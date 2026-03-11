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
} satisfies AppConfig;
