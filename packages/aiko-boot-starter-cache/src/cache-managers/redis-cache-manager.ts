/**
 * RedisCacheManager — Spring Data Redis 缓存管理器
 *
 * 基于 ioredis 实现 CacheManager / Cache 接口。
 * 每个缓存命名空间（name）在 Redis 中以 `name::entryKey` 形式存储。
 *
 * 对应 Spring Data Redis 的：
 *   - org.springframework.data.redis.cache.RedisCacheManager
 *   - org.springframework.data.redis.cache.RedisCache
 *
 * @example
 * ```typescript
 * import { RedisCacheManager } from '@ai-partner-x/aiko-boot-starter-cache/redis';
 * import { setCacheManager } from '@ai-partner-x/aiko-boot-starter-cache';
 *
 * // 应用启动时：
 * const client = getRedisClient();
 * setCacheManager(new RedisCacheManager(client));
 * ```
 */

import type Redis from 'ioredis';
import type { Cache, CacheManager } from '../spi/cache.js';

// ==================== RedisCache ====================

/**
 * RedisCache — 单个缓存命名空间的 Redis 实现
 *
 * 对应 Spring Data Redis 的 `RedisCache`。
 * 物理 key 格式：`{name}::{entryKey}`（当 entryKey 为空时退化为 `{name}`）。
 */
class RedisCache implements Cache {
  constructor(
    private readonly name: string,
    private readonly client: Redis,
  ) {}

  getName(): string {
    return this.name;
  }

  private buildPhysicalKey(entryKey: string): string {
    return entryKey ? `${this.name}::${entryKey}` : this.name;
  }

  async get(entryKey: string): Promise<string | null> {
    return this.client.get(this.buildPhysicalKey(entryKey));
  }

  async put(entryKey: string, value: string, ttlSeconds?: number): Promise<void> {
    const physicalKey = this.buildPhysicalKey(entryKey);
    if (ttlSeconds !== undefined) {
      await this.client.set(physicalKey, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(physicalKey, value);
    }
  }

  async evict(entryKey: string): Promise<void> {
    await this.client.del(this.buildPhysicalKey(entryKey));
  }

  async clear(): Promise<void> {
    const pattern = `${this.name}::*`;
    // Use SCAN (cursor-based) instead of KEYS to avoid blocking Redis on large datasets.
    // SCAN is O(1) per call and iterates incrementally until cursor returns '0'.
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      // Batch deletions (≤50 keys per DEL call) to avoid oversized single requests.
      for (let i = 0; i < keys.length; i += 50) {
        await this.client.del(...keys.slice(i, i + 50));
      }
    } while (cursor !== '0');
    // Also delete the bare namespace key used when entryKey is empty (e.g. no-arg methods).
    await this.client.del(this.name);
  }
}

// ==================== RedisCacheManager ====================

/**
 * RedisCacheManager — Redis 缓存管理器
 *
 * 按需（懒加载）为每个缓存命名空间创建 RedisCache 实例并缓存复用。
 * 对应 Spring Data Redis 的 `RedisCacheManager`。
 */
export class RedisCacheManager implements CacheManager {
  private readonly caches = new Map<string, RedisCache>();

  constructor(private readonly client: Redis) {}

  getCache(name: string): Cache {
    let cache = this.caches.get(name);
    if (!cache) {
      cache = new RedisCache(name, this.client);
      this.caches.set(name, cache);
    }
    return cache;
  }
}
