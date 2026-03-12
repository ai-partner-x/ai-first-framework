/**
 * Plugin System Unit Tests
 * Tests for plugin registry and plugin transformation functionality
 */
import { PluginRegistry, type TranspilePlugin, type TransformContext } from './plugins.js';
import type { ParsedClass, ParsedDecorator, ParsedMethod } from './types.js';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register', () => {
    test('should register a single plugin', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformDecorator: (decorator) => decorator,
      };

      registry.register(plugin);
      const plugins = registry.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
    });

    test('should register multiple plugins', () => {
      const plugin1: TranspilePlugin = { name: 'plugin1' };
      const plugin2: TranspilePlugin = { name: 'plugin2' };
      const plugin3: TranspilePlugin = { name: 'plugin3' };

      registry.registerAll([plugin1, plugin2, plugin3]);
      const plugins = registry.getPlugins();
      expect(plugins).toHaveLength(3);
      expect(plugins.map(p => p.name)).toEqual(['plugin1', 'plugin2', 'plugin3']);
    });

    test('should not register duplicate plugins with same name', () => {
      const plugin1: TranspilePlugin = { name: 'test-plugin' };
      const plugin2: TranspilePlugin = { name: 'test-plugin' };

      registry.register(plugin1);
      registry.register(plugin2);
      const plugins = registry.getPlugins();
      expect(plugins).toHaveLength(1);
    });
  });

  describe('applyDecoratorTransform', () => {
    test('should apply single decorator transformation', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformDecorator: (decorator) => ({
          ...decorator,
          name: decorator.name.toUpperCase(),
        }),
      };

      registry.register(plugin);

      const input: ParsedDecorator = { name: 'Entity', args: {} };
      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyDecoratorTransform(input, context);
      expect(result.name).toBe('ENTITY');
      expect(result.args).toEqual({});
    });

    test('should apply multiple decorator transformations in chain', () => {
      const plugin1: TranspilePlugin = {
        name: 'plugin1',
        transformDecorator: (decorator) => ({
          ...decorator,
          name: decorator.name + '1',
        }),
      };

      const plugin2: TranspilePlugin = {
        name: 'plugin2',
        transformDecorator: (decorator) => ({
          ...decorator,
          name: decorator.name + '2',
        }),
      };

      registry.registerAll([plugin1, plugin2]);

      const input: ParsedDecorator = { name: 'Entity', args: {} };
      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyDecoratorTransform(input, context);
      expect(result.name).toBe('Entity12');
    });

    test('should skip plugins without transformDecorator', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformType: (type) => type,
      };

      registry.register(plugin);

      const input: ParsedDecorator = { name: 'Entity', args: {} };
      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyDecoratorTransform(input, context);
      expect(result).toEqual(input);
    });

    test('should pass context to transformDecorator', () => {
      let capturedContext: TransformContext | undefined;

      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformDecorator: (decorator, context) => {
          capturedContext = context;
          return decorator;
        },
      };

      registry.register(plugin);

      const input: ParsedDecorator = { name: 'Entity', args: {} };
      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      registry.applyDecoratorTransform(input, context);
      expect(capturedContext).toEqual(context);
    });
  });

  describe('applyTypeTransform', () => {
    test('should apply single type transformation', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformType: (type) => type.toUpperCase(),
      };

      registry.register(plugin);

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyTypeTransform('string', context);
      expect(result).toBe('STRING');
    });

    test('should apply multiple type transformations in chain', () => {
      const plugin1: TranspilePlugin = {
        name: 'plugin1',
        transformType: (type) => type + '1',
      };

      const plugin2: TranspilePlugin = {
        name: 'plugin2',
        transformType: (type) => type + '2',
      };

      registry.registerAll([plugin1, plugin2]);

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyTypeTransform('test', context);
      expect(result).toBe('test12');
    });

    test('should skip plugins without transformType', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformDecorator: (decorator) => decorator,
      };

      registry.register(plugin);

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyTypeTransform('string', context);
      expect(result).toBe('string');
    });
  });

  describe('applyMethodTransform', () => {
    test('should apply single method transformation', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformMethod: (method) => ({
          ...method,
          name: method.name.toUpperCase(),
        }),
      };

      registry.register(plugin);

      const input: ParsedMethod = {
        name: 'getUser',
        returnType: 'User',
        parameters: [],
        decorators: [],
        isAsync: false,
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'UserService',
        classType: 'service',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyMethodTransform(input, context);
      expect(result.name).toBe('GETUSER');
    });

    test('should apply multiple method transformations in chain', () => {
      const plugin1: TranspilePlugin = {
        name: 'plugin1',
        transformMethod: (method) => ({
          ...method,
          name: method.name + '1',
        }),
      };

      const plugin2: TranspilePlugin = {
        name: 'plugin2',
        transformMethod: (method) => ({
          ...method,
          name: method.name + '2',
        }),
      };

      registry.registerAll([plugin1, plugin2]);

      const input: ParsedMethod = {
        name: 'getUser',
        returnType: 'User',
        parameters: [],
        decorators: [],
        isAsync: false,
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'UserService',
        classType: 'service',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyMethodTransform(input, context);
      expect(result.name).toBe('getUser12');
    });

    test('should skip plugins without transformMethod', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformDecorator: (decorator) => decorator,
      };

      registry.register(plugin);

      const input: ParsedMethod = {
        name: 'getUser',
        returnType: 'User',
        parameters: [],
        decorators: [],
        isAsync: false,
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'UserService',
        classType: 'service',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyMethodTransform(input, context);
      expect(result).toEqual(input);
    });
  });

  describe('applyClassTransform', () => {
    test('should apply single class transformation', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformClass: (cls) => ({
          ...cls,
          name: cls.name.toUpperCase(),
        }),
      };

      registry.register(plugin);

      const input: ParsedClass = {
        name: 'User',
        decorators: [],
        fields: [],
        methods: [],
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyClassTransform(input, context);
      expect(result.name).toBe('USER');
    });

    test('should apply multiple class transformations in chain', () => {
      const plugin1: TranspilePlugin = {
        name: 'plugin1',
        transformClass: (cls) => ({
          ...cls,
          name: cls.name + '1',
        }),
      };

      const plugin2: TranspilePlugin = {
        name: 'plugin2',
        transformClass: (cls) => ({
          ...cls,
          name: cls.name + '2',
        }),
      };

      registry.registerAll([plugin1, plugin2]);

      const input: ParsedClass = {
        name: 'User',
        decorators: [],
        fields: [],
        methods: [],
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyClassTransform(input, context);
      expect(result.name).toBe('User12');
    });

    test('should skip plugins without transformClass', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformDecorator: (decorator) => decorator,
      };

      registry.register(plugin);

      const input: ParsedClass = {
        name: 'User',
        decorators: [],
        fields: [],
        methods: [],
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyClassTransform(input, context);
      expect(result).toEqual(input);
    });
  });

  describe('applyPostProcess', () => {
    test('should apply single post-processing', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        postProcess: (code) => code.toUpperCase(),
      };

      registry.register(plugin);

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyPostProcess('public class User {}', context);
      expect(result).toBe('PUBLIC CLASS USER {}');
    });

    test('should apply multiple post-processing in chain', () => {
      const plugin1: TranspilePlugin = {
        name: 'plugin1',
        postProcess: (code) => code + '1',
      };

      const plugin2: TranspilePlugin = {
        name: 'plugin2',
        postProcess: (code) => code + '2',
      };

      registry.registerAll([plugin1, plugin2]);

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyPostProcess('test', context);
      expect(result).toBe('test12');
    });

    test('should skip plugins without postProcess', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformDecorator: (decorator) => decorator,
      };

      registry.register(plugin);

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = registry.applyPostProcess('public class User {}', context);
      expect(result).toBe('public class User {}');
    });
  });

  describe('generateAdditional', () => {
    test('should generate additional code from plugin', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        generateAdditional: (cls) => `// Additional code for ${cls.name}`,
      };

      registry.register(plugin);

      const input: ParsedClass = {
        name: 'User',
        decorators: [],
        fields: [],
        methods: [],
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = plugin.generateAdditional?.(input, context);
      expect(result).toBe('// Additional code for User');
    });

    test('should return null when generateAdditional is not defined', () => {
      const plugin: TranspilePlugin = {
        name: 'test-plugin',
        transformDecorator: (decorator) => decorator,
      };

      const input: ParsedClass = {
        name: 'User',
        decorators: [],
        fields: [],
        methods: [],
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      const result = plugin.generateAdditional?.(input, context);
      expect(result).toBeUndefined();
    });
  });

  describe('complex scenarios', () => {
    test('should handle plugin with all transformation hooks', () => {
      const plugin: TranspilePlugin = {
        name: 'full-plugin',
        transformDecorator: (decorator) => ({
          ...decorator,
          name: decorator.name + '_decorator',
        }),
        transformType: (type) => type + '_type',
        transformMethod: (method) => ({
          ...method,
          name: method.name + '_method',
        }),
        transformClass: (cls) => ({
          ...cls,
          name: cls.name + '_class',
        }),
        postProcess: (code) => code + '_post',
      };

      registry.register(plugin);

      const decorator: ParsedDecorator = { name: 'Entity', args: {} };
      const method: ParsedMethod = {
        name: 'getUser',
        returnType: 'User',
        parameters: [],
        decorators: [],
        isAsync: false,
      };
      const cls: ParsedClass = {
        name: 'User',
        decorators: [],
        fields: [],
        methods: [],
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      expect(registry.applyDecoratorTransform(decorator, context).name).toBe('Entity_decorator');
      expect(registry.applyTypeTransform('string', context)).toBe('string_type');
      expect(registry.applyMethodTransform(method, context).name).toBe('getUser_method');
      expect(registry.applyClassTransform(cls, context).name).toBe('User_class');
      expect(registry.applyPostProcess('code', context)).toBe('code_post');
    });

    test('should handle multiple plugins with different hooks', () => {
      const plugin1: TranspilePlugin = {
        name: 'plugin1',
        transformDecorator: (decorator) => ({
          ...decorator,
          name: decorator.name + '1',
        }),
      };

      const plugin2: TranspilePlugin = {
        name: 'plugin2',
        transformMethod: (method) => ({
          ...method,
          name: method.name + '2',
        }),
      };

      const plugin3: TranspilePlugin = {
        name: 'plugin3',
        postProcess: (code) => code + '3',
      };

      registry.registerAll([plugin1, plugin2, plugin3]);

      const decorator: ParsedDecorator = { name: 'Entity', args: {} };
      const method: ParsedMethod = {
        name: 'getUser',
        returnType: 'User',
        parameters: [],
        decorators: [],
        isAsync: false,
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      expect(registry.applyDecoratorTransform(decorator, context).name).toBe('Entity1');
      expect(registry.applyMethodTransform(method, context).name).toBe('getUser2');
      expect(registry.applyPostProcess('code', context)).toBe('code3');
    });

    test('should handle empty registry', () => {
      const decorator: ParsedDecorator = { name: 'Entity', args: {} };
      const method: ParsedMethod = {
        name: 'getUser',
        returnType: 'User',
        parameters: [],
        decorators: [],
        isAsync: false,
      };
      const cls: ParsedClass = {
        name: 'User',
        decorators: [],
        fields: [],
        methods: [],
      };

      const context: TransformContext = {
        sourceFile: 'test.ts',
        className: 'User',
        classType: 'entity',
        options: { packageName: 'com.example' },
        allClasses: [],
      };

      expect(registry.applyDecoratorTransform(decorator, context)).toEqual(decorator);
      expect(registry.applyTypeTransform('string', context)).toBe('string');
      expect(registry.applyMethodTransform(method, context)).toEqual(method);
      expect(registry.applyClassTransform(cls, context)).toEqual(cls);
      expect(registry.applyPostProcess('code', context)).toBe('code');
    });
  });
});
