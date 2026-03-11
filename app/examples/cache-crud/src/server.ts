/**
 * Cache-CRUD API Server — Spring Boot 风格自动配置
 *
 * 演示 @ai-partner-x/aiko-boot-starter-cache 与 REST API 的集成：
 * - createApp 自动加载 app.config.ts、扫描 mapper/ service/ controller/ 并注册到 DI 容器
 * - SQLite 提供持久化存储（@ai-partner-x/aiko-boot-starter-orm + Kysely）
 * - 缓存：app.config.ts 中 cache.enabled = true 触发 CacheAutoConfiguration
 *         对应 @ConditionalOnProperty('cache.enabled', { havingValue: 'true' })
 *         REDIS_HOST 未设置时 enabled = false，缓存装饰器自动降级
 *
 * 运行前先初始化数据库：
 *   pnpm init-db
 *
 * 启动服务：
 *   # 无 Redis（缓存装饰器自动降级，直接访问 DB）
 *   pnpm server
 *
 *   # 有 Redis，无密码
 *   REDIS_HOST=127.0.0.1 REDIS_PORT=6379 pnpm server
 *
 *   # 有 Redis，带密码
 *   REDIS_HOST=127.0.0.1 REDIS_PORT=6379 REDIS_PASSWORD=yourpassword pnpm server
 *
 * 接口列表：
 *   GET    http://localhost:3002/api/users
 *   GET    http://localhost:3002/api/users/:id
 *   POST   http://localhost:3002/api/users
 *   PUT    http://localhost:3002/api/users/:id
 *   DELETE http://localhost:3002/api/users/:id
 */

import 'reflect-metadata';
import { createApp } from '@ai-partner-x/aiko-boot';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 配置由 app.config.ts 统一管理（server.*、database.*、cache.*）
const app = await createApp({ srcDir: __dirname });

// 启动 HTTP 服务器（端口由 app.config.ts server.port 决定，默认 3002）
app.run();
