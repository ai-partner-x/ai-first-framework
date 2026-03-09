/**
 * Redis 连接配置
 *
 * 对应 Spring Boot application.properties 中的 spring.data.redis.* 配置
 */

import Redis from 'ioredis';

/** Redis 单机连接配置 */
export interface RedisStandaloneConfig {
  mode?: 'standalone';
  /** Redis 主机名，默认 '127.0.0.1' */
  host?: string;
  /** Redis 端口，默认 6379 */
  port?: number;
  /** 密码 */
  password?: string;
  /** 数据库索引，默认 0 */
  database?: number;
  /** 连接超时（毫秒），默认 10000 */
  connectTimeout?: number;
  /** 命令超时（毫秒） */
  commandTimeout?: number;
  /** 是否启用 TLS */
  tls?: boolean;
}

/** Redis Sentinel 配置（高可用） */
export interface RedisSentinelConfig {
  mode: 'sentinel';
  /** Sentinel 主节点名称 */
  masterName: string;
  /** Sentinel 节点列表 */
  sentinels: { host: string; port: number }[];
  /** 密码 */
  password?: string;
  /** 数据库索引，默认 0 */
  database?: number;
}

/** Redis Cluster 配置（集群） */
export interface RedisClusterConfig {
  mode: 'cluster';
  /** 集群节点列表 */
  nodes: { host: string; port: number }[];
  /** 密码 */
  password?: string;
}

export type RedisConfig = RedisStandaloneConfig | RedisSentinelConfig | RedisClusterConfig;

/** 全局 Redis 实例 */
let globalRedisClient: Redis | null = null;
let globalRedisConfig: RedisConfig | null = null;

/**
 * 创建 Redis 连接
 *
 * 对应 Spring Boot 中 application.properties 中的 spring.data.redis 配置
 *
 * @example
 * ```typescript
 * // 单机模式
 * await createRedisConnection({ host: 'localhost', port: 6379 });
 *
 * // 带密码
 * await createRedisConnection({ host: 'localhost', port: 6379, password: 'secret' });
 * ```
 */
export function createRedisConnection(config: RedisConfig): Redis {
  globalRedisConfig = config;

  if (config.mode === 'sentinel') {
    globalRedisClient = new Redis({
      sentinels: config.sentinels,
      name: config.masterName,
      password: config.password,
      db: config.database ?? 0,
    });
  } else if (config.mode === 'cluster') {
    // For cluster mode, use ioredis Cluster - return a compatible client
    const Cluster = Redis.Cluster;
    globalRedisClient = new Cluster(config.nodes, {
      redisOptions: { password: config.password },
    }) as unknown as Redis;
  } else {
    // Standalone (default)
    const standaloneConfig = config as RedisStandaloneConfig;
    globalRedisClient = new Redis({
      host: standaloneConfig.host ?? '127.0.0.1',
      port: standaloneConfig.port ?? 6379,
      password: standaloneConfig.password,
      db: standaloneConfig.database ?? 0,
      connectTimeout: standaloneConfig.connectTimeout ?? 10000,
      commandTimeout: standaloneConfig.commandTimeout,
      tls: standaloneConfig.tls ? {} : undefined,
      lazyConnect: true,
    });
  }

  return globalRedisClient;
}

/**
 * 获取全局 Redis 客户端
 */
export function getRedisClient(): Redis {
  if (!globalRedisClient) {
    throw new Error('[AI-First Redis] Redis not initialized. Call createRedisConnection() first.');
  }
  return globalRedisClient;
}

/**
 * 获取 Redis 配置
 */
export function getRedisConfig(): RedisConfig {
  if (!globalRedisConfig) {
    throw new Error('[AI-First Redis] Redis not configured. Call createRedisConnection() first.');
  }
  return globalRedisConfig;
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedisConnection(): Promise<void> {
  if (globalRedisClient) {
    await globalRedisClient.quit();
    globalRedisClient = null;
    globalRedisConfig = null;
  }
}

/**
 * 检查 Redis 是否已初始化
 */
export function isRedisInitialized(): boolean {
  return globalRedisClient !== null;
}
