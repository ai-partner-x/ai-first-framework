import type { AppConfig } from '@ai-partner-x/aiko-boot';

/**
 * Aiko Boot 配置文件 (Spring Boot 风格)
 * 
 * 配置风格参考:
 * @see https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html
 */
export default {
  // ========== Server Configuration (server.*) ==========
  server: {
    port: Number(process.env.PORT) || 3001,
    servlet: {
      contextPath: '/api',  // Spring Boot: server.servlet.context-path
    },
    shutdown: 'graceful',   // Spring Boot: server.shutdown
  },

  // ========== Logging Configuration (logging.*) ==========
  logging: {
    level: {
      root: 'debug',  // Spring Boot: logging.level.root (临时开启调试)
    },
  },

  // ========== Database Configuration (spring.datasource.*) ==========
  database: {
    type: 'sqlite',
    filename: './data/app.db',
    // PostgreSQL 配置示例:
    // type: 'postgres',
    // host: process.env.DB_HOST || 'localhost',
    // port: Number(process.env.DB_PORT) || 5432,
    // user: process.env.DB_USER || 'postgres',
    // password: process.env.DB_PASSWORD || '',
    // database: process.env.DB_NAME || 'app',
  },

  // ========== Validation Configuration ==========
  validation: {
    enabled: true,
    failFast: false,
  },

  // ========== Cache Configuration (aiko-boot-starter-cache) ==========
  // 将 enabled 设为 true 并配置 Redis 地址后即可启用缓存
  // 对应 Spring Boot: spring.cache.type + spring.data.redis.*
  //
  // cache: {
  //   enabled: true,
  //   type: 'redis',
  //   host: process.env.REDIS_HOST || '127.0.0.1',
  //   port: Number(process.env.REDIS_PORT) || 6379,
  //   // password: process.env.REDIS_PASSWORD,
  //   // database: 0,
  // },

  // ========== Storage Configuration (storage.*) ==========
  // 支持 local / s3 / oss / cos 四种存储提供商
  // 默认使用本地存储，可切换到云存储
  storage: {
    provider: 'local',  // 选择存储提供商: 'local' | 's3' | 'oss' | 'cos'
    
    // 本地存储配置
    local: {
      uploadDir: './uploads',  // 本地文件上传目录
      baseUrl: 'http://localhost:3001/api/uploads',  // 文件访问基础 URL
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
