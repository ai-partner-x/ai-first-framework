/**
 * 日志门面 - 类似 SLF4J 风格
 * 提供简洁的静态方法访问日志功能
 */

import { LoggerFactory } from './loggerFactory';
import { Logger } from './logger';
import { LogAutoConfiguration, DEFAULT_CONFIG } from './auto-configuration';
import type { ILogger, LogLevel, LoggerFactoryOptions, LogConfig, AikoApplicationContext, DynamicImportError } from './types';
import { getApplicationContext } from '@ai-partner-x/aiko-boot/boot';

/**
 * 获取日志记录器（SLF4J 风格）
 * @param name 日志记录器名称
 */
export function getLogger(name: string): ILogger;

/**
 * 获取日志记录器（带配置选项）
 * @param name 日志记录器名称
 * @param options 配置选项
 */
export function getLogger(name: string, options?: Partial<LoggerFactoryOptions>): ILogger;

export function getLogger(name: string, options?: Partial<LoggerFactoryOptions>): ILogger {
  return LoggerFactory.getInstance().getLogger(name, options);
}

/**
 * 初始化日志工厂
 */
export function initLogging(options?: LoggerFactoryOptions): LoggerFactory {
  return LoggerFactory.getInstance(options);
}

/**
 * 从配置对象初始化
 */
export function initFromConfig(config: LogConfig): LoggerFactory {
  return LoggerFactory.fromConfig(config);
}

/**
 * 从 aiko-boot 配置系统初始化
 */
export async function initFromAikoBoot(): Promise<LoggerFactory> {
  return LoggerFactory.fromAikoBoot();
}

/**
 * 自动加载配置（从 aiko-boot 配置系统）
 */
export async function autoInit(): Promise<LoggerFactory> {
  return LoggerFactory.autoLoad();
}

/**
 * 创建控制台日志记录器
 */
export function createConsoleLogger(name: string, level: LogLevel = 'info'): ILogger {
  return new Logger({ name, level, transports: [{ type: 'console', level, format: 'cli', colorize: true }] });
}

/**
 * 创建文件日志记录器
 */
export function createFileLogger(name: string, filename: string, options?: { level?: LogLevel; maxSize?: string; maxFiles?: number }): ILogger {
  return new Logger({
    name,
    level: options?.level ?? 'info',
    transports: [{ type: 'file', filename, level: options?.level, maxSize: options?.maxSize, maxFiles: options?.maxFiles }],
  });
}

/**
 * 创建组合日志记录器（控制台 + 文件）
 */
export function createCombinedLogger(name: string, filename: string, options?: { level?: LogLevel; maxSize?: string; maxFiles?: number }): ILogger {
  return new Logger({
    name,
    level: options?.level ?? 'info',
    transports: [
      { type: 'console', level: options?.level, format: 'cli', colorize: true },
      { type: 'file', filename, level: options?.level, maxSize: options?.maxSize, maxFiles: options?.maxFiles },
    ],
  });
}

/**
 * 设置全局日志级别
 */
export function setLevel(level: LogLevel): void {
  LoggerFactory.getInstance().setLevel(level);
}

/**
 * 关闭日志工厂
 */
export function closeLogging(): void {
  LoggerFactory.reset();
}

/**
 * 加载配置
 */
export async function loadConfig(): Promise<LogConfig> {
  try {
    // 尝试从依赖注入容器获取 LogAutoConfiguration 实例
    const context = getApplicationContext();
    
    if (context) {
      // 使用类型守卫进行安全检查
      const typedContext = context as unknown as AikoApplicationContext;
      if (typeof typedContext.getBean === 'function') {
        const autoConfig = typedContext.getBean(LogAutoConfiguration);
        if (autoConfig) {
          return autoConfig.getConfig();
        }
      } else {
        console.warn('Aiko Boot 应用上下文存在，但缺少 getBean 方法，使用默认配置');
      }
    } else {
      console.warn('无法获取 Aiko Boot 应用上下文，使用默认配置');
    }
  } catch (error) {
    // 更明确的错误处理
    const importError = error as DynamicImportError;
    
    if (importError.code === 'MODULE_NOT_FOUND') {
      console.warn('@ai-partner-x/aiko-boot 模块未找到，日志系统将使用独立模式运行');
    } else if (importError.message?.includes('Cannot find module')) {
      console.warn('Aiko Boot 依赖不可用，日志系统将使用默认配置');
    } else {
      console.warn('从 Aiko Boot 加载配置时发生错误，使用默认配置:', importError.message || importError);
    }
  }
  
  // 创建新实例作为后备方案
  const autoConfig = new LogAutoConfiguration();
  return autoConfig.getConfig();
}

/**
 * 获取默认配置
 */
export function getDefaultConfig(): LogConfig {
  return { ...DEFAULT_CONFIG };
}

/** 默认日志记录器 */
export const defaultLogger = createConsoleLogger('app');