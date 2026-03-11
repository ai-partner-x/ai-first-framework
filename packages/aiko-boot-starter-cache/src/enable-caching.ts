/**
 * 缓存启动验证 — Spring Boot 风格的缓存后端初始化
 *
 * 提供 initializeCaching(config) 用于在应用启动阶段根据 config.type 选择并初始化
 * 缓存后端，对应 Spring Boot 的 `spring.cache.type` 自动配置机制。
 *
 * 目前支持 `type: 'redis'`，后续扩展新后端只需在 switch 中添加 case 分支。
 *
 * 通常无需手动调用此函数——安装 `@ai-partner-x/aiko-boot-starter-cache` 后，
 * `CacheAutoConfiguration` 会在应用启动时自动读取 `app.config.ts`（或 `app.config.json`）
 * 中的 `cache.*` 配置并调用此函数：
 *
 * @example app.config.ts / app.config.json 中启用 Redis 缓存
 * ```json
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
 * @example 手动调用（高级用法）
 * ```typescript
 * import { initializeCaching } from '@ai-partner-x/aiko-boot-starter-cache';
 *
 * await initializeCaching({
 *   type: 'redis',
 *   host: process.env.REDIS_HOST ?? '127.0.0.1',
 *   port: Number(process.env.REDIS_PORT ?? 6379),
 * });
 * ```
 *
 * 推荐通过配置文件启用自动配置（设置 cache.enabled=true + cache.type='redis'），
 * 由 CacheAutoConfiguration 在应用启动时自动读取 cache.* 配置并调用 initializeCaching。
 */

// Type-only imports — erased at compile time, no runtime ioredis loading.
//
// `IoRedis` is the module-namespace type of ioredis, derived with `typeof
// import()`.  Indexing into it gives us the *constructor* types:
//   • IoRedis['default']  — Redis constructor  (typeof Redis, new(...) => Redis)
//   • IoRedis['Cluster']  — Cluster constructor (typeof Cluster, new(...) => Cluster)
// InstanceType<…> then gives the corresponding *instance* types.
// This avoids the anti-pattern of using `typeof` on a `import type` alias,
// which names an instance type rather than the constructor.
type IoRedis = typeof import('ioredis');
type RedisInstance = InstanceType<IoRedis['default']>;
type ClusterInstance = InstanceType<IoRedis['Cluster']>;

import type {
  RedisConfig,
  RedisStandaloneConfig,
  RedisSentinelConfig,
  RedisClusterConfig,
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
 * `spring.cache.type` 自动配置机制：
 *
 * - `'redis'` — 验证 Redis 连接（PING）后创建 RedisCacheManager 并注册
 *
 * 初始化完成后，@Cacheable / @CachePut / @CacheEvict 将自动通过所选后端提供缓存服务。
 * 通常由 CacheAutoConfiguration 在应用启动时自动调用（读取 app.config.ts / app.config.json
 * 的 `cache.*` 配置），无需手动调用。
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
 * 1. 懒加载 ioredis 和 Redis 辅助模块（仅在 'redis' 后端被请求时才执行）
 * 2. 用短生命周期客户端发 PING 验证连接（5 秒超时）
 * 3. 验证通过后创建持久客户端
 * 4. 注册 RedisCacheManager 到全局 CacheManager 注册表
 */
async function initializeRedisCaching(config: RedisConfig): Promise<void> {
  const configDesc = describeRedisConfig(config);

  // Lazy-load ioredis and Redis connection helpers only when the 'redis'
  // backend is actually requested. This prevents ioredis from being required
  // at module load time, so consumers who only use cache decorators can import
  // the package without having ioredis installed.
  const [{ default: Redis }, { createRedisConnection }] = await Promise.all([
    import('ioredis') as Promise<IoRedis>,
    import('./config.js'),
  ]);

  const validationClient = createValidationClient(Redis, config);

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
 * Accepts the Redis constructor as a parameter (lazy-loaded by the caller) to
 * avoid importing ioredis at module top-level.
 *
 * Key settings:
 * - maxRetriesPerRequest: 0  — fail-fast on command retry (no spam)
 * - retryStrategy: null      — no reconnect attempts after first failure
 * - enableOfflineQueue: false — commands fail immediately if not connected
 * - lazyConnect: true        — don't connect until first command
 * - connectTimeout: 5000     — abort if TCP handshake takes too long
 */
function createValidationClient(Redis: IoRedis['default'], config: RedisConfig): RedisInstance | ClusterInstance {
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
    // Cluster uses ioredis Cluster class — cast to the Cluster instance type
    return new Redis.Cluster(c.nodes, {
      redisOptions: {
        password: c.password,
        maxRetriesPerRequest: 0,
        connectTimeout: 5000,
      },
    }) as ClusterInstance;
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
