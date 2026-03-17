/**
 * Logger 单元测试
 * 测试 Logger 类的核心功能
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Logger } from '../src/core/logger';
import { LogLevel } from '../src/types';

describe('Logger', () => {
  let logger: Logger;
  
  beforeEach(() => {
    logger = new Logger({
      name: 'test-logger',
      level: 'debug',
      transports: [
        { type: 'console', enabled: true, level: 'debug', format: 'cli' }
      ]
    });
  });
  
  afterEach(() => {
    // 清理工作
  });
  
  test('应该正确创建 Logger 实例', () => {
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.name).toBe('test-logger');
    expect(logger.level).toBe('debug');
  });
  
  test('应该正确记录不同级别的日志', () => {
    // 这些调用应该不会抛出错误
    expect(() => {
      logger.error('错误消息');
      logger.warn('警告消息');
      logger.info('信息消息');
      logger.debug('调试消息');
    }).not.toThrow();
  });
  
  test('应该正确处理带元数据的日志', () => {
    expect(() => {
      logger.info('用户操作', { userId: 123, action: 'login' });
      logger.error('系统错误', { code: 'ERR_001', details: '数据库连接失败' });
    }).not.toThrow();
  });
  
  test('应该正确处理带错误的日志', () => {
    const error = new Error('测试错误');
    expect(() => {
      logger.error('发生错误', error);
      logger.error('带上下文的错误', error, { requestId: 'req-123' });
    }).not.toThrow();
  });
  
  test('应该支持 log() 方法', () => {
    expect(() => {
      logger.log('info', '使用 log 方法');
      logger.log('debug', '调试消息', { data: 'test' });
    }).not.toThrow();
  });
  
  test('应该创建子记录器', () => {
    const childLogger = logger.child('child-module');
    expect(childLogger).toBeInstanceOf(Logger);
    expect(childLogger.name).toBe('test-logger:child-module');
    
    expect(() => {
      childLogger.info('子记录器消息');
    }).not.toThrow();
  });
  
  test('应该创建带上下文的记录器', () => {
    const contextLogger = logger.withContext({ requestId: 'req-123', userId: 456 });
    expect(contextLogger).toBeInstanceOf(Logger);
    
    expect(() => {
      contextLogger.info('带上下文的消息');
    }).not.toThrow();
  });
  
  test('应该正确检查日志级别是否启用', () => {
    // 设置不同级别进行测试
    const errorLogger = new Logger({
      name: 'error-only',
      level: 'error',
      transports: [{ type: 'console', enabled: true }]
    });
    
    const debugLogger = new Logger({
      name: 'debug-all',
      level: 'debug',
      transports: [{ type: 'console', enabled: true }]
    });
    
    // 这些调用应该不会抛出错误
    expect(() => {
      errorLogger.error('错误消息应该记录');
      debugLogger.debug('调试消息应该记录');
    }).not.toThrow();
  });
  
  test('应该正确处理默认元数据', () => {
    const metaLogger = new Logger({
      name: 'meta-logger',
      level: 'info',
      defaultMeta: { service: 'test-service', version: '1.0.0' },
      transports: [{ type: 'console', enabled: true }]
    });
    
    expect(() => {
      metaLogger.info('带默认元数据的消息', { extra: 'value' });
    }).not.toThrow();
  });
  
  test('应该支持 SLF4J 风格的级别检查方法', () => {
    const infoLogger = new Logger({
      name: 'slf4j-logger',
      level: 'info',
      transports: [{ type: 'console', enabled: true }]
    });
    
    // 检查方法是否存在
    expect(typeof infoLogger.isErrorEnabled).toBe('function');
    expect(typeof infoLogger.isWarnEnabled).toBe('function');
    expect(typeof infoLogger.isInfoEnabled).toBe('function');
    expect(typeof infoLogger.isDebugEnabled).toBe('function');
    
    // 测试级别检查
    expect(infoLogger.isErrorEnabled?.()).toBe(true);  // error 级别高于 info
    expect(infoLogger.isWarnEnabled?.()).toBe(true);   // warn 级别高于 info
    expect(infoLogger.isInfoEnabled?.()).toBe(true);   // info 级别等于 info
    expect(infoLogger.isDebugEnabled?.()).toBe(false); // debug 级别低于 info
  });
});