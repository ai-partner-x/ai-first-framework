/**
 * 门面函数单元测试
 * 测试 facade.ts 中导出的公共 API
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  getLogger,
  initLogging,
  createConsoleLogger,
  createFileLogger,
  createCombinedLogger,
  setLevel,
  closeLogging,
  loadConfig,
  getDefaultConfig,
  defaultLogger,
  initFromAikoBoot,
  autoInit
} from '../src/core/facade';
import { Logger } from '../src/core/logger';
import { LogLevel } from '../src/types';

describe('门面函数', () => {
  beforeEach(() => {
    // 确保每次测试前重置状态
    closeLogging();
  });
  
  afterEach(() => {
    closeLogging();
  });
  
  test('应该正确获取默认记录器', () => {
    const logger = defaultLogger;
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.name).toBe('app');
  });
  
  test('应该通过 getLogger() 获取记录器', () => {
    const logger = getLogger('test-app');
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.name).toBe('test-app');
  });
  
  test('getLogger() 应该返回相同名称的相同实例', () => {
    const logger1 = getLogger('same-app');
    const logger2 = getLogger('same-app');
    const logger3 = getLogger('different-app');
    
    expect(logger1).toBe(logger2);
    expect(logger1).not.toBe(logger3);
  });
  
  test('应该正确初始化日志系统', () => {
    const config = {
      level: 'debug' as LogLevel,
      format: 'cli' as const,
      colorize: true,
      transports: [
        { type: 'console' as const, enabled: true, level: 'debug' as LogLevel }
      ]
    };
    
    initLogging(config);
    
    const logger = getLogger('initialized-app');
    expect(logger.level).toBe('debug');
  });
  
  test('应该创建控制台记录器', () => {
    const logger = createConsoleLogger('console-app', 'debug');
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.name).toBe('console-app');
    expect(logger.level).toBe('debug');
  });
  
  test('createConsoleLogger() 应该使用默认级别', () => {
    const logger = createConsoleLogger('console-default');
    expect(logger.level).toBe('info'); // 默认级别
  });
  
  test('应该创建文件记录器', () => {
    const logger = createFileLogger('file-app', './test.log', {
      level: 'info',
      maxSize: '1mb',
      maxFiles: 3
    });
    
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.name).toBe('file-app');
  });
  
  test('应该创建组合记录器', () => {
    const logger = createCombinedLogger('combined-app', './combined.log', {
      level: 'debug',
      maxSize: '1mb',
      maxFiles: 5
    });
    
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.name).toBe('combined-app');
  });
  
  test('应该设置全局日志级别', () => {
    initLogging({ level: 'info' });
    const logger1 = getLogger('app1');
    expect(logger1.level).toBe('info');
    
    setLevel('debug');
    const logger2 = getLogger('app2');
    expect(logger2.level).toBe('debug');
    
    // 现有记录器也应该更新
    expect(logger1.level).toBe('debug');
  });
  
  test('应该正确关闭日志系统', () => {
    const logger = getLogger('closing-app');
    expect(() => {
      logger.info('测试消息');
      closeLogging();
    }).not.toThrow();
  });
  
  test('initFromAikoBoot() 应该处理缺失的 ConfigLoader', () => {
    // 在没有 aiko-boot 的情况下应该不会抛出错误
    expect(() => {
      initFromAikoBoot();
    }).not.toThrow();
    
    const logger = getLogger('aiko-test');
    expect(logger).toBeInstanceOf(Logger);
  });
  
  test('autoInit() 应该自动初始化', () => {
    expect(() => {
      autoInit();
    }).not.toThrow();
    
    const logger = getLogger('auto-init-app');
    expect(logger).toBeInstanceOf(Logger);
  });
  
  test('应该支持不同的日志级别', () => {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    
    levels.forEach(level => {
      initLogging({ level });
      const logger = getLogger(`level-${level}`);
      expect(logger.level).toBe(level);
    });
  });
  
  test('应该正确处理带元数据的日志', () => {
    const logger = createConsoleLogger('meta-test', 'debug');
    
    expect(() => {
      logger.info('用户操作', { userId: 123, action: 'login' });
      logger.error('系统错误', new Error('测试错误'), { code: 'ERR_001' });
    }).not.toThrow();
  });
  
  test('应该支持子记录器', () => {
    const logger = createConsoleLogger('parent', 'info');
    const childLogger = logger.child('child');
    
    expect(childLogger).toBeInstanceOf(Logger);
    expect(childLogger.name).toBe('parent:child');
    
    expect(() => {
      childLogger.info('子记录器消息');
    }).not.toThrow();
  });
  
  test('应该支持带上下文的记录器', () => {
    const logger = createConsoleLogger('context', 'info');
    const contextLogger = logger.withContext({ requestId: 'req-123' });
    
    expect(contextLogger).toBeInstanceOf(Logger);
    
    expect(() => {
      contextLogger.info('带上下文的消息');
    }).not.toThrow();
  });
});