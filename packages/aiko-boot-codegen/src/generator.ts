/**
 * Java Code Generator - MyBatis-Plus Version
 * Generates Java source code from parsed TypeScript classes
 */
import { TYPE_MAPPING, IMPORT_MAPPING, ID_TYPE_MAPPING } from './types.js';
import type { ParsedClass, ParsedMethod, TranspilerOptions, UtilityTypeUsage, ParsedComment, ParsedImport, ParsedInterface } from './types.js';
import { PluginRegistry, type TransformContext } from './plugins.js';
import { getBuiltinPlugins } from './builtin-plugins.js';
import { generateMethodBody } from './method-body-generator.js';

/** Global utility type collector */
const utilityTypeUsages: Map<string, UtilityTypeUsage> = new Map();

/**
 * Generator options with plugin support
 */
export interface GeneratorOptions extends TranspilerOptions {
  /** Plugin registry for extensible transformations */
  pluginRegistry?: PluginRegistry;
  /** Source file path (for plugin context) */
  sourceFile?: string;
  /** All parsed classes in current file (for plugin context) */
  allClasses?: ParsedClass[];
}

/**
 * Generate Java code for a class
 */
export function generateJavaClass(
  parsedClass: ParsedClass,
  options: GeneratorOptions
): string {
  const lines: string[] = [];
  const imports = new Set<string>();

  // Setup plugin registry
  const pluginRegistry = options.pluginRegistry ?? createDefaultPluginRegistry();
  
  // Determine class type
  const classType = getClassType(parsedClass);
  
  // Create transform context
  const context: TransformContext = {
    sourceFile: options.sourceFile ?? '',
    className: parsedClass.name,
    classType,
    options,
    allClasses: options.allClasses ?? [parsedClass],
  };

  // Apply class-level plugin transformations
  let transformedClass = pluginRegistry.applyClassTransform(parsedClass, context);
  
  // Transform decorators
  transformedClass = {
    ...transformedClass,
    decorators: transformedClass.decorators.map(dec => 
      pluginRegistry.applyDecoratorTransform(dec, context)
    ),
  };
  
  // Collect imports
  collectImports(transformedClass, imports, classType, options);

  // Package declaration
  lines.push(`package ${options.packageName};`);
  lines.push('');

  // Import statements
  const sortedImports = [...imports].sort();
  sortedImports.forEach(imp => lines.push(`import ${imp};`));
  lines.push('');

  // Class-level comment (JSDoc → Javadoc)
  if (transformedClass.comment) {
    lines.push(...generateJavaComment(transformedClass.comment, ''));
  }
  
  // Class annotations
  generateClassAnnotations(transformedClass, lines, options);

  // Class declaration
  if (classType === 'repository') {
    // MyBatis-Plus Mapper extends BaseMapper
    const entityName = getEntityNameFromRepository(transformedClass);
    lines.push(`public interface ${transformedClass.name} extends BaseMapper<${entityName}> {`);
  } else if (classType === 'redis' && transformedClass.decorators.some(d => d.name === 'RedisRepository' || d.name === 'RedisRepo')) {
    // Redis Repository extends RedisRepository
    const entityName = getEntityNameFromRepository(transformedClass);
    lines.push(`public interface ${transformedClass.name} extends RedisRepository<${entityName}, String> {`);
  } else {
    lines.push(`public class ${transformedClass.name} {`);
  }
  lines.push('');

  // Fields
  if (classType === 'entity') {
    generateEntityFields(transformedClass, lines);
  } else if (classType === 'dto') {
    generateDtoFields(transformedClass, lines, options);
  } else if (classType === 'redis') {
    // Generate Redis entity fields
    generateDtoFields(transformedClass, lines, options);
  } else if (classType !== 'repository' && !transformedClass.decorators.some(d => d.name === 'RedisRepository' || d.name === 'RedisRepo')) {
    // For service/controller/mq/security/admin, generate injected fields
    generateInjectedFields(transformedClass, lines);
  }

  // Constructor (for DI) - skip for entity with Lombok and repository
  if (transformedClass.constructor && classType !== 'entity' && classType !== 'repository' && !transformedClass.decorators.some(d => d.name === 'RedisRepository' || d.name === 'RedisRepo')) {
    generateConstructor(transformedClass, lines);
  }

  // Methods - skip for repository (BaseMapper provides methods)
  if (classType !== 'repository' && !transformedClass.decorators.some(d => d.name === 'RedisRepository' || d.name === 'RedisRepo')) {
    transformedClass.methods.forEach(method => {
      // Apply method-level plugin transformations
      const transformedMethod = pluginRegistry.applyMethodTransform(method, context);
      generateMethod(transformedMethod, lines, pluginRegistry, context);
      lines.push('');
    });
  }

  // Getters/Setters for Entity, DTO, and Redis (skip if using Lombok)
  if ((classType === 'entity' || classType === 'dto' || classType === 'redis') && !options.useLombok) {
    generateGettersSetters(transformedClass, lines);
  }

  lines.push('}');

  // Apply post-processing
  let javaCode = lines.join('\n');
  javaCode = pluginRegistry.applyPostProcess(javaCode, context);

  return javaCode;
}

/**
 * Create default plugin registry with builtin plugins
 */
function createDefaultPluginRegistry(): PluginRegistry {
  const registry = new PluginRegistry();
  registry.registerAll(getBuiltinPlugins());
  return registry;
}

/**
 * Get class type based on decorators
 */
function getClassType(parsedClass: ParsedClass): 'entity' | 'repository' | 'service' | 'controller' | 'dto' | 'redis' | 'mq' | 'security' | 'admin' {
  for (const dec of parsedClass.decorators) {
    if (dec.name === 'Entity' || dec.name === 'TableName') return 'entity';
    if (dec.name === 'Mapper' || dec.name === 'Repository') return 'repository';
    if (dec.name === 'Service') return 'service';
    if (dec.name === 'RestController') return 'controller';
    if (dec.name === 'RedisHash' || dec.name === 'RedisRepository' || dec.name === 'RedisRepo') return 'redis';
    if (dec.name === 'MqBinding' || dec.name === 'EnableBinding') return 'mq';
    if (dec.name === 'EnableGlobalMethodSecurity') return 'security';
    if (dec.name === 'AdminModule' || dec.name === 'AdminMenu' || dec.name === 'AdminPermission') return 'admin';
  }
  // If no decorators and has fields, it's likely a DTO
  if (parsedClass.fields.length > 0 && parsedClass.methods.length === 0) {
    return 'dto';
  }
  return 'service';
}

/**
 * Get entity name from repository name (e.g., UserRepository -> User)
 */
function getEntityNameFromRepository(parsedClass: ParsedClass): string {
  const name = parsedClass.name;
  if (name.endsWith('Repository')) {
    return name.replace('Repository', '');
  }
  if (name.endsWith('Mapper')) {
    return name.replace('Mapper', '');
  }
  return name;
}

/**
 * Collect imports from parsed TypeScript imports
 */
export function collectImportsFromParsed(parsedImports: ParsedImport[], imports: Set<string>): void {
  for (const imp of parsedImports) {
    // Skip type-only imports (not needed in Java)
    if (imp.isTypeOnly) continue;
    
    // Try module-level mapping first
    if (IMPORT_MAPPING[imp.modulePath]) {
      IMPORT_MAPPING[imp.modulePath].forEach(javaImport => imports.add(javaImport));
    }
    
    // Then try named import mapping
    for (const namedImport of imp.namedImports) {
      if (IMPORT_MAPPING[namedImport]) {
        IMPORT_MAPPING[namedImport].forEach(javaImport => imports.add(javaImport));
      }
    }
  }
}

/**
 * Generate Java comment from parsed comment
 */
export function generateJavaComment(comment: ParsedComment | undefined, indent: string = ''): string[] {
  if (!comment) return [];
  
  const lines: string[] = [];
  
  if (comment.type === 'jsdoc') {
    lines.push(`${indent}/**`);
    // Split text into lines and format
    const textLines = comment.text.split('\n');
    for (const line of textLines) {
      if (line.trim()) {
        lines.push(`${indent} * ${line.trim()}`);
      }
    }
    // Add tags
    if (comment.tags && comment.tags.length > 0) {
      for (const tag of comment.tags) {
        // Convert common TS JSDoc tags to Java
        let javaTag = tag.tag;
        if (tag.tag === 'example') continue; // Skip examples
        if (tag.tag === 'returns') javaTag = 'return';
        lines.push(`${indent} * @${javaTag} ${tag.text}`);
      }
    }
    lines.push(`${indent} */`);
  } else if (comment.type === 'line') {
    lines.push(`${indent}// ${comment.text}`);
  } else if (comment.type === 'block') {
    lines.push(`${indent}/* ${comment.text} */`);
  }
  
  return lines;
}

/**
 * Collect required imports
 */
function collectImports(parsedClass: ParsedClass, imports: Set<string>, classType: string, options: TranspilerOptions): void {
  switch (classType) {
    case 'entity':
      // MyBatis-Plus imports (using wildcard import)
      imports.add('com.baomidou.mybatisplus.annotation.*');
      imports.add('java.time.LocalDateTime');
      // Lombok
      if (options.useLombok) {
        imports.add('lombok.Data');
      }
      // Check for validation annotations
      parsedClass.fields.forEach(field => {
        field.decorators.forEach(dec => {
          if (['NotNull', 'Required'].includes(dec.name)) imports.add('javax.validation.constraints.NotNull');
          if (dec.name === 'Email') imports.add('javax.validation.constraints.Email');
          if (dec.name === 'Min') imports.add('javax.validation.constraints.Min');
          if (dec.name === 'Max') imports.add('javax.validation.constraints.Max');
          if (dec.name === 'Size') imports.add('javax.validation.constraints.Size');
        });
      });
      break;
    case 'repository':
      imports.add('com.baomidou.mybatisplus.core.mapper.BaseMapper');
      imports.add('org.apache.ibatis.annotations.Mapper');
      // Add entity import
      const entityName = getEntityNameFromRepository(parsedClass);
      imports.add(`${options.packageName.replace(/\.mapper$/, '.entity')}.${entityName}`);
      break;
    case 'service':
      imports.add('org.springframework.stereotype.Service');
      imports.add('org.springframework.beans.factory.annotation.Autowired');
      imports.add('java.time.LocalDateTime');
      imports.add('java.util.Objects');
      imports.add('java.util.Map');
      imports.add('java.util.HashMap');
      // Add entity and mapper imports
      addEntityMapperImports(parsedClass, imports, options);
      // Add DTO imports from method parameters and return types
      addDtoImports(parsedClass, imports, options);
      break;
    case 'controller':
      imports.add('org.springframework.web.bind.annotation.RestController');
      imports.add('org.springframework.web.bind.annotation.RequestMapping');
      imports.add('org.springframework.beans.factory.annotation.Autowired');
      imports.add('jakarta.validation.Valid');
      imports.add('java.util.Map');
      imports.add('java.util.HashMap');
      // Add entity and service imports
      addEntityServiceImports(parsedClass, imports, options);
      break;
    case 'dto':
      // Lombok
      if (options.useLombok) {
        imports.add('lombok.Data');
      }
      // Validation imports
      parsedClass.fields.forEach(field => {
        field.decorators.forEach(dec => {
          if (['IsNotEmpty', 'NotNull', 'Required'].includes(dec.name)) {
            imports.add('jakarta.validation.constraints.NotNull');
          }
          if (['IsEmail', 'Email'].includes(dec.name)) {
            imports.add('jakarta.validation.constraints.Email');
          }
          if (['Min', 'IsMin'].includes(dec.name)) {
            imports.add('jakarta.validation.constraints.Min');
          }
          if (['Max', 'IsMax'].includes(dec.name)) {
            imports.add('jakarta.validation.constraints.Max');
          }
          if (['Length', 'Size'].includes(dec.name)) {
            imports.add('jakarta.validation.constraints.Size');
          }
        });
        // Collect imports from field types (e.g., User[] -> entity.User)
        const javaType = mapType(field.type);
        collectImportsFromType(javaType, imports, options.packageName);
      });
      break;
    case 'redis':
      // Redis imports
      imports.add('org.springframework.data.redis.core.RedisHash');
      imports.add('org.springframework.data.redis.repository.RedisRepository');
      imports.add('org.springframework.data.annotation.Id');
      imports.add('org.springframework.data.redis.core.index.Indexed');
      // Lombok
      if (options.useLombok) {
        imports.add('lombok.Data');
      }
      break;
    case 'mq':
      // Message Queue imports
      imports.add('org.springframework.cloud.stream.annotation.EnableBinding');
      imports.add('org.springframework.cloud.stream.annotation.StreamListener');
      imports.add('org.springframework.cloud.stream.annotation.Output');
      imports.add('org.springframework.cloud.stream.messaging.Source');
      imports.add('org.springframework.cloud.stream.messaging.Sink');
      break;
    case 'security':
      // Security imports
      imports.add('org.springframework.security.access.prepost.PreAuthorize');
      imports.add('org.springframework.security.access.prepost.PostAuthorize');
      imports.add('org.springframework.security.access.annotation.Secured');
      imports.add('javax.annotation.security.RolesAllowed');
      imports.add('org.springframework.security.core.annotation.AuthenticationPrincipal');
      imports.add('org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity');
      break;
    case 'admin':
      // Admin imports
      imports.add('com.aiko.admin.annotation.AdminMenu');
      imports.add('com.aiko.admin.annotation.AdminRoute');
      imports.add('com.aiko.admin.annotation.AdminPermission');
      imports.add('com.aiko.admin.annotation.AdminModule');
      break;
  }

  // Check for method annotations
  parsedClass.methods.forEach(method => {
    method.decorators.forEach(dec => {
      if (['GetMapping', 'PostMapping', 'PutMapping', 'DeleteMapping', 'PatchMapping'].includes(dec.name)) {
        imports.add(`org.springframework.web.bind.annotation.${dec.name}`);
      }
      if (dec.name === 'Transactional') {
        imports.add('org.springframework.transaction.annotation.Transactional');
      }
    });

    method.parameters.forEach(param => {
      param.decorators.forEach(dec => {
        if (['PathVariable', 'RequestParam', 'RequestBody'].includes(dec.name)) {
          imports.add(`org.springframework.web.bind.annotation.${dec.name}`);
        }
      });
    });
    
    // Check method body for required imports
    if (method.body) {
      checkBodyImports(method.body, imports);
    }
  });

  // Common imports
  imports.add('java.util.List');
}

/**
 * Add entity and mapper imports for service
 */
function addEntityMapperImports(parsedClass: ParsedClass, imports: Set<string>, options: TranspilerOptions): void {
  const basePackage = options.packageName.replace(/\.(service|controller|mapper|entity|model)$/, '');
  
  // Infer entity names from constructor parameters or fields
  const constructorParams = parsedClass.constructor?.parameters || [];
  const autowiredFields = parsedClass.fields.filter(f => f.decorators.some(d => d.name === 'Autowired'));
  
  [...constructorParams, ...autowiredFields].forEach(p => {
    const type = p.type;
    if (type.endsWith('Mapper')) {
      const entityName = type.replace('Mapper', '');
      imports.add(`${basePackage}.entity.${entityName}`);
      imports.add(`${basePackage}.mapper.${type}`);
    }
  });
  
  // Add QueryWrapper/UpdateWrapper if used in method bodies
  imports.add('com.baomidou.mybatisplus.core.conditions.query.QueryWrapper');
  imports.add('com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper');
}

/**
 * Add entity and service imports for controller
 */
function addEntityServiceImports(parsedClass: ParsedClass, imports: Set<string>, options: TranspilerOptions): void {
  const basePackage = options.packageName.replace(/\.(service|controller|mapper|entity|model)$/, '');
  
  const constructorParams = parsedClass.constructor?.parameters || [];
  const autowiredFields = parsedClass.fields.filter(f => f.decorators.some(d => d.name === 'Autowired'));
  
  [...constructorParams, ...autowiredFields].forEach(p => {
    const type = p.type;
    if (type.endsWith('Service')) {
      const entityName = type.replace('Service', '');
      imports.add(`${basePackage}.entity.${entityName}`);
      imports.add(`${basePackage}.service.${type}`);
    }
  });
  
  // Add DTO imports
  imports.add(`${basePackage}.model.*`);
}

/**
 * Check method body for additional import requirements
 */
function checkBodyImports(body: any[], imports: Set<string>): void {
  const bodyStr = JSON.stringify(body);
  
  if (bodyStr.includes('QueryWrapper')) {
    imports.add('com.baomidou.mybatisplus.core.conditions.query.QueryWrapper');
  }
  if (bodyStr.includes('UpdateWrapper')) {
    imports.add('com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper');
  }
  if (bodyStr.includes('LocalDateTime') || bodyStr.includes('Date')) {
    imports.add('java.time.LocalDateTime');
  }
  if (bodyStr.includes('Objects.equals')) {
    imports.add('java.util.Objects');
  }
  if (bodyStr.includes('Map.of') || bodyStr.includes('HashMap')) {
    imports.add('java.util.Map');
    imports.add('java.util.HashMap');
  }
}

/**
 * Add DTO imports from method parameters and return types
 */
function addDtoImports(parsedClass: ParsedClass, imports: Set<string>, options: TranspilerOptions): void {
  const basePackage = options.packageName.replace(/\.(service|controller|mapper|entity|model)$/, '');
  
  // Known DTO suffixes
  const dtoPatterns = ['Dto', 'DTO', 'Params', 'Request', 'Response', 'Vo', 'VO', 'Result'];
  
  parsedClass.methods.forEach(method => {
    // Check method parameters
    method.parameters.forEach(param => {
      const typeName = param.type.replace(/[\[\]<>]/g, '');
      if (dtoPatterns.some(suffix => typeName.endsWith(suffix))) {
        imports.add(`${basePackage}.model.${typeName}`);
      }
    });
    
    // Check return type
    const returnType = method.returnType.replace(/[\[\]<>]/g, '');
    if (dtoPatterns.some(suffix => returnType.endsWith(suffix))) {
      imports.add(`${basePackage}.model.${returnType}`);
    }
  });
}

/**
 * Generate class annotations
 */
function generateClassAnnotations(parsedClass: ParsedClass, lines: string[], options: TranspilerOptions): void {
  const classType = getClassType(parsedClass);
  
  // For DTO classes, add @Data if using Lombok
  if (classType === 'dto' && options.useLombok) {
    lines.push('@Data');
    return;
  }
  
  // For Redis classes, add @Data if using Lombok
  if (classType === 'redis' && options.useLombok) {
    lines.push('@Data');
  }
  
  parsedClass.decorators.forEach(dec => {
    switch (dec.name) {
      case 'Entity':
      case 'TableName':
        // Lombok annotations
        if (options.useLombok) {
          lines.push('@Data');
        }
        // MyBatis-Plus @TableName
        if (dec.args.tableName || dec.args.table) {
          lines.push(`@TableName("${dec.args.tableName || dec.args.table}")`);
        } else {
          lines.push('@TableName');
        }
        break;
      case 'Mapper':
      case 'Repository':
        lines.push('@Mapper');
        break;
      case 'Service':
        lines.push('@Service');
        break;
      case 'RestController':
        lines.push('@RestController');
        if (dec.args.path) {
          // Convert path syntax: /:id -> /{id}
          const javaPath = dec.args.path.replace(/:(\w+)/g, '{$1}');
          lines.push(`@RequestMapping("${javaPath}")`);
        }
        break;
      case 'RedisHash':
        if (dec.args.value || dec.args.arg0) {
          const value = dec.args.value || dec.args.arg0;
          lines.push(`@RedisHash("${value}")`);
        } else {
          lines.push('@RedisHash');
        }
        break;
      case 'RedisRepository':
      case 'RedisRepo':
        lines.push('@Repository');
        break;
      case 'MqBinding':
      case 'EnableBinding':
        if (dec.args.value) {
          const value = Array.isArray(dec.args.value) ? dec.args.value.join(', ') : dec.args.value;
          lines.push(`@EnableBinding(${value})`);
        } else {
          lines.push('@EnableBinding');
        }
        break;
      case 'EnableGlobalMethodSecurity':
        const prePostEnabled = dec.args.prePostEnabled ?? true;
        const securedEnabled = dec.args.securedEnabled ?? true;
        const jsr250Enabled = dec.args.jsr250Enabled ?? true;
        lines.push(`@EnableGlobalMethodSecurity(prePostEnabled = ${prePostEnabled}, securedEnabled = ${securedEnabled}, jsr250Enabled = ${jsr250Enabled})`);
        break;
      case 'AdminModule':
        lines.push('@AdminModule');
        break;
      case 'AdminMenu':
        lines.push('@AdminMenu');
        break;
      case 'AdminPermission':
        lines.push('@AdminPermission');
        break;
      case 'Output':
      case 'MqSender':
        if (dec.args.value) {
          lines.push(`@Output(${dec.args.value})`);
        } else {
          lines.push('@Output');
        }
        break;
    }
  });
}

/**
 * Generate entity fields with MyBatis-Plus annotations
 */
function generateEntityFields(parsedClass: ParsedClass, lines: string[]): void {
  parsedClass.fields.forEach(field => {
    const javaType = mapFieldType(field);
    
    // Check for @TableId (primary key)
    const tableId = field.decorators.find(d => d.name === 'TableId');
    if (tableId) {
      const idType = tableId.args.type || 'AUTO';
      lines.push(`    @TableId(type = IdType.${idType})`);
    }

    // Check for @TableField (column mapping)
    const tableField = field.decorators.find(d => d.name === 'TableField' || d.name === 'Column');
    if (tableField) {
      const columnName = tableField.args.column || tableField.args.arg0;
      if (columnName && columnName !== field.name) {
        lines.push(`    @TableField("${columnName}")`);
      }
    }

    // Check for validation decorators
    field.decorators.forEach(dec => {
      if (dec.name === 'NotNull' || dec.name === 'Required') lines.push('    @NotNull');
      if (dec.name === 'Email') lines.push('    @Email');
      if (dec.name === 'Min') lines.push(`    @Min(${dec.args.value || dec.args.arg0})`);
      if (dec.name === 'Max') lines.push(`    @Max(${dec.args.value || dec.args.arg0})`);
      if (dec.name === 'Size') lines.push(`    @Size(min = ${dec.args.min || 0}, max = ${dec.args.max || 255})`);
    });

    lines.push(`    private ${javaType} ${field.name};`);
    lines.push('');
  });
}

/**
 * Generate DTO fields with validation annotations
 */
function generateDtoFields(parsedClass: ParsedClass, lines: string[], _options: TranspilerOptions): void {
  const classType = getClassType(parsedClass);
  const isRedis = classType === 'redis' || parsedClass.decorators.some(d => d.name === 'RedisHash');
  
  parsedClass.fields.forEach(field => {
    const javaType = mapFieldType(field);
    
    // Check for Redis decorators first
    if (isRedis) {
      field.decorators.forEach(dec => {
        if (dec.name === 'Id') {
          lines.push('    @Id');
        }
        if (dec.name === 'Indexed') {
          lines.push('    @Indexed');
        }
        if (dec.name === 'RedisValue') {
          lines.push('    @RedisValue');
        }
      });
    }
    
    // Check for validation decorators
    field.decorators.forEach(dec => {
      if (dec.name === 'IsNotEmpty' || dec.name === 'NotNull' || dec.name === 'Required') {
        lines.push('    @NotNull');
      }
      if (dec.name === 'IsEmail' || dec.name === 'Email') {
        lines.push('    @Email');
      }
      if (dec.name === 'Min' || dec.name === 'IsMin') {
        const value = dec.args.value || dec.args.arg0 || 0;
        lines.push(`    @Min(${value})`);
      }
      if (dec.name === 'Max' || dec.name === 'IsMax') {
        const value = dec.args.value || dec.args.arg0 || 0;
        lines.push(`    @Max(${value})`);
      }
      if (dec.name === 'Length' || dec.name === 'Size') {
        const min = dec.args.min || dec.args.arg0 || 0;
        const max = dec.args.max || dec.args.arg1 || 255;
        lines.push(`    @Size(min = ${min}, max = ${max})`);
      }
    });

    lines.push(`    private ${javaType} ${field.name};`);
    lines.push('');
  });
}

/**
 * Map field type with smart number handling
 * - id fields use Long
 * - age, count etc. use Integer
 */
export function mapFieldType(field: { name: string; type: string; decorators: any[] }): string {
  const tsType = field.type;
  
  // Check if it's a Redis field (has @Indexed or is Redis entity)
  const isRedis = field.decorators.some(d => d.name === 'Indexed' || d.name === 'Id');
  
  // Check if it's a primary key (id)
  const isId = field.name === 'id' || field.decorators.some(d => d.name === 'TableId');
  
  // Smart number mapping
  if (tsType === 'number') {
    if (isId) {
      return isRedis ? ID_TYPE_MAPPING.redis : ID_TYPE_MAPPING.default;
    }
    // Age, count, etc. should be Integer
    if (['age', 'count', 'size', 'index', 'position'].some(n => field.name.toLowerCase().includes(n))) {
      return ID_TYPE_MAPPING.age;
    }
    return 'Integer'; // Default to Integer for most number fields
  }
  
  return mapType(tsType);
}

/**
 * Generate injected fields for Services/Controllers
 * Supports both constructor injection and @Autowired property injection
 */
function generateInjectedFields(parsedClass: ParsedClass, lines: string[]): void {
  // 1. From constructor parameters (legacy style)
  parsedClass.constructor?.parameters.forEach(param => {
    const javaType = mapType(param.type);
    lines.push('    @Autowired');
    lines.push(`    private ${javaType} ${param.name};`);
    lines.push('');
  });

  // 2. From @Autowired property decorators (Spring Boot style)
  parsedClass.fields.forEach(field => {
    const autowired = field.decorators.find(d => d.name === 'Autowired');
    if (autowired) {
      const javaType = mapType(field.type);
      lines.push('    @Autowired');
      lines.push(`    private ${javaType} ${field.name};`);
      lines.push('');
    }
  });
}

/**
 * Generate constructor
 */
function generateConstructor(parsedClass: ParsedClass, lines: string[]): void {
  if (!parsedClass.constructor) return;

  const params = parsedClass.constructor.parameters
    .map(p => `${mapType(p.type)} ${p.name}`)
    .join(', ');

  lines.push(`    public ${parsedClass.name}(${params}) {`);
  parsedClass.constructor.parameters.forEach(p => {
    lines.push(`        this.${p.name} = ${p.name};`);
  });
  lines.push('    }');
  lines.push('');
}

/**
 * Generate method
 */
function generateMethod(
  method: ParsedMethod, 
  lines: string[],
  pluginRegistry?: PluginRegistry,
  context?: TransformContext
): void {
  // Transform method decorators through plugins
  const transformedDecorators = pluginRegistry && context
    ? method.decorators.map(dec => pluginRegistry.applyDecoratorTransform(dec, context))
    : method.decorators;

  // Method-level comment (JSDoc → Javadoc)
  if (method.comment) {
    lines.push(...generateJavaComment(method.comment, '    '));
  }
  
  // Method annotations
  transformedDecorators.forEach(dec => {
    if (['GetMapping', 'PostMapping', 'PutMapping', 'DeleteMapping', 'PatchMapping'].includes(dec.name)) {
      let path = dec.args.path || dec.args.arg0 || '';
      // Convert path syntax
      path = path.replace(/:(\w+)/g, '{$1}');
      lines.push(path ? `    @${dec.name}("${path}")` : `    @${dec.name}`);
    }
    if (dec.name === 'Transactional') {
      lines.push('    @Transactional');
    }
    if (dec.name === 'PreAuthorize') {
      const value = dec.args.value || dec.args.arg0 || '';
      // Escape double quotes inside the value
      const escapedValue = value.replace(/"/g, '\\"');
      lines.push(`    @PreAuthorize("${escapedValue}")`);
    }
    if (dec.name === 'PostAuthorize') {
      const value = dec.args.value || dec.args.arg0 || '';
      // Escape double quotes inside the value
      const escapedValue = value.replace(/"/g, '\\"');
      lines.push(`    @PostAuthorize("${escapedValue}")`);
    }
    if (dec.name === 'Secured') {
      const roles = Array.isArray(dec.args.value) ? dec.args.value.map(r => `"${r}"`).join(', ') : `"${dec.args.value}"`;
      lines.push(`    @Secured({${roles}})`);
    }
    if (dec.name === 'RolesAllowed') {
      const roles = Array.isArray(dec.args.value) ? dec.args.value.map(r => `"${r}"`).join(', ') : `"${dec.args.value}"`;
      lines.push(`    @RolesAllowed({${roles}})`);
    }
    if (dec.name === 'MqListener' || dec.name === 'StreamListener') {
      let value = dec.args.value || dec.args.arg0 || '';
      // Check if value is a constant (like Sink.INPUT)
      if (value && (value.includes('.') || value === 'Sink.INPUT' || value === 'Source.OUTPUT')) {
        lines.push(`    @StreamListener(${value})`);
      } else {
        lines.push(value ? `    @StreamListener("${value}")` : `    @StreamListener`);
      }
    }
    if (dec.name === 'Output' || dec.name === 'MqSender') {
      let value = dec.args.value || dec.args.arg0 || '';
      // Check if value is a constant (like Source.OUTPUT)
      if (value && (value.includes('.') || value === 'Source.OUTPUT' || value === 'Sink.INPUT')) {
        lines.push(`    @Output(${value})`);
      } else {
        lines.push(value ? `    @Output("${value}")` : `    @Output`);
      }
    }
    if (dec.name === 'AdminRoute') {
      lines.push('    @AdminRoute');
    }
  });

  // Return type
  const returnType = mapType(method.returnType);

  // Parameters
  const params = method.parameters.map(p => {
    const annotations: string[] = [];
    
    p.decorators.forEach(dec => {
      if (dec.name === 'PathVariable') {
        const name = dec.args.arg0 || p.name;
        annotations.push(`@PathVariable("${name}")`);
      }
      if (dec.name === 'RequestParam') {
        const name = dec.args.arg0 || p.name;
        annotations.push(`@RequestParam("${name}")`);
      }
      if (dec.name === 'RequestBody') {
        // Auto-add @Valid for DTO validation
        annotations.push('@Valid');
        annotations.push('@RequestBody');
      }
    });
    
    // Smart type mapping for parameters
    let javaType = mapType(p.type);
    // Map id parameters to Long
    if (p.type === 'number' && (p.name === 'id' || p.name.includes('Id'))) {
      javaType = ID_TYPE_MAPPING.default;
    }
    
    return `${annotations.join(' ')} ${javaType} ${p.name}`.trim();
  }).join(', ');

  lines.push(`    public ${returnType} ${method.name}(${params}) {`);
  
  // Generate method body
  const bodyLines = generateMethodBody(method);
  lines.push(...bodyLines);
  
  lines.push('    }');
}

/**
 * Generate getters and setters
 */
function generateGettersSetters(parsedClass: ParsedClass, lines: string[]): void {
  const classType = getClassType(parsedClass);
  const isRedis = classType === 'redis' || parsedClass.decorators.some(d => d.name === 'RedisHash');
  
  parsedClass.fields.forEach(field => {
    // Determine Java type - special handling for id field
    let javaType: string;
    const isIdField = field.name === 'id' || 
      field.decorators.some(d => d.name === 'PrimaryKey' || d.name === 'Id' || d.name === 'TableId');
    
    if (isIdField) {
      // For Redis entities, id should be String; for others, use Long
      javaType = isRedis ? 'String' : 'Long';
    } else {
      javaType = mapType(field.type);
    }
    
    const capitalName = field.name.charAt(0).toUpperCase() + field.name.slice(1);

    // Getter
    lines.push(`    public ${javaType} get${capitalName}() {`);
    lines.push(`        return this.${field.name};`);
    lines.push('    }');
    lines.push('');

    // Setter
    lines.push(`    public void set${capitalName}(${javaType} ${field.name}) {`);
    lines.push(`        this.${field.name} = ${field.name};`);
    lines.push('    }');
    lines.push('');
  });
}

/**
 * Map TypeScript type to Java type
 */
export function mapType(tsType: string): string {
  // Handle nullable types
  if (tsType.endsWith(' | null')) {
    tsType = tsType.replace(' | null', '');
  }

  // Handle inline object types: { data: User[]; total: number } -> Map<String, Object>
  if (tsType.startsWith('{') && tsType.endsWith('}')) {
    return 'Map<String, Object>';
  }

  // Handle Omit, Pick, Partial generic types -> generate new class
  const utilityMatch = tsType.match(/^(Omit|Pick|Partial|Required)<([^,>]+)(?:,\s*(['"][^'"]+['"](?:\s*\|\s*['"][^'"]+['"])*))?>/);
  if (utilityMatch) {
    const [fullMatch, utility, baseType, fieldsStr] = utilityMatch;
    const fields = fieldsStr 
      ? fieldsStr.split('|').map(f => f.trim().replace(/['"]/g, ''))
      : [];
    
    // Generate class name
    let generatedClassName: string;
    if (utility === 'Omit') {
      const fieldNames = fields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join('');
      generatedClassName = `${baseType}Without${fieldNames}`;
    } else if (utility === 'Pick') {
      const fieldNames = fields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join('');
      generatedClassName = `${baseType}${fieldNames}Only`;
    } else if (utility === 'Partial') {
      generatedClassName = `${baseType}Partial`;
    } else {
      generatedClassName = baseType;
    }
    
    // Track utility type usage
    if (!utilityTypeUsages.has(fullMatch)) {
      utilityTypeUsages.set(fullMatch, {
        original: fullMatch,
        utility: utility as any,
        baseType: baseType.trim(),
        fields,
        generatedClassName,
      });
    }
    
    return generatedClassName;
  }

  // Handle Promise wrapper
  if (tsType.startsWith('Promise<')) {
    return mapType(tsType.slice(8, -1));
  }

  // Handle arrays
  if (tsType.endsWith('[]')) {
    const elementType = tsType.slice(0, -2);
    return `List<${mapType(elementType)}>`;
  }

  // Direct mapping
  if (TYPE_MAPPING[tsType]) {
    return TYPE_MAPPING[tsType];
  }

  // Keep class names as-is
  return tsType;
}

/**
 * Get all collected utility type usages
 */
export function getUtilityTypeUsages(): UtilityTypeUsage[] {
  return Array.from(utilityTypeUsages.values());
}

/**
 * Clear utility type usages (call before processing a new batch)
 */
export function clearUtilityTypeUsages(): void {
  utilityTypeUsages.clear();
}

/**
 * Register a utility type usage (Omit, Pick, Partial)
 * Call this when encountering utility types in method bodies
 */
export function registerUtilityTypeUsage(
  original: string,
  utility: 'Omit' | 'Pick' | 'Partial' | 'Required',
  baseType: string,
  fields: string[],
  generatedClassName: string
): void {
  if (!utilityTypeUsages.has(original)) {
    utilityTypeUsages.set(original, {
      original,
      utility,
      baseType,
      fields,
      generatedClassName,
    });
  }
}

/**
 * Generate a Java class for a utility type
 */
export function generateUtilityTypeClass(
  usage: UtilityTypeUsage,
  entityClass: ParsedClass,
  options: TranspilerOptions
): string {
  const lines: string[] = [];
  const imports = new Set<string>();
  
  // Collect imports
  if (options.useLombok) {
    imports.add('lombok.Data');
  }
  
  // Generate fields based on utility type and collect imports
  const fieldsToInclude = getFieldsForUtilityType(usage, entityClass);
  
  for (const field of fieldsToInclude) {
    const javaType = mapFieldType(field);
    // Collect imports for field types
    if (javaType === 'LocalDateTime' || javaType.includes('LocalDateTime')) {
      imports.add('java.time.LocalDateTime');
    }
    if (javaType === 'LocalDate' || javaType.includes('LocalDate')) {
      imports.add('java.time.LocalDate');
    }
    if (javaType.startsWith('List<')) {
      imports.add('java.util.List');
    }
    if (javaType.startsWith('Map<')) {
      imports.add('java.util.Map');
    }
    if (javaType === 'BigDecimal') {
      imports.add('java.math.BigDecimal');
    }
  }
  
  // Package
  lines.push(`package ${options.packageName}.model;`);
  lines.push('');
  
  // Imports
  const sortedImports = [...imports].sort();
  sortedImports.forEach(imp => lines.push(`import ${imp};`));
  if (sortedImports.length > 0) lines.push('');
  
  // Class annotations
  if (options.useLombok) {
    lines.push('@Data');
  }
  
  // Class declaration
  lines.push(`public class ${usage.generatedClassName} {`);
  lines.push('');
  
  for (const field of fieldsToInclude) {
    const javaType = mapFieldType(field);
    
    // Add field
    lines.push(`    private ${javaType} ${field.name};`);
    lines.push('');
  }
  
  // Generate getters/setters if not using Lombok
  if (!options.useLombok) {
    for (const field of fieldsToInclude) {
      const javaType = mapFieldType(field);
      const capitalizedName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
      
      // Getter
      lines.push(`    public ${javaType} get${capitalizedName}() {`);
      lines.push(`        return this.${field.name};`);
      lines.push('    }');
      lines.push('');
      
      // Setter
      lines.push(`    public void set${capitalizedName}(${javaType} ${field.name}) {`);
      lines.push(`        this.${field.name} = ${field.name};`);
      lines.push('    }');
      lines.push('');
    }
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Get fields to include in utility type class
 */
function getFieldsForUtilityType(usage: UtilityTypeUsage, entityClass: ParsedClass): typeof entityClass.fields {
  switch (usage.utility) {
    case 'Omit':
      // Exclude specified fields
      return entityClass.fields.filter(f => !usage.fields.includes(f.name));
    case 'Pick':
      // Include only specified fields
      return entityClass.fields.filter(f => usage.fields.includes(f.name));
    case 'Partial':
    case 'Required':
      // Include all fields
      return entityClass.fields;
    default:
      return entityClass.fields;
  }
}

/**
 * Generate Java DTO class or repository interface from TypeScript interface
 */
export function generateJavaFromInterface(
  parsedInterface: ParsedInterface,
  options: TranspilerOptions
): string {
  const lines: string[] = [];
  const imports = new Set<string>();
  
  // Check if it's a repository interface
  const isRepo = parsedInterface.name.includes('Repository');
  
  // Check if it has @Repository decorator
  const hasRepositoryDecorator = parsedInterface.decorators.some(d => d.name === 'Repository');
  
  // Check if it's a Redis repository interface
  const isRedisRepo = isRepo && (parsedInterface.name.includes('Redis') || 
                                parsedInterface.name.includes('Session') ||
                                parsedInterface.decorators.some(d => d.name === 'RedisRepository' || d.name === 'RedisRepo'));
  
  // Check if it's a regular ORM repository
  const isOrmRepo = isRepo && !isRedisRepo;
  
  // Repository imports
  if (isRedisRepo) {
    imports.add('org.springframework.data.redis.repository.RedisRepository');
    imports.add('org.springframework.stereotype.Repository');
  } else if (isOrmRepo || hasRepositoryDecorator) {
    imports.add('com.baomidou.mybatisplus.core.mapper.BaseMapper');
    imports.add('org.apache.ibatis.annotations.Mapper');
    // Add entity import
    const entityName = parsedInterface.name.replace('Repository', '');
    imports.add(`${options.packageName.replace(/\.repository$/, '.entity')}.${entityName}`);
  }
  
  // Lombok
  if (options.useLombok && !isRepo && !hasRepositoryDecorator) {
    imports.add('lombok.Data');
  }
  
  // Collect imports from property types
  for (const prop of parsedInterface.properties) {
    const javaType = mapInterfacePropertyType(prop.type);
    collectImportsFromType(javaType, imports, options.packageName);
  }
  
  // Package declaration
  lines.push(`package ${options.packageName};`);
  lines.push('');
  
  // Imports
  if (imports.size > 0) {
    for (const imp of Array.from(imports).sort()) {
      lines.push(`import ${imp};`);
    }
    lines.push('');
  }
  
  // Generate class comment (from interface JSDoc)
  if (parsedInterface.comment) {
    lines.push(...generateJavaComment(parsedInterface.comment, ''));
  }
  
  // Class annotation
  if (isRedisRepo) {
    lines.push('@Repository');
  } else if (isOrmRepo || hasRepositoryDecorator) {
    lines.push('@Repository');
    lines.push('@Mapper');
  } else if (options.useLombok) {
    lines.push('@Data');
  }
  
  // Class declaration
  if (isRedisRepo) {
    // Extract entity name from repository name
    const entityName = parsedInterface.name.replace('Repository', '');
    lines.push(`public interface ${parsedInterface.name} extends RedisRepository<${entityName}, String> {`);
  } else if (isOrmRepo || hasRepositoryDecorator) {
    // Extract entity name from repository name
    const entityName = parsedInterface.name.replace('Repository', '');
    lines.push(`public interface ${parsedInterface.name} extends BaseMapper<${entityName}> {`);
  } else {
    lines.push(`public class ${parsedInterface.name} {`);
  }
  
  // For repository interfaces, don't generate fields or methods
  if (!isRepo && !hasRepositoryDecorator) {
    // Generate fields from interface properties
    for (const prop of parsedInterface.properties) {
      // Add field comment if present
      if (prop.comment) {
        lines.push(`    /** ${prop.comment} */`);
      }
      
      const javaType = mapInterfacePropertyType(prop.type);
      lines.push(`    private ${javaType} ${prop.name};`);
      lines.push('');
    }
    
    // Generate getters/setters if not using Lombok
    if (!options.useLombok) {
      for (const prop of parsedInterface.properties) {
        const javaType = mapInterfacePropertyType(prop.type);
        const capitalizedName = prop.name.charAt(0).toUpperCase() + prop.name.slice(1);
        
        // Getter
        lines.push(`    public ${javaType} get${capitalizedName}() {`);
        lines.push(`        return this.${prop.name};`);
        lines.push('    }');
        lines.push('');
        
        // Setter
        lines.push(`    public void set${capitalizedName}(${javaType} ${prop.name}) {`);
        lines.push(`        this.${prop.name} = ${prop.name};`);
        lines.push('    }');
        lines.push('');
      }
    }
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Map interface property type to Java type
 */
function mapInterfacePropertyType(tsType: string): string {
  // Handle union types (e.g., 'id' | 'username' | 'age' -> String)
  if (tsType.includes("'") || tsType.includes('"')) {
    return 'String';
  }
  
  // Handle nullable types
  if (tsType.endsWith(' | null') || tsType.endsWith(' | undefined')) {
    tsType = tsType.replace(/ \| (null|undefined)/g, '');
  }
  
  // Handle array types: User[] -> List<User>
  if (tsType.endsWith('[]')) {
    const elementType = tsType.slice(0, -2);
    const javaElementType = mapInterfacePropertyType(elementType);
    return `List<${javaElementType}>`;
  }
  
  // Handle number
  if (tsType === 'number') {
    return 'Integer';
  }
  
  // Use standard type mapping
  if (TYPE_MAPPING[tsType]) {
    return TYPE_MAPPING[tsType];
  }
  
  return tsType;
}

/**
 * Collect imports from Java type string
 */
function collectImportsFromType(javaType: string, imports: Set<string>, currentPackage: string): void {
  // Handle List<X>
  if (javaType.startsWith('List<')) {
    imports.add('java.util.List');
    // Extract inner type
    const innerType = javaType.slice(5, -1);
    collectImportsFromType(innerType, imports, currentPackage);
    return;
  }
  
  // Handle basic Java types that need imports
  const typeImportMap: Record<string, string> = {
    'LocalDateTime': 'java.time.LocalDateTime',
    'LocalDate': 'java.time.LocalDate',
    'BigDecimal': 'java.math.BigDecimal',
    'Map': 'java.util.Map',
    'Set': 'java.util.Set',
  };
  
  if (typeImportMap[javaType]) {
    imports.add(typeImportMap[javaType]);
    return;
  }
  
  // Handle entity/model references - assume same package prefix
  // e.g., User in model package needs entity import
  const primitiveTypes = ['String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Object', 'void'];
  if (!primitiveTypes.includes(javaType) && !javaType.includes('.')) {
    // Get base package (remove 'model' suffix)
    const basePackage = currentPackage.replace(/\.model$/, '');
    imports.add(`${basePackage}.entity.${javaType}`);
  }
}
