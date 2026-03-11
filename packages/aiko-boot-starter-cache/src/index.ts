/**
 * @ai-partner-x/aiko-boot-starter-cache — Spring Cache 缓存抽象层
 *
 * 对标 Spring Cache，提供统一的缓存抽象与注解：
 * - @Cacheable — 缓存方法返回值（读通缓存）
 * - @CachePut  — 执行方法并更新缓存（写通缓存）
 * - @CacheEvict — 清除缓存
 * - initializeCaching(config) — 启动时验证 Redis 连接并注册 RedisCacheManager
 * - CacheAutoConfiguration — Spring Boot 风格自动配置（@AutoConfiguration）
 *
 * 扩展接口（CacheManager SPI）供自定义后端使用：
 * - Cache / CacheManager — 缓存后端扩展接口
 * - setCacheManager() — 注册自定义缓存后端
 * - getCacheManager() — 获取当前激活的后端
 *
 * Redis 连接管理与 RedisTemplate 等数据访问 API 位于：
 * @see @ai-partner-x/aiko-boot-starter-cache/redis
 *
 * 对应 Spring 中:
 * ```
 * import org.springframework.cache.annotation.Cacheable;
 * import org.springframework.cache.annotation.CachePut;
 * import org.springframework.cache.annotation.CacheEvict;
 * import org.springframework.cache.CacheManager;
 * ```
 */

// ==================== Cache SPI (扩展点) ====================
// 实现自定义缓存后端时，需实现 Cache + CacheManager 接口，
// 并在启动时通过 setCacheManager() 注册。
export type { Cache, CacheManager } from './spi/cache.js';

// ==================== Cache Config (后端选择) ====================
// CacheConfig 是传递给 initializeCaching(config) 的通用缓存配置类型；
// 通过 type 字段（如 'redis'）决定初始化哪个后端。
// 自动配置路径（推荐）：在配置文件中设置 cache.enabled=true + cache.type='redis'，
// 由 CacheAutoConfiguration 读取 cache.* 配置并自动调用 initializeCaching。
export type { CacheConfig, RedisCacheConfig } from './spi/cache-config.js';

export {
  setCacheManager,
  getCacheManager,
  isCacheManagerInitialized,
  clearCacheManager,
} from './cache-manager-registry.js';

// ==================== Cache Decorators (Spring Cache) ====================
export {
  Cacheable,
  CachePut,
  CacheEvict,
  getCacheComponentMetadata,
  getRedisComponentMetadata,
  CACHE_COMPONENT_METADATA,
  REDIS_COMPONENT_METADATA,
  CACHEABLE_METADATA,
  CACHE_PUT_METADATA,
  CACHE_EVICT_METADATA,
  type CacheableOptions,
  type CacheEvictOptions,
  type CacheKeyGenerator,
} from './decorators.js';

// ==================== Startup Validation ====================
export {
  initializeCaching,
  CacheInitializationError,
} from './enable-caching.js';

// ==================== Auto Configuration (Spring Boot 风格) ====================
// CacheAutoConfiguration 在 createApp() 启动阶段自动初始化缓存连接
export {
  CacheAutoConfiguration,
  CacheProperties,
} from './auto-configuration.js';

// ==================== Config Augmentation (扩展 @ai-partner-x/aiko-boot 的 AppConfig) ====================
import './config-augment.js';

// ==================== DI convenience re-export ====================
// 配合 @Cacheable/@CachePut/@CacheEvict 服务类中的 @Autowired 属性注入使用
export { Autowired } from '@ai-partner-x/aiko-boot';
