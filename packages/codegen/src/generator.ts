/**
 * Java Code Generator - MyBatis-Plus Version
 * Generates Java source code from parsed TypeScript classes
 */
import { TYPE_MAPPING } from './types.js';
import type { ParsedClass, ParsedMethod, TranspilerOptions } from './types.js';

/**
 * Generate Java code for a class
 */
export function generateJavaClass(
  parsedClass: ParsedClass,
  options: TranspilerOptions
): string {
  const lines: string[] = [];
  const imports = new Set<string>();

  // Determine class type
  const classType = getClassType(parsedClass);
  
  // Collect imports
  collectImports(parsedClass, imports, classType, options);

  // Package declaration
  lines.push(`package ${options.packageName};`);
  lines.push('');

  // Import statements
  const sortedImports = [...imports].sort();
  sortedImports.forEach(imp => lines.push(`import ${imp};`));
  lines.push('');

  // Class annotations
  generateClassAnnotations(parsedClass, lines, options);

  // Class declaration
  if (classType === 'repository') {
    // MyBatis-Plus Mapper extends BaseMapper
    const entityName = getEntityNameFromRepository(parsedClass);
    lines.push(`public interface ${parsedClass.name} extends BaseMapper<${entityName}> {`);
  } else {
    lines.push(`public class ${parsedClass.name} {`);
  }
  lines.push('');

  // Fields
  if (classType === 'entity') {
    generateEntityFields(parsedClass, lines);
  } else if (parsedClass.constructor && classType !== 'repository') {
    generateInjectedFields(parsedClass, lines);
  }

  // Constructor (for DI) - skip for entity with Lombok and repository
  if (parsedClass.constructor && classType !== 'entity' && classType !== 'repository') {
    generateConstructor(parsedClass, lines);
  }

  // Methods - skip for repository (BaseMapper provides methods)
  if (classType !== 'repository') {
    parsedClass.methods.forEach(method => {
      generateMethod(method, lines);
      lines.push('');
    });
  }

  // Getters/Setters for Entity (skip if using Lombok)
  if (classType === 'entity' && !options.useLombok) {
    generateGettersSetters(parsedClass, lines);
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Get class type based on decorators
 */
function getClassType(parsedClass: ParsedClass): 'entity' | 'repository' | 'service' | 'controller' {
  for (const dec of parsedClass.decorators) {
    if (dec.name === 'Entity' || dec.name === 'TableName') return 'entity';
    if (dec.name === 'Mapper' || dec.name === 'Repository') return 'repository';
    if (dec.name === 'Service') return 'service';
    if (dec.name === 'RestController') return 'controller';
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
 * Collect required imports
 */
function collectImports(parsedClass: ParsedClass, imports: Set<string>, classType: string, options: TranspilerOptions): void {
  switch (classType) {
    case 'entity':
      // MyBatis-Plus imports
      imports.add('com.baomidou.mybatisplus.annotation.TableName');
      imports.add('com.baomidou.mybatisplus.annotation.TableId');
      imports.add('com.baomidou.mybatisplus.annotation.TableField');
      imports.add('com.baomidou.mybatisplus.annotation.IdType');
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
      break;
    case 'service':
      imports.add('org.springframework.stereotype.Service');
      break;
    case 'controller':
      imports.add('org.springframework.web.bind.annotation.RestController');
      imports.add('org.springframework.web.bind.annotation.RequestMapping');
      break;
  }

  // Check for method annotations
  parsedClass.methods.forEach(method => {
    method.decorators.forEach(dec => {
      if (['GetMapping', 'PostMapping', 'PutMapping', 'DeleteMapping'].includes(dec.name)) {
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
  });

  // Check for injected fields (@Autowired property injection)
  if (classType !== 'entity' && classType !== 'repository') {
    const hasAutowired = parsedClass.fields?.some(f => 
      f.decorators.some(d => d.name === 'Autowired')
    );
    if (hasAutowired || parsedClass.constructor) {
      imports.add('org.springframework.beans.factory.annotation.Autowired');
    }
  }

  // Common imports
  imports.add('java.util.List');
}

/**
 * Generate class annotations
 */
function generateClassAnnotations(parsedClass: ParsedClass, lines: string[], options: TranspilerOptions): void {
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
    }
  });
}

/**
 * Generate entity fields with MyBatis-Plus annotations
 */
function generateEntityFields(parsedClass: ParsedClass, lines: string[]): void {
  parsedClass.fields.forEach(field => {
    const javaType = mapType(field.type);
    
    // Check for @TableId (primary key)
    const tableId = field.decorators.find(d => d.name === 'TableId');
    if (tableId) {
      const idType = tableId.args.type || 'AUTO';
      lines.push(`    @TableId(type = IdType.${idType})`);
    }

    // Check for @TableField (column mapping)
    const tableField = field.decorators.find(d => d.name === 'TableField' || d.name === 'Column');
    if (tableField?.args.column && tableField.args.column !== field.name) {
      lines.push(`    @TableField("${tableField.args.column}")`);
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
function generateMethod(method: ParsedMethod, lines: string[]): void {
  // Method annotations
  method.decorators.forEach(dec => {
    if (['GetMapping', 'PostMapping', 'PutMapping', 'DeleteMapping', 'PatchMapping'].includes(dec.name)) {
      let path = dec.args.path || dec.args.arg0 || '';
      // Convert path syntax
      path = path.replace(/:(\w+)/g, '{$1}');
      lines.push(path ? `    @${dec.name}("${path}")` : `    @${dec.name}`);
    }
    if (dec.name === 'Transactional') {
      lines.push('    @Transactional');
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
        annotations.push('@RequestBody');
      }
    });
    return `${annotations.join(' ')} ${mapType(p.type)} ${p.name}`.trim();
  }).join(', ');

  lines.push(`    public ${returnType} ${method.name}(${params}) {`);
  lines.push('        // TODO: Implement');
  lines.push(`        return null;`);
  lines.push('    }');
}

/**
 * Generate getters and setters
 */
function generateGettersSetters(parsedClass: ParsedClass, lines: string[]): void {
  parsedClass.fields.forEach(field => {
    const javaType = mapType(field.type);
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
function mapType(tsType: string): string {
  // Handle nullable types
  if (tsType.endsWith(' | null')) {
    tsType = tsType.replace(' | null', '');
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
