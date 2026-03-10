/**
 * @ai-partner-x/aiko-boot-starter-cache/redis — Spring Data Redis 数据层
 *
 * 对标 Spring Data Redis，提供 Redis 连接管理与数据访问 API：
 * - RedisConfig / createRedisConnection — 连接配置与管理
 * - RedisTemplate / StringRedisTemplate — Spring 风格的 Redis 操作模板
 * - opsForValue / opsForList / opsForHash / opsForSet / opsForZSet — 操作工厂方法
 * - IORedisAdapter — 底层 ioredis 适配器
 *
 * 对应 Spring 中:
 * ```
 * import org.springframework.data.redis.core.RedisTemplate;
 * import org.springframework.data.redis.core.StringRedisTemplate;
 * ```
 *
 * @example
 * ```typescript
 * import { RedisTemplate, StringRedisTemplate, getRedisClient } from '@ai-partner-x/aiko-boot-starter-cache/redis';
 *
 * // 通过 createApp 初始化连接后，直接获取客户端构建模板
 * const client = getRedisClient();
 * const redisTemplate = new RedisTemplate<string, unknown>({ client });
 * const stringTemplate = new StringRedisTemplate({ client });
 *
 * await redisTemplate.opsForValue().set('key', { name: '张三' }, 3600);
 * const val = await redisTemplate.opsForValue().get('key'); // { name: '张三' }
 * ```
 */

// ==================== RedisCacheManager ====================
export { RedisCacheManager } from './cache-managers/redis-cache-manager.js';

// ==================== Connection / Config ====================
export {
  createRedisConnection,
  getRedisClient,
  getRedisConfig,
  closeRedisConnection,
  isRedisInitialized,
  type RedisConfig,
  type RedisStandaloneConfig,
  type RedisSentinelConfig,
  type RedisClusterConfig,
} from './config.js';

// ==================== RedisTemplate ====================
export {
  RedisTemplate,
  StringRedisTemplate,
  type RedisTemplateOptions,
} from './redis-template.js';

// ==================== Operations ====================
export type { ValueOperations } from './operations/value-operations.js';
export type { ListOperations } from './operations/list-operations.js';
export type { HashOperations } from './operations/hash-operations.js';
export type { SetOperations } from './operations/set-operations.js';
export type { ZSetOperations, TypedTuple } from './operations/zset-operations.js';

// ==================== Adapters ====================
export {
  IORedisAdapter,
  type IORedisAdapterOptions,
  type RedisSerializer,
} from './adapters/index.js';
