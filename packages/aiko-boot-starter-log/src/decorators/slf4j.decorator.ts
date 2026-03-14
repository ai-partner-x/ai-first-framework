/**
 * @Slf4j 类装饰器
 * 自动为类注入日志记录器，类似 Lombok @Slf4j 注解
 */

import { ILogger, LoggerFactoryOptions } from '../types';
import { getLogger } from '../core/facade';
import { LoggerMetadata } from '../metadata/metadata';

/** @Slf4j 装饰器选项 */
export interface Slf4jOptions {
  /** 日志记录器名称（默认使用类名） */
  name?: string;
  /** 日志级别 */
  level?: string;
  /** 是否启用装饰器 */
  enabled?: boolean;
  /** 自定义日志工厂选项 */
  factoryOptions?: Partial<LoggerFactoryOptions>;
  /** 自定义日志方法名称（默认：'log'） */
  logMethodName?: string;
}

/**
 * @Slf4j 类装饰器工厂函数
 */
export function Slf4j(options?: Slf4jOptions): ClassDecorator {
  return function (target: any) {
    const className = target?.name || '';
    const loggerName = options?.name || className;
    const isEnabled = options?.enabled !== false;

    if (!isEnabled) {
      return target; // 返回原始目标，而不是 undefined
    }

    // 存储元数据
    LoggerMetadata.setName(target, loggerName);
    LoggerMetadata.setOptions(target, options);

    // 创建日志记录器实例
    const logger = getLogger(loggerName, options?.factoryOptions as any);
    LoggerMetadata.setLogger(target, logger);

    // 向类原型添加 logger 属性
    Object.defineProperty(target.prototype, 'logger', {
      get() {
        return LoggerMetadata.getLogger(target);
      },
      enumerable: false,
      configurable: true,
    });

    // 向类静态属性添加 logger 属性
    Object.defineProperty(target, 'logger', {
      get() {
        return LoggerMetadata.getLogger(target);
      },
      enumerable: false,
      configurable: true,
    });

    // 可选：为类添加便捷的日志方法
    if (options?.level) {
      const level = options.level.toLowerCase();
      const logMethodName = options.logMethodName || 'log';
      
      // 检查目标原型是否已经存在同名属性（包括继承的属性）
      const propertyDescriptor = Object.getOwnPropertyDescriptor(target.prototype, logMethodName);
      const hasPropertyInChain = logMethodName in target.prototype;
      
      if (!propertyDescriptor && !hasPropertyInChain) {
        // 原型上不存在该属性，可以安全添加
        Object.defineProperty(target.prototype, logMethodName, {
          value(message: string, meta?: any) {
            const logger = this.logger;
            if (logger && logger[level]) {
              logger[level](message, meta);
            }
          },
          enumerable: false,
          configurable: true,
          writable: true,
        });
      } else {
        // 属性已经存在（无论是直接属性还是继承的），不进行覆盖
        // 发出警告（开发环境）
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[Slf4j Decorator] Class ${className} already has a property named '${logMethodName}' ` +
            `(in prototype chain). The decorator will not add a logging method with this name. ` +
            `Consider using a different logMethodName option.`
          );
        }
      }
    }

    return target; // 返回装饰后的类
  };
}

/**
 * 简化的 @Slf4j 装饰器（无参数）
 */
export function Slf4jSimple(): ClassDecorator {
  return Slf4j({});
}

/**
 * 检查类是否已应用 @Slf4j 装饰器
 */
export function isSlf4jDecorated(target: any): boolean {
  return LoggerMetadata.hasLogger(target);
}