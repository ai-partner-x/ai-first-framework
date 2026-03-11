/**
 * Storage Auto Configuration - Spring Boot 风格自动配置
 *
 * 根据配置文件自动初始化存储服务
 *
 * @example
 * ```json
 * // app.config.json
 * {
 *   "storage": {
 *     "provider": "local",
 *     "local": {
 *       "uploadDir": "./uploads",
 *       "baseUrl": "http://localhost:3000/uploads"
 *     }
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
import { setStorageConfig, resetStorageConfig, type StorageConfig } from './config.js';
import type { LocalStorageConfig } from './adapters/local.js';
import type { S3StorageConfig } from './adapters/s3.js';
import type { OssStorageConfig } from './adapters/oss.js';
import type { CosStorageConfig } from './adapters/cos.js';
import { STORAGE_INIT_ORDER, STORAGE_SHUTDOWN_ORDER } from './lifecycle-order.js';

/**
 * 存储配置属性类
 *
 * 对应配置文件中的 storage.* 配置
 */
@ConfigurationProperties('storage')
export class StorageProperties {
  /** 存储提供商: local | s3 | oss | cos */
  provider?: 'local' | 's3' | 'oss' | 'cos';

  /** 本地磁盘存储配置 */
  local?: LocalStorageConfig;

  /** AWS S3 / MinIO / Cloudflare R2 兼容存储配置 */
  s3?: S3StorageConfig;

  /** 阿里云 OSS 存储配置 */
  oss?: OssStorageConfig;

  /** 腾讯云 COS 存储配置 */
  cos?: CosStorageConfig;
}

/**
 * Storage 自动配置类
 *
 * 当配置了 storage.provider 时自动初始化存储服务
 */
@AutoConfiguration({ order: 20 })
@ConditionalOnProperty('storage.provider')
@Component()
export class StorageAutoConfiguration {
  /**
   * 应用启动时初始化存储服务
   */
  @OnApplicationReady({ order: STORAGE_INIT_ORDER })
  async initializeStorage(): Promise<void> {
    const config = this.buildStorageConfig();
    if (!config) {
      console.warn('[aiko-storage] Storage configuration incomplete, skipping initialization');
      return;
    }

    console.log(`📦 [aiko-storage] Initializing ${config.provider} storage...`);
    setStorageConfig(config);
    console.log(`✅ [aiko-storage] Storage service ready`);
  }

  /**
   * 应用关闭时重置存储配置
   */
  @OnApplicationShutdown({ order: STORAGE_SHUTDOWN_ORDER })
  async closeStorage(): Promise<void> {
    console.log('📦 [aiko-storage] Resetting storage configuration...');
    resetStorageConfig();
    console.log('✅ [aiko-storage] Storage service stopped');
  }

  /**
   * 从配置构建存储配置
   */
  private buildStorageConfig(): StorageConfig | null {
    const provider = ConfigLoader.get<string>('storage.provider') as StorageConfig['provider'];

    if (!provider) return null;

    switch (provider) {
      case 'local': {
        const uploadDir = ConfigLoader.get<string>('storage.local.uploadDir');
        const baseUrl = ConfigLoader.get<string>('storage.local.baseUrl');
        if (!uploadDir || !baseUrl) return null;
        return { provider, local: { uploadDir, baseUrl } };
      }

      case 's3': {
        const bucket = ConfigLoader.get<string>('storage.s3.bucket');
        const region = ConfigLoader.get<string>('storage.s3.region');
        const accessKeyId = ConfigLoader.get<string>('storage.s3.accessKeyId');
        const secretAccessKey = ConfigLoader.get<string>('storage.s3.secretAccessKey');
        if (!bucket || !region || !accessKeyId || !secretAccessKey) return null;
        return {
          provider,
          s3: {
            bucket,
            region,
            accessKeyId,
            secretAccessKey,
            endpoint: ConfigLoader.get<string>('storage.s3.endpoint'),
            forcePathStyle: ConfigLoader.get<boolean>('storage.s3.forcePathStyle'),
            cdnBaseUrl: ConfigLoader.get<string>('storage.s3.cdnBaseUrl'),
            aclEnabled: ConfigLoader.get<boolean>('storage.s3.aclEnabled'),
          },
        };
      }

      case 'oss': {
        const bucket = ConfigLoader.get<string>('storage.oss.bucket');
        const region = ConfigLoader.get<string>('storage.oss.region');
        const accessKeyId = ConfigLoader.get<string>('storage.oss.accessKeyId');
        const accessKeySecret = ConfigLoader.get<string>('storage.oss.accessKeySecret');
        if (!bucket || !region || !accessKeyId || !accessKeySecret) return null;
        return {
          provider,
          oss: {
            bucket,
            region,
            accessKeyId,
            accessKeySecret,
            customDomain: ConfigLoader.get<string>('storage.oss.customDomain'),
            secure: ConfigLoader.get<boolean>('storage.oss.secure'),
          },
        };
      }

      case 'cos': {
        const bucket = ConfigLoader.get<string>('storage.cos.bucket');
        const region = ConfigLoader.get<string>('storage.cos.region');
        const secretId = ConfigLoader.get<string>('storage.cos.secretId');
        const secretKey = ConfigLoader.get<string>('storage.cos.secretKey');
        if (!bucket || !region || !secretId || !secretKey) return null;
        return {
          provider,
          cos: {
            bucket,
            region,
            secretId,
            secretKey,
            customDomain: ConfigLoader.get<string>('storage.cos.customDomain'),
          },
        };
      }

      default:
        return null;
    }
  }
}
