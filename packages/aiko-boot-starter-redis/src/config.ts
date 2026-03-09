/**
 * Redis 全局配置
 * 
 * 在 createApp 时设置 Redis 配置，RedisRepository 自动获取连接
 */

// ==================== Types ====================

/** Redis 配置 */
export interface RedisConfig {
  /** 主机地址 */
  host: string;
  /** 端口 */
  port: number;
  /** 密码 */
  password?: string;
  /** 数据库索引 */
  db?: number;
  /** 连接超时时间（毫秒） */
  timeout?: number;
}

// ==================== Global Config ====================

/** 全局 Redis 配置 */
let globalRedisConfig: RedisConfig | null = null;

/**
 * 设置全局 Redis 配置
 */
export function setRedisConfig(config: RedisConfig): void {
  globalRedisConfig = config;
}

/**
 * 获取全局 Redis 配置
 */
export function getRedisConfig(): RedisConfig | null {
  return globalRedisConfig;
}

/**
 * 检查 Redis 配置是否已设置
 */
export function isRedisConfigured(): boolean {
  return globalRedisConfig !== null;
}

// ==================== Default Config ====================

/**
 * 默认 Redis 配置
 */
export const DEFAULT_REDIS_CONFIG: RedisConfig = {
  host: 'localhost',
  port: 6379,
  db: 0,
  timeout: 30000
};