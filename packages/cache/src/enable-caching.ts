/**
 * 缓存启动验证 — Spring Boot 风格的 Redis 连接初始化
 *
 * 提供 initializeCaching(config) 用于在应用启动阶段验证 Redis 连接，
 * 并将 RedisCacheManager 注册为全局 CacheManager，使 @Cacheable / @CachePut /
 * @CacheEvict 等注解通过 Redis 后端提供缓存服务。
 *
 * @example
 * ```typescript
 * import { createApp } from '@ai-first/nextjs';
 *
 * const app = await createApp({
 *   srcDir: import.meta.dirname,
 *   cache: {
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

// ==================== Error ====================

/**
 * 缓存初始化失败错误
 *
 * 调用 initializeCaching(config) 时，若 Redis 连接失败，则抛出此错误并阻止应用启动。
 *
 * 对应 Spring Boot 中 Redis 连接失败时的 BeanCreationException。
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
 * 初始化并验证 Redis 缓存连接（**必须**在异步启动阶段调用）
 *
 * 验证流程：
 * 1. 向 Redis 发送 PING 命令验证连接可用性（默认超时 5 秒）
 * 2. 连接成功后，创建持久化的生产客户端
 * 3. 创建 RedisCacheManager 并注册到全局 CacheManager 注册表
 *
 * 注册完成后，@Cacheable / @CachePut / @CacheEvict 将自动通过 Redis 提供缓存服务。
 * 若需切换到其他缓存后端，可在启动时调用 setCacheManager() 替换（无需修改业务代码）。
 *
 * 对应 Spring Boot 应用上下文启动时的 CacheManager Bean 初始化检查。
 * 通常由 createApp({ cache: config }) 自动调用，无需手动调用。
 *
 * @param config Redis 连接配置（对应 `spring.data.redis.*`）
 *
 * @throws {CacheInitializationError} Redis 连接失败时
 *
 * @example
 * ```typescript
 * await initializeCaching({ host: '127.0.0.1', port: 6379 });
 * ```
 */
export async function initializeCaching(config: RedisConfig): Promise<void> {
  // We use a separate, short-lived validation client (maxRetriesPerRequest: 0,
  // retryStrategy: null) so that a failing connection is detected immediately —
  // no ioredis retry spam during startup.
  const configDesc = describeConfig(config);
  const validationClient = createValidationClient(config);

  try {
    await validationClient.ping();
  } catch (error) {
    throw new CacheInitializationError(
      `[AI-First Cache] Failed to connect to Redis at ${configDesc}. ` +
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

function describeConfig(config: RedisConfig): string {
  if (config.mode === 'sentinel') {
    return `sentinel[${(config as RedisSentinelConfig).sentinels.map(s => `${s.host}:${s.port}`).join(',')}]`;
  }
  if (config.mode === 'cluster') {
    return `cluster[${(config as RedisClusterConfig).nodes.map(n => `${n.host}:${n.port}`).join(',')}]`;
  }
  const c = config as RedisStandaloneConfig;
  return `${c.host ?? '127.0.0.1'}:${c.port ?? 6379}`;
}
