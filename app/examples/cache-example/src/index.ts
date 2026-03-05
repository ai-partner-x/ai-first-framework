/**
 * Cache Example - 入口
 *
 * 演示 @ai-first/cache 与通用 DI 装饰器的结合用法：
 * 1. @Service + @Cacheable/@CachePut/@CacheEvict — 使用通用 DI 装饰器标记缓存服务
 *    （类方法带有缓存注解时，类被自动识别为缓存组件，无需 @RedisComponent）
 * 2. @Autowired — DI 容器自动注入依赖（无需 Redis 可自动降级）
 * 3. RedisTemplate 直接操作（需要 Redis 实例）
 *
 * 运行：
 *   # 无 Redis（装饰器自动降级）
 *   pnpm start
 *
 *   # 有 Redis
 *   REDIS_HOST=127.0.0.1 REDIS_PORT=6379 pnpm start
 */

import 'reflect-metadata';
import {
  createRedisConnection,
  closeRedisConnection,
  RedisTemplate,
  StringRedisTemplate,
  getRedisComponentMetadata,
} from '@ai-first/cache';
import { Container } from '@ai-first/di';
import { UserCacheService } from './service/user.cache.service.js';

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;

async function main() {
  console.log('=== @app/cache-example ===\n');

  // ==================== Redis 连接（可选）====================

  let redisTemplate: RedisTemplate<string, unknown> | null = null;
  let stringTemplate: StringRedisTemplate | null = null;

  if (REDIS_HOST) {
    console.log(`--- 连接 Redis: ${REDIS_HOST}:${REDIS_PORT} ---`);
    const client = createRedisConnection({ host: REDIS_HOST, port: REDIS_PORT });
    redisTemplate = new RedisTemplate<string, unknown>({ client });
    stringTemplate = new StringRedisTemplate({ client });
    console.log('  Redis 连接成功\n');
  } else {
    console.log('--- 未配置 REDIS_HOST，跳过 Redis 连接（装饰器自动降级）---\n');
  }

  // ==================== 自动识别为缓存组件 ====================
  //
  // UserCacheService 使用 @Service 作为类装饰器（而非 @RedisComponent），
  // 但因为方法带有 @Cacheable/@CachePut/@CacheEvict，类被自动标记为缓存组件。
  // getRedisComponentMetadata() 仍然返回有效的元数据。
  //
  // 对应 Java: @Service 类有 @Cacheable 方法时，Spring 自动启用缓存代理

  console.log('--- 自动识别为缓存组件（@Service + @Cacheable 方法）---');
  const meta = getRedisComponentMetadata(UserCacheService);
  console.log('  getRedisComponentMetadata():', meta);
  console.log('  （类使用 @Service 装饰，但因方法有 @Cacheable，被自动标记为缓存组件）');
  console.log('');

  // ==================== DI 容器解析 ====================
  //
  // @Service 已自动注册为 DI 单例（Injectable + Singleton）
  // 通过 Container.resolve() 获取，@Autowired 依赖由 DI 自动注入
  //
  // 对应 Java: @Autowired UserCacheService userCacheService;

  console.log('--- DI 容器解析（@Service 已注册为单例）---');
  const userService = Container.resolve(UserCacheService);
  console.log('  resolved:', userService.constructor.name);
  // 通过实际调用来验证 @Autowired 注入是否成功（如果 userRepository 未注入，调用会抛出异常）
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

  if (redisTemplate && stringTemplate) {
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

    console.log('--- RedisTemplate: opsForHash ---');
    const hashOps = redisTemplate.opsForHash<string, string>();
    await hashOps.put('session:abc123', 'userId', '1');
    await hashOps.put('session:abc123', 'role', 'admin');
    const sessionEntries = await hashOps.entries('session:abc123');
    console.log('  session:abc123:', Object.fromEntries(sessionEntries));
    console.log('');

    console.log('--- RedisTemplate: opsForZSet (排行榜) ---');
    const zsetOps = redisTemplate.opsForZSet();
    await zsetOps.add('score:board', 'user:1', 1500);
    await zsetOps.add('score:board', 'user:2', 2300);
    await zsetOps.add('score:board', 'user:3', 1800);
    const top3 = await zsetOps.reverseRangeWithScores('score:board', 0, 2);
    console.log('  Top 3:', top3);
    console.log('');

    // 清理测试数据
    console.log('--- 清理测试数据 ---');
    await redisTemplate.delete(['app:version', 'app:counter', 'session:abc123', 'score:board']);
    console.log('  done');
    console.log('');

    await closeRedisConnection();
  }

  console.log('=== 示例完成 ===');
}

main().catch(console.error);
