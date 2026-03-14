/**
 * @ai-partner-x/aiko-boot-starter-web 类型扩展
 * 
 * 通过 module augmentation 扩展 @ai-partner-x/aiko-boot 的 AppConfig
 */

import type { ServerProperties, ServletProperties, MultipartProperties } from './auto-configuration.js';

// 重新导出配置类型
export type { ServerProperties, ServletProperties, MultipartProperties };

/**
 * 扩展 @ai-partner-x/aiko-boot 的 AppConfig 接口
 * 
 * 安装此包后，AppConfig 自动包含 server 和 spring.servlet 配置
 * 配置风格参考 Spring Boot: https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html
 */
declare module '@ai-partner-x/aiko-boot' {
  interface AppConfig {
    /** 
     * 服务器配置 (Spring Boot 风格)
     * @see https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#appendix.application-properties.server
     */
    server?: ServerProperties;

    /**
     * Spring 配置
     * @see https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#appendix.application-properties.web
     */
    spring?: {
      servlet?: {
        /**
         * 文件上传配置 (Spring Boot: spring.servlet.multipart.*)
         */
        multipart?: MultipartProperties;
      };
    };
  }
}
