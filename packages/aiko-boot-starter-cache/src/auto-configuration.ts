/**
 * Cache Auto Configuration - Spring Boot 风格自动配置
 * 
 * 根据配置文件自动初始化 Redis 缓存连接
 * 
 * @example
 * ```json
 * // app.config.json
 * {
 *   "cache": {
 *     "type": "redis",
 *     "host": "127.0.0.1",
 *     "port": 6379
 *   }
 * }
 * ```
 * 
 * @example Redis Sentinel 高可用模式
 * ```json
 * {
 *   "cache": {
 *     "type": "redis",
 *     "mode": "sentinel",
 *     "masterName": "mymaster",
 *     "sentinels": [{ "host": "127.0.0.1", "port": 26379 }]
 *   }
 * }
 * ```
 */
import 'reflect-metadata';
import {
  AutoConfiguration,
  ConfigurationProperties,
  ConditionalOnProperty,
  OnApplicationReady,
  OnApplicationShutdown,
  ConfigLoader,
} from '@ai-partner-x/aiko-boot/boot';
import { Component } from '@ai-partner-x/aiko-boot';
import { initializeCaching, CacheInitializationError } from './enable-caching.js';
import { closeRedisConnection, isRedisInitialized } from './config.js';
import { clearCacheManager } from './cache-manager-registry.js';
import type { CacheConfig } from './spi/cache-config.js';

/**
 * 缓存配置属性类
 * 
 * 对应配置文件中的 cache.* 配置
 * 
 * @example
 * ```json
 * {
 *   "cache": {
 *     "type": "redis",
 *     "host": "127.0.0.1",
 *     "port": 6379,
 *     "password": "secret",
 *     "database": 0
 *   }
 * }
 * ```
 */
@ConfigurationProperties('cache')
export class CacheProperties {
  /** 缓存后端类型，目前支持 'redis' */
  type?: 'redis';

  /** Redis 连接模式: standalone（默认）| sentinel | cluster */
  mode?: 'standalone' | 'sentinel' | 'cluster';

  // ---- 单机 / 通用 ----

  /** Redis 主机，默认 '127.0.0.1' */
  host?: string;
  /** Redis 端口，默认 6379 */
  port?: number;
  /** 连接密码 */
  password?: string;
  /** 数据库索引，默认 0 */
  database?: number;
  /** 连接超时（毫秒），默认 10000 */
  connectTimeout?: number;
  /** 命令超时（毫秒） */
  commandTimeout?: number;
  /** 是否启用 TLS */
  tls?: boolean;

  // ---- Sentinel 模式 ----

  /** Sentinel 主节点名称 */
  masterName?: string;
  /** Sentinel 节点列表 */
  sentinels?: { host: string; port: number }[];

  // ---- Cluster 模式 ----

  /** 集群节点列表 */
  nodes?: { host: string; port: number }[];
}

/**
 * Cache 自动配置类
 * 
 * 当配置了 cache.type 时自动初始化缓存连接。
 * 对应 Spring Boot 的 `spring.cache.type` 自动配置机制。
 */
@AutoConfiguration({ order: 50 })
@ConditionalOnProperty('cache.type')
@Component()
export class CacheAutoConfiguration {

  /**
   * 应用启动时初始化缓存连接
   */
  @OnApplicationReady({ order: -50 })
  async initializeCache(): Promise<void> {
    const config = this.buildCacheConfig();
    if (!config) {
      console.warn('[aiko-cache] Cache configuration incomplete, skipping initialization');
      return;
    }

    console.log(`🗄️  [aiko-cache] Initializing ${config.type} cache...`);
    try {
      await initializeCaching(config);
      console.log(`✅ [aiko-cache] Cache initialized`);
    } catch (error) {
      if (error instanceof CacheInitializationError) {
        throw error;
      }
      throw new CacheInitializationError(
        `[aiko-cache] Unexpected error during cache initialization: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  /**
   * 应用关闭时断开缓存连接
   */
  @OnApplicationShutdown({ order: 100 })
  async closeCache(): Promise<void> {
    if (isRedisInitialized()) {
      console.log('🗄️  [aiko-cache] Closing cache connection...');
      await closeRedisConnection();
      clearCacheManager();
      console.log('✅ [aiko-cache] Cache disconnected');
    }
  }

  /**
   * 从配置文件构建 CacheConfig
   */
  private buildCacheConfig(): CacheConfig | null {
    const type = ConfigLoader.get<string>('cache.type');
    if (!type) return null;

    if (type === 'redis') {
      const mode = ConfigLoader.get<string>('cache.mode', 'standalone');

      if (mode === 'sentinel') {
        const masterName = ConfigLoader.get<string>('cache.masterName');
        const sentinels = ConfigLoader.get<{ host: string; port: number }[]>('cache.sentinels');
        if (!masterName || !sentinels?.length) {
          console.warn('[aiko-cache] Sentinel mode requires masterName and sentinels');
          return null;
        }
        return {
          type: 'redis',
          mode: 'sentinel',
          masterName,
          sentinels,
          password: ConfigLoader.get<string>('cache.password'),
          database: ConfigLoader.get<number>('cache.database'),
        } as CacheConfig;
      }

      if (mode === 'cluster') {
        const nodes = ConfigLoader.get<{ host: string; port: number }[]>('cache.nodes');
        if (!nodes?.length) {
          console.warn('[aiko-cache] Cluster mode requires nodes');
          return null;
        }
        return {
          type: 'redis',
          mode: 'cluster',
          nodes,
          password: ConfigLoader.get<string>('cache.password'),
        } as CacheConfig;
      }

      // Standalone (default)
      return {
        type: 'redis',
        host: ConfigLoader.get<string>('cache.host', '127.0.0.1'),
        port: ConfigLoader.get<number>('cache.port', 6379),
        password: ConfigLoader.get<string>('cache.password'),
        database: ConfigLoader.get<number>('cache.database'),
        connectTimeout: ConfigLoader.get<number>('cache.connectTimeout'),
        commandTimeout: ConfigLoader.get<number>('cache.commandTimeout'),
        tls: ConfigLoader.get<boolean>('cache.tls'),
      } as CacheConfig;
    }

    return null;
  }
}
