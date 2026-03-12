/**
 * Built-in Transpile Plugins
 * Pre-configured plugins for common TypeScript to Java transformations
 */
import type { TranspilePlugin } from './plugins.js';
import type { ParsedDecorator, ParsedClass } from './types.js';
import { getComponentPlugins } from './component-plugins.js';

/**
 * Mapper Plugin
 * Transforms @Mapper(User) to @Mapper() for Java (MyBatis-Plus style)
 * In Java, the entity type is inferred from BaseMapper<T> generic
 */
export const mapperPlugin: TranspilePlugin = {
  name: 'mapper-plugin',
  
  transformDecorator(decorator: ParsedDecorator) {
    // @Mapper(User) -> @Mapper() (Java uses BaseMapper<User> for type inference)
    if (decorator.name === 'Mapper' || decorator.name === 'Repository') {
      return {
        ...decorator,
        args: {}, // Remove entity argument
      };
    }
    return decorator;
  },
};

/**
 * Entity Plugin
 * Handles @Entity and @TableName decorator transformations
 */
export const entityPlugin: TranspilePlugin = {
  name: 'entity-plugin',
  
  transformDecorator(decorator: ParsedDecorator) {
    // Ensure @Entity becomes @TableName with table name
    if (decorator.name === 'Entity') {
      return {
        name: 'TableName',
        args: decorator.args,
      };
    }
    return decorator;
  },
};

/**
 * Validation Plugin
 * Transforms TypeScript validation decorators to Jakarta Validation annotations
 */
export const validationPlugin: TranspilePlugin = {
  name: 'validation-plugin',
  
  transformDecorator(decorator: ParsedDecorator) {
    // Map validation decorators to Jakarta Validation
    const validationMapping: Record<string, string> = {
      'Required': 'NotNull',
      'MinLength': 'Size',
      'MaxLength': 'Size',
      'Pattern': 'Pattern',
    };
    
    if (validationMapping[decorator.name]) {
      return {
        ...decorator,
        name: validationMapping[decorator.name],
      };
    }
    return decorator;
  },
};

/**
 * Date Plugin
 * Transforms Date type handling for Java LocalDateTime
 */
export const datePlugin: TranspilePlugin = {
  name: 'date-plugin',
  
  transformType(tsType: string) {
    if (tsType === 'Date') {
      return 'LocalDateTime';
    }
    return tsType;
  },
};

/**
 * Service Plugin
 * Handles @Service decorator and DI transformations
 */
export const servicePlugin: TranspilePlugin = {
  name: 'service-plugin',
  
  transformClass(cls: ParsedClass, context) {
    // If class has @Service decorator and constructor with dependencies,
    // ensure proper @Autowired annotations
    if (context.classType === 'service') {
      // Transform constructor parameters to @Autowired fields
      return cls;
    }
    return cls;
  },
};

/**
 * Controller Plugin
 * Handles @RestController and request mapping transformations
 */
export const controllerPlugin: TranspilePlugin = {
  name: 'controller-plugin',
  
  transformDecorator(decorator: ParsedDecorator) {
    // Convert path parameter syntax: /:id -> /{id}
    if (['GetMapping', 'PostMapping', 'PutMapping', 'DeleteMapping', 'PatchMapping'].includes(decorator.name)) {
      const path = decorator.args.path || decorator.args.arg0;
      if (path && typeof path === 'string') {
        const javaPath = path.replace(/:(\w+)/g, '{$1}');
        return {
          ...decorator,
          args: {
            ...decorator.args,
            path: javaPath,
            arg0: javaPath,
          },
        };
      }
    }
    return decorator;
  },
};

/**
 * QueryWrapper Plugin
 * Handles QueryWrapper/UpdateWrapper code transformations
 */
export const queryWrapperPlugin: TranspilePlugin = {
  name: 'querywrapper-plugin',
  
  // QueryWrapper syntax is similar in both TS and Java
  // Main transformation is type generics handling
  transformType(tsType: string) {
    if (tsType.startsWith('QueryWrapper<')) {
      return tsType; // Keep as-is, Java has same syntax
    }
    if (tsType.startsWith('UpdateWrapper<')) {
      return tsType;
    }
    return tsType;
  },
};

/**
 * Get all built-in plugins
 */
export function getBuiltinPlugins(): TranspilePlugin[] {
  return [
    mapperPlugin,
    entityPlugin,
    validationPlugin,
    datePlugin,
    servicePlugin,
    controllerPlugin,
    queryWrapperPlugin,
    ...getComponentPlugins(),
  ];
}

/**
 * Get plugins by name
 */
export function getPluginsByName(names: string[]): TranspilePlugin[] {
  const allPlugins: Record<string, TranspilePlugin> = {
    'mapper-plugin': mapperPlugin,
    'entity-plugin': entityPlugin,
    'validation-plugin': validationPlugin,
    'date-plugin': datePlugin,
    'service-plugin': servicePlugin,
    'controller-plugin': controllerPlugin,
    'querywrapper-plugin': queryWrapperPlugin,
  };
  
  return names.map(name => {
    const plugin = allPlugins[name];
    if (!plugin) {
      throw new Error(`Unknown plugin: ${name}`);
    }
    return plugin;
  });
}
