/**
 * 通用缓存配置 — Spring Boot 风格的缓存后端选择
 *
 * 对应 Spring Boot `cache.type` 属性：通过 `type` 字段决定启用哪个缓存后端，
 * 具体后端配置直接内联在同一对象中，方便配置管理。
 *
 * 目前支持的后端：
 * - `'redis'` — Spring Data Redis（由 @ai-partner-x/aiko-boot-starter-cache/redis 提供）
 *
 * 未来可扩展更多后端，只需在 CacheConfig 联合类型中添加新的成员即可，
 * 无需修改 initializeCaching / @Cacheable / @CachePut / @CacheEvict 等现有代码。
 *
 * @example Redis 后端（单机）— 通过配置文件自动配置（推荐）
 * ```json
 * // app.config.json
 * {
 *   "cache": {
 *     "enabled": true,
 *     "type": "redis",
 *     "host": "127.0.0.1",
 *     "port": 6379
 *   }
 * }
 * ```
 *
 * @example Redis 后端（单机）— 编程式初始化
 * ```typescript
 * import { initializeCaching } from '@ai-partner-x/aiko-boot-starter-cache';
 *
 * await createApp({
 *   srcDir: import.meta.dirname,
 *   cache: {
 *     type: 'redis',
 *     host: process.env.REDIS_HOST ?? '127.0.0.1',
 *     port: Number(process.env.REDIS_PORT ?? 6379),
 *   },
 * });
 * ```
 *
 * @example Redis 后端（Sentinel 高可用）
 * ```typescript
 * await createApp({
 *   srcDir: import.meta.dirname,
 *   cache: {
 *     type: 'redis',
 *     mode: 'sentinel',
 *     masterName: 'mymaster',
 *     sentinels: [{ host: '127.0.0.1', port: 26379 }],
 *   },
 * });
 * ```
 *
 * @example 自定义后端（未来扩展示例）
 * ```typescript
 * import { setCacheManager } from '@ai-partner-x/aiko-boot-starter-cache';
 * import { MyCustomCacheManager } from './my-aiko-boot-starter-cache-manager';
 *
 * // 应用启动前手动注册自定义后端：
 * setCacheManager(new MyCustomCacheManager());
 * ```
 */

import type { RedisConfig } from '../config.js';

// ==================== Redis 缓存配置 ====================

/**
 * Redis 缓存后端配置
 *
 * 对应 Spring Boot：
 * ```
 * cache.type=redis
 * cache.host=127.0.0.1
 * cache.port=6379
 * ```
 *
 * `type: 'redis'` 是必填的判别字段，后续属性直接继承自 RedisConfig
 * （standalone / sentinel / cluster 模式均通过 `mode` 字段区分）。
 */
export type RedisCacheConfig = { type: 'redis' } & RedisConfig;

// ==================== CacheConfig 联合类型 ====================

/**
 * 通用缓存配置 — 通过 `type` 字段选择后端
 *
 * 对应 Spring Boot 的 `cache.type`。
 *
 * 当前支持的 type 值：
 * - `'redis'` — 使用 Redis 缓存后端（Spring Data Redis）
 *
 * 未来扩展方向（示例，暂未实现）：
 * ```typescript
 * // 内存缓存（ConcurrentMapCacheManager）
 * | { type: 'simple' }
 * // Memcached
 * | { type: 'memcached'; host: string; port: number; ... }
 * // Caffeine（in-JVM 缓存）
 * | { type: 'caffeine'; spec?: string; ... }
 * // 自定义（用户自行注册 CacheManager）
 * | { type: 'custom' }
 * ```
 *
 * 新增后端时只需：
 * 1. 将新配置类型追加到此联合类型
 * 2. 在 initializeCaching() 中添加对应 `case` 分支
 * 无需修改 @Cacheable / @CachePut / @CacheEvict 等业务注解。
 */
export type CacheConfig =
  | RedisCacheConfig;
  // 未来在此处扩展更多后端 ↓
  // | { type: 'simple' }
  // | MemcachedCacheConfig
  // | CaffeineCacheConfig
  // | { type: 'custom' }
