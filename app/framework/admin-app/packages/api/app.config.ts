import type { AppConfig } from '@ai-partner-x/aiko-boot';

/**
 * Admin App API 配置文件 (Spring Boot 风格)
 * 
 * 配置风格参考:
 * @see https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html
 */
export default {
  // ========== Server Configuration (server.*) ==========
  server: {
    port: Number(process.env.PORT) || 3002,
    servlet: {
      contextPath: '/api',  // Spring Boot: server.servlet.context-path
    },
    shutdown: 'graceful',   // Spring Boot: server.shutdown
  },

  // ========== Logging Configuration (logging.*) ==========
  logging: {
    level: {
      root: 'info',  // Spring Boot: logging.level.root
    },
  },

  // ========== Database Configuration (spring.datasource.*) ==========
  database: {
    type: 'sqlite',
    filename: './data/app.db',
  },

  // ========== Security Configuration ==========
  security: {
    enabled: true,
    jwt: {
      secret: process.env.JWT_SECRET || 'admin-app-jwt-secret-key-2024',
      expiresIn: '2h',
    },
    cors: {
      enabled: true,
      origin: 'http://localhost:5174',
      credentials: true,
    },
    publicPaths: ['/api/auth/login', '/api/auth/refresh'],
  },

  // ========== Validation Configuration ==========
  validation: {
    enabled: true,
    failFast: false,
  },
} satisfies AppConfig;
