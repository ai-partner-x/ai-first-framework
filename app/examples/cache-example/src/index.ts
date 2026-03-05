/**
 * Cache Example - 入口
 *
 * 演示 @ai-first/cache 的两种启动模式：
 *
 * 模式一（REDIS_HOST 已配置）：@EnableCaching + initializeCaching()
 *   - @EnableCaching 将 Redis 配置绑定到应用配置类（纯声明，无副作用）
 *   - initializeCaching() 在启动时创建连接并验证（PING）；失败则抛出 CacheInitializationError
 *   - 对应 Spring Boot: @EnableCaching + spring.data.redis.* 配置项
 *
 * 模式二（REDIS_HOST 未配置）：无 @EnableCaching，缓存装饰器自动降级
 *   - @Cacheable/@CachePut/@CacheEvict 直接调用原方法，不访问 Redis
 *
 * 运行：
 *   # 无 Redis（装饰器自动降级）
 *   pnpm start
 *
 *   # 有 Redis（启用 @EnableCaching 严格模式）
 *   REDIS_HOST=127.0.0.1 REDIS_PORT=6379 pnpm start
 */

import 'reflect-metadata';
import {
  EnableCaching,
  initializeCaching,
  CacheInitializationError,
  closeRedisConnection,
  RedisTemplate,
  StringRedisTemplate,
} from '@ai-first/cache';
import { Container } from '@ai-first/di';
import { UserCacheService } from './service/user.cache.service.js';

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;

// ==================== @EnableCaching（应用配置类）====================
//
// 在实际应用中，通常在顶层用装饰器语法：
//
//   @EnableCaching({
//     host: process.env.REDIS_HOST ?? '127.0.0.1',
//     port: Number(process.env.REDIS_PORT ?? 6379),
//   })
//   class AppConfig {}
//
//   async function main() {
//     await initializeCaching();  // 失败则抛出 CacheInitializationError
//   }
//
// 本示例为演示两种模式，仅在 REDIS_HOST 配置时才启用 @EnableCaching。
// EnableCaching(config)(Class) 等价于 @EnableCaching(config) class Class {}

class AppConfig {}

async function main() {
  console.log('=== @app/cache-example ===\n');

  // ==================== 启动验证（@EnableCaching 模式）====================
  //
  // @EnableCaching 将 Redis 配置绑定到 AppConfig（纯声明，无网络副作用）。
  // initializeCaching() 创建 Redis 连接并发送 PING 验证：
  //   - 成功 → 缓存就绪，继续启动
  //   - 失败 → 抛出 CacheInitializationError（生产环境应在此 process.exit(1)）
  //
  // 对应 Spring Boot: ApplicationContext 启动时的 CacheManager bean 初始化检查

  if (REDIS_HOST) {
    console.log(`--- @EnableCaching 模式：连接 Redis ${REDIS_HOST}:${REDIS_PORT} ---`);

    // 等价于在 AppConfig 类上添加 @EnableCaching({ host, port }) 装饰器
    EnableCaching({ host: REDIS_HOST, port: REDIS_PORT })(AppConfig);

    try {
      await initializeCaching();
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
    console.log('--- 未配置 REDIS_HOST：跳过 @EnableCaching，缓存装饰器自动降级 ---');
    console.log('  提示：设置 REDIS_HOST=127.0.0.1 可开启 @EnableCaching 严格模式\n');
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
  const newUser = await userService.createUser({ name: '赵六', email: 'zhaoliu@example.com', age: 28 });
  console.log('  created:', newUser);
  console.log('');

  // ==================== @CachePut: 更新 ====================

  console.log('--- @CachePut: updateUser ---');
  const updated = await userService.updateUser(1, { name: '张三（已更新）', age: 26 });
  console.log('  updated:', updated);
  console.log('');

  // ==================== @CacheEvict: 删除 ====================

  console.log('--- @CacheEvict: deleteUser ---');
  const deleted = await userService.deleteUser(2);
  console.log('  deleteUser(2):', deleted);
  console.log('');

  // ==================== RedisTemplate 直接操作（需要 Redis）====================

  if (REDIS_HOST) {
    const { getRedisClient } = await import('@ai-first/cache');
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
