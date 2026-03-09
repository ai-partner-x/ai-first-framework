/**
 * Cache Example - 入口（演示脚本）
 *
 * 演示使用 Spring Boot 风格自动配置的缓存系统：
 *
 * - createApp() 自动加载 app.config.ts，依次触发：
 *     1. OrmAutoConfiguration  — 自动初始化 SQLite 数据库连接
 *     2. CacheAutoConfiguration — 若 REDIS_HOST 已配置，则自动初始化 Redis
 * - 若 REDIS_HOST 未配置，@Cacheable/@CachePut/@CacheEvict 自动降级，直接调用原方法
 *
 * 运行前先初始化数据库（只需执行一次）：
 *   pnpm init-db
 *
 * 运行：
 *   # 无 Redis（装饰器自动降级）
 *   pnpm start
 *
 *   # 有 Redis（启用缓存严格模式）
 *   REDIS_HOST=127.0.0.1 REDIS_PORT=6379 pnpm start
 *
 *   # 有 Redis + 密码认证
 *   REDIS_HOST=127.0.0.1 REDIS_PORT=6379 REDIS_PASSWORD=yourpassword pnpm start
 *
 * 如果需要 REST API 服务，请使用 pnpm server 启动 src/server.ts。
 */

import 'reflect-metadata';
import { createApp, Container } from '@ai-partner-x/aiko-boot';
// 触发 @ai-partner-x/aiko-boot-starter-cache 的 AppConfig 类型扩展（config-augment）
import '@ai-partner-x/aiko-boot-starter-cache';
// Spring Data Redis 数据层（直接操作 Redis，按需引入）
import {
  isRedisInitialized,
  closeRedisConnection,
  getRedisClient,
  RedisTemplate,
  StringRedisTemplate,
} from '@ai-partner-x/aiko-boot-starter-cache/redis';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { UserCacheService } from './service/user.cache.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== @app/cache-crud ===\n');

  // ==================== Spring Boot 风格自动配置启动 ====================
  //
  // createApp() 对应 Spring Boot 的 SpringApplication.run()：
  //   1. 加载 app.config.ts（包含 database.* 和可选的 cache.* 配置）
  //   2. 扫描 service/ 等目录，注册 @Service 组件到 DI 容器
  //   3. OrmAutoConfiguration (@OnApplicationReady, order=-100)
  //        → 自动初始化 SQLite 连接（无需手动调用 createKyselyDatabase）
  //   4. CacheAutoConfiguration (@OnApplicationReady, order=-50)
  //        → @ConditionalOnProperty('cache.enabled', { havingValue: 'true' }) 控制是否激活
  //        → cache.enabled = true 时自动验证并初始化 Redis；false 时跳过，缓存装饰器自动降级
  //        → 对应 Spring Boot 的 CacheManager bean 初始化检查
  //
  // 通过环境变量控制是否启用 Redis（详见 app.config.ts）：
  //   REDIS_HOST=127.0.0.1 REDIS_PORT=6379 pnpm start

  console.log('--- createApp()：加载配置并触发自动配置 ---');
  await createApp({ srcDir: __dirname });
  console.log('');

  // ==================== DI 容器解析 ====================
  //
  // createApp() 扫描 service/ 目录时已将 @Service 类注册为 DI 单例，
  // 通过 Container.resolve() 获取，@Autowired 依赖由 DI 自动注入
  //
  // 对应 Java: @Autowired UserCacheService userCacheService;

  console.log('--- DI 容器解析（@Service 已注册为单例）---');
  const userService = Container.resolve(UserCacheService);
  console.log('  resolved:', userService.constructor.name);
  const testUser = await userService.getUserById(999);
  console.log('  @Autowired UserRepository 注入验证（id=999 查询返回 null）:', testUser === null);
  console.log('');

  // ==================== @Cacheable: 查询 ====================

  console.log('--- @Cacheable: getUserById ---');
  console.log('第一次查询（访问 DB）:');
  const user1 = await userService.getUserById(1);
  console.log('  result:', user1);

  console.log('第二次查询（有 Redis 则命中缓存，不访问 DB）:');
  const user1Cached = await userService.getUserById(1);
  console.log('  result:', user1Cached);
  console.log('');

  // ==================== @Cacheable: 列表 ====================

  console.log('--- @Cacheable: getUserList ---');
  const list = await userService.getUserList();
  console.log('  list count:', list.length);
  console.log('');

  // ==================== @CacheEvict + createUser ====================

  console.log('--- @CacheEvict: createUser（清除 user:list 缓存）---');
  // 使用时间戳保证邮箱唯一，避免多次运行因唯一约束失败。
  // 演示结束后会通过 deleteUser 清理该记录，保持数据库整洁。
  const newUser = await userService.createUser({ name: '赵六', email: `zhaoliu_${Date.now()}@example.com`, age: 28 });
  console.log('  created:', newUser);
  console.log('');

  // ==================== @CachePut: 更新 ====================

  console.log('--- @CachePut: updateUser ---');
  if (user1) {
    const updated = await userService.updateUser(user1.id, { name: '张三（已更新）', age: 26 });
    console.log('  updated:', updated);
  }
  console.log('');

  // ==================== @CacheEvict: 删除 ====================

  console.log('--- @CacheEvict: deleteUser ---');
  const deleted = await userService.deleteUser(newUser.id);
  console.log(`  deleteUser(${newUser.id}):`, deleted);
  console.log('');

  // ==================== RedisTemplate 直接操作（需要 Redis）====================
  // Spring Data Redis 层：通过 @ai-partner-x/aiko-boot-starter-cache/redis 导入 RedisTemplate
  // CacheAutoConfiguration 已初始化 Redis 连接，通过 getRedisClient() 获取共享客户端

  if (isRedisInitialized()) {
    const client = getRedisClient();
    const redisTemplate = new RedisTemplate<string, unknown>({ client });
    const stringTemplate = new StringRedisTemplate({ client });

    console.log('--- RedisTemplate: opsForValue ---');
    const valueOps = redisTemplate.opsForValue();
    await valueOps.set('app:version', '1.0.0', 3600);
    const version = await valueOps.get('app:version');
    console.log('  app:version:', version);

    await valueOps.set('app:counter', 0, 3600);
    await valueOps.increment('app:counter');
    await valueOps.increment('app:counter');
    const counter = await valueOps.get('app:counter');
    console.log('  app:counter (after 2 increments):', counter);
    console.log('');

    console.log('--- StringRedisTemplate ---');
    await stringTemplate.opsForValue().set('str:hello', 'world', 60);
    const hello = await stringTemplate.opsForValue().get('str:hello');
    console.log('  str:hello:', hello);
    console.log('');

    // 清理测试数据
    console.log('--- 清理测试数据 ---');
    await redisTemplate.delete(['app:version', 'app:counter', 'str:hello']);
    console.log('  done');
    console.log('');

    await closeRedisConnection();
  }

  console.log('=== 示例完成 ===');
}

main().catch(console.error);
