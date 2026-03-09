import * as ts from 'typescript';
import {
  ParsedClass,
  ParsedField,
  ParsedMethod,
  ParsedParameter,
  ParsedDecorator,
  ParsedComment,
  ParsedInterface,
  ParsedInterfaceProperty,
  ParsedFunction,
  ParsedVariable
} from './types';

/**
 * Parse TypeScript source file
 */
export function parseSourceFile(sourceFile: ts.SourceFile): {
  classes: ParsedClass[];
  interfaces: ParsedInterface[];
  functions: ParsedFunction[];
  variables: ParsedVariable[];
} {
  const classes: ParsedClass[] = [];
  const interfaces: ParsedInterface[] = [];
  const functions: ParsedFunction[] = [];
  const variables: ParsedVariable[] = [];

  function visitNode(node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      classes.push(parseClass(node, sourceFile));
    } else if (ts.isInterfaceDeclaration(node)) {
      interfaces.push(parseInterface(node, sourceFile));
    } else if (ts.isFunctionDeclaration(node)) {
      functions.push(parseFunction(node, sourceFile));
    } else if (ts.isVariableStatement(node)) {
      const parsedVars = parseVariableStatement(node, sourceFile);
      variables.push(...parsedVars);
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);
  return { classes, interfaces, functions, variables };
}

/**
 * Parse class declaration
 */
function parseClass(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): ParsedClass {
  return {
    name: node.name?.getText(sourceFile) || '',
    isExported: isExported(node),
    heritageClauses: parseHeritageClauses(node, sourceFile),
    decorators: parseDecorators(node, sourceFile),
    fields: parseClassMembers(node, sourceFile),
    methods: parseClassMethods(node, sourceFile),
    comments: parseComments(node, sourceFile)
  };
}

/**
 * Parse interface declaration
 */
function parseInterface(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): ParsedInterface {
  return {
    name: node.name.getText(sourceFile),
    isExported: isExported(node),
    heritageClauses: parseHeritageClauses(node, sourceFile),
    properties: parseInterfaceProperties(node, sourceFile),
    methods: parseInterfaceMethods(node, sourceFile),
    decorators: parseDecorators(node, sourceFile),
    comments: parseComments(node, sourceFile)
  };
}

/**
 * Parse function declaration
 */
function parseFunction(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): ParsedFunction {
  return {
    name: node.name?.getText(sourceFile) || '',
    isExported: isExported(node),
    isAsync: node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword) ?? false,
    returnType: parseType(node.type, sourceFile),
    parameters: parseParameters(node.parameters, sourceFile),
    modifiers: parseModifiers(node.modifiers),
    decorators: parseDecorators(node, sourceFile),
    body: node.body ? node.body.getText(sourceFile) : '',
    comments: parseComments(node, sourceFile)
  };
}

/**
 * Parse variable statement
 */
function parseVariableStatement(node: ts.VariableStatement, sourceFile: ts.SourceFile): ParsedVariable[] {
  const variables: ParsedVariable[] = [];
  
  for (const declaration of node.declarationList.declarations) {
    if (declaration.name) {
      variables.push({
        name: declaration.name.getText(sourceFile),
        type: parseType(declaration.type, sourceFile),
        isExported: isExported(node),
        modifiers: parseModifiers(node.modifiers),
        decorators: parseDecorators(node, sourceFile),
        initializer: declaration.initializer ? declaration.initializer.getText(sourceFile) : '',
        comments: parseComments(node, sourceFile)
      });
    }
  }
  
  return variables;
}

/**
 * Parse class members (fields)
 */
function parseClassMembers(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): ParsedField[] {
  const fields: ParsedField[] = [];
  
  for (const member of node.members) {
    if (ts.isPropertyDeclaration(member)) {
      fields.push({
        name: member.name?.getText(sourceFile) || '',
        type: parseType(member.type, sourceFile),
        modifiers: parseModifiers(member.modifiers),
        decorators: parseDecorators(member, sourceFile),
        initializer: member.initializer ? member.initializer.getText(sourceFile) : undefined,
        comments: parseComments(member, sourceFile)
      });
    }
  }
  
  return fields;
}

/**
 * Parse class methods
 */
function parseClassMethods(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): ParsedMethod[] {
  const methods: ParsedMethod[] = [];
  
  for (const member of node.members) {
    if (ts.isMethodDeclaration(member)) {
      methods.push({
        name: member.name?.getText(sourceFile) || '',
        isAsync: member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword) ?? false,
        returnType: parseType(member.type, sourceFile),
        parameters: parseParameters(member.parameters, sourceFile),
        modifiers: parseModifiers(member.modifiers),
        decorators: parseDecorators(member, sourceFile),
        body: member.body ? member.body.getText(sourceFile) : '',
        comments: parseComments(member, sourceFile)
      });
    }
  }
  
  return methods;
}

/**
 * Parse interface properties
 */
function parseInterfaceProperties(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): ParsedInterfaceProperty[] {
  const properties: ParsedInterfaceProperty[] = [];
  
  for (const member of node.members) {
    if (ts.isPropertySignature(member)) {
      properties.push({
        name: member.name?.getText(sourceFile) || '',
        type: parseType(member.type, sourceFile),
        isOptional: !!member.questionToken,
        modifiers: parseModifiers(member.modifiers),
        decorators: parseDecorators(member, sourceFile),
        comments: parseComments(member, sourceFile)
      });
    }
  }
  
  return properties;
}

/**
 * Parse interface methods
 */
function parseInterfaceMethods(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): ParsedMethod[] {
  const methods: ParsedMethod[] = [];
  
  for (const member of node.members) {
    if (ts.isMethodSignature(member)) {
      methods.push({
        name: member.name?.getText(sourceFile) || '',
        isAsync: false, // Interfaces don't have async methods
        returnType: parseType(member.type, sourceFile),
        parameters: parseParameters(member.parameters, sourceFile),
        modifiers: parseModifiers(member.modifiers),
        decorators: parseDecorators(member, sourceFile),
        body: '', // Interface methods don't have bodies
        comments: parseComments(member, sourceFile)
      });
    }
  }
  
  return methods;
}

/**
 * Parse parameters
 */
function parseParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>, sourceFile: ts.SourceFile): ParsedParameter[] {
  return parameters.map(param => ({
    name: param.name?.getText(sourceFile) || '',
    type: parseType(param.type, sourceFile),
    modifiers: parseModifiers(param.modifiers),
    decorators: parseDecorators(param, sourceFile),
    initializer: param.initializer ? param.initializer.getText(sourceFile) : undefined
  }));
}

/**
 * Parse heritage clauses
 */
function parseHeritageClauses(node: ts.ClassDeclaration | ts.InterfaceDeclaration, sourceFile: ts.SourceFile): string[] {
  const clauses: string[] = [];
  
  if (node.heritageClauses) {
    for (const clause of node.heritageClauses) {
      for (const type of clause.types) {
        clauses.push(type.getText(sourceFile));
      }
    }
  }
  
  return clauses;
}

/**
 * Parse decorators
 */
function parseDecorators(node: ts.Node, sourceFile: ts.SourceFile): ParsedDecorator[] {
  const decorators: ParsedDecorator[] = [];
  
  if (ts.canHaveDecorators(node)) {
    const nodeDecorators = ts.getDecorators(node);
    if (nodeDecorators) {
      for (const decorator of nodeDecorators) {
        const expression = decorator.expression;
        if (ts.isCallExpression(expression)) {
          const name = expression.expression.getText(sourceFile);
          const args = expression.arguments.map(arg => arg.getText(sourceFile));
          decorators.push({ name, arguments: args });
        } else if (ts.isIdentifier(expression)) {
          decorators.push({ name: expression.getText(sourceFile), arguments: [] });
        }
      }
    }
  }
  
  return decorators;
}

/**
 * Parse comments
 */
function parseComments(node: ts.Node, sourceFile: ts.SourceFile): ParsedComment[] {
  const comments: ParsedComment[] = [];
  
  // Get leading comments
  const leadingComments = ts.getLeadingCommentRanges(sourceFile.text, node.pos);
  if (leadingComments) {
    for (const commentRange of leadingComments) {
      const commentText = sourceFile.text.substring(commentRange.pos, commentRange.end);
      comments.push({
        text: commentText,
        isJSDoc: commentText.startsWith('/**')
      });
    }
  }
  
  // Get trailing comments
  const trailingComments = ts.getTrailingCommentRanges(sourceFile.text, node.end);
  if (trailingComments) {
    for (const commentRange of trailingComments) {
      const commentText = sourceFile.text.substring(commentRange.pos, commentRange.end);
      comments.push({
        text: commentText,
        isJSDoc: commentText.startsWith('/**')
      });
    }
  }
  
  return comments;
}

/**
 * Parse modifiers
 */
function parseModifiers(modifiers?: ts.NodeArray<ts.ModifierLike>): string[] {
  if (!modifiers) return [];
  return modifiers
    .filter(modifier => !ts.isDecorator(modifier)) // Filter out decorators
    .map(modifier => modifier.getText());
}

/**
 * Parse type
 */
function parseType(type?: ts.TypeNode, sourceFile?: ts.SourceFile): string {
  if (!type || !sourceFile) return 'any';
  return type.getText(sourceFile);
}

/**
 * Check if node is exported
 */
function isExported(node: ts.Node): boolean {
  if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || 
      ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
    return node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  }
  return false;
}
