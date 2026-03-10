/**
 * CacheManager 全局注册表
 *
 * 维护当前激活的 CacheManager 实例。装饰器（@Cacheable / @CachePut / @CacheEvict）
 * 通过此注册表与后端解耦——它们只依赖 CacheManager 接口，不感知具体实现。
 *
 * 对应 Spring Boot 中 ApplicationContext 里的单例 CacheManager Bean。
 *
 * @example 注册 Redis 后端（通常由 initializeCaching() 自动完成）
 * ```typescript
 * import { setCacheManager } from '@ai-partner-x/aiko-boot-starter-cache';
 * import { RedisCacheManager, getRedisClient } from '@ai-partner-x/aiko-boot-starter-cache/redis';
 *
 * setCacheManager(new RedisCacheManager(getRedisClient()));
 * ```
 *
 * @example 注册自定义内存后端（测试用途）
 * ```typescript
 * import { setCacheManager } from '@ai-partner-x/aiko-boot-starter-cache';
 *
 * setCacheManager(new MyInMemoryCacheManager());
 * ```
 */

import type { CacheManager } from './spi/cache.js';

let activeCacheManager: CacheManager | null = null;

/**
 * 注册（激活）一个 CacheManager 实例。
 *
 * 调用后，所有通过 @Cacheable / @CachePut / @CacheEvict 修饰的方法
 * 将使用该实例操作缓存。
 *
 * 对应 Spring Boot 自动配置中注册 CacheManager Bean。
 *
 * @param manager 要激活的 CacheManager 实现
 */
export function setCacheManager(manager: CacheManager): void {
  activeCacheManager = manager;
}

/**
 * 获取当前激活的 CacheManager；未注册时返回 `null`。
 */
export function getCacheManager(): CacheManager | null {
  return activeCacheManager;
}

/**
 * 判断是否已有 CacheManager 注册。
 *
 * 装饰器用此方法决定是否跳过缓存逻辑（graceful degradation）。
 */
export function isCacheManagerInitialized(): boolean {
  return activeCacheManager !== null;
}

/**
 * 清除当前激活的 CacheManager（测试或应用关闭时使用）。
 */
export function clearCacheManager(): void {
  activeCacheManager = null;
}
