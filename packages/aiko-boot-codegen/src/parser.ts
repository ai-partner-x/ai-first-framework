/**
 * TypeScript AST Parser
 * Parses TypeScript source files and extracts class information
 */
import ts from 'typescript';
import type { 
  ParsedClass, ParsedDecorator, ParsedField, ParsedMethod, ParsedParameter, ParsedConstructor,
  ParsedStatement, ParsedExpression, ParsedDestructuringDeclaration,
  ParsedImport, ParsedComment, ParsedSourceFile, ParsedInterface, ParsedInterfaceProperty
} from './types.js';

/**
 * Parse a TypeScript source file (legacy - returns only classes)
 */
export function parseSourceFile(sourceCode: string, fileName: string = 'source.ts'): ParsedClass[] {
  const result = parseSourceFileFull(sourceCode, fileName);
  return result.classes;
}

/**
 * Parse a TypeScript source file with full information (imports, comments, classes, interfaces)
 */
export function parseSourceFileFull(sourceCode: string, fileName: string = 'source.ts'): ParsedSourceFile {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceCode,
    ts.ScriptTarget.ES2022,
    true
  );

  const imports: ParsedImport[] = [];
  const classes: ParsedClass[] = [];
  const interfaces: ParsedInterface[] = [];
  const comments: ParsedComment[] = [];

  // Parse top-level comments
  const fileComments = parseLeadingComments(sourceFile, sourceFile);
  comments.push(...fileComments);

  function visit(node: ts.Node) {
    // Parse import declarations
    if (ts.isImportDeclaration(node)) {
      imports.push(parseImport(node, sourceFile));
    }
    // Parse class declarations
    else if (ts.isClassDeclaration(node) && node.name) {
      const parsedClass = parseClass(node, sourceFile);
      classes.push(parsedClass);
      // Add class-level comments to file comments only if no file-level comments
      if (fileComments.length === 0 && parsedClass.comment) {
        comments.push(parsedClass.comment);
      }
    }
    // Parse interface declarations
    else if (ts.isInterfaceDeclaration(node) && node.name) {
      const parsedInterface = parseInterface(node, sourceFile);
      interfaces.push(parsedInterface);
      // Add interface-level comments to file comments only if no file-level comments
      if (fileComments.length === 0 && parsedInterface.comment) {
        comments.push(parsedInterface.comment);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  
  return {
    filePath: fileName,
    imports,
    classes,
    interfaces,
    comments,
  };
}

/**
 * Parse import declaration
 */
function parseImport(node: ts.ImportDeclaration, sourceFile: ts.SourceFile): ParsedImport {
  const modulePath = (node.moduleSpecifier as ts.StringLiteral).text;
  const namedImports: string[] = [];
  let defaultImport: string | undefined;
  let namespaceImport: string | undefined;
  const isTypeOnly = node.importClause?.isTypeOnly ?? false;

  if (node.importClause) {
    // Default import: import React from 'react'
    if (node.importClause.name) {
      defaultImport = node.importClause.name.getText(sourceFile);
    }

    // Named imports: import { a, b } from 'module'
    if (node.importClause.namedBindings) {
      if (ts.isNamedImports(node.importClause.namedBindings)) {
        node.importClause.namedBindings.elements.forEach(el => {
          namedImports.push(el.name.getText(sourceFile));
        });
      }
      // Namespace import: import * as fs from 'fs'
      else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
        namespaceImport = node.importClause.namedBindings.name.getText(sourceFile);
      }
    }
  }

  return {
    modulePath,
    namedImports,
    defaultImport,
    namespaceImport,
    isTypeOnly,
  };
}

/**
 * Parse leading comments (JSDoc, line, block)
 */
function parseLeadingComments(node: ts.Node, sourceFile: ts.SourceFile): ParsedComment[] {
  const comments: ParsedComment[] = [];
  const text = sourceFile.getFullText();
  const nodeStart = node.getFullStart();
  const ranges = ts.getLeadingCommentRanges(text, nodeStart);
  
  if (!ranges) return comments;
  
  for (const range of ranges) {
    const commentText = text.slice(range.pos, range.end);
    
    if (range.kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      if (commentText.startsWith('/**')) {
        // JSDoc comment
        const content = commentText.slice(3, -2).trim();
        const tags = parseJSDocTags(content);
        comments.push({
          type: 'jsdoc',
          text: content.split('\n').map(l => l.replace(/^\s*\*\s?/, '')).join('\n').trim(),
          tags,
        });
      } else {
        // Block comment
        comments.push({
          type: 'block',
          text: commentText.slice(2, -2).trim(),
        });
      }
    } else if (range.kind === ts.SyntaxKind.SingleLineCommentTrivia) {
      // Line comment
      comments.push({
        type: 'line',
        text: commentText.slice(2).trim(),
      });
    }
  }
  
  return comments;
}

/**
 * Parse JSDoc tags from comment content
 */
function parseJSDocTags(content: string): { tag: string; text: string }[] {
  const tags: { tag: string; text: string }[] = [];
  const tagRegex = /@(\w+)\s+([^\n@]*)/g;
  let match;
  
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push({
      tag: match[1],
      text: match[2].trim(),
    });
  }
  
  return tags;
}

/**
 * Parse a class declaration
 */
function parseClass(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): ParsedClass {
  const name = node.name?.getText(sourceFile) || 'UnnamedClass';
  const decorators = parseDecorators(node, sourceFile);
  const fields: ParsedField[] = [];
  const methods: ParsedMethod[] = [];
  let constructor: ParsedConstructor | undefined;
  
  // Parse class-level JSDoc comment (prefer JSDoc, fallback to last comment)
  const comments = parseLeadingComments(node, sourceFile);
  const comment = comments.find(c => c.type === 'jsdoc') || 
                  (comments.length > 0 ? comments[comments.length - 1] : undefined);

  node.members.forEach(member => {
    if (ts.isPropertyDeclaration(member)) {
      fields.push(parseField(member, sourceFile));
    } else if (ts.isMethodDeclaration(member)) {
      methods.push(parseMethod(member, sourceFile));
    } else if (ts.isConstructorDeclaration(member)) {
      constructor = parseConstructor(member, sourceFile);
    }
  });

  return { name, decorators, fields, methods, constructor, comment };
}

/**
 * Parse an interface declaration (converts to DTO class in Java)
 */
function parseInterface(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): ParsedInterface {
  const name = node.name.getText(sourceFile);
  const properties: ParsedInterfaceProperty[] = [];
  
  // Check if exported
  const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  
  // Parse interface-level decorators
  const decorators = parseDecorators(node, sourceFile);
  
  // Parse interface-level JSDoc comment (prefer JSDoc, fallback to last comment)
  const comments = parseLeadingComments(node, sourceFile);
  const comment = comments.find(c => c.type === 'jsdoc') || 
                  (comments.length > 0 ? comments[comments.length - 1] : undefined);
  
  // Parse interface members
  node.members.forEach(member => {
    if (ts.isPropertySignature(member) && member.name) {
      const propName = member.name.getText(sourceFile);
      const propType = member.type ? member.type.getText(sourceFile) : 'any';
      const optional = !!member.questionToken;
      
      // Parse property-level comment (inline comment)
      const propComments = parseLeadingComments(member, sourceFile);
      const propComment = propComments.find(c => c.type === 'line')?.text || 
                         propComments.find(c => c.type === 'jsdoc')?.text;
      
      properties.push({
        name: propName,
        type: propType,
        optional,
        comment: propComment,
      });
    }
  });
  
  return { name, properties, decorators, comment, isExported };
}

/**
 * Parse decorators from a node
 * Note: TypeScript's ts.getDecorators() requires ts.HasDecorators type,
 * but ts.InterfaceDeclaration doesn't extend ts.HasDecorators in the type system.
 * We use ts.canHaveDecorators() to safely check if the node supports decorators.
 */
function parseDecorators(node: ts.Node, sourceFile: ts.SourceFile): ParsedDecorator[] {
  if (!ts.canHaveDecorators(node)) return [];
  
  const decorators: ParsedDecorator[] = [];
  const nodeDecorators = ts.getDecorators(node);
  
  if (!nodeDecorators) return decorators;

  nodeDecorators.forEach(decorator => {
    const expression = decorator.expression;
    
    if (ts.isCallExpression(expression)) {
      const name = expression.expression.getText(sourceFile);
      const args = parseDecoratorArgs(expression, sourceFile);
      decorators.push({ name, args });
    } else if (ts.isIdentifier(expression)) {
      decorators.push({ name: expression.getText(sourceFile), args: {} });
    }
  });

  return decorators;
}

/**
 * Parse decorator arguments
 */
function parseDecoratorArgs(call: ts.CallExpression, sourceFile: ts.SourceFile): Record<string, any> {
  const args: Record<string, any> = {};
  
  call.arguments.forEach((arg, index) => {
    if (ts.isObjectLiteralExpression(arg)) {
      arg.properties.forEach(prop => {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          const key = prop.name.getText(sourceFile);
          const value = parseValue(prop.initializer, sourceFile);
          args[key] = value;
        }
      });
    } else if (ts.isStringLiteral(arg)) {
      args[`arg${index}`] = arg.text;
    } else {
      args[`arg${index}`] = arg.getText(sourceFile);
    }
  });

  return args;
}

/**
 * Parse a value node
 */
function parseValue(node: ts.Expression, sourceFile: ts.SourceFile): any {
  if (ts.isStringLiteral(node)) {
    return node.text;
  } else if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  } else if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  } else if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  return node.getText(sourceFile);
}

/**
 * Parse a field (property declaration)
 */
function parseField(node: ts.PropertyDeclaration, sourceFile: ts.SourceFile): ParsedField {
  const name = node.name.getText(sourceFile);
  const type = node.type ? node.type.getText(sourceFile) : 'any';
  const decorators = parseDecorators(node, sourceFile);
  const optional = !!node.questionToken;
  
  // Parse field-level comment
  const comments = parseLeadingComments(node, sourceFile);
  const comment = comments.find(c => c.type === 'jsdoc') || comments[0];

  return { name, type, decorators, optional, comment };
}

/**
 * Parse a method declaration
 */
function parseMethod(node: ts.MethodDeclaration, sourceFile: ts.SourceFile): ParsedMethod {
  const name = node.name.getText(sourceFile);
  let returnType = 'void';
  
  if (node.type) {
    returnType = node.type.getText(sourceFile);
    // Remove Promise wrapper
    if (returnType.startsWith('Promise<')) {
      returnType = returnType.slice(8, -1);
    }
  }

  const decorators = parseDecorators(node, sourceFile);
  const parameters = node.parameters.map(p => parseParameter(p, sourceFile));
  const isAsync = !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);
  
  // Parse method body
  const body = node.body ? parseBlock(node.body, sourceFile) : undefined;
  
  // Parse method-level JSDoc comment
  const comments = parseLeadingComments(node, sourceFile);
  const comment = comments.find(c => c.type === 'jsdoc') || comments[0];

  return { name, returnType, parameters, decorators, isAsync, body, comment };
}

/**
 * Parse a parameter
 */
function parseParameter(node: ts.ParameterDeclaration, sourceFile: ts.SourceFile): ParsedParameter {
  const name = node.name.getText(sourceFile);
  const type = node.type ? node.type.getText(sourceFile) : 'any';
  const decorators = parseDecorators(node, sourceFile);

  return { name, type, decorators };
}

/**
 * Parse a constructor
 */
function parseConstructor(node: ts.ConstructorDeclaration, sourceFile: ts.SourceFile): ParsedConstructor {
  const parameters = node.parameters.map(p => parseParameter(p, sourceFile));
  return { parameters };
}

/**
 * Parse a block of statements
 */
function parseBlock(block: ts.Block, sourceFile: ts.SourceFile): ParsedStatement[] {
  const statements: ParsedStatement[] = [];
  
  for (const stmt of block.statements) {
    const parsed = parseStatement(stmt, sourceFile);
    if (parsed) {
      statements.push(parsed);
    }
  }
  
  return statements;
}

/**
 * Parse a single statement
 */
function parseStatement(node: ts.Statement, sourceFile: ts.SourceFile): ParsedStatement | null {
  // Return statement
  if (ts.isReturnStatement(node)) {
    return {
      type: 'return',
      expression: node.expression ? parseExpression(node.expression, sourceFile) : undefined,
    };
  }
  
  // Throw statement
  if (ts.isThrowStatement(node)) {
    return {
      type: 'throw',
      expression: node.expression ? parseExpression(node.expression, sourceFile) : { type: 'literal', value: null, literalType: 'null' },
    };
  }
  
  // Variable declaration
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    if (decl) {
      const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
      
      // Check for destructuring: const { a, b } = obj
      if (ts.isObjectBindingPattern(decl.name)) {
        return parseDestructuringDeclaration(decl, isConst, sourceFile);
      }
      
      // Normal variable declaration
      if (ts.isIdentifier(decl.name)) {
        return {
          type: 'variable',
          name: decl.name.getText(sourceFile),
          varType: decl.type ? decl.type.getText(sourceFile) : 'any',
          isConst,
          initializer: decl.initializer ? parseExpression(decl.initializer, sourceFile) : undefined,
        };
      }
    }
  }
  
  // If statement
  if (ts.isIfStatement(node)) {
    return {
      type: 'if',
      condition: parseExpression(node.expression, sourceFile),
      thenBlock: ts.isBlock(node.thenStatement) 
        ? parseBlock(node.thenStatement, sourceFile) 
        : [parseStatement(node.thenStatement, sourceFile)!].filter(Boolean),
      elseBlock: node.elseStatement 
        ? (ts.isBlock(node.elseStatement) 
            ? parseBlock(node.elseStatement, sourceFile)
            : [parseStatement(node.elseStatement, sourceFile)!].filter(Boolean))
        : undefined,
    };
  }
  
  // For-of statement
  if (ts.isForOfStatement(node)) {
    const varName = ts.isVariableDeclarationList(node.initializer) && node.initializer.declarations[0]
      ? node.initializer.declarations[0].name.getText(sourceFile)
      : '';
    return {
      type: 'for',
      kind: 'forOf',
      variable: varName,
      iterable: parseExpression(node.expression, sourceFile),
      body: ts.isBlock(node.statement) 
        ? parseBlock(node.statement, sourceFile)
        : [parseStatement(node.statement, sourceFile)!].filter(Boolean),
    };
  }
  
  // Expression statement
  if (ts.isExpressionStatement(node)) {
    return {
      type: 'expression',
      expression: parseExpression(node.expression, sourceFile),
    };
  }
  
  // Block statement
  if (ts.isBlock(node)) {
    return {
      type: 'block',
      statements: parseBlock(node, sourceFile),
    };
  }
  
  return null;
}

/**
 * Parse destructuring declaration: const { a, b = 1, c } = obj
 */
function parseDestructuringDeclaration(
  decl: ts.VariableDeclaration,
  isConst: boolean,
  sourceFile: ts.SourceFile
): ParsedDestructuringDeclaration {
  const bindingPattern = decl.name as ts.ObjectBindingPattern;
  const variables: { name: string; defaultValue?: ParsedExpression }[] = [];
  
  for (const element of bindingPattern.elements) {
    if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
      const name = element.name.getText(sourceFile);
      const defaultValue = element.initializer 
        ? parseExpression(element.initializer, sourceFile)
        : undefined;
      variables.push({ name, defaultValue });
    }
  }
  
  // Get source type from initializer if it's typed
  let sourceType = 'any';
  if (decl.initializer && ts.isIdentifier(decl.initializer)) {
    sourceType = decl.initializer.getText(sourceFile);
  }
  
  return {
    type: 'destructuring',
    variables,
    source: decl.initializer ? parseExpression(decl.initializer, sourceFile) : { type: 'identifier', name: 'null' },
    sourceType,
    isConst,
  };
}

/**
 * Parse an expression
 */
function parseExpression(node: ts.Expression, sourceFile: ts.SourceFile): ParsedExpression {
  // String literal
  if (ts.isStringLiteral(node)) {
    return { type: 'literal', value: node.text, literalType: 'string' };
  }
  
  // Numeric literal
  if (ts.isNumericLiteral(node)) {
    return { type: 'literal', value: Number(node.text), literalType: 'number' };
  }
  
  // Boolean literals
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return { type: 'literal', value: true, literalType: 'boolean' };
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return { type: 'literal', value: false, literalType: 'boolean' };
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return { type: 'literal', value: null, literalType: 'null' };
  }
  
  // Identifier
  if (ts.isIdentifier(node)) {
    return { type: 'identifier', name: node.text };
  }
  
  // Property access: obj.prop
  if (ts.isPropertyAccessExpression(node)) {
    return {
      type: 'propertyAccess',
      object: parseExpression(node.expression, sourceFile),
      property: node.name.text,
    };
  }
  
  // Method call: obj.method() or method()
  if (ts.isCallExpression(node)) {
    const args = node.arguments.map(arg => parseExpression(arg, sourceFile));
    
    if (ts.isPropertyAccessExpression(node.expression)) {
      // Method call on object: obj.method()
      return {
        type: 'methodCall',
        object: parseExpression(node.expression.expression, sourceFile),
        method: node.expression.name.text,
        arguments: args,
        isChained: ts.isCallExpression(node.expression.expression),
      };
    } else if (ts.isIdentifier(node.expression)) {
      // Direct function call: method()
      return {
        type: 'methodCall',
        method: node.expression.text,
        arguments: args,
      };
    }
  }
  
  // New expression: new Class()
  if (ts.isNewExpression(node)) {
    const className = node.expression.getText(sourceFile);
    const typeArgs = node.typeArguments?.map(t => t.getText(sourceFile));
    const args = node.arguments?.map(arg => parseExpression(arg, sourceFile)) || [];
    return {
      type: 'new',
      className,
      typeArguments: typeArgs,
      arguments: args,
    };
  }
  
  // Binary expression: a + b, a === b, etc.
  if (ts.isBinaryExpression(node)) {
    return {
      type: 'binary',
      left: parseExpression(node.left, sourceFile),
      operator: ts.tokenToString(node.operatorToken.kind) || node.operatorToken.getText(sourceFile),
      right: parseExpression(node.right, sourceFile),
    };
  }
  
  // Await expression
  if (ts.isAwaitExpression(node)) {
    return {
      type: 'await',
      expression: parseExpression(node.expression, sourceFile),
    };
  }
  
  // Non-null assertion expression: expr! -> just return the inner expression (Java doesn't have this)
  if (ts.isNonNullExpression(node)) {
    return parseExpression(node.expression, sourceFile);
  }
  
  // Type assertion expression: expr as Type -> just return the inner expression (Java doesn't have this)
  if (ts.isAsExpression(node)) {
    return parseExpression(node.expression, sourceFile);
  }
  
  // Conditional (ternary) expression: condition ? trueExpr : falseExpr
  if (ts.isConditionalExpression(node)) {
    return {
      type: 'conditional',
      condition: parseExpression(node.condition, sourceFile),
      whenTrue: parseExpression(node.whenTrue, sourceFile),
      whenFalse: parseExpression(node.whenFalse, sourceFile),
    };
  }
  
  // Element access expression: arr[0], obj['key']
  if (ts.isElementAccessExpression(node)) {
    return {
      type: 'elementAccess',
      object: parseExpression(node.expression, sourceFile),
      index: parseExpression(node.argumentExpression, sourceFile),
    };
  }
  
  // Parenthesized expression: (expr) -> just return the inner expression
  if (ts.isParenthesizedExpression(node)) {
    return parseExpression(node.expression, sourceFile);
  }
  
  // Object literal
  if (ts.isObjectLiteralExpression(node)) {
    const properties: { key: string; value: ParsedExpression }[] = [];
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        properties.push({
          key: prop.name.text,
          value: parseExpression(prop.initializer, sourceFile),
        });
      }
    }
    return { type: 'object', properties };
  }
  
  // Array literal
  if (ts.isArrayLiteralExpression(node)) {
    return {
      type: 'array',
      elements: node.elements.map(el => parseExpression(el, sourceFile)),
    };
  }
  
  // Fallback: raw code
  return { type: 'raw', code: node.getText(sourceFile) };
}
