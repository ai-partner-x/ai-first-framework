/**
 * Cache Example - 入口（演示脚本）
 *
 * 演示 @ai-first/cache 的两种运行模式：
 *
 * 模式一（REDIS_HOST 已配置）：initializeCaching(config) 验证 Redis 连接
 *   - 启动时调用 initializeCaching(config) 验证 Redis 连接（PING）
 *   - 失败则抛出 CacheInitializationError，阻止启动
 *   - 对应 Spring Boot: CacheManager bean 初始化检查
 *
 * 模式二（REDIS_HOST 未配置）：缓存装饰器自动降级
 *   - @Cacheable/@CachePut/@CacheEvict 直接调用原方法，不访问 Redis
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
// Spring Cache 抽象层
import {
  initializeCaching,
  CacheInitializationError,
} from '@ai-first/cache';
// Spring Data Redis 数据层
import {
  closeRedisConnection,
  getRedisClient,
  RedisTemplate,
  StringRedisTemplate,
} from '@ai-first/cache/redis';
// ORM 数据库初始化（UserRepository 基于 Kysely/SQLite）
import { createKyselyDatabase } from '@ai-partner-x/aiko-boot-starter-orm';
import { Container } from '@ai-partner-x/aiko-boot';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { UserCacheService } from './service/user.cache.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined; // 空字符串视为"无密码"

async function main() {
  console.log('=== @app/cache-example ===\n');

  // ==================== 数据库初始化 ====================
  //
  // UserRepository 基于 @ai-partner-x/aiko-boot-starter-orm Kysely 适配器，需要先建立 DB 连接。
  // 使用 createKyselyDatabase 初始化 SQLite（与 createApp 内部行为一致）。
  //
  // 请先执行 pnpm init-db 创建表和种子数据。

  console.log('--- 初始化 SQLite 数据库连接 ---');
  await createKyselyDatabase({
    type: 'sqlite',
    filename: join(__dirname, '../data/cache_example.db'),
  });
  console.log('  ✅ SQLite 连接就绪\n');

  // ==================== 启动验证 ====================
  //
  // initializeCaching(config) 创建 Redis 连接并发送 PING 验证：
  //   - 成功 → 缓存就绪，继续启动
  //   - 失败 → 抛出 CacheInitializationError（生产环境应在此 process.exit(1)）
  //
  // 通常由 CacheAutoConfiguration 在 createApp() 阶段自动完成，
  // 此处为演示示例故手动调用。
  //
  // 对应 Spring Boot: ApplicationContext 启动时的 CacheManager bean 初始化检查

  if (REDIS_HOST) {
    const pwdHint = REDIS_PASSWORD ? '（已配置密码）' : '（无密码）';
    console.log(`--- initializeCaching：连接 Redis ${REDIS_HOST}:${REDIS_PORT} ${pwdHint} ---`);

    try {
      await initializeCaching({ type: 'redis', host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD });
      console.log('  ✅ Redis 连接验证成功，缓存已就绪\n');
    } catch (e) {
      if (e instanceof CacheInitializationError) {
        // 生产环境应在此处终止应用: process.exit(1)
        console.error('  ❌ 缓存初始化失败（启动阶段）：', e.message);
        console.error('  → 生产环境应在此处终止应用启动（process.exit(1)）\n');
        return;
      }
      throw e;
    }
  } else {
    console.log('--- 未配置 REDIS_HOST：跳过 initializeCaching，缓存装饰器自动降级 ---');
    console.log('  提示：设置 REDIS_HOST=127.0.0.1 可开启严格模式\n');
  }

  // ==================== DI 容器解析 ====================
  //
  // @Service 已自动注册为 DI 单例（Injectable + Singleton）
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
  // Spring Data Redis 层：通过 @ai-first/cache/redis 导入 RedisTemplate

  if (REDIS_HOST) {
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
