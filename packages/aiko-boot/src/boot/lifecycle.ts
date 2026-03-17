/**
 * Application Lifecycle Events - Spring Boot Style Event System
 * 
 * 支持:
 * 1. @EventListener - 事件监听器
 * 2. @OnApplicationStarting - 应用启动前
 * 3. @OnApplicationReady - 应用启动完成后
 * 4. @OnApplicationShutdown - 应用关闭时
 * 5. @Async - 异步执行
 * 6. ApplicationEventPublisher - 事件发布
 * 
 * @example
 * ```typescript
 * @Component()
 * export class MyEventListener {
 *   @OnApplicationReady()
 *   async onReady() {
 *     console.log('Application is ready!');
 *   }
 *   
 *   @EventListener(UserCreatedEvent)
 *   async onUserCreated(event: UserCreatedEvent) {
 *     await this.sendWelcomeEmail(event.user);
 *   }
 * }
 * ```
 */
import 'reflect-metadata';
import { Container } from '../di/server.js';
import type { AsyncOptions } from '../types.js';

// Metadata keys (使用字符串而非 Symbol，以便跨模块共享)
const EVENT_LISTENER_METADATA = 'aiko-boot:eventListener';
const LIFECYCLE_METADATA = 'aiko-boot:lifecycle';
const ASYNC_METADATA = 'aiko-boot:async';
// Separate key for AsyncOptions so ASYNC_METADATA remains a plain boolean flag
const ASYNC_OPTIONS_METADATA = 'aiko-boot:asyncOptions';

// 生命周期类型
export type LifecycleEvent = 
  | 'ApplicationStarting'
  | 'ApplicationStarted'
  | 'ApplicationReady'
  | 'ApplicationShutdown';

// 事件监听器定义
interface EventListenerDefinition {
  methodName: string;
  eventType: Function;
  async: boolean;
  order: number;
}

// 生命周期监听器定义
interface LifecycleListenerDefinition {
  target: Function;
  methodName: string;
  event: LifecycleEvent;
  async: boolean;
  order: number;
  className?: string; // 用于去重的类名（优先于 target.name）
}

// 使用 globalThis 存储 lifecycle 监听器，以便跨 ESM 模块实例共享
const LIFECYCLE_LISTENERS_KEY = Symbol.for('aiko-boot:lifecycleListeners');
const EVENT_LISTENERS_KEY = Symbol.for('aiko-boot:eventListeners');

function getLifecycleListenersArray(): LifecycleListenerDefinition[] {
  if (!(globalThis as any)[LIFECYCLE_LISTENERS_KEY]) {
    (globalThis as any)[LIFECYCLE_LISTENERS_KEY] = [];
  }
  return (globalThis as any)[LIFECYCLE_LISTENERS_KEY];
}

function getEventListenersMap(): Map<Function, Array<{
  target: Function;
  methodName: string;
  async: boolean;
  order: number;
}>> {
  if (!(globalThis as any)[EVENT_LISTENERS_KEY]) {
    (globalThis as any)[EVENT_LISTENERS_KEY] = new Map();
  }
  return (globalThis as any)[EVENT_LISTENERS_KEY];
}

// 已注册的生命周期监听器（使用 globalThis 存储）
const lifecycleListeners = getLifecycleListenersArray();

// 已注册的事件监听器（按事件类型分组，使用 globalThis 存储）
const eventListeners = getEventListenersMap();

/**
 * @EventListener - 监听特定事件
 * 
 * @param eventType - 要监听的事件类型
 * @param options - 配置选项
 * 
 * @example
 * ```typescript
 * @Component()
 * export class NotificationListener {
 *   @EventListener(OrderCreatedEvent)
 *   async onOrderCreated(event: OrderCreatedEvent) {
 *     await this.notifyAdmin(event);
 *   }
 * }
 * ```
 */
export function EventListener(eventType: Function, options: { order?: number } = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const { order = 0 } = options;
    const isAsync = Reflect.getMetadata(ASYNC_METADATA, target, propertyKey) || false;
    
    const listeners = Reflect.getMetadata(EVENT_LISTENER_METADATA, target.constructor) || [];
    listeners.push({
      methodName: propertyKey,
      eventType,
      async: isAsync,
      order,
    });
    Reflect.defineMetadata(EVENT_LISTENER_METADATA, listeners, target.constructor);

    // 注册到全局事件监听器
    if (!eventListeners.has(eventType)) {
      eventListeners.set(eventType, []);
    }
    eventListeners.get(eventType)!.push({
      target: target.constructor,
      methodName: propertyKey,
      async: isAsync,
      order,
    });

    return descriptor;
  };
}

/**
 * @OnApplicationStarting - 应用启动前执行
 * 
 * @example
 * ```typescript
 * @Component()
 * export class StartupValidator {
 *   @OnApplicationStarting()
 *   validateConfig() {
 *     if (!process.env.DATABASE_URL) {
 *       throw new Error('DATABASE_URL is required');
 *     }
 *   }
 * }
 * ```
 */
export function OnApplicationStarting(options: { order?: number } = {}) {
  return createLifecycleDecorator('ApplicationStarting', options);
}

/**
 * @OnApplicationStarted - 应用启动完成后立即执行
 */
export function OnApplicationStarted(options: { order?: number } = {}) {
  return createLifecycleDecorator('ApplicationStarted', options);
}

/**
 * @OnApplicationReady - 应用完全就绪后执行
 * 
 * 所有组件加载完成、所有 Bean 创建完成后触发
 * 
 * @example
 * ```typescript
 * @Component()
 * export class WarmupService {
 *   @OnApplicationReady()
 *   async warmupCache() {
 *     await this.cacheService.preload();
 *   }
 * }
 * ```
 */
export function OnApplicationReady(options: { order?: number } = {}) {
  return createLifecycleDecorator('ApplicationReady', options);
}

/**
 * @OnApplicationShutdown - 应用关闭时执行
 * 
 * @example
 * ```typescript
 * @Component()
 * export class CleanupService {
 *   @OnApplicationShutdown()
 *   async cleanup() {
 *     await this.closeConnections();
 *   }
 * }
 * ```
 */
export function OnApplicationShutdown(options: { order?: number } = {}) {
  return createLifecycleDecorator('ApplicationShutdown', options);
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
 * The decorated method returns a resolved `Promise` immediately.  The original
 * async logic is scheduled with `setImmediate` so that it runs after the current
 * event-loop tick, detached from the caller's execution path.  This mirrors Spring's
 * fire-and-forget semantics: `await`-ing the decorated method does **not** wait for
 * the background task to complete.
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
  return function <T extends (...args: any[]) => void | Promise<void>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> {
    // Store a boolean flag so lifecycle/event readers can treat it as boolean.
    Reflect.defineMetadata(ASYNC_METADATA, true, target, propertyKey);
    // Store the options object under a separate key.
    Reflect.defineMetadata(ASYNC_OPTIONS_METADATA, { ...options }, target, propertyKey);

    const original = descriptor.value!;
    descriptor.value = function (this: any, ...args: any[]) {
      const ctx = this;
      setImmediate(async () => {
        try {
          await original.apply(ctx, args);
        } catch (error) {
          const handler = options.onError ?? defaultAsyncErrorHandler;
          try {
            await handler(error, propertyKey);
          } catch (handlerError) {
            if (handler !== defaultAsyncErrorHandler) {
              try {
                await defaultAsyncErrorHandler(handlerError, propertyKey);
              } catch {
                // Swallow to ensure @Async never crashes the process
              }
            }
          }
        }
      });
      // The wrapper always returns Promise<void>; the cast is required because the
      // wrapper's return type is not directly assignable to T (which may be void or
      // Promise<void>), even though both satisfy the constraint.
      // Return a resolved Promise so callers can safely call .catch() on the result
      // without triggering a TypeError (fire-and-forget semantics are still preserved).
      return Promise.resolve();
    } as unknown as T;
    return descriptor;
  };
}

/**
 * Returns true when the given method has been decorated with @Async.
 */
export function isAsync(target: any, methodName: string): boolean {
  return Reflect.hasMetadata(ASYNC_METADATA, target, methodName);
}

/**
 * Returns the AsyncOptions recorded by @Async on the given method, or undefined.
 */
export function getAsyncOptions(target: any, methodName: string): AsyncOptions | undefined {
  return Reflect.getMetadata(ASYNC_OPTIONS_METADATA, target, methodName);
}

/**
 * 创建生命周期装饰器的工厂函数
 */
function createLifecycleDecorator(event: LifecycleEvent, options: { order?: number }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const { order = 0 } = options;
    const isAsync = Reflect.getMetadata(ASYNC_METADATA, target, propertyKey) || false;

    // 只存储元数据，不直接注册到监听器列表
    // 注册由 registerLifecycleListenersFromClass 统一处理（解决 ESM 模块实例重复问题）
    const lifecycleMeta = Reflect.getMetadata(LIFECYCLE_METADATA, target.constructor) || [];
    lifecycleMeta.push({ event, methodName: propertyKey, async: isAsync, order });
    Reflect.defineMetadata(LIFECYCLE_METADATA, lifecycleMeta, target.constructor);

    return descriptor;
  };
}

/**
 * 从类中提取并注册 lifecycle 监听器
 * 用于动态加载的模块（解决 ESM 模块实例不共享的问题）
 */
export function registerLifecycleListenersFromClass(target: Function, exportName?: string): void {
  const meta = Reflect.getMetadata(LIFECYCLE_METADATA, target);
  if (!meta || !Array.isArray(meta)) return;
  
  // 优先使用传入的 exportName，其次使用 target.name
  const className = exportName || target.name;
  
  for (const listener of meta) {
    // 检查是否已注册（使用事件+方法名+类名组合去重）
    const alreadyRegistered = lifecycleListeners.some(
      l => l.className === className && l.methodName === listener.methodName && l.event === listener.event
    );
    if (!alreadyRegistered) {
      lifecycleListeners.push({
        target,
        methodName: listener.methodName,
        event: listener.event,
        async: listener.async || false,
        order: listener.order || 0,
        className, // 存储用于去重的类名
      });
    }
  }
}

/**
 * 应用事件发布器
 */
export class ApplicationEventPublisher {
  /**
   * 发布事件
   */
  static async publish<T>(event: T): Promise<void> {
    const eventType = (event as any).constructor;
    const listeners = eventListeners.get(eventType) || [];

    // 按 order 排序
    const sorted = [...listeners].sort((a, b) => a.order - b.order);

    for (const listener of sorted) {
      try {
        const instance = Container.resolve(listener.target as any);
        const method = (instance as any)[listener.methodName];
        
        if (listener.async) {
          // 异步执行，不等待
          method.call(instance, event).catch((e: Error) => {
            console.error(`[aiko-boot] Event listener error: ${e.message}`);
          });
        } else {
          // 同步等待
          await method.call(instance, event);
        }
      } catch (e) {
        console.error(`[aiko-boot] Failed to invoke event listener: ${(e as Error).message}`);
      }
    }
  }

  /**
   * 发布同步事件（等待所有监听器完成）
   */
  static async publishSync<T>(event: T): Promise<void> {
    const eventType = (event as any).constructor;
    const listeners = eventListeners.get(eventType) || [];

    const sorted = [...listeners].sort((a, b) => a.order - b.order);

    for (const listener of sorted) {
      const instance = Container.resolve(listener.target as any);
      const method = (instance as any)[listener.methodName];
      await method.call(instance, event);
    }
  }
}

/**
 * 应用生命周期管理器
 */
export class ApplicationLifecycle {
  private static shutdownHandlers: Array<() => Promise<void>> = [];
  private static isShuttingDown = false;

  /**
   * 触发生命周期事件
   */
  static async emit(event: LifecycleEvent, verbose = true): Promise<void> {
    const listeners = lifecycleListeners
      .filter(l => l.event === event)
      .sort((a, b) => a.order - b.order);

    if (verbose) {
      console.log(`🔄 [aiko-boot] Lifecycle: ${event} (${listeners.length} listener(s))`);
    }

    for (const listener of listeners) {
      try {
        const instance = Container.resolve(listener.target as any);
        const method = (instance as any)[listener.methodName];

        if (verbose) {
          console.log(`   → ${listener.target.name}.${listener.methodName}()`);
        }

        if (listener.async) {
          method.call(instance).catch((e: Error) => {
            console.error(`[aiko-boot] Lifecycle handler error: ${e.message}`);
          });
        } else {
          await method.call(instance);
        }
      } catch (e) {
        console.error(`[aiko-boot] Failed to invoke lifecycle handler: ${(e as Error).message}`);
        throw e; // 重新抛出，让应用知道启动失败
      }
    }
  }

  /**
   * 注册关闭处理器
   */
  static registerShutdownHandler(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  /**
   * 设置 graceful shutdown
   */
  static setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(`\n⚠️  [aiko-boot] Received ${signal}, shutting down gracefully...`);

      try {
        // 触发 shutdown 生命周期事件
        await this.emit('ApplicationShutdown');

        // 执行注册的关闭处理器
        for (const handler of this.shutdownHandlers) {
          await handler();
        }

        console.log('👋 [aiko-boot] Shutdown complete');
        process.exit(0);
      } catch (e) {
        console.error('❌ [aiko-boot] Error during shutdown:', e);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * 清除所有监听器（用于测试）
   */
  static clear(): void {
    lifecycleListeners.length = 0;
    eventListeners.clear();
    this.shutdownHandlers = [];
    this.isShuttingDown = false;
  }
}

/**
 * 获取生命周期监听器元数据
 */
export function getLifecycleListeners(target: Function): Array<{
  event: LifecycleEvent;
  methodName: string;
  async: boolean;
  order: number;
}> {
  return Reflect.getMetadata(LIFECYCLE_METADATA, target) || [];
}

/**
 * 获取事件监听器元数据
 */
export function getEventListeners(target: Function): EventListenerDefinition[] {
  return Reflect.getMetadata(EVENT_LISTENER_METADATA, target) || [];
}

// ==================== 内置事件类型 ====================

/**
 * 应用启动中事件
 */
export class ApplicationStartingEvent {
  constructor(public readonly timestamp: Date = new Date()) {}
}

/**
 * 应用启动完成事件
 */
export class ApplicationStartedEvent {
  constructor(
    public readonly timestamp: Date = new Date(),
    public readonly startupTime: number = 0
  ) {}
}

/**
 * 应用就绪事件
 */
export class ApplicationReadyEvent {
  constructor(
    public readonly timestamp: Date = new Date(),
    public readonly startupTime: number = 0
  ) {}
}

/**
 * 应用关闭事件
 */
export class ApplicationShutdownEvent {
  constructor(
    public readonly timestamp: Date = new Date(),
    public readonly signal?: string
  ) {}
}
