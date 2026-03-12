/**
 * @ai-partner-x/aiko-boot-starter-log
 * 基于 Winston 的日志门面库，类似 SLF4J 风格
 * @version 0.2.0
 * @license MIT
 */

// ========== 类型定义 ==========
export {
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
  LOG_LEVELS,
} from './types';

// ========== 核心类 ==========
export { Logger } from './logger';
export { LoggerFactory } from './loggerFactory';
export { Formatter } from './formatter';
export { LogAutoConfiguration, DEFAULT_CONFIG, createLogAutoConfiguration, logAutoConfigure } from './auto-configuration';

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
} from './facade';

// ========== 实例导出 ==========
import { LoggerFactory } from './loggerFactory';

/** 日志工厂实例 */
export const loggerFactory = LoggerFactory.getInstance();

/** 版本号 */
export const VERSION = '0.2.0';

/** 库名 */
export const LIBRARY_NAME = '@ai-partner-x/aiko-boot-starter-log';