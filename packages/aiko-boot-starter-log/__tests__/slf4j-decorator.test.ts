/**
 * @Slf4j 装饰器单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Slf4j, Slf4jSimple, isSlf4jDecorated } from '../src/decorators/slf4j.decorator';
import { Log, LogError } from '../src/decorators/log.decorator';
import { LoggerMetadata } from '../src/metadata/metadata';
import { getLogger } from '../src/core/facade';
import { enableDecoratorSupport } from '../src/utils/decorator-utils';

// 启用装饰器支持
enableDecoratorSupport();

// 模拟 logger
const mockLogger = {
  name: 'TestLogger',
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  http: vi.fn(),
  verbose: vi.fn(),
  debug: vi.fn(),
  silly: vi.fn(),
};

describe('@Slf4j 装饰器单元测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // 清理元数据
    // 注意：这里需要清理所有测试中使用的类
    // 由于测试中创建了多个类，这里不进行具体清理
    // 每个测试用例应该自行管理其状态
  });

  describe('基础功能测试', () => {
    it('应该正确应用 @Slf4j 装饰器', () => {
      @Slf4j({ name: 'TestService' })
      class TestService {
        testMethod() {
          return 'test';
        }
        // 装饰器会添加 logger 属性
        logger?: any;
        static logger?: any;
      }

      expect(LoggerMetadata.hasLogger(TestService)).toBe(true);
      expect(LoggerMetadata.getName(TestService)).toBe('TestService');
      
      const service = new TestService();
      expect(service.logger).toBeDefined();
      expect(service.logger?.name).toBe('TestService');
      expect(TestService.logger).toBeDefined();
    });

    it('应该向类原型和静态属性注入 logger', () => {
      @Slf4j({ name: 'TestClass' })
      class TestClass {
        instanceMethod() {
          return 'instance';
        }
        
        static staticMethod() {
          return 'static';
        }
      }

      const instance = new TestClass();
      
      // 实例属性
      expect(instance).toHaveProperty('logger');
      expect(instance.logger).toBeInstanceOf(Object);
      
      // 静态属性
      expect(TestClass).toHaveProperty('logger');
      expect(TestClass.logger).toBeInstanceOf(Object);
      
      // 两者应该是同一个 logger 实例
      expect(instance.logger).toBe(TestClass.logger);
    });

    it('应该使用类名作为默认 logger 名称', () => {
      @Slf4j()
      class DefaultNameClass {
        test() {
          return 'test';
        }
      }

      expect(LoggerMetadata.getName(DefaultNameClass)).toBe('DefaultNameClass');
      
      const instance = new DefaultNameClass();
      expect(instance.logger?.name).toBe('DefaultNameClass');
    });

    it('应该支持自定义 logger 名称', () => {
      @Slf4j({ name: 'CustomLoggerName' })
      class TestClass {
        test() {
          return 'test';
        }
      }

      expect(LoggerMetadata.getName(TestClass)).toBe('CustomLoggerName');
      
      const instance = new TestClass();
      expect(instance.logger?.name).toBe('CustomLoggerName');
    });
  });

  describe('选项配置测试', () => {
    it('应该支持禁用装饰器', () => {
      @Slf4j({ enabled: false, name: 'DisabledLogger' })
      class DisabledClass {
        test() {
          return 'test';
        }
      }

      expect(LoggerMetadata.hasLogger(DisabledClass)).toBe(false);
      
      const instance = new DisabledClass();
      expect(instance.logger).toBeUndefined();
      expect(DisabledClass.logger).toBeUndefined();
    });

    it('应该支持自定义日志级别和添加 log 方法', () => {
      @Slf4j({ name: 'TestClass', level: 'info' })
      class TestClass {
        testMethod() {
          this.log('测试消息', { meta: 'data' });
          return 'test';
        }
      }

      const instance = new TestClass();
      
      // 应该添加 log 方法
      expect(instance).toHaveProperty('log');
      expect(typeof instance.log).toBe('function');
      
      // 调用 log 方法
      const result = instance.testMethod();
      expect(result).toBe('test');
    });

    it('应该支持 factoryOptions 配置', () => {
      const factoryOptions = { level: 'debug', format: 'json' };
      
      @Slf4j({ name: 'TestClass', factoryOptions })
      class TestClass {
        test() {
          return 'test';
        }
      }

      // 验证元数据中存储了 factoryOptions
      const options = LoggerMetadata.getOptions(TestClass);
      expect(options?.factoryOptions).toEqual(factoryOptions);
    });
  });

  describe('便捷装饰器测试', () => {
    it('@Slf4jSimple 应该使用默认选项', () => {
      @Slf4jSimple()
      class SimpleClass {
        test() {
          return 'test';
        }
      }

      expect(LoggerMetadata.hasLogger(SimpleClass)).toBe(true);
      expect(LoggerMetadata.getName(SimpleClass)).toBe('SimpleClass');
      
      const instance = new SimpleClass();
      expect(instance.logger).toBeDefined();
    });
  });

  describe('工具函数测试', () => {
    it('isSlf4jDecorated 应该正确识别装饰的类', () => {
      @Slf4j({ name: 'DecoratedClass' })
      class DecoratedClass {
        test() {
          return 'test';
        }
      }

      class UndecoratedClass {
        test() {
          return 'test';
        }
      }

      expect(isSlf4jDecorated(DecoratedClass)).toBe(true);
      expect(isSlf4jDecorated(UndecoratedClass)).toBe(false);
      expect(isSlf4jDecorated(Object)).toBe(false);
    });

    it('isSlf4jDecorated 应该处理禁用装饰器的情况', () => {
      @Slf4j({ enabled: false, name: 'DisabledClass' })
      class DisabledClass {
        test() {
          return 'test';
        }
      }

      expect(isSlf4jDecorated(DisabledClass)).toBe(false);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理匿名类', () => {
      const AnonymousClass = class {
        test() {
          return 'test';
        }
      };
      
      // 应用装饰器
      const DecoratedClass = Slf4j({ name: 'AnonymousLogger' })(AnonymousClass);
      
      expect(LoggerMetadata.hasLogger(DecoratedClass)).toBe(true);
      expect(LoggerMetadata.getName(DecoratedClass)).toBe('AnonymousLogger');
    });

    it('应该处理没有名称的匿名类', () => {
      // 完全匿名的类表达式
      const AnonymousClass = class {};
      
      // 应用装饰器，不提供名称
      const DecoratedClass = Slf4j()(AnonymousClass);
      
      expect(LoggerMetadata.hasLogger(DecoratedClass)).toBe(true);
      // 匿名类的 name 属性通常是变量名 'AnonymousClass'
      expect(LoggerMetadata.getName(DecoratedClass)).toBe('AnonymousClass');
    });

    it('应该处理匿名类作为函数返回值', () => {
      function createClass() {
        return class {
          method() {
            return 'method';
          }
          logger?: any;
          static logger?: any;
        };
      }
      
      const AnonymousClass = createClass();
      const DecoratedClass = Slf4j({ name: 'FunctionReturnClass' })(AnonymousClass);
      
      expect(LoggerMetadata.hasLogger(DecoratedClass)).toBe(true);
      expect(LoggerMetadata.getName(DecoratedClass)).toBe('FunctionReturnClass');
      
      const instance = new DecoratedClass();
      expect(instance.logger).toBeDefined();
      expect(instance.logger?.name).toBe('FunctionReturnClass');
    });

    it('应该处理匿名类继承场景', () => {
      // 匿名父类
      const ParentClass = class {
        parentMethod() {
          return 'parent';
        }
      };
      
      // 应用装饰器到父类
      const DecoratedParent = Slf4j({ name: 'ParentLogger' })(ParentClass);
      
      // 匿名子类继承匿名父类
      const ChildClass = class extends DecoratedParent {
        childMethod() {
          return 'child';
        }
      };
      
      // 应用装饰器到子类
      const DecoratedChild = Slf4j({ name: 'ChildLogger' })(ChildClass);
      
      const parent = new DecoratedParent();
      const child = new DecoratedChild();
      
      expect(parent.logger?.name).toBe('ParentLogger');
      expect(child.logger?.name).toBe('ChildLogger');
      expect(parent.logger).not.toBe(child.logger);
    });

    it('应该处理匿名类与箭头函数结合', () => {
      // 使用箭头函数创建匿名类
      const createAnonymousClass = (name: string) => {
        const cls = class {
          constructor(public value: string) {}
          
          getValue() {
            return this.value;
          }
        };
        
        // 动态应用装饰器
        return Slf4j({ name })(cls);
      };
      
      const DecoratedClassA = createAnonymousClass('ClassA');
      const DecoratedClassB = createAnonymousClass('ClassB');
      
      const instanceA = new DecoratedClassA('valueA');
      const instanceB = new DecoratedClassB('valueB');
      
      expect(instanceA.logger?.name).toBe('ClassA');
      expect(instanceB.logger?.name).toBe('ClassB');
      expect(instanceA.getValue()).toBe('valueA');
      expect(instanceB.getValue()).toBe('valueB');
    });

    it('应该处理匿名类多次装饰的情况', () => {
      const AnonymousClass = class {
        test() {
          return 'test';
        }
      };
      
      // 多次应用装饰器
      const DecoratedOnce = Slf4j({ name: 'FirstLogger' })(AnonymousClass);
      const DecoratedTwice = Slf4j({ name: 'SecondLogger' })(DecoratedOnce);
      
      expect(LoggerMetadata.getName(DecoratedTwice)).toBe('SecondLogger');
      
      const instance = new DecoratedTwice();
      expect(instance.logger?.name).toBe('SecondLogger');
    });

    it('应该处理匿名类禁用装饰器的情况', () => {
      const AnonymousClass = class {
        test() {
          return 'test';
        }
        logger?: any;
        static logger?: any;
      };
      
      // 应用禁用状态的装饰器
      const DecoratedClass = Slf4j({ enabled: false, name: 'DisabledLogger' })(AnonymousClass);
      
      expect(LoggerMetadata.hasLogger(DecoratedClass)).toBe(false);
      
      const instance = new DecoratedClass();
      expect(instance.logger).toBeUndefined();
    });

    it('应该处理继承场景', () => {
      @Slf4j({ name: 'ParentClass' })
      class ParentClass {
        parentMethod() {
          return 'parent';
        }
      }

      @Slf4j({ name: 'ChildClass' })
      class ChildClass extends ParentClass {
        childMethod() {
          return 'child';
        }
      }

      const parent = new ParentClass();
      const child = new ChildClass();

      expect(parent.logger?.name).toBe('ParentClass');
      expect(child.logger?.name).toBe('ChildClass');
      expect(parent.logger).not.toBe(child.logger);
    });

    it('应该处理多次应用装饰器的情况', () => {
      @Slf4j({ name: 'FirstLogger' })
      @Slf4j({ name: 'SecondLogger' })
      class MultiDecoratedClass {
        test() {
          return 'test';
        }
        logger?: any;
        static logger?: any;
      }

      // 注意：在 TypeScript 装饰器中，装饰器执行顺序是从下到上
      // 即 @Slf4j({ name: 'SecondLogger' }) 先执行，@Slf4j({ name: 'FirstLogger' }) 后执行
      // 后执行的装饰器会覆盖先执行的，所以第一个装饰器（最后执行）生效
      expect(LoggerMetadata.getName(MultiDecoratedClass)).toBe('FirstLogger');
      
      const instance = new MultiDecoratedClass();
      expect(instance.logger?.name).toBe('FirstLogger');
    });
  });

  describe('集成测试', () => {
    it('应该与 @Log 装饰器协同工作', () => {
      @Slf4j({ name: 'IntegratedClass' })
      class IntegratedClass {
        @Log()
        loggedMethod(param: string) {
          return `Hello ${param}`;
        }
        
        @Log({ level: 'debug' })
        debugMethod() {
          return 'debug';
        }
        
        @LogError('错误测试')
        errorMethod() {
          throw new Error('测试错误');
        }
        logger?: any;
        static logger?: any;
      }

      const instance = new IntegratedClass();
      
      // 测试正常方法
      const result = instance.loggedMethod('World');
      expect(result).toBe('Hello World');
      
      // 测试 debug 方法
      const debugResult = instance.debugMethod();
      expect(debugResult).toBe('debug');
      
      // 测试错误方法
      expect(() => instance.errorMethod()).toThrow('测试错误');
      
      // 验证 logger 存在
      expect(instance.logger).toBeDefined();
      expect(instance.logger?.name).toBe('IntegratedClass');
    });

    it('应该支持多个类使用不同的 logger', () => {
      @Slf4j({ name: 'ServiceA' })
      class ServiceA {
        methodA() {
          return 'A';
        }
      }

      @Slf4j({ name: 'ServiceB' })
      class ServiceB {
        methodB() {
          return 'B';
        }
      }

      const serviceA = new ServiceA();
      const serviceB = new ServiceB();

      expect(serviceA.logger?.name).toBe('ServiceA');
      expect(serviceB.logger?.name).toBe('ServiceB');
      expect(serviceA.logger).not.toBe(serviceB.logger);
    });
  });

  describe('属性冲突保护测试', () => {
    it('应该避免覆盖类已有的 log 属性', () => {
      // 模拟 console.warn
      const originalWarn = console.warn;
      const warnings: string[] = [];
      console.warn = (...args) => {
        warnings.push(args.join(' '));
      };

      try {
        // 类已经定义了 log 属性
        @Slf4j({ name: 'ClassWithExistingLog', level: 'info' })
        class ClassWithExistingLog {
          // 类已有的 log 方法
          log(message: string) {
            return `Original: ${message}`;
          }
          
          testMethod() {
            return this.log('test');
          }
        }

        const instance = new ClassWithExistingLog();
        
        // 应该保留原有的 log 方法
        expect(typeof instance.log).toBe('function');
        expect(instance.testMethod()).toBe('Original: test');
        
        // 应该发出警告（在开发环境下）
        if (process.env.NODE_ENV === 'development') {
          expect(warnings.length).toBeGreaterThan(0);
          expect(warnings[0]).toContain('already has a property named');
        }
      } finally {
        console.warn = originalWarn;
      }
    });

    it('应该支持自定义日志方法名称', () => {
      @Slf4j({ name: 'CustomLogMethod', level: 'debug', logMethodName: 'customLog' })
      class CustomLogMethodClass {
        testMethod() {
          this.customLog('测试消息', { meta: 'data' });
          return 'test';
        }
      }

      const instance = new CustomLogMethodClass();
      
      // 应该添加自定义名称的日志方法
      expect(instance).toHaveProperty('customLog');
      expect(typeof instance.customLog).toBe('function');
      
      // 原有的 log 属性不应该被添加
      expect(instance).not.toHaveProperty('log');
    });

    it('应该处理类已有 log 属性但使用自定义方法名的情况', () => {
      @Slf4j({ name: 'ClassWithLogAndCustom', level: 'warn', logMethodName: 'loggerLog' })
      class ClassWithLogAndCustom {
        // 类已有的 log 方法
        log(message: string) {
          return `Existing log: ${message}`;
        }
        
        testMethod() {
          // 应该能调用原有的 log 方法
          const result = this.log('test');
          // 也应该能调用装饰器添加的 loggerLog 方法
          expect(this).toHaveProperty('loggerLog');
          return result;
        }
      }

      const instance = new ClassWithLogAndCustom();
      
      // 应该保留原有的 log 方法
      expect(instance.log('test')).toBe('Existing log: test');
      
      // 应该添加自定义的 loggerLog 方法
      expect(instance).toHaveProperty('loggerLog');
      expect(typeof instance.loggerLog).toBe('function');
      
      // 测试方法应该正常工作
      expect(instance.testMethod()).toBe('Existing log: test');
    });

    it('应该处理继承场景中的属性冲突', () => {
      // 父类有 log 属性
      class ParentWithLog {
        log(message: string) {
          return `Parent log: ${message}`;
        }
      }

      // 子类应用装饰器
      @Slf4j({ name: 'ChildClass', level: 'error', logMethodName: 'errorLog' })
      class ChildClass extends ParentWithLog {
        testMethod() {
          // 应该能调用父类的 log 方法
          const parentResult = this.log('from child');
          // 也应该能调用装饰器添加的 errorLog 方法
          expect(this).toHaveProperty('errorLog');
          return parentResult;
        }
      }

      const instance = new ChildClass();
      
      // 应该继承父类的 log 方法
      expect(instance.log('test')).toBe('Parent log: test');
      
      // 应该添加自定义的 errorLog 方法
      expect(instance).toHaveProperty('errorLog');
      expect(typeof instance.errorLog).toBe('function');
      
      // 测试方法应该正常工作
      expect(instance.testMethod()).toBe('Parent log: from child');
    });
  });
});