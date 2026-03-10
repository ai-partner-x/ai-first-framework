/**
 * @ai-partner-x/aiko-boot-starter-cache 类型扩展
 * 
 * 通过 module augmentation 扩展 @ai-partner-x/aiko-boot 的 AppConfig
 */

import type { CacheProperties } from './auto-configuration.js';

// 重新导出配置类型
export type { CacheProperties };

/**
 * 扩展 @ai-partner-x/aiko-boot 的 AppConfig 接口
 * 
 * 安装此包后，AppConfig 自动包含 cache 配置
 * 配置风格参考 Spring Boot: spring.cache.* / spring.data.redis.*
 */
declare module '@ai-partner-x/aiko-boot' {
  interface AppConfig {
    /** 缓存配置 (aiko-boot-starter-cache) */
    cache?: CacheProperties;
  }
}
