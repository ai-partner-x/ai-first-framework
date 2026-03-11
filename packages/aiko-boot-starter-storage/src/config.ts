/**
 * @ai-partner-x/aiko-boot-starter-storage
 * 全局存储配置管理
 *
 * 对齐 aiko-boot-starter-orm 的 setDatabaseConfig / getDatabaseConfig 风格
 */
import { StorageError, type IStorageAdapter } from './types.js';
import type { LocalStorageConfig } from './adapters/local.js';
import type { S3StorageConfig } from './adapters/s3.js';
import type { OssStorageConfig } from './adapters/oss.js';
import type { CosStorageConfig } from './adapters/cos.js';

export type { LocalStorageConfig } from './adapters/local.js';
export type { S3StorageConfig } from './adapters/s3.js';
export type { OssStorageConfig } from './adapters/oss.js';
export type { CosStorageConfig } from './adapters/cos.js';

/** 全局存储配置 */
export interface StorageConfig {
  /** 当前使用的存储提供商 */
  provider: 'local' | 's3' | 'oss' | 'cos';
  /** 本地磁盘配置（provider = 'local' 时必填） */
  local?: LocalStorageConfig;
  /** S3 配置（provider = 's3' 时必填） */
  s3?: S3StorageConfig;
  /** 阿里云 OSS 配置（provider = 'oss' 时必填） */
  oss?: OssStorageConfig;
  /** 腾讯云 COS 配置（provider = 'cos' 时必填） */
  cos?: CosStorageConfig;
}

let _config: StorageConfig | null = null;

function validateStorageConfig(config: StorageConfig): void {
  switch (config.provider) {
    case 'local':
      if (!config.local) throw new StorageError('provider=local 时必须提供 local 配置', 'INVALID_CONFIG');
      return;
    case 's3':
      if (!config.s3) throw new StorageError('provider=s3 时必须提供 s3 配置', 'INVALID_CONFIG');
      return;
    case 'oss':
      if (!config.oss) throw new StorageError('provider=oss 时必须提供 oss 配置', 'INVALID_CONFIG');
      return;
    case 'cos':
      if (!config.cos) throw new StorageError('provider=cos 时必须提供 cos 配置', 'INVALID_CONFIG');
      return;
    default:
      throw new StorageError(`不支持的存储提供商: ${(config as StorageConfig).provider}`, 'INVALID_CONFIG');
  }
}

/**
 * 设置全局存储配置
 *
 * @example
 * // 本地磁盘
 * setStorageConfig({
 *   provider: 'local',
 *   local: { uploadDir: '/var/uploads', baseUrl: 'http://localhost:3000/uploads' },
 * });
 *
 * @example
 * // S3
 * setStorageConfig({
 *   provider: 's3',
 *   s3: { bucket: 'my-bucket', region: 'us-east-1', accessKeyId: '...', secretAccessKey: '...' },
 * });
 */
export function setStorageConfig(config: StorageConfig): void {
  validateStorageConfig(config);
  _config = config;
}

/**
 * 获取全局存储配置
 * @throws StorageError 如果未调用 setStorageConfig 初始化
 */
export function getStorageConfig(): StorageConfig {
  if (!_config) {
    throw new StorageError('存储配置未初始化，请先调用 setStorageConfig()', 'CONFIG_MISSING');
  }
  return _config;
}

/**
 * 根据当前全局配置自动创建对应的存储适配器
 * @throws StorageError 如果配置缺失或 provider 不支持
 */
export async function createAdapterFromConfig(): Promise<IStorageAdapter> {
  const config = getStorageConfig();
  switch (config.provider) {
    case 'local': {
      if (!config.local) {
        throw new StorageError('local 配置缺失', 'CONFIG_MISSING');
      }
      const { LocalStorageAdapter } = await import('./adapters/local.js');
      return new LocalStorageAdapter(config.local);
    }
    case 's3': {
      if (!config.s3) {
        throw new StorageError('s3 配置缺失', 'CONFIG_MISSING');
      }
      const { S3StorageAdapter } = await import('./adapters/s3.js');
      return new S3StorageAdapter(config.s3);
    }
    case 'oss': {
      if (!config.oss) {
        throw new StorageError('oss 配置缺失', 'CONFIG_MISSING');
      }
      const { OssStorageAdapter } = await import('./adapters/oss.js');
      return new OssStorageAdapter(config.oss);
    }
    case 'cos': {
      if (!config.cos) {
        throw new StorageError('cos 配置缺失', 'CONFIG_MISSING');
      }
      const { CosStorageAdapter } = await import('./adapters/cos.js');
      return new CosStorageAdapter(config.cos);
    }
    default: {
      throw new StorageError(
        `不支持的存储提供商: ${(config as StorageConfig).provider}`,
        'ADAPTER_NOT_FOUND',
      );
    }
  }
}

/**
 * 判断存储配置是否已初始化
 */
export function isStorageInitialized(): boolean {
  return _config !== null;
}

/**
 * 重置全局存储配置（主要用于测试场景）
 */
export function resetStorageConfig(): void {
  _config = null;
}
