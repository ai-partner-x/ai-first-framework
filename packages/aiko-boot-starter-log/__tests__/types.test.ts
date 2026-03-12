/**
 * 类型定义单元测试
 * 测试 types.ts 中的类型定义和常量
 */

import { describe, test, expect } from 'vitest';
import {
  LOG_LEVELS,
  LogLevel,
  FormatType,
  LogMeta,
  LogEntry,
  ILogger,
  BaseTransportConfig,
  ConsoleTransportConfig,
  FileTransportConfig,
  StreamTransportConfig,
  TransportConfig,
  LoggerOptions,
  LoggerFactoryOptions,
  FormatOptions,
  LogConfig
} from '../src/types';

describe('类型定义', () => {
  test('LOG_LEVELS 应该包含正确的级别映射', () => {
    expect(LOG_LEVELS).toBeDefined();
    expect(LOG_LEVELS.error).toBe(0);
    expect(LOG_LEVELS.warn).toBe(1);
    expect(LOG_LEVELS.info).toBe(2);
    expect(LOG_LEVELS.http).toBe(3);
    expect(LOG_LEVELS.verbose).toBe(4);
    expect(LOG_LEVELS.debug).toBe(5);
    expect(LOG_LEVELS.silly).toBe(6);
  });
  
  test('LogLevel 类型应该包含所有级别', () => {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
    levels.forEach(level => {
      expect(level).toBeDefined();
    });
  });
  
  test('FormatType 类型应该包含所有格式', () => {
    const formats: FormatType[] = ['json', 'simple', 'pretty', 'cli'];
    formats.forEach(format => {
      expect(format).toBeDefined();
    });
  });
  
  test('LogMeta 应该是一个记录类型', () => {
    const meta: LogMeta = {
      userId: 123,
      requestId: 'abc-123',
      timestamp: new Date().toISOString(),
      nested: { key: 'value' }
    };
    
    expect(meta).toBeDefined();
    expect(typeof meta.userId).toBe('number');
    expect(typeof meta.requestId).toBe('string');
  });
  
  test('LogEntry 应该包含必需的属性', () => {
    const entry: LogEntry = {
      level: 'info',
      message: '测试消息',
      timestamp: new Date().toISOString(),
      meta: { key: 'value' }
    };
    
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('测试消息');
    expect(entry.timestamp).toBeDefined();
    expect(entry.meta).toBeDefined();
  });
  
  test('ILogger 接口应该定义所有必需的方法', () => {
    // 这是一个类型检查测试，我们创建一个符合接口的对象
    const logger: ILogger = {
      name: 'test-logger',
      level: 'info',
      
      // 日志输出方法
      error: (message: string, meta?: LogMeta | Error) => {},
      warn: (message: string, meta?: LogMeta) => {},
      info: (message: string, meta?: LogMeta) => {},
      http: (message: string, meta?: LogMeta) => {},
      verbose: (message: string, meta?: LogMeta) => {},
      debug: (message: string, meta?: LogMeta) => {},
      silly: (message: string, meta?: LogMeta) => {},
      log: (level: LogLevel, message: string, meta?: LogMeta) => {},
      
      // SLF4J 风格级别检查（可选）
      isErrorEnabled: () => true,
      isWarnEnabled: () => true,
      isInfoEnabled: () => true,
      isDebugEnabled: () => false,
      isTraceEnabled: () => false,
      
      // 子记录器和上下文
      child: (name: string) => logger,
      withContext: (context: LogMeta) => logger
    };
    
    expect(logger.name).toBe('test-logger');
    expect(logger.level).toBe('info');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.child).toBe('function');
  });
  
  test('BaseTransportConfig 应该定义基础配置', () => {
    const config: BaseTransportConfig = {
      enabled: true,
      level: 'info',
      format: 'cli'
    };
    
    expect(config.enabled).toBe(true);
    expect(config.level).toBe('info');
    expect(config.format).toBe('cli');
  });
  
  test('ConsoleTransportConfig 应该扩展基础配置', () => {
    const config: ConsoleTransportConfig = {
      type: 'console',
      enabled: true,
      level: 'debug',
      format: 'cli',
      colorize: true,
      timestamp: true
    };
    
    expect(config.type).toBe('console');
    expect(config.colorize).toBe(true);
    expect(config.timestamp).toBe(true);
  });
  
  test('FileTransportConfig 应该包含文件特定配置', () => {
    const config: FileTransportConfig = {
      type: 'file',
      enabled: true,
      level: 'info',
      filename: './app.log',
      maxSize: '10m',
      maxFiles: 5,
      createDir: true
    };
    
    expect(config.type).toBe('file');
    expect(config.filename).toBe('./app.log');
    expect(config.maxSize).toBe('10m');
    expect(config.maxFiles).toBe(5);
  });
  
  test('StreamTransportConfig 应该包含流配置', () => {
    const writableStream = {
      write: () => true
    } as any;
    
    const config: StreamTransportConfig = {
      type: 'stream',
      enabled: true,
      level: 'error',
      stream: writableStream
    };
    
    expect(config.type).toBe('stream');
    expect(config.stream).toBe(writableStream);
  });
  
  test('TransportConfig 应该是联合类型', () => {
    const consoleConfig: TransportConfig = {
      type: 'console',
      enabled: true,
      level: 'info'
    };
    
    const fileConfig: TransportConfig = {
      type: 'file',
      enabled: true,
      filename: './test.log',
      level: 'debug'
    };
    
    expect(consoleConfig.type).toBe('console');
    expect(fileConfig.type).toBe('file');
  });
  
  test('LoggerOptions 应该包含记录器选项', () => {
    const options: LoggerOptions = {
      name: 'test-logger',
      level: 'debug',
      defaultMeta: { service: 'test' },
      transports: [{ type: 'console', enabled: true }],
      format: 'pretty',
      colorize: true,
      timestamp: true
    };
    
    expect(options.name).toBe('test-logger');
    expect(options.level).toBe('debug');
    expect(options.defaultMeta).toBeDefined();
    expect(options.transports).toBeInstanceOf(Array);
  });
  
  test('LoggerFactoryOptions 应该包含工厂选项', () => {
    const options: LoggerFactoryOptions = {
      level: 'info',
      format: 'cli',
      transports: [{ type: 'console', enabled: true }],
      defaultMeta: { app: 'test-app' },
      colorize: false,
      timestamp: false
    };
    
    expect(options.level).toBe('info');
    expect(options.format).toBe('cli');
    expect(options.transports).toBeInstanceOf(Array);
  });
  
  test('FormatOptions 应该包含格式化选项', () => {
    const options: FormatOptions = {
      timestamp: true,
      colorize: true,
      custom: (info: any) => `[CUSTOM] ${info.message}`
    };
    
    expect(options.timestamp).toBe(true);
    expect(options.colorize).toBe(true);
    expect(typeof options.custom).toBe('function');
  });
  
  test('LogConfig 应该包含日志配置', () => {
    const config: LogConfig = {
      level: 'warn',
      format: 'json',
      colorize: false,
      timestamp: true,
      transports: [
        { type: 'console', enabled: true, level: 'warn' },
        { type: 'file', enabled: true, filename: './error.log', level: 'error' }
      ],
      defaultMeta: { environment: 'test' }
    };
    
    expect(config.level).toBe('warn');
    expect(config.format).toBe('json');
    expect(config.transports.length).toBe(2);
    expect(config.defaultMeta).toBeDefined();
  });
  
  test('应该正确比较日志级别优先级', () => {
    // error (0) < warn (1) < info (2) < http (3) < verbose (4) < debug (5) < silly (6)
    expect(LOG_LEVELS.error).toBeLessThan(LOG_LEVELS.warn);
    expect(LOG_LEVELS.warn).toBeLessThan(LOG_LEVELS.info);
    expect(LOG_LEVELS.info).toBeLessThan(LOG_LEVELS.http);
    expect(LOG_LEVELS.http).toBeLessThan(LOG_LEVELS.verbose);
    expect(LOG_LEVELS.verbose).toBeLessThan(LOG_LEVELS.debug);
    expect(LOG_LEVELS.debug).toBeLessThan(LOG_LEVELS.silly);
  });
});