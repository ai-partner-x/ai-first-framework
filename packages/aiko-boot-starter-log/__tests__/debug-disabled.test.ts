import { describe, it, expect, vi } from 'vitest';
import { Slf4j } from '../src/decorators/slf4j.decorator';
import { LoggerMetadata } from '../src/metadata/metadata';
import { enableDecoratorSupport } from '../src/utils/decorator-utils';

// 启用装饰器支持
enableDecoratorSupport();

describe('调试禁用装饰器测试', () => {
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
    
    console.log('DecoratedClass:', DecoratedClass);
    console.log('hasLogger:', LoggerMetadata.hasLogger(DecoratedClass));
    console.log('getName:', LoggerMetadata.getName(DecoratedClass));
    
    expect(LoggerMetadata.hasLogger(DecoratedClass)).toBe(false);
    
    const instance = new DecoratedClass();
    console.log('instance.logger:', instance.logger);
    expect(instance.logger).toBeUndefined();
  });
});