import type { AppConfig } from '@ai-partner-x/aiko-boot';

/**
 * Cache-CRUD 配置文件（Spring Boot 风格）
 *
 * 配置风格参考 Spring Boot application.properties:
 * @see https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html
 *
 * 通过环境变量启用 Redis（可选）：
 *   REDIS_HOST=127.0.0.1 REDIS_PORT=6379 pnpm server
 */

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
// 空字符串 (`REDIS_PASSWORD=`) 统一转为 undefined，避免空字符串被传入 ioredis auth 流程
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export default {
  // ========== Server Configuration (server.*) ==========
  server: {
    port: Number(process.env.PORT || '3002'),
    servlet: {
      contextPath: '/api',
    },
    shutdown: 'graceful',
  },

  // ========== Database Configuration (database.*) ==========
  database: {
    type: 'sqlite',
    filename: './data/cache_example.db',
  },

  // ========== Cache Configuration (cache.*) ==========
  // cache.enabled = true 时，CacheAutoConfiguration 的
  // @ConditionalOnProperty('cache.enabled', { havingValue: 'true' }) 触发 Redis 初始化。
  // 未设置 REDIS_HOST 时 enabled = false，条件不满足，缓存装饰器自动降级（直接调用原方法）。
  cache: {
    enabled: Boolean(REDIS_HOST),
    type: 'redis' as const,
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  },
} satisfies AppConfig;
