/**
 * Cache Decorators - Spring Boot 风格的缓存注解
 *
 * 提供与 Spring Cache 风格兼容的方法装饰器：
 * - @Cacheable — 缓存方法返回值，存在时直接返回缓存
 * - @CachePut — 执行方法并将返回值更新到缓存
 * - @CacheEvict — 执行方法后删除缓存
 *
 * 装饰器通过 CacheManager 接口与缓存后端解耦，
 * 后端实现（Redis、Memcached、In-Memory 等）可在应用启动时通过
 * setCacheManager() 自由切换，无需修改业务代码。
 *
 * 使用方式：在类上使用 @Service / @Component（来自 @ai-partner-x/aiko-boot），
 * 方法上使用 @Cacheable / @CachePut / @CacheEvict（来自 @ai-partner-x/aiko-boot-starter-cache）。
 *
 * @example
 * ```typescript
 * import { Service } from '@ai-partner-x/aiko-boot';
 * import { Cacheable, CachePut, CacheEvict, Autowired } from '@ai-partner-x/aiko-boot-starter-cache';
 *
 * @Service()
 * class UserCacheService {
 *   @Autowired()
 *   private userRepository!: UserRepository;
 *
 *   @Cacheable({ key: 'user', ttl: 300 })
 *   async getUserById(id: number): Promise<User> {
 *     return this.userRepository.findById(id);
 *   }
 *
 *   @CachePut({ key: 'user', ttl: 300 })
 *   async updateUser(id: number, user: User): Promise<User> {
 *     return this.userRepository.save(user);
 *   }
 *
 *   @CacheEvict({ key: 'user' })
 *   async deleteUser(id: number): Promise<void> {
 *     await this.userRepository.delete(id);
 *   }
 * }
 * ```
 */

import 'reflect-metadata';
import { getCacheManager } from './cache-manager-registry.js';

// ==================== Metadata Keys ====================

export const CACHE_COMPONENT_METADATA = Symbol('cacheComponent');
/**
 * @deprecated 请使用 CACHE_COMPONENT_METADATA。
 * 此常量是 CACHE_COMPONENT_METADATA 的别名（指向同一 Symbol 实例），
 * 保留仅为向后兼容：使用任意一个读写的元数据完全相同。
 */
export const REDIS_COMPONENT_METADATA = CACHE_COMPONENT_METADATA;
export const CACHEABLE_METADATA = Symbol('cacheable');
export const CACHE_PUT_METADATA = Symbol('cachePut');
export const CACHE_EVICT_METADATA = Symbol('cacheEvict');

// ==================== Types ====================

/** 缓存 key 生成函数，接收方法参数，返回缓存 key 字符串（支持异步） */
export type CacheKeyGenerator = (...args: unknown[]) => string | Promise<string>;

/** @Cacheable / @CachePut 选项 */
export interface CacheableOptions {
  /**
   * 缓存命名空间，对应 @Cacheable(value = "user") 中的 `value`。
   *
   * 由 CacheManager 实现决定如何映射到物理存储 key，
   * 业务代码只需关注命名空间语义，无需感知底层格式。
   */
  key: string;
  /**
   * 过期时间（秒），不设置则永久缓存
   * 对应 Spring: @Cacheable(value = "user", cacheManager = ...)
   */
  ttl?: number;
  /**
   * 自定义条目 key 生成器（接收方法参数，支持异步）
   * 默认将所有参数 JSON 序列化后拼接
   *
   * 对应 Spring: @Cacheable(key = "#id")
   */
  keyGenerator?: CacheKeyGenerator;
  /**
   * 缓存条件（接收方法参数，支持异步），返回 false 时不缓存
   * 对应 Spring: @Cacheable(condition = "#id > 0")
   */
  condition?: (...args: unknown[]) => boolean | Promise<boolean>;
}

/** @CacheEvict 选项 */
export interface CacheEvictOptions {
  /**
   * 缓存命名空间
   * 对应 Spring: @CacheEvict(value = "user")
   */
  key: string;
  /**
   * 自定义条目 key 生成器
   */
  keyGenerator?: CacheKeyGenerator;
  /**
   * 是否清空整个命名空间（即调用 Cache.clear()）
   * 对应 Spring: @CacheEvict(allEntries = true)
   */
  allEntries?: boolean;
  /**
   * 是否在方法执行前清除缓存（默认 false，即执行后清除）
   * 对应 Spring: @CacheEvict(beforeInvocation = true)
   */
  beforeInvocation?: boolean;
}

// ==================== Helpers ====================

/**
 * 根据方法参数生成条目 key 字符串。
 * 当无参数时返回空字符串，Cache 实现可将其退化为命名空间本身。
 * 支持同步和异步 keyGenerator。
 */
async function buildEntryKey(args: unknown[], keyGenerator?: CacheKeyGenerator): Promise<string> {
  if (keyGenerator) {
    return await keyGenerator(...args);
  }
  return args
    .map(a => {
      if (typeof a !== 'object' || a === null) return String(a);
      try {
        return JSON.stringify(a);
      } catch {
        return '[Unstringifiable]';
      }
    })
    .join(':');
}

/**
 * 在目标类上自动标记 CACHE_COMPONENT_METADATA（若尚未标记）。
 *
 * 当 @Cacheable / @CachePut / @CacheEvict 被应用到方法上时调用此函数，
 * 使得只使用 @Service / @Component 作为类装饰器的缓存服务类也能被
 * getCacheComponentMetadata() 识别为缓存组件。
 *
 * @param methodPrototype - 被装饰方法所在类的原型对象
 */
function autoMarkCacheComponent(methodPrototype: object): void {
  const ctor = (methodPrototype as { constructor: Function }).constructor;
  if (!Reflect.hasMetadata(CACHE_COMPONENT_METADATA, ctor)) {
    Reflect.defineMetadata(CACHE_COMPONENT_METADATA, { className: ctor.name }, ctor);
  }
}

// ==================== Decorators ====================

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
 *   return db.findUser(id);  // 缓存命中时不会执行
 * }
 * ```
 */
export function Cacheable(options: CacheableOptions) {
  return function (
    methodPrototype: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    autoMarkCacheComponent(methodPrototype);

    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const manager = getCacheManager();
      if (!manager) {
        return originalMethod.apply(this, args);
      }

      if (options.condition && !(await options.condition(...args))) {
        return originalMethod.apply(this, args);
      }

      const cache = manager.getCache(options.key);
      const entryKey = await buildEntryKey(args, options.keyGenerator);

      const cached = await cache.get(entryKey);
      if (cached !== null) {
        try {
          return JSON.parse(cached) as unknown;
        } catch {
          // 缓存数据损坏或格式不兼容，降级为直接调用原方法
          return originalMethod.apply(this, args);
        }
      }

      const result = await originalMethod.apply(this, args);

      if (result !== undefined && result !== null) {
        await cache.put(entryKey, JSON.stringify(result), options.ttl);
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
    methodPrototype: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    autoMarkCacheComponent(methodPrototype);

    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      const manager = getCacheManager();
      if (!manager) {
        return result;
      }

      if (options.condition && !(await options.condition(...args))) {
        return result;
      }

      if (result !== undefined && result !== null) {
        const cache = manager.getCache(options.key);
        const entryKey = await buildEntryKey(args, options.keyGenerator);
        await cache.put(entryKey, JSON.stringify(result), options.ttl);
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
 * // 清空整个 user 命名空间
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
    autoMarkCacheComponent(methodPrototype);

    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const evict = async () => {
        const manager = getCacheManager();
        if (!manager) return;

        const cache = manager.getCache(options.key);

        if (options.allEntries) {
          if (options.keyGenerator) {
            console.warn('@CacheEvict: allEntries=true 时 keyGenerator 将被忽略');
          }
          await cache.clear();
        } else {
          const entryKey = await buildEntryKey(args, options.keyGenerator);
          await cache.evict(entryKey);
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
 * 获取缓存组件元数据（由 @Cacheable/@CachePut/@CacheEvict 自动写入）
 */
export function getCacheComponentMetadata(
  target: Function,
): { className: string } | undefined {
  return Reflect.getMetadata(CACHE_COMPONENT_METADATA, target) as
    | { className: string }
    | undefined;
}

/**
 * @deprecated 使用 getCacheComponentMetadata，此别名保持向后兼容
 */
export const getRedisComponentMetadata = getCacheComponentMetadata;

