/**
 * @ai-first/redis
 *
 * Redis framework with Spring Boot compatible decorators
 */

// Config
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

// RedisTemplate
export {
  RedisTemplate,
  StringRedisTemplate,
  type RedisTemplateOptions,
} from './redis-template.js';

// Decorators
export {
  RedisComponent,
  Cacheable,
  CachePut,
  CacheEvict,
  getRedisComponentMetadata,
  REDIS_COMPONENT_METADATA,
  CACHEABLE_METADATA,
  CACHE_PUT_METADATA,
  CACHE_EVICT_METADATA,
  type RedisComponentOptions,
  type CacheableOptions,
  type CacheEvictOptions,
  type CacheKeyGenerator,
} from './decorators.js';

// Operations
export type { ValueOperations } from './operations/value-operations.js';
export type { ListOperations } from './operations/list-operations.js';
export type { HashOperations } from './operations/hash-operations.js';
export type { SetOperations } from './operations/set-operations.js';
export type { ZSetOperations, TypedTuple } from './operations/zset-operations.js';

// Adapters
export { IORedisAdapter, type IORedisAdapterOptions, type RedisSerializer } from './adapters/index.js';
