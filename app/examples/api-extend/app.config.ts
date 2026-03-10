import type { AppConfig } from '@ai-partner-x/aiko-boot';

/**
 * Aiko Boot 配置文件 (Spring Boot 风格)
 *
 * 演示 aiko-boot-starter-web 的 AutoConfiguration 配置能力:
 *   - server.*          ← 服务器端口、context-path
 *   - spring.servlet.multipart.*  ← 文件上传大小限制
 *   - logging.*         ← 日志级别
 */
export default {
  // ========== Server Configuration (server.*) ==========
  server: {
    port: Number(process.env.PORT) || 3003,
    servlet: {
      contextPath: '/api',  // Spring Boot: server.servlet.context-path
    },
    shutdown: 'graceful',
  },

  // ========== Logging Configuration (logging.*) ==========
  logging: {
    level: {
      root: 'debug',  // 详细日志，方便观察 @Async 后台任务输出
    },
  },

  // ========== Multipart File Upload (spring.servlet.multipart.*) ==========
  // 对应 Spring Boot: spring.servlet.multipart.max-file-size / max-request-size
  spring: {
    servlet: {
      multipart: {
        enabled: true,
        maxFileSize: '10MB',      // 单个文件最大 10 MB
        maxRequestSize: '50MB',   // 整个请求最大 50 MB
      },
    },
  },
} satisfies AppConfig;
