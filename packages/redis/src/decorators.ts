/**
 * Redis Decorators - Spring Boot 风格的缓存注解
 *
 * 提供与 Spring Cache 风格兼容的装饰器：
 * - @RedisComponent — 标记 Redis 组件类（类似 @Repository）
 * - @Cacheable — 缓存方法返回值，存在时直接返回缓存
 * - @CachePut — 执行方法并将返回值更新到缓存
 * - @CacheEvict — 执行方法后删除缓存
 *
 * @example
 * ```typescript
 * @RedisComponent()
 * class UserCacheService {
 *   @Cacheable({ key: 'user', ttl: 300 })
 *   async getUserById(id: number): Promise<User> {
 *     return db.findUser(id);
 *   }
 *
 *   @CachePut({ key: 'user' })
 *   async updateUser(id: number, user: User): Promise<User> {
 *     return db.updateUser(id, user);
 *   }
 *
 *   @CacheEvict({ key: 'user' })
 *   async deleteUser(id: number): Promise<void> {
 *     await db.deleteUser(id);
 *   }
 * }
 * ```
 */

import 'reflect-metadata';
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

// ==================== Decorators ====================

/**
 * @RedisComponent 装饰器
 *
 * 标记该类为 Redis 缓存组件，类似 Spring 中的 @Component / @Repository。
 * 主要用于文档和代码可读性，无运行时副作用。
 */
export function RedisComponent(options: RedisComponentOptions = {}) {
  return function <T extends { new (...args: unknown[]): object }>(target: T): T {
    Reflect.defineMetadata(REDIS_COMPONENT_METADATA, {
      ...options,
      className: target.name,
    }, target);
    return target;
  };
}

/**
 * @Cacheable 装饰器
 *
 * 缓存方法返回值。调用方法前先查缓存，命中则直接返回；未命中则执行方法并将结果写入缓存。
 * 对应 Spring: @Cacheable(value = "...", key = "...")
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
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
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
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
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
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
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
