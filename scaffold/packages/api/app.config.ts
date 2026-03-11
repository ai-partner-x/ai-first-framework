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
  // ========== Cache Configuration (cache.*) ==========
  // Cache is disabled by default — no Redis connection is made until you opt in.
  // To enable: set `enabled: true`, ensure Redis is running, then adjust host/port.
  cache: {
    enabled: false,  // set to true to activate (requires Redis)
    type: 'redis',
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
  },
} satisfies AppConfig;
