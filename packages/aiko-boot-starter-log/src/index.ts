/**
 * @ai-partner-x/aiko-boot-starter-log
 * 基于 Winston 的日志门面库，类似 SLF4J 风格
 * @version 0.2.0
 * @license MIT
 */

// ========== 类型定义 ==========
export type {
  LogLevel,
  LogMeta,
  LogEntry,
  ILogger,
  FormatType,
  BaseTransportConfig,
  ConsoleTransportConfig,
  FileTransportConfig,
  StreamTransportConfig,
  TransportConfig,
  LoggerOptions,
  LoggerFactoryOptions,
  FormatOptions,
  LogConfig,
  Slf4jDecoratorOptions,
  LogDecoratorOptions,
  LoggableClass,
  DecoratorConfig,
} from './types';

export { LOG_LEVELS } from './types';

// ========== 核心类 ==========
export { Logger } from './core/logger';
export { LoggerFactory } from './factory/loggerFactory';
export { Formatter } from './utils/formatter';
export { LogAutoConfiguration, DEFAULT_CONFIG, createLogAutoConfiguration, logAutoConfigure } from './config/auto-configuration';

// ========== 门面函数（SLF4J 风格） ==========
export {
  getLogger,
  initLogging,
  initFromConfig,
  initFromAikoBoot,
  autoInit,
  createConsoleLogger,
  createFileLogger,
  createCombinedLogger,
  setLevel,
  closeLogging,
  loadConfig,
  getDefaultConfig,
  defaultLogger,
} from './core/facade';

// ========== 装饰器支持 ==========
// @Slf4j 类装饰器
export {
  Slf4j,
  Slf4jSimple,
  isSlf4jDecorated,
  type Slf4jOptions,
} from './decorators/slf4j.decorator';

// @Log 方法装饰器
export {
  Log,
  LogSimple,
  LogInfo,
  LogDebug,
  LogError,
  type LogOptions,
} from './decorators/log.decorator';

// 元数据管理
export {
  LoggerMetadata,
  LOGGER_METADATA_KEY,
  LOGGER_NAME_METADATA_KEY,
  LOGGER_OPTIONS_METADATA_KEY,
} from './metadata/metadata';

// 工具函数
export {
  enableDecoratorSupport,
  getClassLogger,
  isClassLoggable,
  injectLogger,
  createMethodWrapper,
} from './utils/decorator-utils';

// ========== 实例导出 ==========
import { LoggerFactory } from './factory/loggerFactory';

/** 日志工厂实例 */
export const loggerFactory = LoggerFactory.getInstance();

/** 版本号 */
export const VERSION = '0.2.0';

/** 库名 */
export const LIBRARY_NAME = '@ai-partner-x/aiko-boot-starter-log';

// 装饰器支持需要手动启用
// 使用装饰器前请调用：import { enableDecoratorSupport } from './utils/decorator-utils'; enableDecoratorSupport();