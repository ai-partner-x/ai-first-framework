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
  security: {
    enabled: true,
    jwt: {
      secret: process.env.JWT_SECRET || (() => {
        console.warn('⚠️ Using default JWT secret in development! Please set JWT_SECRET environment variable in production.');
        return 'aiko-boot-admin-secret-2025-develop-change'; // 使用有效的JWT secret字符串
      })(),
      expiresIn: '2h',
    },
    session: {
      secret: process.env.SESSION_SECRET || (() => {
        console.warn('⚠️ Using default session secret in development! Please set SESSION_SECRET environment variable in production.');
        return 'dev-only-session-secret';
      })(),
      maxAge: 86400000,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 86400000,
      },
    },
    oauth2: {
      github: {
        clientID: process.env.GITHUB_CLIENT_ID || (() => {
          console.warn('⚠️ Using default GitHub client ID in development!');
          return 'your-github-client-id';
        })(),
        clientSecret: process.env.GITHUB_CLIENT_SECRET || (() => {
          console.warn('⚠️ Using default GitHub client secret in development!');
          return 'your-github-client-secret';
        })(),
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
      },
      google: {
        clientID: process.env.GOOGLE_CLIENT_ID || (() => {
          console.warn('⚠️ Using default Google client ID in development!');
          return 'your-google-client-id';
        })(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || (() => {
          console.warn('⚠️ Using default Google client secret in development!');
          return 'your-google-client-secret';
        })(),
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
      },
    },
    publicPaths: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/current',
      '/api/auth/info',
      '/api/auth/github',
      '/api/auth/google',
      '/api/auth/github/callback',
      '/api/auth/google/callback',
      '/api/public',
    ],
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
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
  // ========== Cache Configuration (cache.*) ==========
  // Cache is disabled by default — no Redis connection is made until you opt in.
  // To enable: set `enabled: true`, ensure Redis is running, then adjust host/port.
  cache: {
    enabled: false,  // set to true to activate (requires Redis)
    type: 'redis',
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
} satisfies AppConfig;
