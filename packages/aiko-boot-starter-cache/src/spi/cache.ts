/**
 * Spring Cache SPI — 缓存扩展点接口
 *
 * 参照 Spring Cache 的设计：
 *   - org.springframework.cache.Cache          → Cache
 *   - org.springframework.cache.CacheManager   → CacheManager
 *
 * 任何缓存后端（Redis、Memcached、Caffeine 等）只需实现这两个接口，
 * 然后通过 setCacheManager() 注册到全局注册表，即可被
 * @Cacheable / @CachePut / @CacheEvict 无缝驱动——无需修改业务代码。
 *
 * @example 实现自定义内存缓存后端
 * ```typescript
 * import { Cache, CacheManager, setCacheManager } from '@ai-partner-x/aiko-boot-starter-cache';
 *
 * class MapCache implements Cache {
 *   private store = new Map<string, { value: string; expiresAt?: number }>();
 *   constructor(public readonly name: string) {}
 *   getName() { return this.name; }
 *   async get(entryKey: string) {
 *     const entry = this.store.get(entryKey);
 *     if (!entry) return null;
 *     if (entry.expiresAt && Date.now() > entry.expiresAt) {
 *       this.store.delete(entryKey);
 *       return null;
 *     }
 *     return entry.value;
 *   }
 *   async put(entryKey: string, value: string, ttlSeconds?: number) {
 *     this.store.set(entryKey, {
 *       value,
 *       expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
 *     });
 *   }
 *   async evict(entryKey: string) { this.store.delete(entryKey); }
 *   async clear() { this.store.clear(); }
 * }
 *
 * class MapCacheManager implements CacheManager {
 *   private caches = new Map<string, MapCache>();
 *   getCache(name: string) {
 *     if (!this.caches.has(name)) this.caches.set(name, new MapCache(name));
 *     return this.caches.get(name)!;
 *   }
 * }
 *
 * // 在应用启动时注册：
 * setCacheManager(new MapCacheManager());
 * ```
 */

// ==================== Cache ====================

/**
 * Cache — 单个缓存命名空间的操作接口
 *
 * 对应 Spring Cache 的 `org.springframework.cache.Cache`。
 *
 * 实现时，物理存储 key 通常由 `名称::条目key` 组成，例如 Redis 实现
 * 将 `entryKey = "1"` 存储为 `user::1`。但这属于实现细节，接口本身只暴露
 * 逻辑条目 key。
 */
export interface Cache {
  /**
   * 返回缓存命名空间名称（即 @Cacheable / @CachePut / @CacheEvict 的 `key` 选项）
   *
   * 对应 Spring: `Cache.getName()`
   */
  getName(): string;

  /**
   * 根据条目 key 获取已序列化的缓存值；缓存未命中时返回 `null`。
   *
   * 对应 Spring: `Cache.get(Object key)`
   *
   * @param entryKey 条目标识符（由装饰器的 `keyGenerator` 生成）
   */
  get(entryKey: string): Promise<string | null>;

  /**
   * 将已序列化的值写入缓存。
   *
   * 对应 Spring: `Cache.put(Object key, Object value)`
   *
   * @param entryKey  条目标识符
   * @param value     已序列化的值（JSON 字符串）
   * @param ttlSeconds 可选过期时间（秒）；不传则永久缓存
   */
  put(entryKey: string, value: string, ttlSeconds?: number): Promise<void>;

  /**
   * 删除单个缓存条目。
   *
   * 对应 Spring: `Cache.evict(Object key)`
   *
   * @param entryKey 条目标识符
   */
  evict(entryKey: string): Promise<void>;

  /**
   * 清空该命名空间下的所有缓存条目。
   *
   * 对应 Spring: `Cache.clear()`
   */
  clear(): Promise<void>;
}

// ==================== CacheManager ====================

/**
 * CacheManager — 缓存管理器扩展接口
 *
 * 对应 Spring Cache 的 `org.springframework.cache.CacheManager`。
 *
 * 每种缓存后端（Redis、Memcached、Caffeine、In-Memory 等）提供一个
 * `CacheManager` 实现，并在应用启动时通过 `setCacheManager()` 注册。
 * 之后，`@Cacheable` / `@CachePut` / `@CacheEvict` 将自动通过此接口
 * 操作缓存，无需感知具体的后端技术。
 */
export interface CacheManager {
  /**
   * 根据名称获取（或创建）对应的 Cache 实例。
   *
   * 对应 Spring: `CacheManager.getCache(String name)`
   *
   * @param name 缓存命名空间名称（即 @Cacheable 的 `key` 选项）
   */
  getCache(name: string): Cache;
}
