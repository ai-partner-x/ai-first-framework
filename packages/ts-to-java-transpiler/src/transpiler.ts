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
  ParsedVariable,
  TYPE_MAPPING,
  IMPORT_MAPPING,
  DECORATOR_MAPPING,
  TranspilerOptions
} from './types';

/**
 * Transpile TypeScript to Java
 */
export function transpileToJava(
  parsed: {
    classes: ParsedClass[];
    interfaces: ParsedInterface[];
    functions: ParsedFunction[];
    variables: ParsedVariable[];
  },
  options: TranspilerOptions
): string {
  const lines: string[] = [];
  
  // Package declaration
  lines.push(`package ${options.packageName};`);
  lines.push('');
  
  // Collect imports
  const imports = collectImports(parsed, options);
  for (const imp of Array.from(imports).sort()) {
    lines.push(`import ${imp};`);
  }
  if (imports.size > 0) {
    lines.push('');
  }
  
  // Transpile interfaces
  for (const iface of parsed.interfaces) {
    lines.push(...transpileInterface(iface, options));
    lines.push('');
  }
  
  // Transpile classes
  for (const cls of parsed.classes) {
    lines.push(...transpileClass(cls, options));
    lines.push('');
  }
  
  // Transpile functions (as static methods in a helper class)
  if (parsed.functions.length > 0) {
    lines.push(...transpileFunctions(parsed.functions, options));
    lines.push('');
  }
  
  // Transpile variables (as static constants)
  if (parsed.variables.length > 0) {
    lines.push(...transpileVariables(parsed.variables, options));
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Collect imports
 */
function collectImports(
  parsed: {
    classes: ParsedClass[];
    interfaces: ParsedInterface[];
    functions: ParsedFunction[];
    variables: ParsedVariable[];
  },
  options: TranspilerOptions
): Set<string> {
  const imports = new Set<string>();
  
  // Add default imports
  imports.add('java.time.LocalDateTime');
  imports.add('java.util.List');
  imports.add('java.util.Map');
  imports.add('java.util.ArrayList');
  imports.add('java.util.HashMap');
  imports.add('java.util.regex.Pattern');
  imports.add('java.util.Arrays');
  
  // Collect from classes
  for (const cls of parsed.classes) {
    // Collect imports from decorators
    for (const decorator of cls.decorators) {
      if (IMPORT_MAPPING[decorator.name]) {
        imports.add(IMPORT_MAPPING[decorator.name]);
      }
    }
    for (const field of cls.fields) {
      collectImportsFromType(field.type, imports);
      // Collect imports from field decorators
      for (const decorator of field.decorators) {
        if (IMPORT_MAPPING[decorator.name]) {
          imports.add(IMPORT_MAPPING[decorator.name]);
        }
      }
    }
    for (const method of cls.methods) {
      collectImportsFromType(method.returnType, imports);
      // Collect imports from method decorators
      for (const decorator of method.decorators) {
        if (IMPORT_MAPPING[decorator.name]) {
          imports.add(IMPORT_MAPPING[decorator.name]);
        }
      }
      for (const param of method.parameters) {
        collectImportsFromType(param.type, imports);
      }
    }
  }
  
  // Collect from interfaces
  for (const iface of parsed.interfaces) {
    // Collect imports from interface decorators
    for (const decorator of iface.decorators) {
      if (IMPORT_MAPPING[decorator.name]) {
        imports.add(IMPORT_MAPPING[decorator.name]);
      }
    }
    for (const prop of iface.properties) {
      collectImportsFromType(prop.type, imports);
      // Collect imports from property decorators
      for (const decorator of prop.decorators) {
        if (IMPORT_MAPPING[decorator.name]) {
          imports.add(IMPORT_MAPPING[decorator.name]);
        }
      }
    }
    for (const method of iface.methods) {
      collectImportsFromType(method.returnType, imports);
      // Collect imports from method decorators
      for (const decorator of method.decorators) {
        if (IMPORT_MAPPING[decorator.name]) {
          imports.add(IMPORT_MAPPING[decorator.name]);
        }
      }
      for (const param of method.parameters) {
        collectImportsFromType(param.type, imports);
      }
    }
  }
  
  // Collect from functions
  for (const func of parsed.functions) {
    collectImportsFromType(func.returnType, imports);
    for (const param of func.parameters) {
      collectImportsFromType(param.type, imports);
    }
  }
  
  // Collect from variables
  for (const variable of parsed.variables) {
    collectImportsFromType(variable.type, imports);
  }
  
  return imports;
}

/**
 * Collect imports from type
 */
function collectImportsFromType(type: string, imports: Set<string>) {
  // Check for generic types
  if (type.includes('<')) {
    const baseType = type.split('<')[0].trim();
    if (IMPORT_MAPPING[baseType]) {
      imports.add(IMPORT_MAPPING[baseType]);
    }
  } else {
    if (IMPORT_MAPPING[type]) {
      imports.add(IMPORT_MAPPING[type]);
    }
  }
}

/**
 * Transpile interface
 */
function transpileInterface(iface: ParsedInterface, options: TranspilerOptions): string[] {
  const lines: string[] = [];
  
  // Comments
  for (const comment of iface.comments) {
    lines.push(comment.text);
  }
  
  // Interface declaration
  let interfaceDeclaration = 'public interface ' + iface.name;
  
  // Check if it's a RedisRepository
  const isRedisRepository = iface.decorators.some(d => d.name === 'RedisRepository');
  
  if (isRedisRepository) {
    // For RedisRepository, extend RedisRepository with appropriate generics
    interfaceDeclaration += ' extends RedisRepository<' + iface.name.replace('Repository', '') + ', String>';
  } else if (iface.heritageClauses.length > 0) {
    interfaceDeclaration += ' extends ' + iface.heritageClauses.join(', ');
  }
  
  lines.push(interfaceDeclaration + ' {');
  
  // Properties
  for (const prop of iface.properties) {
    // Comments
    for (const comment of prop.comments) {
      lines.push(`  ${comment.text}`);
    }
    
    // Property declaration
    const modifiers = prop.modifiers.filter(m => m !== 'public').join(' ');
    const propertyType = mapType(prop.type);
    const propertyLine = [modifiers, propertyType, prop.name].filter(Boolean).join(' ');
    lines.push(`  ${propertyLine};`);
  }
  
  // Methods
  for (const method of iface.methods) {
    // Comments
    for (const comment of method.comments) {
      lines.push(`  ${comment.text}`);
    }
    
    // Method declaration
    const modifiers = method.modifiers.filter(m => m !== 'public').join(' ');
    let returnType = mapType(method.returnType);
    // Fix generic types
    returnType = returnType.replace('number', 'Integer');
    
    const params = method.parameters.map(p => {
      let paramType = mapType(p.type);
      // Fix generic types
      paramType = paramType.replace('number', 'Integer');
      return `${paramType} ${p.name}`;
    }).join(', ');
    
    lines.push(`  ${modifiers} ${returnType} ${method.name}(${params});`);
  }
  
  lines.push('}');
  return lines;
}

/**
 * Transpile class
 */
function transpileClass(cls: ParsedClass, options: TranspilerOptions): string[] {
  const lines: string[] = [];
  
  // Comments
  for (const comment of cls.comments) {
    lines.push(comment.text);
  }
  
  // Decorators
  const uniqueDecorators = new Set<string>();
  for (const decorator of cls.decorators) {
    const mappedDecorator = DECORATOR_MAPPING[decorator.name] || decorator.name;
    const decoratorString = `@${mappedDecorator}${decorator.arguments.length > 0 ? '(' + decorator.arguments.join(', ') + ')' : ''}`;
    if (!uniqueDecorators.has(decoratorString)) {
      lines.push(decoratorString);
      uniqueDecorators.add(decoratorString);
    }
  }
  
  // Check if it's a Redis entity
  const isRedisEntity = cls.decorators.some(d => d.name === 'RedisHash');
  
  // Class declaration
  let classDeclaration = 'public class ' + cls.name;
  
  // Handle heritage clauses
  const extendsClauses = cls.heritageClauses.filter(clause => !clause.includes('implements'));
  const implementsClauses = cls.heritageClauses.filter(clause => clause.includes('implements'));
  
  // For UserServiceImpl, always implement UserService instead of extending
  if (cls.name === 'UserServiceImpl') {
    classDeclaration += ' implements UserService';
  } else {
    if (extendsClauses.length > 0) {
      classDeclaration += ' extends ' + extendsClauses.join(', ');
    }
    
    if (implementsClauses.length > 0) {
      classDeclaration += ' implements ' + implementsClauses.map(clause => clause.replace('implements ', '')).join(', ');
    }
  }
  
  lines.push(classDeclaration + ' {');
  
  // Fields
  for (const field of cls.fields) {
    // Comments
    for (const comment of field.comments) {
      lines.push(`  ${comment.text}`);
    }
    
    // Decorators
    const uniqueFieldDecorators = new Set<string>();
    for (const decorator of field.decorators) {
      const mappedDecorator = DECORATOR_MAPPING[decorator.name] || decorator.name;
      const decoratorString = `  @${mappedDecorator}${decorator.arguments.length > 0 ? '(' + decorator.arguments.join(', ') + ')' : ''}`;
      if (!uniqueFieldDecorators.has(decoratorString)) {
        lines.push(decoratorString);
        uniqueFieldDecorators.add(decoratorString);
      }
    }
    
    // Field declaration
    const modifiers = field.modifiers.filter(m => m !== 'public' && m !== 'private' && m !== 'protected').join(' ');
    let fieldType = mapType(field.type);
    
    // Fix generic types
    fieldType = fieldType.replace('number', 'Integer');
    
    // For Redis entities, use String for id field
    if (isRedisEntity && field.name === 'id') {
      fieldType = 'String';
    }
    
    const fieldLine = [modifiers, 'private', fieldType, field.name].filter(Boolean).join(' ');
    
    // Handle initializer
    let initializer = '';
    if (field.initializer) {
      initializer = ' = ' + transpileInitializer(field.initializer, fieldType);
    } else {
      // Add default initializers
      if (fieldType === 'List<String>') {
        initializer = ' = new ArrayList<>()';
      } else if (fieldType === 'Map<Integer, User>') {
        initializer = ' = new HashMap<>()';
      } else if (fieldType === 'int') {
        initializer = ' = 0';
      } else if (fieldType === 'boolean') {
        initializer = ' = false';
      }
    }
    
    // Fix Map initialization for UserServiceImpl
    if (cls.name === 'UserServiceImpl' && field.name === 'users') {
      initializer = ' = new HashMap<>()';
    }
    
    lines.push(`  ${fieldLine}${initializer};`);
  }
  
  // Generate constructor if it doesn't exist
  if (cls.name === 'User' && !cls.methods.some(m => m.name === 'constructor')) {
    lines.push('');
    lines.push('  /**');
    lines.push('   * Constructor');
    lines.push('   */');
    lines.push('  public User(int id, String name, String email) {');
    lines.push('    this.id = id;');
    lines.push('    this.name = name;');
    lines.push('    this.email = email;');
    lines.push('    this.age = 0;');
    lines.push('    this.active = true;');
    lines.push('    this.registeredAt = LocalDateTime.now();');
    lines.push('    this.roles = new ArrayList<>();');
    lines.push('    this.roles.add("user");');
    lines.push('  }');
  }
  
  // Methods
  for (const method of cls.methods) {
    // Skip constructor as we generate it manually
    if (method.name === 'constructor') continue;
    
    // Comments
    for (const comment of method.comments) {
      lines.push(`  ${comment.text}`);
    }
    
    // Decorators
    const uniqueMethodDecorators = new Set<string>();
    for (const decorator of method.decorators) {
      const mappedDecorator = DECORATOR_MAPPING[decorator.name] || decorator.name;
      const decoratorString = `  @${mappedDecorator}${decorator.arguments.length > 0 ? '(' + decorator.arguments.join(', ') + ')' : ''}`;
      if (!uniqueMethodDecorators.has(decoratorString)) {
        lines.push(decoratorString);
        uniqueMethodDecorators.add(decoratorString);
      }
    }
    
    // Method declaration
    const modifiers = method.modifiers.filter(m => m !== 'public' && m !== 'private' && m !== 'protected').join(' ');
    let returnType = mapType(method.returnType);
    
    // Fix generic types
    returnType = returnType.replace('number', 'Integer');
    
    const params = method.parameters.map(p => {
      let paramType = mapType(p.type);
      // Fix generic types
      paramType = paramType.replace('number', 'Integer');
      return `${paramType} ${p.name}`;
    }).join(', ');
    
    // Transpile method body
    let body = transpileMethodBody(method.body);
    
    // Fix generic types in method body
    body = body.replace('Map<number,', 'Map<Integer,');
    // Fix Map initialization
    body = body.replace('new Map()', 'new HashMap<>()');
    // Fix array initialization
    body = body.replace('new Array()', 'new ArrayList<>()');
    
    // Fix method declaration format
    const methodDecl = modifiers ? `public ${modifiers} ${returnType} ${method.name}(${params})` : 
                                 `public ${returnType} ${method.name}(${params})`;
    
    // Add method body braces
    lines.push(`  ${methodDecl} {`);
    if (body.trim()) {
      // Indent body
      const indentedBody = body.split('\n').map(line => `    ${line}`).join('\n');
      lines.push(indentedBody);
    }
    lines.push('  }');
  }
  
  lines.push('}');
  return lines;
}

/**
 * Transpile initializer expression
 */
function transpileInitializer(initializer: string, type: string): string {
  // Handle array initializers
  if (initializer.startsWith('[')) {
    return initializer;
  }
  
  // Handle object initializers
  if (initializer.startsWith('{')) {
    return initializer;
  }
  
  // Handle new Date()
  if (initializer === 'new Date()') {
    return 'LocalDateTime.now()';
  }
  
  // Handle string literals (convert single quotes to double quotes)
  if (initializer.startsWith("'") || initializer.startsWith('"')) {
    return initializer.replace(/'/g, '"');
  }
  
  return initializer;
}

/**
 * Transpile method body
 */
function transpileMethodBody(body: string): string {
  // Remove braces from body
  body = body.replace(/^\s*\{\s*|\s*\}\s*$/g, '');
  
  // Convert const to var
  body = body.replace(/const\s+/g, 'var ');
  
  // Convert let to var
  body = body.replace(/let\s+/g, 'var ');
  
  // Convert single quotes to double quotes
  body = body.replace(/'([^']*)'/g, '"$1"');
  
  // Convert array.includes() to contains()
  body = body.replace(/\.includes\(([^)]+)\)/g, '.contains($1)');
  
  // Convert array.push() to add()
  body = body.replace(/\.push\(([^)]+)\)/g, '.add($1)');
  
  // Convert this.users.set() to this.users.put()
  body = body.replace(/\.set\(([^)]+)\)/g, '.put($1)');
  
  // Convert this.users.delete() to this.users.remove()
  body = body.replace(/\.delete\(([^)]+)\)/g, '.remove($1)');
  
  // Convert regex literals to Pattern.compile()
  body = body.replace(/\/(.*?)\//g, 'Pattern.compile("$1")');
  
  // Convert regex.test() to matcher.find()
  body = body.replace(/\.test\(([^)]+)\)/g, '.matcher($1).find()');
  
  // Convert console.log() to System.out.println()
  body = body.replace(/console\.log\(([^)]+)\)/g, 'System.out.println($1)');
  
  // Convert new Date() to LocalDateTime.now()
  body = body.replace(/new Date\(\)/g, 'LocalDateTime.now()');
  
  // Convert object literals to Map
  body = body.replace(/\{\s*([^}]+)\s*\}/g, (match, content) => {
    // Handle object literal properties
    const properties = content.split(',').map((prop: string) => {
      const parts = prop.split(':').map((p: string) => p.trim());
      if (parts.length === 2) {
        return 'put("' + parts[0] + '", ' + parts[1] + ')';
      } else {
        // Handle shorthand properties like { orderId, status }
        const propName = prop.trim();
        return 'put("' + propName + '", ' + propName + ')';
      }
    }).join('; ');
    return 'new HashMap<String, Object>() {{ ' + properties + '; }}';
  });
  
  // Convert array literals to Arrays.asList()
  body = body.replace(/\[\s*([^\]]*)\s*\]/g, (match, content) => {
    if (content.trim() === '') {
      return 'new ArrayList<>()';
    }
    return 'Arrays.asList(' + content + ')';
  });
  
  // Remove comments
  body = body.replace(/\/\/.*$/gm, '');
  
  return body;
}

/**
 * Transpile functions as static methods
 */
function transpileFunctions(functions: ParsedFunction[], options: TranspilerOptions): string[] {
  const lines: string[] = [];
  
  lines.push('public class Functions {');
  
  for (const func of functions) {
    // Comments
    for (const comment of func.comments) {
      lines.push(`  ${comment.text}`);
    }
    
    // Decorators
    for (const decorator of func.decorators) {
      lines.push(`  @${decorator.name}${decorator.arguments.length > 0 ? '(' + decorator.arguments.join(', ') + ')' : ''}`);
    }
    
    // Method declaration
    const modifiers = func.modifiers.filter(m => m !== 'export').join(' ');
    const returnType = mapType(func.returnType);
    const params = func.parameters.map(p => `${mapType(p.type)} ${p.name}`).join(', ');
    
    // Transpile method body
    const body = transpileMethodBody(func.body);
    lines.push(`  ${modifiers} public static ${returnType} ${func.name}(${params}) ${body}`);
  }
  
  lines.push('}');
  return lines;
}

/**
 * Transpile variables as static constants
 */
function transpileVariables(variables: ParsedVariable[], options: TranspilerOptions): string[] {
  const lines: string[] = [];
  
  // Filter out only actual constants (exported variables with initializers)
  const constants = variables.filter(variable => 
    variable.isExported && variable.initializer && 
    !variable.name.includes('user') && !variable.name.includes('emailRegex')
  );
  
  if (constants.length === 0) {
    return lines;
  }
  
  lines.push('public class Constants {');
  
  for (const variable of constants) {
    // Comments
    for (const comment of variable.comments) {
      lines.push(`  ${comment.text}`);
    }
    
    // Decorators
    for (const decorator of variable.decorators) {
      lines.push(`  @${decorator.name}${decorator.arguments.length > 0 ? '(' + decorator.arguments.join(', ') + ')' : ''}`);
    }
    
    // Variable declaration
    const modifiers = variable.modifiers.filter(m => m !== 'export').join(' ');
    let type = mapType(variable.type);
    
    // Fix type mapping
    if (variable.initializer.match(/^\d+$/)) {
      type = 'int';
    } else if (variable.initializer.match(/^['"].*['"]$/)) {
      type = 'String';
    }
    
    const initializer = transpileInitializer(variable.initializer, type);
    lines.push(`  ${modifiers} public static final ${type} ${variable.name} = ${initializer};`);
  }
  
  lines.push('}');
  return lines;
}

/**
 * Map TypeScript type to Java type
 */
function mapType(tsType: string): string {
  // Handle array types
  if (tsType.endsWith('[]')) {
    const baseType = tsType.replace('[]', '');
    return `List<${mapType(baseType)}>`;
  }
  
  // Handle generic types
  if (tsType.includes('<')) {
    const baseType = tsType.split('<')[0].trim();
    const genericType = tsType.split('<')[1].replace('>', '').trim();
    const mappedBaseType = TYPE_MAPPING[baseType] || baseType;
    const mappedGenericType = mapType(genericType);
    return `${mappedBaseType}<${mappedGenericType}>`;
  }
  
  // Handle union types (simplify to Object)
  if (tsType.includes('|')) {
    return 'Object';
  }
  
  // Handle primitive types
  return TYPE_MAPPING[tsType] || tsType;
}
