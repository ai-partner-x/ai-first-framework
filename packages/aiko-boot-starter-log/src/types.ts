/**
 * 日志类型定义
 */

import * as winston from 'winston';

/** 日志级别 */
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

/** 日志级别映射（数值越小优先级越高） */
export const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6,
};

/** 日志元数据 */
export type LogMeta = Record<string, unknown>;

/** 日志条目 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp?: string;
  meta?: LogMeta;
  [key: string]: unknown;
}

/**
 * 日志记录器接口
 * 类似 SLF4J Logger 风格
 */
export interface ILogger {
  /** 记录器名称 */
  readonly name: string;
  /** 当前日志级别 */
  readonly level: LogLevel;

  // ========== 日志输出方法 ==========

  error(message: string, errorOrMeta?: Error | LogMeta, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  http(message: string, meta?: LogMeta): void;
  verbose(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
  silly(message: string, meta?: LogMeta): void;
  log(level: LogLevel, message: string, meta?: LogMeta): void;

  // ========== SLF4J 风格级别判断 ==========

  /** 是否启用 ERROR 级别 */
  isErrorEnabled?(): boolean;
  /** 是否启用 WARN 级别 */
  isWarnEnabled?(): boolean;
  /** 是否启用 INFO 级别 */
  isInfoEnabled?(): boolean;
  /** 是否启用 HTTP 级别 */
  isHttpEnabled?(): boolean;
  /** 是否启用 VERBOSE 级别 */
  isVerboseEnabled?(): boolean;
  /** 是否启用 DEBUG 级别 */
  isDebugEnabled?(): boolean;
  /** 是否启用 SILLY 级别 */
  isSillyEnabled?(): boolean;
  /** 是否启用 TRACE 级别 */
  isTraceEnabled?(): boolean;
  /** 检查指定级别是否启用 */
  isLevelEnabled?(level: LogLevel): boolean;

  // ========== 子记录器与上下文 ==========

  /** 创建子记录器 */
  child(name: string): ILogger;
  /** 创建带上下文的记录器 */
  withContext(context: LogMeta): ILogger;
}

/** 日志格式类型 */
export type FormatType = 'json' | 'simple' | 'pretty' | 'cli';

/** 传输配置基类 */
export interface BaseTransportConfig {
  enabled?: boolean;
  level?: LogLevel;
  format?: FormatType;
}

/** 控制台传输配置 */
export interface ConsoleTransportConfig extends BaseTransportConfig {
  type: 'console';
  colorize?: boolean;
  timestamp?: boolean;
}

/** 文件传输配置 */
export interface FileTransportConfig extends BaseTransportConfig {
  type: 'file';
  filename: string;
  maxSize?: string;
  maxFiles?: number;
  createDir?: boolean;
}

/** 流传输配置 */
export interface StreamTransportConfig extends BaseTransportConfig {
  type: 'stream';
  stream: NodeJS.WritableStream;
}

/** 传输配置联合类型 */
export type TransportConfig = ConsoleTransportConfig | FileTransportConfig | StreamTransportConfig;

/** 日志记录器配置 */
export interface LoggerOptions {
  name: string;
  level?: LogLevel;
  defaultMeta?: LogMeta;
  transports?: TransportConfig[];
  format?: FormatType;
  colorize?: boolean;
  timestamp?: boolean;
}

/** 日志工厂配置 */
export interface LoggerFactoryOptions {
  level?: LogLevel;
  format?: FormatType;
  transports?: TransportConfig[];
  defaultMeta?: LogMeta;
  colorize?: boolean;
  timestamp?: boolean;
}

/** 格式化选项 */
export interface FormatOptions {
  timestamp?: string | boolean;
  colorize?: boolean;
  custom?: (info: winston.Logform.TransformableInfo) => string;
}

/** 日志配置 */
export interface LogConfig {
  level?: LogLevel;
  format?: FormatType;
  colorize?: boolean;
  timestamp?: boolean;
  transports?: TransportConfig[];
  defaultMeta?: LogMeta;
}

/** Aiko Boot 应用上下文接口（可选依赖） */
export interface AikoApplicationContext {
  getBean?: <T>(type: new (...args: any[]) => T) => T | undefined;
  isActive?: () => boolean;
  [key: string]: unknown;
}

/** 动态导入错误类型 */
export interface DynamicImportError extends Error {
  code?: string;
  type?: 'MODULE_NOT_FOUND' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'UNKNOWN';
}

// ========== 装饰器相关类型 ==========

/** @Slf4j 装饰器选项 */
export interface Slf4jDecoratorOptions {
  name?: string;
  level?: string;
  enabled?: boolean;
  factoryOptions?: Partial<LoggerFactoryOptions>;
}

/** @Log 装饰器选项 */
export interface LogDecoratorOptions {
  level?: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
  message?: string;
  logArgs?: boolean;
  logResult?: boolean;
  logDuration?: boolean;
  logError?: boolean;
  argsSerializer?: (args: any[]) => any;
  resultSerializer?: (result: any) => any;
  errorSerializer?: (error: Error) => any;
  loggerName?: string;
}

/** 支持日志的类接口 */
export interface LoggableClass {
  /** 日志记录器实例 */
  logger?: ILogger;
}

/** 支持日志的类构造函数接口 */
export interface LoggableClassConstructor {
  /** 静态日志记录器实例 */
  logger?: ILogger;
  new (...args: any[]): LoggableClass;
}

/** 装饰器元数据键类型 */
export type LoggerMetadataKey = 
  | 'logger' 
  | 'logger:name' 
  | 'logger:options';

/** 装饰器配置接口 */
export interface DecoratorConfig {
  /** 是否启用装饰器支持 */
  enabled?: boolean;
  /** 默认日志级别 */
  defaultLevel?: string;
  /** 是否自动注入 logger 属性 */
  autoInject?: boolean;
}