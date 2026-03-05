/**
 * Redis Decorators - Spring Boot 风格的缓存注解
 *
 * 提供与 Spring Cache 风格兼容的装饰器：
 * - @RedisComponent — 标记 Redis 缓存组件（兼容 @Component/@Service，自动注册到 DI 容器）
 * - @Cacheable — 缓存方法返回值，存在时直接返回缓存
 * - @CachePut — 执行方法并将返回值更新到缓存
 * - @CacheEvict — 执行方法后删除缓存
 *
 * ## 两种使用方式（等价）
 *
 * ### 方式一：@RedisComponent（专用装饰器，对标 Spring @Service）
 * ```typescript
 * import { RedisComponent, Cacheable, Autowired } from '@ai-first/cache';
 *
 * @RedisComponent()
 * class UserCacheService {
 *   @Autowired()
 *   private userRepository!: UserRepository;
 *
 *   @Cacheable({ key: 'user', ttl: 300 })
 *   async getUserById(id: number): Promise<User> {
 *     return this.userRepository.findById(id);
 *   }
 * }
 * ```
 *
 * ### 方式二：@Service / @Component（通用 DI 装饰器）
 * ```typescript
 * import { Service } from '@ai-first/core';
 * import { Cacheable, Autowired } from '@ai-first/cache';
 *
 * @Service()
 * class UserCacheService {
 *   @Autowired()
 *   private userRepository!: UserRepository;
 *
 *   // 当方法带有 @Cacheable/@CachePut/@CacheEvict 时，
 *   // 类会被自动识别为 Redis 缓存组件（等同于 @RedisComponent）
 *   @Cacheable({ key: 'user', ttl: 300 })
 *   async getUserById(id: number): Promise<User> {
 *     return this.userRepository.findById(id);
 *   }
 * }
 * ```
 */

import 'reflect-metadata';
import { Injectable, Singleton, inject, injectAutowiredProperties } from '@ai-first/di/server';
import { getRedisClient, isRedisInitialized } from './config.js';

// ==================== Metadata Keys ====================

export const REDIS_COMPONENT_METADATA = Symbol('redisComponent');
export const CACHEABLE_METADATA = Symbol('cacheable');
export const CACHE_PUT_METADATA = Symbol('cachePut');
export const CACHE_EVICT_METADATA = Symbol('cacheEvict');

// ==================== Types ====================

/** 缓存 key 生成函数，接收方法参数，返回缓存 key 字符串 */
export type CacheKeyGenerator = (...args: unknown[]) => string;

/** @RedisComponent 选项 */
export interface RedisComponentOptions {
  /** 组件名称（可选，用于日志） */
  name?: string;
}

/** @Cacheable / @CachePut 选项 */
export interface CacheableOptions {
  /**
   * 缓存 key 前缀，最终 key = `${key}::${keyGenerator 返回值}`
   *
   * 对应 Spring: @Cacheable(value = "user")
   */
  key: string;
  /**
   * 过期时间（秒），不设置则永久缓存
   * 对应 Spring: @Cacheable(value = "user", cacheManager = ...)
   */
  ttl?: number;
  /**
   * 自定义 key 生成器（接收方法参数）
   * 默认将所有参数 JSON 序列化后拼接
   *
   * 对应 Spring: @Cacheable(key = "#id")
   */
  keyGenerator?: CacheKeyGenerator;
  /**
   * 缓存条件（接收方法参数），返回 false 时不缓存
   * 对应 Spring: @Cacheable(condition = "#id > 0")
   */
  condition?: (...args: unknown[]) => boolean;
}

/** @CacheEvict 选项 */
export interface CacheEvictOptions {
  /**
   * 缓存 key 前缀
   * 对应 Spring: @CacheEvict(value = "user")
   */
  key: string;
  /**
   * 自定义 key 生成器
   */
  keyGenerator?: CacheKeyGenerator;
  /**
   * 是否清除所有以 key 开头的缓存（使用 KEYS pattern 删除）
   * 对应 Spring: @CacheEvict(allEntries = true)
   */
  allEntries?: boolean;
  /**
   * 是否在方法执行前清除缓存（默认 false，即执行后清除）
   * 对应 Spring: @CacheEvict(beforeInvocation = true)
   */
  beforeInvocation?: boolean;
}

// ==================== Helper ====================

function buildCacheKey(prefix: string, args: unknown[], keyGenerator?: CacheKeyGenerator): string {
  const suffix = keyGenerator
    ? keyGenerator(...args)
    : args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(':');
  return suffix ? `${prefix}::${suffix}` : prefix;
}

/**
 * 在目标类上自动标记 REDIS_COMPONENT_METADATA（若尚未标记）。
 *
 * 当 @Cacheable / @CachePut / @CacheEvict 被应用到方法上时调用此函数，
 * 使得只使用 @Service / @Component 作为类装饰器的缓存服务类也能被
 * getRedisComponentMetadata() 识别为 Redis 缓存组件。
 *
 * @param methodPrototype - 被装饰方法所在类的原型对象（即方法装饰器接收的 target 参数）
 */
function autoMarkRedisComponent(methodPrototype: object): void {
  const ctor = (methodPrototype as { constructor: Function }).constructor;
  if (!Reflect.hasMetadata(REDIS_COMPONENT_METADATA, ctor)) {
    Reflect.defineMetadata(REDIS_COMPONENT_METADATA, { className: ctor.name }, ctor);
  }
}

// ==================== Decorators ====================

/**
 * @RedisComponent 装饰器
 *
 * 标记该类为 Redis 缓存组件。在 Spring Boot 风格上对标 @Service / @Repository，
 * 同时自动注册到 DI 容器（Injectable + Singleton），并支持 @Autowired 属性注入。
 *
 * 效果等同于同时使用 @Service + 缓存语义标记：
 * - 自动注入构造函数参数（constructor injection）
 * - 支持 @Autowired 属性注入
 * - 注册为单例，可被其他 @Service / @Component 通过 @Autowired 注入
 *
 * @example
 * ```typescript
 * @RedisComponent({ name: 'UserCacheService' })
 * class UserCacheService {
 *   @Autowired()
 *   private userMapper!: UserMapper;
 *
 *   @Cacheable({ key: 'user', ttl: 300 })
 *   async getUserById(id: number): Promise<User> { ... }
 * }
 *
 * // 在 @Service 中注入 UserCacheService
 * @Service()
 * class UserService {
 *   @Autowired()
 *   private cacheService!: UserCacheService;
 * }
 *
 * // 通过 DI 容器解析
 * import { container } from '@ai-first/di';
 * const svc = container.resolve(UserCacheService);
 * ```
 */
export function RedisComponent(options: RedisComponentOptions = {}) {
  // Note: `any` is intentional here — TSyringe's Injectable/inject APIs require `any`-typed
  // constructors; using `unknown` breaks compatibility with tsyringe's type signatures.
  // This mirrors the same pattern used by @Service / @Component in @ai-first/core.
  return function <T extends { new (...args: any[]): any }>(target: T): T {
    // 存储 Redis 组件元数据
    Reflect.defineMetadata(REDIS_COMPONENT_METADATA, {
      ...options,
      className: target.name,
    }, target);

    // 自动注入构造函数参数（constructor injection）
    const paramTypes: unknown[] = Reflect.getMetadata('design:paramtypes', target) || [];
    paramTypes.forEach((type: unknown, index: number) => {
      // `undefined` for the property key is the TSyringe convention for constructor-parameter injection
      inject(type as Parameters<typeof inject>[0])(target, undefined as any, index);
    });

    // 注册到 DI 容器（Injectable + Singleton），与 @Service / @Component 行为一致
    Injectable()(target);
    Singleton()(target);

    // 包装构造函数，支持 @Autowired 属性注入
    // `any` here is intentional: the wrapper must be assignable to T at runtime
    const originalConstructor = target;
    const newConstructor = function (this: any, ...args: any[]) {
      const instance = new (originalConstructor as any)(...args);
      injectAutowiredProperties(instance);
      return instance;
    } as unknown as T;

    newConstructor.prototype = originalConstructor.prototype;
    Object.setPrototypeOf(newConstructor, originalConstructor);

    // 复制所有元数据（保留 @Cacheable / @CachePut / @CacheEvict 方法元数据）
    const metadataKeys: (string | symbol)[] = Reflect.getMetadataKeys(originalConstructor) as (string | symbol)[];
    metadataKeys.forEach((key: string | symbol) => {
      const value = Reflect.getMetadata(key, originalConstructor);
      Reflect.defineMetadata(key, value, newConstructor);
    });

    return newConstructor;
  };
}

/**
 * @Cacheable 装饰器
 *
 * 缓存方法返回值。调用方法前先查缓存，命中则直接返回；未命中则执行方法并将结果写入缓存。
 * 对应 Spring: @Cacheable(value = "...", key = "...")
 *
 * 可与 @RedisComponent、@Service 或 @Component 类装饰器配合使用。
 * 应用此装饰器时会自动将所在类标记为缓存组件（若尚未标记）。
 *
 * @example
 * ```typescript
 * @Cacheable({ key: 'user', ttl: 300 })
 * async getUserById(id: number): Promise<User> {
 *   return db.findUser(id);
 * }
 * ```
 */
export function Cacheable(options: CacheableOptions) {
  return function (
    methodPrototype: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    // 自动将所在类标记为缓存组件（兼容 @Service / @Component 用法）
    autoMarkRedisComponent(methodPrototype);

    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      if (!isRedisInitialized()) {
        return originalMethod.apply(this, args);
      }

      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args);
      }

      const client = getRedisClient();
      const cacheKey = buildCacheKey(options.key, args, options.keyGenerator);

      const cached = await client.get(cacheKey);
      if (cached !== null) {
        return JSON.parse(cached) as unknown;
      }

      const result = await originalMethod.apply(this, args);

      if (result !== undefined && result !== null) {
        const serialized = JSON.stringify(result);
        if (options.ttl !== undefined) {
          await client.set(cacheKey, serialized, 'EX', options.ttl);
        } else {
          await client.set(cacheKey, serialized);
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * @CachePut 装饰器
 *
 * 执行方法并将返回值更新到缓存，每次都执行方法（不跳过）。
 * 对应 Spring: @CachePut(value = "...", key = "...")
 *
 * 可与 @RedisComponent、@Service 或 @Component 类装饰器配合使用。
 * 应用此装饰器时会自动将所在类标记为缓存组件（若尚未标记）。
 *
 * @example
 * ```typescript
 * @CachePut({ key: 'user', ttl: 300 })
 * async updateUser(id: number, user: User): Promise<User> {
 *   return db.updateUser(id, user);
 * }
 * ```
 */
export function CachePut(options: CacheableOptions) {
  return function (
    methodPrototype: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    // 自动将所在类标记为缓存组件（兼容 @Service / @Component 用法）
    autoMarkRedisComponent(methodPrototype);

    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      if (!isRedisInitialized()) {
        return result;
      }

      if (options.condition && !options.condition(...args)) {
        return result;
      }

      if (result !== undefined && result !== null) {
        const client = getRedisClient();
        const cacheKey = buildCacheKey(options.key, args, options.keyGenerator);
        const serialized = JSON.stringify(result);
        if (options.ttl !== undefined) {
          await client.set(cacheKey, serialized, 'EX', options.ttl);
        } else {
          await client.set(cacheKey, serialized);
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * @CacheEvict 装饰器
 *
 * 执行方法后删除缓存（也可配置为执行前删除）。
 * 对应 Spring: @CacheEvict(value = "...", key = "...")
 *
 * 可与 @RedisComponent、@Service 或 @Component 类装饰器配合使用。
 * 应用此装饰器时会自动将所在类标记为缓存组件（若尚未标记）。
 *
 * @example
 * ```typescript
 * @CacheEvict({ key: 'user' })
 * async deleteUser(id: number): Promise<void> {
 *   await db.deleteUser(id);
 * }
 *
 * // 清除所有 user:: 开头的缓存
 * @CacheEvict({ key: 'user', allEntries: true })
 * async clearAllUsers(): Promise<void> {}
 * ```
 */
export function CacheEvict(options: CacheEvictOptions) {
  return function (
    methodPrototype: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    // 自动将所在类标记为缓存组件（兼容 @Service / @Component 用法）
    autoMarkRedisComponent(methodPrototype);

    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const evict = async () => {
        if (!isRedisInitialized()) return;

        const client = getRedisClient();

        if (options.allEntries) {
          const pattern = `${options.key}::*`;
          const keysToDelete = await client.keys(pattern);
          if (keysToDelete.length > 0) {
            await client.del(...keysToDelete);
          }
        } else {
          const cacheKey = buildCacheKey(options.key, args, options.keyGenerator);
          await client.del(cacheKey);
        }
      };

      if (options.beforeInvocation) {
        await evict();
        return originalMethod.apply(this, args);
      }

      const result = await originalMethod.apply(this, args);
      await evict();
      return result;
    };

    return descriptor;
  };
}

// ==================== Metadata Helpers ====================

/**
 * 获取 RedisComponent 元数据
 */
export function getRedisComponentMetadata(
  target: Function,
): (RedisComponentOptions & { className: string }) | undefined {
  return Reflect.getMetadata(REDIS_COMPONENT_METADATA, target) as
    | (RedisComponentOptions & { className: string })
    | undefined;
}
