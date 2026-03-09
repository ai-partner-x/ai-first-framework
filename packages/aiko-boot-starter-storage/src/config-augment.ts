/**
 * @ai-partner-x/aiko-boot-starter-storage 类型扩展
 *
 * 通过 module augmentation 扩展 @ai-partner-x/aiko-boot 的 AppConfig
 */

import type { StorageProperties } from './auto-configuration.js';

export type { StorageProperties };

export type { StorageConfig } from './config.js';

/**
 * 扩展 @ai-partner-x/aiko-boot 的 AppConfig 接口
 *
 * 安装此包后，AppConfig 自动包含 storage 配置
 */
declare module '@ai-partner-x/aiko-boot' {
  interface AppConfig {
    /** 存储配置 (aiko-boot-starter-storage) */
    storage?: StorageProperties;
  }
}
