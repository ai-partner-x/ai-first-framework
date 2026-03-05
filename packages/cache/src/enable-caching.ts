/**
 * @EnableCaching — Spring Boot 风格的缓存开关装饰器
 *
 * 提供与 Spring Boot @EnableCaching 风格兼容的缓存初始化 API：
 * - @EnableCaching  — 将 Redis 连接配置绑定到应用配置类，开启缓存功能
 * - initializeCaching() — 异步验证 Redis 连接，启动时调用；连接失败则抛出 CacheInitializationError
 * - isCachingEnabled() — 检查当前运行时是否已通过 @EnableCaching 启用缓存
 *
 * @example
 * ```typescript
 * import { EnableCaching, initializeCaching, CacheInitializationError } from '@ai-first/cache';
 *
 * // 对应 Spring Boot:
 * //   @SpringBootApplication
 * //   @EnableCaching
 * //   public class Application { ... }
 * //   # application.properties:
 * //   spring.data.redis.host=127.0.0.1
 * //   spring.data.redis.port=6379
 *
 * @EnableCaching({
 *   host: process.env.REDIS_HOST ?? '127.0.0.1',
 *   port: Number(process.env.REDIS_PORT ?? 6379),
 * })
 * class AppConfig {}
 *
 * async function main() {
 *   // 验证 Redis 配置和连接；失败时抛出 CacheInitializationError，阻止启动
 *   await initializeCaching();
 *   console.log('缓存初始化成功，应用启动');
 * }
 * ```
 */

import 'reflect-metadata';
import Redis from 'ioredis';
import {
  createRedisConnection,
  type RedisConfig,
  type RedisStandaloneConfig,
  type RedisSentinelConfig,
  type RedisClusterConfig,
} from './config.js';

// ==================== Metadata Key ====================

export const ENABLE_CACHING_METADATA = Symbol('enableCaching');

// ==================== Module-level State ====================

/** Whether @EnableCaching was applied in the current runtime */
let _cachingEnabled = false;
let _cachingConfig: RedisConfig | null = null;

// ==================== Error ====================

/**
 * 缓存初始化失败错误
 *
 * 在 @EnableCaching 应用后调用 initializeCaching() 时，
 * 若 Redis 配置缺失或连接失败，则抛出此错误并阻止应用启动。
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

// ==================== Decorator ====================

/**
 * @EnableCaching — 开启缓存注解功能
 *
 * 对标 Spring Boot 的 `@EnableCaching` + `spring.data.redis.*` 配置项，
 * 将 Redis 连接配置绑定到应用配置类，使 @Cacheable/@CachePut/@CacheEvict 生效。
 *
 * **必须**在异步启动阶段调用 `await initializeCaching()`，
 * 以主动验证 Redis 配置有效性并确认连接可用。若连接不可达，抛出 CacheInitializationError。
 *
 * @param config Redis 连接配置（对应 `spring.data.redis.*`）
 *
 * @example
 * ```typescript
 * @EnableCaching({
 *   host: process.env.REDIS_HOST ?? '127.0.0.1',
 *   port: Number(process.env.REDIS_PORT ?? 6379),
 * })
 * class AppConfig {}
 *
 * async function main() {
 *   await initializeCaching();  // 失败则抛出 CacheInitializationError
 * }
 * ```
 *
 * 对应 Java:
 * ```java
 * @SpringBootApplication
 * @EnableCaching
 * public class Application { ... }
 * // application.properties:
 * // spring.data.redis.host=127.0.0.1
 * // spring.data.redis.port=6379
 * ```
 */
export function EnableCaching(config: RedisConfig) {
  if (!config) {
    throw new CacheInitializationError(
      '[AI-First Cache] @EnableCaching requires a Redis configuration object. ' +
      'Example: @EnableCaching({ host: "127.0.0.1", port: 6379 })',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function <T extends new (...args: any[]) => any>(target: T): T {
    // Store config in class metadata for introspection / tooling
    Reflect.defineMetadata(ENABLE_CACHING_METADATA, config, target);

    // Register config globally so initializeCaching() can find it.
    // NOTE: We intentionally do NOT call createRedisConnection() here.
    // The connection is created (and validated) lazily in initializeCaching(),
    // so that the decorator remains a pure declaration with no network side effects.
    _cachingEnabled = true;
    _cachingConfig = config;

    return target;
  };
}

// ==================== Bootstrap Validation ====================

/**
 * 初始化并验证 Redis 缓存连接（**必须**在异步启动阶段调用）
 *
 * 验证流程：
 * 1. 检查 @EnableCaching 是否已应用（未应用则抛出 CacheInitializationError）
 * 2. 确认 Redis 配置已注册
 * 3. 向 Redis 发送 PING 命令验证连接可用性（默认超时 5 秒）
 *
 * 对应 Spring Boot 应用上下文启动时的 CacheManager 初始化检查。
 *
 * @throws {CacheInitializationError} 未调用 @EnableCaching、或 Redis 连接失败时
 *
 * @example
 * ```typescript
 * async function main() {
 *   await initializeCaching();  // 失败则抛出错误，阻止后续启动
 *   console.log('缓存连接就绪');
 * }
 * ```
 */
export async function initializeCaching(): Promise<void> {
  if (!_cachingEnabled) {
    throw new CacheInitializationError(
      '[AI-First Cache] @EnableCaching is not applied. ' +
      'Add @EnableCaching({ host, port, ... }) to your application configuration class ' +
      'before calling initializeCaching().',
    );
  }

  if (!_cachingConfig) {
    throw new CacheInitializationError(
      '[AI-First Cache] Redis configuration is missing. ' +
      'Provide a valid RedisConfig in @EnableCaching({ host: "127.0.0.1", port: 6379 }).',
    );
  }

  // (Re-)create the production connection AFTER validation succeeds.
  // We use a separate, short-lived validation client (maxRetriesPerRequest: 0,
  // retryStrategy: null) so that a failing connection is detected immediately —
  // no ioredis retry spam during startup.
  const configDesc = describeConfig(_cachingConfig);
  const validationClient = createValidationClient(_cachingConfig);

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
  createRedisConnection(_cachingConfig);
}

// ==================== Helpers ====================

/**
 * 检查当前运行时是否已通过 @EnableCaching 启用缓存
 */
export function isCachingEnabled(): boolean {
  return _cachingEnabled;
}

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
