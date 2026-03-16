import { getLogger, defaultLogger, ILogger } from '@ai-partner-x/aiko-boot-starter-log';

/**
 * 日志服务适配器
 * 提供统一的日志接口，封装 aiko-boot-starter-log 的功能
 */
export class LogService {
  private static instance: LogService;
  private logger: ILogger;
  
  private constructor() {
    // 使用命名logger，便于区分不同模块
    this.logger = getLogger('scaffold-api');
  }
  
  /**
   * 获取日志服务单例
   */
  static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }
  
  /**
   * 记录错误日志
   * @param message 错误消息
   * @param error 错误对象（可选）
   * @param meta 附加元数据（可选）
   */
  error(message: string, error?: Error, meta?: Record<string, any>) {
    this.logger.error(message, error, meta);
  }
  
  /**
   * 记录警告日志
   * @param message 警告消息
   * @param meta 附加元数据（可选）
   */
  warn(message: string, meta?: Record<string, any>) {
    this.logger.warn(message, meta);
  }
  
  /**
   * 记录信息日志
   * @param message 信息消息
   * @param meta 附加元数据（可选）
   */
  info(message: string, meta?: Record<string, any>) {
    this.logger.info(message, meta);
  }
  
  /**
   * 记录调试日志
   * @param message 调试消息
   * @param meta 附加元数据（可选）
   */
  debug(message: string, meta?: Record<string, any>) {
    this.logger.debug(message, meta);
  }
  
  /**
   * 记录HTTP请求日志
   * @param message HTTP消息
   * @param meta 附加元数据（可选）
   */
  http(message: string, meta?: Record<string, any>) {
    this.logger.http(message, meta);
  }
  
  /**
   * 记录详细日志
   * @param message 详细消息
   * @param meta 附加元数据（可选）
   */
  verbose(message: string, meta?: Record<string, any>) {
    this.logger.verbose(message, meta);
  }
  
  /**
   * 记录最详细日志
   * @param message 最详细消息
   * @param meta 附加元数据（可选）
   */
  silly(message: string, meta?: Record<string, any>) {
    this.logger.silly(message, meta);
  }
  
  /**
   * 检查是否启用指定级别的日志
   * @param level 日志级别
   */
  isLevelEnabled(level: string): boolean {
    return this.logger.isLevelEnabled(level);
  }
  
  /**
   * 获取原始logger实例
   */
  getLogger(): ILogger {
    return this.logger;
  }
  
  /**
   * 创建子logger（用于模块划分）
   * @param name 子logger名称
   */
  createChildLogger(name: string): ILogger {
    return this.logger.child(name);
  }
  
  /**
   * 添加上下文信息
   * @param context 上下文对象
   */
  withContext(context: Record<string, any>): ILogger {
    return this.logger.withContext(context);
  }
}

// 导出单例实例
export const logService = LogService.getInstance();
