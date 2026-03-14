/**
 * 日志记录器 - 类似 SLF4J Logger 风格
 */

import * as winston from 'winston';
import { Formatter } from '../utils/formatter';
import type { ILogger, LogLevel, LogMeta, LoggerOptions, TransportConfig } from '../types';
import { LOG_LEVELS } from '../types';

/** 文件大小单位映射 */
const SIZE_UNITS: Record<string, number> = {
  b: 1, k: 1024, kb: 1024,
  m: 1024 * 1024, mb: 1024 * 1024,
  g: 1024 * 1024 * 1024, gb: 1024 * 1024 * 1024,
};

/**
 * 日志记录器实现
 * 类似 SLF4J Logger 接口风格
 */
export class Logger implements ILogger {
  readonly name: string;
  private _level: LogLevel;
  private winstonLogger: winston.Logger;
  private defaultMeta: LogMeta;

  constructor(options: LoggerOptions) {
    this.name = options.name;
    this._level = this.validateLevel(options.level) ?? 'info';
    this.defaultMeta = options.defaultMeta ?? {};
    this.winstonLogger = this.createWinstonLogger(options);
  }

  /** 获取当前日志级别 */
  get level(): LogLevel {
    return this._level;
  }

  /** 验证日志级别有效性 */
  private validateLevel(level?: LogLevel): LogLevel | undefined {
    if (!level) return undefined;
    const validLevels = Object.keys(LOG_LEVELS) as LogLevel[];
    return validLevels.includes(level) ? level : undefined;
  }

  /** 获取底层 winston 实例（高级用法） */
  get winston(): winston.Logger {
    return this.winstonLogger;
  }

  private createWinstonLogger(options: LoggerOptions): winston.Logger {
    const { transports, format = 'cli', colorize = true } = options;

    const logger = winston.createLogger({
      levels: LOG_LEVELS,
      level: this._level,
      defaultMeta: { logger: this.name, ...this.defaultMeta },
    });

    if (transports?.length) {
      transports.filter(t => t.enabled !== false).forEach(t => {
        const transport = this.createTransport(t, format, colorize);
        if (transport) logger.add(transport);
      });
    } else {
      logger.add(new winston.transports.Console({ format: Formatter.cli(colorize) }));
    }

    return logger;
  }

  private createTransport(config: TransportConfig, defaultFormat: string, colorize: boolean): winston.transport | null {
    const format = config.format ?? defaultFormat;
    const level = config.level ?? this._level;

    switch (config.type) {
      case 'console':
        return new winston.transports.Console({
          level,
          format: format === 'json' ? Formatter.json() : Formatter.cli(colorize),
        });
      case 'file':
        return new winston.transports.File({
          level,
          filename: config.filename,
          maxsize: config.maxSize ? this.parseSize(config.maxSize) : undefined,
          maxFiles: config.maxFiles,
          format: Formatter.json(),
        });
      case 'stream':
        return new winston.transports.Stream({
          level,
          stream: config.stream,
          format: Formatter.json(),
        });
      default:
        return null;
    }
  }

  private parseSize(size: string): number {
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
    if (!match) throw new Error(`无效的文件大小格式: ${size}`);
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'b').toLowerCase();
    return Math.floor(value * (SIZE_UNITS[unit] || 1));
  }

  private mergeMeta(meta?: LogMeta): LogMeta {
    return { ...this.defaultMeta, ...meta };
  }

  // ========== SLF4J 风格日志方法 ==========

  error(message: string, errorOrMeta?: Error | LogMeta, meta?: LogMeta): void {
    if (errorOrMeta instanceof Error) {
      this.winstonLogger.error(message, {
        ...this.mergeMeta(meta),
        error: { name: errorOrMeta.name, message: errorOrMeta.message, stack: errorOrMeta.stack },
      });
    } else {
      this.winstonLogger.error(message, this.mergeMeta(errorOrMeta));
    }
  }

  warn(message: string, meta?: LogMeta): void {
    this.winstonLogger.warn(message, this.mergeMeta(meta));
  }

  info(message: string, meta?: LogMeta): void {
    this.winstonLogger.info(message, this.mergeMeta(meta));
  }

  http(message: string, meta?: LogMeta): void {
    this.winstonLogger.http(message, this.mergeMeta(meta));
  }

  verbose(message: string, meta?: LogMeta): void {
    this.winstonLogger.verbose(message, this.mergeMeta(meta));
  }

  debug(message: string, meta?: LogMeta): void {
    this.winstonLogger.debug(message, this.mergeMeta(meta));
  }

  silly(message: string, meta?: LogMeta): void {
    this.winstonLogger.silly(message, this.mergeMeta(meta));
  }

  log(level: LogLevel, message: string, meta?: LogMeta): void {
    this.winstonLogger.log(level, message, this.mergeMeta(meta));
  }

  // ========== 日志级别判断（SLF4J 风格） ==========

  /** 是否启用 ERROR 级别 */
  isErrorEnabled(): boolean {
    return this.isLevelEnabled('error');
  }

  /** 是否启用 WARN 级别 */
  isWarnEnabled(): boolean {
    return this.isLevelEnabled('warn');
  }

  /** 是否启用 INFO 级别 */
  isInfoEnabled(): boolean {
    return this.isLevelEnabled('info');
  }

  /** 是否启用 DEBUG 级别 */
  isDebugEnabled(): boolean {
    return this.isLevelEnabled('debug');
  }

  /** 是否启用 TRACE 级别（对应 silly） */
  isTraceEnabled(): boolean {
    return this.isLevelEnabled('silly');
  }

  /** 是否启用 HTTP 级别 */
  isHttpEnabled(): boolean {
    return this.isLevelEnabled('http');
  }

  /** 是否启用 VERBOSE 级别 */
  isVerboseEnabled(): boolean {
    return this.isLevelEnabled('verbose');
  }

  /** 是否启用 SILLY 级别 */
  isSillyEnabled(): boolean {
    return this.isLevelEnabled('silly');
  }

  /**
   * 判断指定日志级别是否启用
   * 注意：LOG_LEVELS 映射中数值越小优先级越高（error:0, warn:1, info:2, ...）
   * 因此判断逻辑是：要检查的级别数值 <= 当前级别数值时，该级别才启用
   * 例如：当前级别为 'info'(2) 时，'error'(0) 和 'warn'(1) 也启用，但 'debug'(5) 不启用
   * @param level 要检查的日志级别
   * @returns 该级别是否启用
   */
  isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this._level];
  }

  // ========== 子记录器与上下文 ==========

  /**
   * 创建子记录器
   * @param suffix 名称后缀
   */
  child(suffix: string): ILogger {
    return new Logger({
      name: `${this.name}:${suffix}`,
      level: this._level,
      defaultMeta: this.defaultMeta,
    });
  }

  /**
   * 创建带上下文的记录器
   * @param context 上下文元数据
   */
  withContext(context: LogMeta): ILogger {
    return new Logger({
      name: this.name,
      level: this._level,
      defaultMeta: { ...this.defaultMeta, ...context },
    });
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this._level = level;
    this.winstonLogger.level = level;
  }

  /**
   * 更新记录器配置
   * 支持配置热更新，包括：
   * - 日志级别（热更新）
   * - 默认元数据（热更新）
   * 
   * @param options 新的配置选项
   * @returns 是否成功更新配置（true=热更新成功，false=需要重新创建记录器）
   */
  updateConfig(options: Partial<LoggerOptions>): boolean {
    let needsRecreate = false;
    const currentOptions = this.getCurrentOptions();
    
    // 检查是否需要重新创建 winston logger
    if (options.transports !== undefined && JSON.stringify(options.transports) !== JSON.stringify(currentOptions.transports)) {
      needsRecreate = true;
    }
    
    if (options.format !== undefined && options.format !== currentOptions.format) {
      needsRecreate = true;
    }
    
    if (options.colorize !== undefined && options.colorize !== currentOptions.colorize) {
      needsRecreate = true;
    }
    
    if (options.timestamp !== undefined && options.timestamp !== currentOptions.timestamp) {
      needsRecreate = true;
    }
    
    // 如果不需要重新创建，进行热更新
    if (!needsRecreate) {
      // 更新日志级别
      if (options.level) {
        this.setLevel(options.level);
      }

      // 更新默认元数据
      if (options.defaultMeta) {
        this.defaultMeta = { ...this.defaultMeta, ...options.defaultMeta };
      }
      
      return true; // 热更新成功
    }
    
    // 需要重新创建 winston logger
    this.recreateWinstonLogger({
      ...currentOptions,
      ...options,
    });
    
    return false; // 需要重新创建记录器
  }

  /**
   * 获取当前配置选项
   * @private
   */
  private getCurrentOptions(): LoggerOptions {
    // 从 winston logger 中提取当前 transports 信息
    const transports: TransportConfig[] = [];
    
    // 注意：winston logger 不直接暴露 transports 配置，这里返回一个简化版本
    // 实际实现中可能需要更复杂的逻辑来重建配置
    return {
      name: this.name,
      level: this._level,
      defaultMeta: this.defaultMeta,
      transports: transports, // 简化处理
      format: 'cli', // 简化处理
      colorize: true, // 简化处理
      timestamp: true, // 简化处理
    };
  }

  /**
   * 重新创建 winston logger
   * @private
   */
  private recreateWinstonLogger(options: LoggerOptions): void {
    // 关闭旧的 winston logger
    this.winstonLogger.close();
    
    // 更新内部状态
    if (options.level) {
      this._level = this.validateLevel(options.level) ?? 'info';
    }
    
    if (options.defaultMeta) {
      this.defaultMeta = { ...this.defaultMeta, ...options.defaultMeta };
    }
    
    // 重新创建 winston logger
    this.winstonLogger = this.createWinstonLogger(options);
  }

  /**
   * 关闭日志记录器
   */
  close(): void {
    this.winstonLogger.close();
  }
}