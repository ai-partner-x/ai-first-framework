/**
 * Core Domain Decorators (DDD)
 * Domain layer decorators for business logic
 * 
 * ORM decorators -> @ai-partner-x/aiko-boot-starter-orm
 * Web decorators -> @ai-partner-x/aiko-boot-starter-web
 * Validation decorators -> @ai-partner-x/aiko-boot-starter-validation
 */
import 'reflect-metadata';
import { Injectable, Singleton, inject, injectAutowiredProperties } from './di/server.js';
import type { ServiceOptions, AsyncOptions } from './types.js';

// Metadata keys (使用字符串而非 Symbol，以便跨 ESM 模块共享)
const SERVICE_METADATA = 'aiko-boot:service';
const COMPONENT_METADATA = 'aiko-boot:component';
const TRANSACTIONAL_METADATA = 'aiko-boot:transactional';
const ASYNC_METADATA = 'aiko-boot:async';

// ==================== Component Layer ====================

/**
 * @Component - 通用组件装饰器 (like Spring @Component)
 * 自动注册到 DI 容器，支持 @Autowired 属性注入
 * 
 * @example
 * @Component()
 * export class EmailHelper {
 *   sendEmail(to: string, content: string) { ... }
 * }
 */
export function Component(options: { name?: string } = {}) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    Reflect.defineMetadata(COMPONENT_METADATA, {
      ...options,
      name: options.name || target.name,
    }, target);
    
    // Auto inject constructor dependencies
    const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
    paramTypes.forEach((type: any, index: number) => {
      inject(type)(target, undefined as any, index);
    });
    
    // Apply DI decorators
    Injectable()(target);
    Singleton()(target);
    
    // 包装构造函数，支持 @Autowired 属性注入
    const originalConstructor = target;
    const newConstructor = function (this: any, ...args: any[]) {
      const instance = new (originalConstructor as any)(...args);
      injectAutowiredProperties(instance);
      return instance;
    } as unknown as T;
    
    newConstructor.prototype = originalConstructor.prototype;
    Object.setPrototypeOf(newConstructor, originalConstructor);
    
    const metadataKeys = Reflect.getMetadataKeys(originalConstructor);
    metadataKeys.forEach(key => {
      const value = Reflect.getMetadata(key, originalConstructor);
      Reflect.defineMetadata(key, value, newConstructor);
    });
    
    return newConstructor;
  };
}

// ==================== Service Layer ====================

/**
 * @Service - Mark a class as domain service (like Spring @Service)
 * Auto-registers to DI container with constructor injection and @Autowired support
 * 
 * @example
 * @Service()
 * export class UserService {
 *   @Autowired()
 *   private userMapper!: UserMapper;
 * }
 */
export function Service(options: ServiceOptions = {}) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    Reflect.defineMetadata(SERVICE_METADATA, {
      ...options,
      name: options.name || target.name,
    }, target);
    
    // Auto inject constructor dependencies
    const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
    paramTypes.forEach((type: any, index: number) => {
      inject(type)(target, undefined as any, index);
    });
    
    // Apply DI decorators
    Injectable()(target);
    Singleton()(target);
    
    // 包装构造函数，支持 @Autowired 属性注入
    const originalConstructor = target;
    const newConstructor = function (this: any, ...args: any[]) {
      const instance = new (originalConstructor as any)(...args);
      injectAutowiredProperties(instance);
      return instance;
    } as unknown as T;
    
    newConstructor.prototype = originalConstructor.prototype;
    Object.setPrototypeOf(newConstructor, originalConstructor);
    
    // 复制 metadata
    const metadataKeys = Reflect.getMetadataKeys(originalConstructor);
    metadataKeys.forEach(key => {
      const value = Reflect.getMetadata(key, originalConstructor);
      Reflect.defineMetadata(key, value, newConstructor);
    });
    
    return newConstructor;
  };
}

// ==================== Transaction ====================

/**
 * @Transactional - Mark a method as transactional (like Spring @Transactional)
 */
export function Transactional() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(TRANSACTIONAL_METADATA, true, target, propertyKey);
    
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      console.log('[Transaction] Starting transaction for ' + propertyKey);
      try {
        const result = await original.apply(this, args);
        console.log('[Transaction] Committing transaction for ' + propertyKey);
        return result;
      } catch (error) {
        console.error('[Transaction] Rolling back transaction for ' + propertyKey, error);
        throw error;
      }
    };
    return descriptor;
  };
}

// ==================== Async ====================

/**
 * Default error handler for @Async — logs the error with the method name.
 */
function defaultAsyncErrorHandler(error: unknown, methodName: string): void {
  console.error(`[Async] Unhandled error in background task "${methodName}":`, error);
}

/**
 * @Async - Execute a method as a background task (like Spring Boot @Async)
 *
 * The decorated method returns `void` immediately.  The original async logic is
 * scheduled with `setImmediate` so that it runs after the current event-loop tick,
 * detached from the caller's execution path.  This mirrors Spring's fire-and-forget
 * semantics when a `@Async` method returns `void`.
 *
 * Error handling:
 * - By default, any uncaught error is written to `console.error`.
 * - Pass `onError` in the options object to override this behavior (e.g. send to
 *   an alerting service or structured logger).
 *
 * @param options - Optional configuration
 *
 * @example
 * // Fire-and-forget email notification
 * @Service()
 * export class NotificationService {
 *   @Async()
 *   async sendWelcomeEmail(userId: number): Promise<void> {
 *     // runs in background — caller is NOT blocked
 *     await this.mailer.send(userId);
 *   }
 * }
 *
 * @example
 * // Custom error handler
 * @Async({ onError: (err, method) => logger.error({ method, err }) })
 * async heavyReport(): Promise<void> { ... }
 */
export function Async(options: AsyncOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(ASYNC_METADATA, { ...options }, target, propertyKey);

    const original = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      const ctx = this;
      setImmediate(async () => {
        try {
          await original.apply(ctx, args);
        } catch (error) {
          const handler = options.onError ?? defaultAsyncErrorHandler;
          handler(error, propertyKey);
        }
      });
      // Return void immediately — fire-and-forget
    };
    return descriptor;
  };
}

// ==================== Metadata Getters ====================

export function getComponentMetadata(target: any): { name?: string } | undefined {
  return Reflect.getMetadata(COMPONENT_METADATA, target);
}

export function getServiceMetadata(target: any): ServiceOptions | undefined {
  return Reflect.getMetadata(SERVICE_METADATA, target);
}

export function isTransactional(target: any, methodName: string): boolean {
  return Reflect.getMetadata(TRANSACTIONAL_METADATA, target, methodName) || false;
}

export function isAsync(target: any, methodName: string): boolean {
  return Reflect.hasMetadata(ASYNC_METADATA, target, methodName);
}

export function getAsyncOptions(target: any, methodName: string): AsyncOptions | undefined {
  return Reflect.getMetadata(ASYNC_METADATA, target, methodName);
}
