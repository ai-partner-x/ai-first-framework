/**
 * LoggerFactory 单元测试
 * 测试 LoggerFactory 类的工厂功能
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { LoggerFactory } from '../src/loggerFactory';
import { Logger } from '../src/logger';
import { LogLevel } from '../src/types';

describe('LoggerFactory', () => {
  let factory: LoggerFactory;
  
  beforeEach(() => {
    factory = LoggerFactory.getInstance();
    LoggerFactory.reset(); // 重置工厂状态
  });
  
  afterEach(() => {
    LoggerFactory.reset();
  });
  
  test('应该正确获取单例实例', () => {
    const instance1 = LoggerFactory.getInstance();
    const instance2 = LoggerFactory.getInstance();
    
    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(LoggerFactory);
  });
  
  test('应该正确创建日志记录器', () => {
    const logger = factory.getLogger('test-logger');
    
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.name).toBe('test-logger');
  });
  
  test('应该正确获取或创建日志记录器', () => {
    const logger1 = factory.getLogger('test-logger');
    const logger2 = factory.getLogger('test-logger');
    const logger3 = factory.getLogger('different-logger');
    
    expect(logger1).toBe(logger2); // 相同名称应该返回相同实例
    expect(logger1).not.toBe(logger3); // 不同名称应该返回不同实例
  });
  
  test('应该正确初始化工厂配置', () => {
    const config = {
      level: 'debug' as LogLevel,
      format: 'cli' as const,
      transports: [
        { type: 'console' as const, enabled: true, level: 'debug' as LogLevel, format: 'cli' as const }
      ]
    };
    
    // 使用 fromConfig 方法创建新的工厂实例
    const configuredFactory = LoggerFactory.fromConfig(config);
    
    const logger = configuredFactory.getLogger('configured-logger');
    expect(logger.level).toBe('debug');
  });
  
  test('应该正确重置工厂', () => {
    // 先获取一个记录器
    factory.getLogger('test-logger');
    
    expect(factory['loggers'].size).toBeGreaterThan(0);
    
    // 重置工厂
    LoggerFactory.reset();
    
    // 获取新的工厂实例
    const newFactory = LoggerFactory.getInstance();
    expect(newFactory['loggers'].size).toBe(0);
  });
  
  test('应该正确处理默认配置', () => {
    // 使用默认配置
    const logger = factory.getLogger('default-logger');
    
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.level).toBe('info'); // 默认级别
  });
  
  test('应该支持设置全局日志级别', () => {
    factory.setLevel('debug');
    
    const logger = factory.getLogger('level-test');
    expect(logger.level).toBe('debug');
  });
  
  test('应该正确获取所有日志记录器名称', () => {
    factory.getLogger('logger1');
    factory.getLogger('logger2');
    factory.getLogger('logger3');
    
    const loggerNames = factory.getLoggerNames();
    expect(loggerNames.length).toBe(3);
    expect(loggerNames).toEqual(['logger1', 'logger2', 'logger3']);
  });
  
  test('应该支持关闭所有日志记录器', () => {
    factory.getLogger('logger1');
    factory.getLogger('logger2');
    
    expect(() => {
      factory.close();
    }).not.toThrow();
  });
  
  test('应该正确处理自定义传输器', () => {
    const config = {
      level: 'info' as LogLevel,
      transports: [
        { type: 'console' as const, enabled: true, level: 'info' as LogLevel },
        { type: 'console' as const, enabled: true, level: 'error' as LogLevel, format: 'json' as const }
      ]
    };
    
    // 使用 fromConfig 方法创建新的工厂实例
    const configuredFactory = LoggerFactory.fromConfig(config);
    
    const logger = configuredFactory.getLogger('multi-transport');
    expect(() => {
      logger.info('测试多传输器');
      logger.error('错误消息');
    }).not.toThrow();
  });
  
  test('应该正确处理文件传输器配置', () => {
    const config = {
      level: 'info' as LogLevel,
      transports: [
        { 
          type: 'file' as const, 
          enabled: true, 
          filename: './test.log',
          level: 'info' as LogLevel,
          maxSize: '1mb',
          maxFiles: 3
        }
      ]
    };
    
    // 使用 fromConfig 方法创建新的工厂实例
    const configuredFactory = LoggerFactory.fromConfig(config);
    
    const logger = configuredFactory.getLogger('file-logger');
    expect(logger).toBeInstanceOf(Logger);
  });
});