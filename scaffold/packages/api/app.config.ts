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
    level: {
      root: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
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
