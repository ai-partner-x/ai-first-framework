import type { AppConfig } from '@ai-partner-x/aiko-boot';

/**
 * Aiko Boot 配置文件 (Spring Boot 风格)
 *
 * 演示 aiko-boot-starter-web 的 AutoConfiguration 配置能力:
 *   - server.*          ← 服务器端口、context-path
 *   - spring.servlet.multipart.*  ← 文件上传大小限制
 *   - logging.*         ← 日志级别
 *   - storage.*         ← 存储服务配置（本地/S3/OSS/COS）
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
      },
    },
  },

  // ========== Storage Configuration (storage.*) ==========
  // 支持 local / s3 / oss / cos 四种存储提供商
  // 默认使用本地存储，可切换到云存储
  storage: {
    provider: 'local',  // 选择存储提供商: 'local' | 's3' | 'oss' | 'cos'
    
    // 本地存储配置
    local: {
      uploadDir: './uploads',  // 本地文件上传目录
      baseUrl: 'http://localhost:3003/api/uploads',  // 文件访问基础 URL
    },
    
    // 以下为云存储配置示例，使用时取消注释并填写真实凭证
    /*
    s3: {
      bucket: 'your-bucket-name',
      region: 'us-east-1',
      accessKeyId: 'your-access-key-id',
      secretAccessKey: 'your-secret-access-key',
      // endpoint: 'https://s3.amazonaws.com',  // 自定义 endpoint（如 MinIO）
      // forcePathStyle: false,
      // cdnBaseUrl: 'https://cdn.example.com',  // 可选：CDN 加速
      // aclEnabled: true,
    },
    
    oss: {
      bucket: 'your-bucket-name',
      region: 'cn-hangzhou',
      accessKeyId: 'your-access-key-id',
      accessKeySecret: 'your-access-key-secret',
      // customDomain: 'https://cdn.example.com',  // 可选：自定义域名
      // secure: true,  // 使用 HTTPS
    },
    
    cos: {
      bucket: 'your-bucket-name-123456',
      region: 'ap-guangzhou',
      secretId: 'your-secret-id',
      secretKey: 'your-secret-key',
      // customDomain: 'https://cdn.example.com',  // 可选：自定义域名
    },
    */
  },
} satisfies AppConfig;
