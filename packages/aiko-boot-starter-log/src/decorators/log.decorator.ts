/**
 * @Log 方法装饰器
 * 自动记录方法调用，支持同步和异步方法
 */

import { ILogger } from '../types';
import { LoggerMetadata } from '../metadata/metadata';
import { getLogger } from '../core/facade';

/** @Log 装饰器选项 */
export interface LogOptions {
  /** 日志级别（默认：'info'） */
  level?: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
  /** 自定义日志消息模板 */
  message?: string;
  /** 是否记录方法参数（默认：true） */
  logArgs?: boolean;
  /** 是否记录返回值（默认：true） */
  logResult?: boolean;
  /** 是否记录执行时间（默认：true） */
  logDuration?: boolean;
  /** 是否记录错误（默认：true） */
  logError?: boolean;
  /** 参数序列化函数 */
  argsSerializer?: (args: any[]) => any;
  /** 结果序列化函数 */
  resultSerializer?: (result: any) => any;
  /** 错误序列化函数 */
  errorSerializer?: (error: Error) => any;
  /** 自定义日志记录器名称（覆盖类级别的记录器） */
  loggerName?: string;
}

/**
 * @Log 方法装饰器工厂函数
 */
export function Log(options?: LogOptions): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor | undefined
  ) {
    // 检查 descriptor 是否存在，如果不存在则创建
    if (!descriptor) {
      console.warn(`@Log decorator: descriptor is undefined for ${String(propertyKey)}, creating new descriptor`);
      descriptor = {
        value: undefined as any,
        writable: true,
        enumerable: false,
        configurable: true,
      };
      return descriptor;
    }
    
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      console.warn(`@Log decorator: originalMethod is undefined for ${String(propertyKey)}`);
      return descriptor;
    }
    
    const methodName = String(propertyKey);
    const className = target?.constructor?.name || 'UnknownClass';
    
    const config: Required<LogOptions> = {
      level: options?.level || 'info',
      message: options?.message || `Method ${methodName} called`,
      logArgs: options?.logArgs !== false,
      logResult: options?.logResult !== false,
      logDuration: options?.logDuration !== false,
      logError: options?.logError !== false,
      argsSerializer: options?.argsSerializer || defaultArgsSerializer,
      resultSerializer: options?.resultSerializer || defaultResultSerializer,
      errorSerializer: options?.errorSerializer || defaultErrorSerializer,
      loggerName: options?.loggerName || '',
    };

    descriptor.value = function (...args: any[]) {
      // 获取日志记录器
      let logger: ILogger | undefined;
      if (config.loggerName) {
        // 使用自定义记录器名称
        logger = getLogger(config.loggerName);
      } else {
        // 使用类级别的记录器
        logger = LoggerMetadata.getLogger(target.constructor);
      }

      if (!logger) {
        // 如果没有找到记录器，直接执行原始方法
        return originalMethod.apply(this, args);
      }

      const startTime = Date.now();
      const meta: any = {
        className,
        methodName,
      };

      // 记录方法参数
      if (config.logArgs && args.length > 0) {
        meta.args = config.argsSerializer(args);
      }

      try {
        // 执行前日志
        if (logger.isInfoEnabled?.()) {
          logger[config.level](`${config.message} - start`, meta);
        }

        // 执行原始方法
        const result = originalMethod.apply(this, args);

        // 处理异步方法
        if (result instanceof Promise) {
          return result
            .then((asyncResult) => {
              const duration = Date.now() - startTime;
              logSuccess(logger!, config, meta, asyncResult, duration);
              return asyncResult;
            })
            .catch((error) => {
              const duration = Date.now() - startTime;
              logError(logger!, config, meta, error, duration);
              throw error;
            });
        }

        // 处理同步方法
        const duration = Date.now() - startTime;
        logSuccess(logger, config, meta, result, duration);
        return result;
      } catch (error) {
        // 处理同步方法错误
        const duration = Date.now() - startTime;
        logError(logger, config, meta, error as Error, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

/** 默认参数序列化器 */
function defaultArgsSerializer(args: any[]): any {
  return args.map(arg => {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (typeof arg === 'function') return '[Function]';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        return '[Object]';
      }
    }
    // 对于基本类型（数字、字符串、布尔值），直接返回原始值
    return arg;
  });
}

/** 默认结果序列化器 */
function defaultResultSerializer(result: any): any {
  if (result === undefined) return 'undefined';
  if (result === null) return 'null';
  if (typeof result === 'function') return '[Function]';
  if (typeof result === 'object') {
    try {
      return JSON.stringify(result);
    } catch {
      return '[Object]';
    }
  }
  return result;
}

/** 默认错误序列化器 */
function defaultErrorSerializer(error: Error): any {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

/** 记录成功日志 */
function logSuccess(
  logger: ILogger,
  config: Required<LogOptions>,
  meta: any,
  result: any,
  duration: number
): void {
  const successMeta = { ...meta };
  
  if (config.logResult) {
    successMeta.result = config.resultSerializer(result);
  }
  
  if (config.logDuration) {
    successMeta.duration = `${duration}ms`;
  }
  
  logger[config.level](`${config.message} - success`, successMeta);
}

/** 记录错误日志 */
function logError(
  logger: ILogger,
  config: Required<LogOptions>,
  meta: any,
  error: Error,
  duration: number
): void {
  if (!config.logError) return;
  
  const errorMeta = { ...meta };
  
  if (config.logDuration) {
    errorMeta.duration = `${duration}ms`;
  }
  
  errorMeta.error = config.errorSerializer(error);
  
  logger.error(`${config.message} - error`, error, errorMeta);
}

/**
 * 简化的 @Log 装饰器（无参数）
 */
export function LogSimple(): MethodDecorator {
  return Log({});
}

/**
 * 便捷装饰器：@LogInfo
 */
export function LogInfo(message?: string): MethodDecorator {
  return Log({ level: 'info', message });
}

/**
 * 便捷装饰器：@LogDebug
 */
export function LogDebug(message?: string): MethodDecorator {
  return Log({ level: 'debug', message });
}

/**
 * 便捷装饰器：@LogError
 */
export function LogError(message?: string): MethodDecorator {
  return Log({ level: 'error', message });
}