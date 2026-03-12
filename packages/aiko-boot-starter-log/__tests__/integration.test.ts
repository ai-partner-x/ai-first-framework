/**
 * 集成测试
 * 测试模块的端到端功能
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  getLogger,
  initLogging,
  createConsoleLogger,
  setLevel,
  closeLogging,
  defaultLogger,
  LoggerFactory,
  Logger
} from '../src';

describe('集成测试', () => {
  beforeEach(() => {
    // 确保每次测试前重置状态
    closeLogging();
  });
  
  afterEach(() => {
    closeLogging();
  });
  
  test('应该完成完整的日志生命周期', () => {
    // 1. 初始化日志系统
    initLogging({
      level: 'debug',
      format: 'cli',
      colorize: false, // 测试中禁用颜色
      transports: [
        { type: 'console', enabled: true, level: 'debug', format: 'cli' }
      ]
    });
    
    // 2. 获取记录器
    const logger = getLogger('integration-test');
    expect(logger).toBeInstanceOf(Logger);
    
    // 3. 记录不同级别的日志
    expect(() => {
      logger.error('集成测试错误');
      logger.warn('集成测试警告');
      logger.info('集成测试信息');
      logger.debug('集成测试调试');
    }).not.toThrow();
    
    // 4. 更改日志级别
    setLevel('error');
    
    // 5. 验证级别更改生效
    const newLogger = getLogger('level-changed');
    expect(newLogger.level).toBe('error');
    
    // 6. 关闭日志系统
    expect(() => {
      closeLogging();
    }).not.toThrow();
  });
  
  test('应该支持多个记录器实例', () => {
    initLogging({ level: 'info' });
    
    const logger1 = getLogger('service-a');
    const logger2 = getLogger('service-b');
    const logger3 = getLogger('service-c');
    
    expect(logger1).not.toBe(logger2);
    expect(logger2).not.toBe(logger3);
    expect(logger1.name).toBe('service-a');
    expect(logger2.name).toBe('service-b');
    expect(logger3.name).toBe('service-c');
    
    // 所有记录器应该使用相同的配置
    expect(logger1.level).toBe('info');
    expect(logger2.level).toBe('info');
    expect(logger3.level).toBe('info');
  });
  
  test('应该正确处理带元数据的复杂日志', () => {
    const logger = createConsoleLogger('complex-logger', 'debug');
    
    const complexMeta = {
      userId: 12345,
      requestId: 'req-67890',
      sessionId: 'session-abc123',
      timestamp: new Date().toISOString(),
      nested: {
        data: {
          items: [1, 2, 3],
          config: { enabled: true, timeout: 5000 }
        }
      },
      error: new Error('测试错误')
    };
    
    expect(() => {
      logger.info('复杂日志消息', complexMeta);
      logger.error('复杂错误日志', complexMeta.error as Error, {
        context: complexMeta
      });
    }).not.toThrow();
  });
  
  test('应该支持记录器继承和上下文', () => {
    const parentLogger = createConsoleLogger('parent', 'info');
    
    // 创建子记录器
    const childLogger = parentLogger.child('child');
    expect(childLogger.name).toBe('parent:child');
    
    // 创建带上下文的记录器
    const contextLogger = parentLogger.withContext({
      requestId: 'req-123',
      userId: 456
    });
    
    expect(() => {
      parentLogger.info('父记录器消息');
      childLogger.info('子记录器消息');
      contextLogger.info('带上下文的记录器消息', { extra: 'data' });
    }).not.toThrow();
  });
  
  test('应该正确处理默认记录器', () => {
    expect(defaultLogger).toBeDefined();
    expect(defaultLogger).toBeInstanceOf(Logger);
    expect(defaultLogger.name).toBe('app');
    
    expect(() => {
      defaultLogger.info('默认记录器测试');
      defaultLogger.error('默认记录器错误');
    }).not.toThrow();
  });
  
  test('应该支持 LoggerFactory 直接使用', () => {
    const factory = LoggerFactory.getInstance();
    factory.reset();
    
    // 直接使用工厂创建记录器
    const logger1 = factory.getLogger('factory-logger-1');
    const logger2 = factory.getLogger('factory-logger-2');
    
    expect(logger1).toBeInstanceOf(Logger);
    expect(logger2).toBeInstanceOf(Logger);
    
    // 测试工厂配置
    const config = {
      level: 'warn',
      transports: [
        { type: 'console', enabled: true, level: 'warn' }
      ]
    };
    
    // 使用 fromConfig 创建新的工厂实例
    const configuredFactory = LoggerFactory.fromConfig(config);
    const configuredLogger = configuredFactory.getLogger('configured');
    expect(configuredLogger.level).toBe('warn');
    
    // 测试获取所有记录器
    const allLoggers = configuredFactory.getAllLoggers();
    expect(allLoggers.length).toBeGreaterThanOrEqual(1);
    
    // 测试关闭所有记录器
    expect(() => {
      configuredFactory.closeAll();
    }).not.toThrow();
  });
  
  test('应该支持动态日志级别切换', () => {
    initLogging({ level: 'error' });
    
    const logger = getLogger('dynamic-level');
    
    // 初始级别为 error
    expect(logger.level).toBe('error');
    
    // 切换到 debug
    setLevel('debug');
    expect(logger.level).toBe('debug');
    
    // 切换到 info
    setLevel('info');
    expect(logger.level).toBe('info');
    
    // 切换到 warn
    setLevel('warn');
    expect(logger.level).toBe('warn');
    
    // 切换回 error
    setLevel('error');
    expect(logger.level).toBe('error');
  });
  
  test('应该处理并发日志记录', async () => {
    initLogging({ level: 'debug' });
    
    const promises = [];
    
    // 创建多个并发日志任务
    for (let i = 0; i < 10; i++) {
      promises.push(new Promise<void>((resolve) => {
        const logger = getLogger(`concurrent-${i}`);
        setTimeout(() => {
          logger.info(`并发消息 ${i}`);
          resolve();
        }, Math.random() * 10);
      }));
    }
    
    // 等待所有并发任务完成
    await Promise.all(promises);
    
    // 验证没有错误发生
    expect(promises.length).toBe(10);
  });
  
  test('应该正确处理错误边界情况', () => {
    // 测试无效的日志级别（应该回退到默认）
    const logger = createConsoleLogger('error-test', 'invalid' as any);
    expect(logger.level).toBe('info'); // 应该回退到默认
    
    // 测试空消息
    expect(() => {
      logger.info('');
      logger.info('', {});
    }).not.toThrow();
    
    // 测试 null/undefined 元数据
    expect(() => {
      logger.info('测试消息', null as any);
      logger.info('测试消息', undefined as any);
    }).not.toThrow();
  });
  
  test('应该支持模块重新初始化', () => {
    // 第一次初始化
    initLogging({ level: 'error' });
    const logger1 = getLogger('reinit-1');
    expect(logger1.level).toBe('error');
    
    // 关闭
    closeLogging();
    
    // 第二次初始化（不同配置）
    initLogging({ level: 'debug' });
    const logger2 = getLogger('reinit-2');
    expect(logger2.level).toBe('debug');
    
    // 应该可以正常工作
    expect(() => {
      logger2.debug('重新初始化后的调试消息');
    }).not.toThrow();
  });
});