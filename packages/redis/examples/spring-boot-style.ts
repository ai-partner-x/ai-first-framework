/**
 * Redis Spring Boot 风格使用示例
 *
 * 展示 @ai-first/redis 的基本用法，对标 Spring Boot Redis 风格
 *
 * 注意：本示例需要运行中的 Redis 实例（默认 localhost:6379）
 * 实际运行: node --experimental-specifier-resolution=node examples/spring-boot-style.mjs
 */

import {
  createRedisConnection,
  closeRedisConnection,
  RedisTemplate,
  StringRedisTemplate,
  RedisComponent,
  Cacheable,
  CachePut,
  CacheEvict,
} from '../src/index.js';

// ==================== Entity 定义 ====================

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// ==================== Cache Service 定义 ====================

/**
 * 用户缓存服务
 *
 * TypeScript (AI-First):
 * @RedisComponent()
 * class UserCacheService { ... }
 *
 * 对标 Java Spring Boot:
 * @Service
 * public class UserCacheService { ... }
 */
@RedisComponent({ name: 'UserCacheService' })
class UserCacheService {
  // 模拟数据库
  private db: Map<number, User> = new Map([
    [1, { id: 1, name: '张三', email: 'zhangsan@example.com', age: 25 }],
    [2, { id: 2, name: '李四', email: 'lisi@example.com', age: 30 }],
    [3, { id: 3, name: '王五', email: 'wangwu@example.com', age: 22 }],
  ]);

  /**
   * 查询用户（带缓存）
   *
   * TypeScript: @Cacheable({ key: 'user', ttl: 300 })
   * Java: @Cacheable(value = "user", key = "#id")
   */
  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    console.log(`  [DB] 查询数据库: getUserById(${id})`);
    return this.db.get(id) ?? null;
  }

  /**
   * 更新用户（更新缓存）
   *
   * TypeScript: @CachePut({ key: 'user', ttl: 300 })
   * Java: @CachePut(value = "user", key = "#user.id")
   */
  @CachePut({ key: 'user', ttl: 300, keyGenerator: (_id, user) => String((user as User).id) })
  async updateUser(_id: number, user: User): Promise<User> {
    console.log(`  [DB] 更新数据库: updateUser(${user.id})`);
    this.db.set(user.id, user);
    return user;
  }

  /**
   * 删除用户（清除缓存）
   *
   * TypeScript: @CacheEvict({ key: 'user' })
   * Java: @CacheEvict(value = "user", key = "#id")
   */
  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<void> {
    console.log(`  [DB] 删除数据库: deleteUser(${id})`);
    this.db.delete(id);
  }
}

// ==================== 主示例 ====================

async function main() {
  console.log('=== @ai-first/redis Spring Boot 风格示例 ===\n');

  // 1. 创建 Redis 连接（类比 Spring Boot application.properties 中的 redis 配置）
  console.log('--- 初始化 Redis 连接 ---');
  const client = createRedisConnection({
    host: '127.0.0.1',
    port: 6379,
  });

  // 2. 创建 RedisTemplate（类比 Spring 注入 RedisTemplate）
  const redisTemplate = new RedisTemplate<string, unknown>({ client });
  const stringTemplate = new StringRedisTemplate({ client });

  // 3. opsForValue() - String 操作
  console.log('\n--- opsForValue() - String/Value 操作 ---');
  const valueOps = redisTemplate.opsForValue();

  await valueOps.set('greeting', '你好，世界');
  const greeting = await valueOps.get('greeting');
  console.log('get(greeting):', greeting);

  await valueOps.set('counter', 0, 60);
  await valueOps.increment('counter');
  await valueOps.increment('counter');
  const counter = await valueOps.get('counter');
  console.log('counter after 2 increments:', counter);

  await valueOps.multiSet(new Map([
    ['k1', 'value1'],
    ['k2', 'value2'],
    ['k3', 'value3'],
  ]));
  const values = await valueOps.multiGet(['k1', 'k2', 'k3']);
  console.log('multiGet([k1,k2,k3]):', values);

  // 4. opsForHash() - Hash 操作
  console.log('\n--- opsForHash() - Hash 操作 ---');
  const hashOps = redisTemplate.opsForHash<string, string>();

  await hashOps.put('user:hash:1', 'name', '张三');
  await hashOps.put('user:hash:1', 'email', 'zhangsan@example.com');
  await hashOps.put('user:hash:1', 'age', '25');

  const name = await hashOps.get('user:hash:1', 'name');
  console.log('hget(user:hash:1, name):', name);

  const entries = await hashOps.entries('user:hash:1');
  console.log('hgetall(user:hash:1):', Object.fromEntries(entries));

  const keys = await hashOps.keys('user:hash:1');
  console.log('hkeys(user:hash:1):', keys);

  // 5. opsForList() - List 操作
  console.log('\n--- opsForList() - List 操作 ---');
  const listOps = redisTemplate.opsForList();

  await listOps.rightPush('queue:tasks', 'task1');
  await listOps.rightPush('queue:tasks', 'task2');
  await listOps.rightPush('queue:tasks', 'task3');

  const queueSize = await listOps.size('queue:tasks');
  console.log('llen(queue:tasks):', queueSize);

  const task = await listOps.leftPop('queue:tasks');
  console.log('lpop(queue:tasks):', task);

  const remaining = await listOps.range('queue:tasks', 0, -1);
  console.log('lrange(queue:tasks, 0, -1):', remaining);

  // 6. opsForSet() - Set 操作
  console.log('\n--- opsForSet() - Set 操作 ---');
  const setOps = redisTemplate.opsForSet();

  await setOps.add('tags:article:1', 'redis', 'cache', 'nosql', 'database');
  const members = await setOps.members('tags:article:1');
  console.log('smembers(tags:article:1):', [...members]);

  const hasTag = await setOps.isMember('tags:article:1', 'redis');
  console.log('sismember(tags:article:1, redis):', hasTag);

  const setSize = await setOps.size('tags:article:1');
  console.log('scard(tags:article:1):', setSize);

  // 7. opsForZSet() - ZSet 操作
  console.log('\n--- opsForZSet() - 有序集合操作 ---');
  const zsetOps = redisTemplate.opsForZSet();

  await zsetOps.add('leaderboard', 'player1', 100);
  await zsetOps.add('leaderboard', 'player2', 250);
  await zsetOps.add('leaderboard', 'player3', 180);

  const top3 = await zsetOps.reverseRange('leaderboard', 0, 2);
  console.log('zrevrange(leaderboard, 0, 2):', top3);

  const top3WithScores = await zsetOps.reverseRangeWithScores('leaderboard', 0, 2);
  console.log('zrevrange ... WITHSCORES:', top3WithScores);

  const player1Score = await zsetOps.score('leaderboard', 'player1');
  console.log('zscore(leaderboard, player1):', player1Score);

  await zsetOps.incrementScore('leaderboard', 'player1', 50);
  const newScore = await zsetOps.score('leaderboard', 'player1');
  console.log('after zincrby +50, player1 score:', newScore);

  // 8. 全局 Key 操作
  console.log('\n--- 全局 Key 操作 ---');
  await redisTemplate.expire('greeting', 100);
  const ttl = await redisTemplate.getExpire('greeting');
  console.log('TTL of greeting:', ttl);

  const hasKey = await redisTemplate.hasKey('greeting');
  console.log('hasKey(greeting):', hasKey);

  // 9. StringRedisTemplate 示例
  console.log('\n--- StringRedisTemplate ---');
  const strOps = stringTemplate.opsForValue();
  await strOps.set('str:name', '李四');
  const strName = await strOps.get('str:name');
  console.log('StringRedisTemplate get(str:name):', strName);

  // 10. @Cacheable / @CachePut / @CacheEvict 示例
  console.log('\n--- @Cacheable / @CachePut / @CacheEvict 装饰器 ---');
  const userService = new UserCacheService();

  console.log('第一次查询（会访问 DB）:');
  const user1 = await userService.getUserById(1);
  console.log('  result:', user1);

  console.log('第二次查询（命中缓存，不访问 DB）:');
  const user1Cached = await userService.getUserById(1);
  console.log('  result:', user1Cached);

  console.log('更新用户（更新缓存）:');
  const updated = await userService.updateUser(1, { ...user1!, name: '张三（已更新）' });
  console.log('  result:', updated);

  console.log('删除用户（清除缓存）:');
  await userService.deleteUser(2);
  console.log('  done');

  // 清理
  console.log('\n--- 清理测试数据 ---');
  await redisTemplate.delete(['greeting', 'counter', 'k1', 'k2', 'k3']);
  await redisTemplate.delete('user:hash:1');
  await redisTemplate.delete('queue:tasks');
  await redisTemplate.delete('tags:article:1');
  await redisTemplate.delete('leaderboard');
  await stringTemplate.delete('str:name');

  console.log('\n=== 示例完成 ===');

  await closeRedisConnection();
}

main().catch(console.error);
