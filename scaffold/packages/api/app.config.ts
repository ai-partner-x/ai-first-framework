import type { AppConfig } from '@ai-partner-x/aiko-boot';

export default {
  server: {
    port: Number(process.env.PORT) || 3001,
    servlet: {
      contextPath: '/api',
    },
    shutdown: 'graceful',
  },
  logging: {
    // 日志级别：error, warn, info, http, verbose, debug, silly
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    
    // 输出格式：json, cli, pretty, simple
    format: process.env.NODE_ENV === 'production' ? 'json' : 'cli',
    
    // 是否启用颜色
    colorize: process.env.NODE_ENV !== 'production',
    
    // 是否显示时间戳
    timestamp: true,
    
    // 默认元数据
    defaultMeta: {
      service: 'scaffold-api',
      version: '0.1.0',
      env: process.env.NODE_ENV || 'development',
    },
    
    // 传输配置
    transports: [
      {
        type: 'console',
        enabled: true,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: process.env.NODE_ENV === 'production' ? 'json' : 'cli',
        colorize: process.env.NODE_ENV !== 'production',
      },
      {
        type: 'file',
        enabled: true,
        filename: './logs/log-{date}.log',
        level: 'info',
        maxSize: '10m',
        maxFiles: 7,
        format: 'json',
        rotateByDate: true,
        retentionDays: 30,
        maxFileSize: 100,
      },
      {
        type: 'file',
        enabled: true,
        filename: './logs/error-{date}.log',
        level: 'error',
        maxSize: '10m',
        maxFiles: 30,
        format: 'json',
        rotateByDate: true,
        retentionDays: 30,
        maxFileSize: 100,
      },
    ],
  },
  
  database: {
    type: 'sqlite',
    filename: './data/app.db',
  },
  validation: {
    enabled: true,
    failFast: false,
  },
  storage: {
    provider: 'local',
    local: {
      uploadDir: './uploads',
      baseUrl: 'http://localhost:3001/api/uploads',
    },
  },

  // ========== MQ Configuration (消息队列) ==========
  // 使用内存适配器无需 RabbitMQ，设置 MQ_TYPE=memory 或使用下方配置
  mq: {
    enabled: true,
    type: 'memory' as const,
  },
} satisfies AppConfig;
