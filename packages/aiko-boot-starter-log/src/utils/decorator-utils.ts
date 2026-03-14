/**
 * 装饰器工具函数
 */

import { ILogger } from '../types';
import { LoggerMetadata } from '../metadata/metadata';
import { createConsoleLogger } from '../core/facade';
/**
 * 启用装饰器支持
 * 需要在应用启动时调用，确保 reflect-metadata 已加载
 */
export function enableDecoratorSupport(): void {
  // 检查 reflect-metadata 是否已加载
  if (typeof Reflect !== 'object' || !(Reflect as any).getMetadata) {
    console.warn(
      'reflect-metadata 未加载，装饰器功能可能无法正常工作。' +
      '请确保在应用入口处导入 "reflect-metadata" 包。'
    );
  }
}

/**
 * 获取类的日志记录器
 * 如果类已应用 @Slf4j 装饰器，返回对应的记录器
 * 否则返回 undefined
 */
export function getClassLogger(target: any): ILogger | undefined {
  return LoggerMetadata.getLogger(target);
}

/**
 * 检查类是否已应用 @Slf4j 装饰器
 */
export function isClassLoggable(target: any): boolean {
  return LoggerMetadata.hasLogger(target);
}

/**
 * 为类手动注入日志记录器
 * 用于不使用 @Slf4j 装饰器的情况
 */
export async function injectLogger(
  target: any,
  loggerOrName: ILogger | string,
  options?: any
): Promise<void> {
  let logger: ILogger;
  
  if (typeof loggerOrName === 'string') {
    try {
      // 尝试动态导入 facade 模块
      const facade = await import('../core/facade');
      logger = facade.getLogger(loggerOrName, options);
    } catch (error) {
      // 如果导入失败，创建一个简单的控制台记录器
      logger = createConsoleLogger(loggerOrName);
    }
  } else {
    logger = loggerOrName;
  }
  
  LoggerMetadata.setLogger(target, logger);
  
  // 向类原型添加 logger 属性
  Object.defineProperty(target.prototype, 'logger', {
    get() {
      return LoggerMetadata.getLogger(target);
    },
    enumerable: false,
    configurable: true,
  });
}

/**
 * 创建方法包装器（用于手动包装方法）
 */
export function createMethodWrapper(
  method: Function,
  options?: any
): Function {
  return function (this: any, ...args: any[]) {
    // 实现类似 @Log 装饰器的逻辑
    const startTime = Date.now();
    const methodName = method.name || 'anonymous';
    
    try {
      console.log(`[LOG] ${methodName} called with args:`, args);
      const result = method.apply(this, args);
      
      if (result instanceof Promise) {
        return result
          .then((asyncResult) => {
            const duration = Date.now() - startTime;
            console.log(`[LOG] ${methodName} completed in ${duration}ms`);
            return asyncResult;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            console.error(`[LOG] ${methodName} failed in ${duration}ms:`, error);
            throw error;
          });
      }
      
      const duration = Date.now() - startTime;
      console.log(`[LOG] ${methodName} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[LOG] ${methodName} failed in ${duration}ms:`, error);
      throw error;
    }
  };
}