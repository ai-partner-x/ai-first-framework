/**
 * 装饰器测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Slf4j, isSlf4jDecorated } from '../src/decorators/slf4j.decorator';
import { Log, LogError, LogInfo } from '../src/decorators/log.decorator';
import { LoggerMetadata } from '../src/metadata/metadata';
import { enableDecoratorSupport, getClassLogger, isClassLoggable, injectLogger, createMethodWrapper } from '../src/utils/decorator-utils';
import { getLogger } from '../src/core/facade';

// 启用装饰器支持
enableDecoratorSupport();

describe('装饰器功能测试', () => {
  let TestService: any;
  let TestService2: any;
  
  beforeEach(() => {
    // 定义测试类（在 enableDecoratorSupport 之后）
    @Slf4j({ name: 'TestService' })
    class TestServiceClass {
      
      @Log()
      syncMethod(param: string) {
        return `Hello ${param}`;
      }
      
      @Log({ level: 'debug' })
      async asyncMethod(param: string) {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `Async ${param}`;
      }
      
      @Log({ logArgs: false, logResult: false })
      noLogMethod() {
        return 'no log';
      }
      
      @LogError('Test error')
      errorMethod() {
        throw new Error('Test error');
      }
    }
    
    // 另一个测试类
    @Slf4j({ name: 'TestService2' })
    class TestService2Class {
      @LogInfo('Custom message')
      customMessageMethod() {
        return 'custom';
      }
    }
    
    TestService = TestServiceClass;
    TestService2 = TestService2Class;
  });
  
  afterEach(() => {
    // 清理元数据
    if (TestService) LoggerMetadata.clear(TestService);
    if (TestService2) LoggerMetadata.clear(TestService2);
  });
  
  it('应该正确应用 @Slf4j 装饰器', () => {
    expect(LoggerMetadata.hasLogger(TestService)).toBe(true);
    expect(LoggerMetadata.getName(TestService)).toBe('TestService');
    
    const service = new TestService();
    expect(service.logger).toBeDefined();
    expect(service.logger?.name).toBe('TestService');
    expect(TestService.logger).toBeDefined();
  });
  
  it('应该通过 @Slf4j 装饰器注入 logger 属性', () => {
    const service = new TestService();
    expect(service).toHaveProperty('logger');
    expect(service.logger).toBeInstanceOf(Object);
    expect(service.logger?.name).toBe('TestService');
  });
  
  it('应该正确应用 @Log 装饰器到同步方法', () => {
    const service = new TestService();
    const result = service.syncMethod('World');
    expect(result).toBe('Hello World');
  });
  
  it('应该正确应用 @Log 装饰器到异步方法', async () => {
    const service = new TestService();
    const result = await service.asyncMethod('World');
    expect(result).toBe('Async World');
  });
  
  it('@Log 装饰器应该支持禁用参数和结果日志', () => {
    const service = new TestService();
    const result = service.noLogMethod();
    expect(result).toBe('no log');
  });
  
  it('@LogError 装饰器应该记录错误', () => {
    const service = new TestService();
    expect(() => service.errorMethod()).toThrow('Test error');
  });
  
  it('@LogInfo 装饰器应该使用自定义消息', () => {
    const service = new TestService2();
    const result = service.customMessageMethod();
    expect(result).toBe('custom');
  });
  
  it('应该支持 isSlf4jDecorated 函数', () => {
    expect(isSlf4jDecorated(TestService)).toBe(true);
    expect(isSlf4jDecorated(Object)).toBe(false);
  });
  
  it('应该支持 getClassLogger 函数', () => {
    const logger = getClassLogger(TestService);
    expect(logger).toBeDefined();
    expect(logger?.name).toBe('TestService');
  });
  
  it('应该支持 isClassLoggable 函数', () => {
    expect(isClassLoggable(TestService)).toBe(true);
    expect(isClassLoggable(Object)).toBe(false);
  });
  
  it('应该支持 injectLogger 函数', async () => {
    class ManualService {
      doSomething() {
        return 'done';
      }
    }
    
    expect(isClassLoggable(ManualService)).toBe(false);
    
    // 手动注入 logger
    await injectLogger(ManualService, 'ManualService');
    
    expect(isClassLoggable(ManualService)).toBe(true);
    
    const service = new ManualService();
    expect(service.logger).toBeDefined();
    expect(service.logger?.name).toBe('ManualService');
  });
  
  it('应该支持 createMethodWrapper 函数', () => {
    const originalMethod = (a: number, b: number) => a + b;
    const wrappedMethod = createMethodWrapper(originalMethod);
    
    const result = wrappedMethod(2, 3);
    expect(result).toBe(5);
  });
  
  it('应该向后兼容传统 API', () => {
    // 传统方式仍然可用
    const traditionalLogger = getLogger('TraditionalLogger');
    expect(traditionalLogger).toBeDefined();
    expect(traditionalLogger.name).toBe('TraditionalLogger');
    
    // 装饰器方式也可用
    @Slf4j({ name: 'DecoratedLogger' })
    class DecoratedClass {
      test() {
        return 'test';
      }
    }
    
    const decorated = new DecoratedClass();
    expect(decorated.logger).toBeDefined();
    expect(decorated.logger?.name).toBe('DecoratedLogger');
    
    // 两者可以共存
    expect(traditionalLogger.name).not.toBe(decorated.logger?.name);
  });
});