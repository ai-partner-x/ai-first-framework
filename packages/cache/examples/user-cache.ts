/**
 * User Cache Example - 用户缓存示例
 *
 * 展示 @ai-first/cache 的两种使用方式：
 *
 * 方式一：@Service + @Cacheable（推荐）
 *   - 使用通用 DI 装饰器 @Service 作为类装饰器
 *   - 类方法带有 @Cacheable/@CachePut/@CacheEvict 时，自动被识别为缓存组件
 *   - 等同于 Java Spring Boot 中 @Service 类上使用 @Cacheable
 *
 * 方式二：@RedisComponent（专用装饰器，语义更明确）
 *   - 专门标记 Redis 缓存组件，具备完整的 DI 行为
 *
 * 注意：装饰器示例无需 Redis 即可运行（未初始化时自动降级为直接调用）
 *       完整 RedisTemplate 操作需要运行中的 Redis 实例（默认 localhost:6379）
 */

import 'reflect-metadata';
import {
  RedisComponent,
  Cacheable,
  CachePut,
  CacheEvict,
  Autowired,
  getRedisComponentMetadata,
} from '../src/index.js';
import { Container } from '@ai-first/di';
import { Service } from '@ai-first/core';

// ==================== Entity 定义 ====================

/**
 * 用户实体
 */
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// ==================== Repository 定义（模拟数据库层）====================

/**
 * 用户数据仓库（通过 @Service 注册到 DI 容器）
 *
 * TypeScript: @Service()
 * Java: @Repository / @Service
 */
@Service()
class UserRepository {
  private db: Map<number, User> = new Map([
    [1, { id: 1, name: '张三', email: 'zhangsan@example.com', age: 25 }],
    [2, { id: 2, name: '李四', email: 'lisi@example.com', age: 30 }],
    [3, { id: 3, name: '王五', email: 'wangwu@example.com', age: 22 }],
  ]);

  findById(id: number): User | null {
    return this.db.get(id) ?? null;
  }

  save(user: User): User {
    this.db.set(user.id, user);
    return user;
  }

  delete(id: number): void {
    this.db.delete(id);
  }
}

// ==================== 方式一：@Service + @Cacheable ====================

/**
 * 用户缓存服务（使用通用 @Service 装饰器）
 *
 * 这是推荐的写法：
 * TypeScript:
 * @Service()                        ← 通用 DI 装饰器
 * class UserCacheService {
 *   @Cacheable(...)                 ← 缓存方法自动将类标记为缓存组件
 * }
 *
 * 转译为 Java:
 * @Service
 * public class UserCacheService {
 *   @Cacheable(value = "user", key = "#id")  ← Spring 自动启用缓存代理
 * }
 *
 * @Service 行为：
 * - 自动注册为单例
 * - 支持 @Autowired 属性注入
 * - 方法带有 @Cacheable 时，类被自动识别为缓存组件（getRedisComponentMetadata() 返回数据）
 */
@Service({ name: 'UserCacheService' })
class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;

  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    console.log(`  [DB] 查询数据库: getUserById(${id})`);
    return this.userRepository.findById(id);
  }

  @CachePut({ key: 'user', ttl: 300, keyGenerator: (_id, user) => String((user as User).id) })
  async updateUser(_id: number, user: User): Promise<User> {
    console.log(`  [DB] 更新数据库: updateUser(${user.id})`);
    return this.userRepository.save(user);
  }

  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<void> {
    console.log(`  [DB] 删除数据库: deleteUser(${id})`);
    this.userRepository.delete(id);
  }

  @CacheEvict({ key: 'user', allEntries: true })
  async clearAll(): Promise<void> {
    console.log('  [Cache] 清空所有用户缓存');
  }
}

// ==================== 方式二：@RedisComponent（专用装饰器）====================

/**
 * 用户缓存服务（使用专用 @RedisComponent 装饰器）
 *
 * @RedisComponent 与 @Service + @Cacheable 方法完全等价，
 * 语义上更明确地表达"这是一个 Redis 缓存组件"。
 *
 * TypeScript:
 * @RedisComponent()
 * class UserCacheServiceV2 { ... }
 *
 * Java:
 * @Service  // Spring 中没有专门的 @RedisComponent，统一用 @Service
 * public class UserCacheServiceV2 { ... }
 */
@RedisComponent({ name: 'UserCacheServiceV2' })
class UserCacheServiceV2 {
  @Autowired()
  private userRepository!: UserRepository;

  @Cacheable({ key: 'user:v2', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    console.log(`  [DB] 查询数据库: getUserById(${id})`);
    return this.userRepository.findById(id);
  }
}

// ==================== 使用示例 ====================

async function main() {
  console.log('=== @ai-first/cache User Cache Example ===\n');

  // ==================== 方式一：@Service + @Cacheable ====================
  //
  // UserCacheService 使用 @Service 作为类装饰器，方法上有 @Cacheable。
  // @Cacheable 运行时自动将类标记为缓存组件，getRedisComponentMetadata() 返回有效数据。

  console.log('--- 方式一：@Service + @Cacheable（自动识别为缓存组件）---');
  const meta1 = getRedisComponentMetadata(UserCacheService);
  console.log('  getRedisComponentMetadata(UserCacheService):', meta1);

  const userService = Container.resolve(UserCacheService);
  console.log('  DI resolved:', userService.constructor.name);
  console.log('');

  // @Cacheable - 查询用户
  console.log('--- @Cacheable ---');
  console.log('第一次查询（访问 DB）:');
  const user1 = await userService.getUserById(1);
  console.log('  result:', user1);

  console.log('第二次查询（有 Redis 则命中缓存，不访问 DB）:');
  const user1Cached = await userService.getUserById(1);
  console.log('  result:', user1Cached);
  console.log('');

  // @CachePut - 更新用户并同步缓存
  console.log('--- @CachePut ---');
  const updated = await userService.updateUser(1, { ...user1!, name: '张三（已更新）' });
  console.log('  updated:', updated);
  console.log('');

  // @CacheEvict - 删除用户并清除缓存
  console.log('--- @CacheEvict ---');
  await userService.deleteUser(2);
  console.log('  deleteUser(2) done');
  await userService.clearAll();
  console.log('  clearAll() done');
  console.log('');

  // ==================== 方式二：@RedisComponent（专用装饰器）====================
  //
  // UserCacheServiceV2 使用 @RedisComponent，语义更明确，与方式一完全等价。

  console.log('--- 方式二：@RedisComponent（专用装饰器）---');
  const meta2 = getRedisComponentMetadata(UserCacheServiceV2);
  console.log('  getRedisComponentMetadata(UserCacheServiceV2):', meta2);

  const userServiceV2 = Container.resolve(UserCacheServiceV2);
  console.log('  DI resolved:', userServiceV2.constructor.name);
  const user1v2 = await userServiceV2.getUserById(1);
  console.log('  getUserById(1):', user1v2);
  console.log('');

  console.log('=== Example Complete ===');
}

main().catch(console.error);

