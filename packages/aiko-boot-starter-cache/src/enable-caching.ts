/**
 * 缓存启动验证 — Spring Boot 风格的缓存后端初始化
 *
 * 提供 initializeCaching(config) 用于在应用启动阶段根据 config.type 选择并初始化
 * 缓存后端，对应 Spring Boot 的 `cache.type` 自动配置机制。
 *
 * 目前支持 `type: 'redis'`，后续扩展新后端只需在 switch 中添加 case 分支。
 *
 * @example Redis 后端
 * ```typescript
 * import { createApp } from '@ai-partner-x/aiko-boot';
 *
 * const app = await createApp({
 *   srcDir: import.meta.dirname,
 *   cache: {
 *     type: 'redis',
 *     host: process.env.REDIS_HOST ?? '127.0.0.1',
 *     port: Number(process.env.REDIS_PORT ?? 6379),
 *   },
 * });
 * ```
 */

import Redis from 'ioredis';
import {
  createRedisConnection,
  type RedisConfig,
  type RedisStandaloneConfig,
  type RedisSentinelConfig,
  type RedisClusterConfig,
} from './config.js';
import { RedisCacheManager } from './cache-managers/redis-cache-manager.js';
import { setCacheManager } from './cache-manager-registry.js';
import type { CacheConfig } from './spi/cache-config.js';

// ==================== Error ====================

/**
 * 缓存初始化失败错误
 *
 * 调用 initializeCaching(config) 时，若后端连接失败，则抛出此错误并阻止应用启动。
 *
 * 对应 Spring Boot 中 CacheManager Bean 创建失败时的 BeanCreationException。
 */
export class CacheInitializationError extends Error {
  override readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'CacheInitializationError';
    this.cause = cause;
  }
}

// ==================== Bootstrap Validation ====================

/**
 * 初始化并验证缓存后端（**必须**在异步启动阶段调用）
 *
 * 根据 `config.type` 自动选择对应的缓存后端，对应 Spring Boot 的
 * `cache.type` 自动配置机制：
 *
 * - `'redis'` — 验证 Redis 连接（PING）后创建 RedisCacheManager 并注册
 *
 * 初始化完成后，@Cacheable / @CachePut / @CacheEvict 将自动通过所选后端提供缓存服务。
 * 通常由 createApp({ cache: config }) 自动调用，无需手动调用。
 *
 * @param config 缓存后端配置（type 字段决定使用哪个后端）
 *
 * @throws {CacheInitializationError} 后端连接失败时
 *
 * @example
 * ```typescript
 * await initializeCaching({ type: 'redis', host: '127.0.0.1', port: 6379 });
 * ```
 */
export async function initializeCaching(config: CacheConfig): Promise<void> {
  switch (config.type) {
    case 'redis': {
      // Strip the `type` discriminant to get a plain RedisConfig.
      // The extra `type` property is ignored by ioredis and our Redis helpers.
      const { type: _cacheType, ...redisConfig } = config;
      await initializeRedisCaching(redisConfig as RedisConfig);
      break;
    }

    // Future backends — add new case branches here:
    // case 'simple': {
    //   setCacheManager(new SimpleCacheManager());
    //   break;
    // }
    // case 'memcached': { ... }

    default: {
      throw new CacheInitializationError(
        `[Aiko Boot Starter Cache] Unknown cache type: "${(config as { type: string }).type}". ` +
        `Supported types: 'redis'.`,
      );
    }
  }
}

// ==================== Redis backend init ====================

/**
 * 初始化 Redis 缓存后端
 *
 * 1. 用短生命周期客户端发 PING 验证连接（5 秒超时）
 * 2. 验证通过后创建持久客户端
 * 3. 注册 RedisCacheManager 到全局 CacheManager 注册表
 */
async function initializeRedisCaching(config: RedisConfig): Promise<void> {
  const configDesc = describeRedisConfig(config);
  const validationClient = createValidationClient(config);

  try {
    await validationClient.connect();
    await validationClient.ping();
  } catch (error) {
    throw new CacheInitializationError(
      `[Aiko Boot Starter Cache] Failed to connect to Redis at ${configDesc}. ` +
      `Ensure Redis is running and the configuration is correct. ` +
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  } finally {
    // Always disconnect the temporary validation client.
    try { validationClient.disconnect(); } catch { /* best-effort */ }
  }

  // Validation passed — set up the persistent production client.
  const client = createRedisConnection(config);

  // Register RedisCacheManager as the global CacheManager.
  // From this point, @Cacheable / @CachePut / @CacheEvict use Redis.
  setCacheManager(new RedisCacheManager(client));
}

// ==================== Helpers ====================

/**
 * Create a short-lived Redis client intended only for connection validation.
 *
 * Key settings:
 * - maxRetriesPerRequest: 0  — fail-fast on command retry (no spam)
 * - retryStrategy: null      — no reconnect attempts after first failure
 * - enableOfflineQueue: false — commands fail immediately if not connected
 * - lazyConnect: true        — don't connect until first command
 * - connectTimeout: 5000     — abort if TCP handshake takes too long
 */
function createValidationClient(config: RedisConfig): Redis {
  if (config.mode === 'sentinel') {
    const c = config as RedisSentinelConfig;
    return new Redis({
      sentinels: c.sentinels,
      name: c.masterName,
      password: c.password,
      db: c.database ?? 0,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,   // null = stop retrying (ioredis API)
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 5000,
    });
  }

  if (config.mode === 'cluster') {
    const c = config as RedisClusterConfig;
    // Cluster uses ioredis Cluster class — cast to Redis for the return type
    return new Redis.Cluster(c.nodes, {
      redisOptions: {
        password: c.password,
        maxRetriesPerRequest: 0,
        connectTimeout: 5000,
      },
    }) as unknown as Redis;
  }

  // Standalone (default)
  const c = config as RedisStandaloneConfig;
  return new Redis({
    host: c.host ?? '127.0.0.1',
    port: c.port ?? 6379,
    password: c.password,
    db: c.database ?? 0,
    tls: c.tls ? {} : undefined,
    lazyConnect: true,
    connectTimeout: c.connectTimeout ?? 5000,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,   // null = stop retrying (ioredis API)
    enableOfflineQueue: false,
  });
}

function describeRedisConfig(config: RedisConfig): string {
  if (config.mode === 'sentinel') {
    return `sentinel[${(config as RedisSentinelConfig).sentinels.map(s => `${s.host}:${s.port}`).join(',')}]`;
  }
  if (config.mode === 'cluster') {
    return `cluster[${(config as RedisClusterConfig).nodes.map(n => `${n.host}:${n.port}`).join(',')}]`;
  }
  const c = config as RedisStandaloneConfig;
  return `${c.host ?? '127.0.0.1'}:${c.port ?? 6379}`;
}
