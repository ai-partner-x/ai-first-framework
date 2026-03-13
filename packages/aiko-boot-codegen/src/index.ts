/**
 * @ai-partner-x/codegen
 * TypeScript to Java code generator + Frontend API Client generator
 */
export * from './types.js';
export { parseSourceFile, parseSourceFileFull } from './parser.js';
export { 
  generateJavaClass, 
  collectImportsFromParsed, 
  generateJavaComment,
  type GeneratorOptions 
} from './generator.js';
export { generateApiClient, watchApiClient, type CodegenOptions, type WatchOptions } from './client-generator.js';
export { createDecoratorGenericTransformer, transformSourceCode } from './transformer.js';
export { decoratorGenericPlugin } from './tsup-plugin.js';

// Plugin system exports
export { 
  type TranspilePlugin, 
  type TransformContext,
  PluginRegistry,
  defaultPluginRegistry,
} from './plugins.js';
export {
  mapperPlugin,
  entityPlugin,
  validationPlugin,
  datePlugin,
  servicePlugin,
  controllerPlugin,
  queryWrapperPlugin,
  getBuiltinPlugins,
  getPluginsByName,
} from './builtin-plugins.js';

import { parseSourceFileFull } from './parser.js';
import { generateJavaClass, generateJavaFromInterface } from './generator.js';
import type { TranspilerOptions } from './types.js';

/**
 * Transpile TypeScript source code to Java
 */
export function transpile(
  sourceCode: string,
  options: TranspilerOptions
): Map<string, string> {
  const parsedFile = parseSourceFileFull(sourceCode);
  const result = new Map<string, string>();

  // Process classes
  parsedFile.classes.forEach(cls => {
    const javaCode = generateJavaClass(cls, options);
    result.set(`${cls.name}.java`, javaCode);
  });

  // Process interfaces
  parsedFile.interfaces.forEach(intf => {
    const javaCode = generateJavaFromInterface(intf, options);
    result.set(`${intf.name}.java`, javaCode);
  });

  return result;
}
