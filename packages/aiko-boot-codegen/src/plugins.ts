/**
 * Transpile Plugin System
 * Provides extensible hooks for customizing TypeScript to Java code generation
 */
import type { ParsedClass, ParsedDecorator, ParsedMethod, TranspilerOptions } from './types.js';

/**
 * Context passed to plugin hooks
 */
export interface TransformContext {
  /** Source file path */
  sourceFile: string;
  /** Current class name */
  className: string;
  /** Class type determined by decorators */
  classType: 'entity' | 'repository' | 'service' | 'controller' | 'dto' | 'redis' | 'mq' | 'security' | 'admin' | 'unknown';
  /** Transpiler options */
  options: TranspilerOptions;
  /** All parsed classes in current file */
  allClasses: ParsedClass[];
}

/**
 * Plugin interface for extending code generation
 */
export interface TranspilePlugin {
  /** Plugin name for identification */
  name: string;
  
  /**
   * Transform decorator before code generation
   * Use to modify decorator arguments or convert decorator names
   * 
   * @example
   * // @Mapper(User) -> @Mapper() in Java
   * transformDecorator(dec) {
   *   if (dec.name === 'Mapper') {
   *     return { ...dec, args: {} };
   *   }
   *   return dec;
   * }
   */
  transformDecorator?: (decorator: ParsedDecorator, context: TransformContext) => ParsedDecorator;
  
  /**
   * Transform TypeScript type to Java type
   * Called for each type reference in the code
   * 
   * @example
   * // Custom type mapping
   * transformType(tsType) {
   *   if (tsType === 'UserDto') return 'com.example.dto.UserDto';
   *   return tsType;
   * }
   */
  transformType?: (tsType: string, context: TransformContext) => string;
  
  /**
   * Transform method before code generation
   * Use to modify method signature, annotations, etc.
   */
  transformMethod?: (method: ParsedMethod, context: TransformContext) => ParsedMethod;
  
  /**
   * Transform entire class before code generation
   * Use for class-level modifications
   */
  transformClass?: (cls: ParsedClass, context: TransformContext) => ParsedClass;
  
  /**
   * Post-process generated Java code
   * Called after all code generation is complete
   * Use for final adjustments like import optimization
   */
  postProcess?: (javaCode: string, context: TransformContext) => string;
  
  /**
   * Generate additional Java code (like helper methods)
   * Called after main class generation
   */
  generateAdditional?: (cls: ParsedClass, context: TransformContext) => string | null;
}

/**
 * Plugin registry for managing active plugins
 */
export class PluginRegistry {
  private plugins: TranspilePlugin[] = [];
  
  register(plugin: TranspilePlugin): void {
    this.plugins.push(plugin);
  }
  
  registerAll(plugins: TranspilePlugin[]): void {
    this.plugins.push(...plugins);
  }
  
  getPlugins(): TranspilePlugin[] {
    return this.plugins;
  }
  
  /**
   * Apply decorator transformations from all plugins
   */
  applyDecoratorTransform(decorator: ParsedDecorator, context: TransformContext): ParsedDecorator {
    let result = decorator;
    for (const plugin of this.plugins) {
      if (plugin.transformDecorator) {
        result = plugin.transformDecorator(result, context);
      }
    }
    return result;
  }
  
  /**
   * Apply type transformations from all plugins
   */
  applyTypeTransform(tsType: string, context: TransformContext): string {
    let result = tsType;
    for (const plugin of this.plugins) {
      if (plugin.transformType) {
        result = plugin.transformType(result, context);
      }
    }
    return result;
  }
  
  /**
   * Apply method transformations from all plugins
   */
  applyMethodTransform(method: ParsedMethod, context: TransformContext): ParsedMethod {
    let result = method;
    for (const plugin of this.plugins) {
      if (plugin.transformMethod) {
        result = plugin.transformMethod(result, context);
      }
    }
    return result;
  }
  
  /**
   * Apply class transformations from all plugins
   */
  applyClassTransform(cls: ParsedClass, context: TransformContext): ParsedClass {
    let result = cls;
    for (const plugin of this.plugins) {
      if (plugin.transformClass) {
        result = plugin.transformClass(result, context);
      }
    }
    return result;
  }
  
  /**
   * Apply post-processing from all plugins
   */
  applyPostProcess(javaCode: string, context: TransformContext): string {
    let result = javaCode;
    for (const plugin of this.plugins) {
      if (plugin.postProcess) {
        result = plugin.postProcess(result, context);
      }
    }
    return result;
  }
}

/**
 * Default plugin registry instance
 */
export const defaultPluginRegistry = new PluginRegistry();
