/**
 * User Cache Example - 用户缓存示例
 *
 * 展示 @ai-first/cache 的基本用法
 *
 * TypeScript 代码可以转译为等价的 Java Spring Boot Cache 代码
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

// ==================== Cache Service 定义 ====================

/**
 * 用户缓存服务
 *
 * TypeScript:
 * @RedisComponent()                   ← 自动注册到 DI 容器（Injectable + Singleton）
 * class UserCacheService { ... }
 *
 * 转译为 Java:
 * @Service
 * public class UserCacheService { ... }
 *
 * @RedisComponent 与 @Service / @Component 完全等价的 DI 行为：
 * - 自动注册为单例
 * - 支持构造函数注入
 * - 支持 @Autowired 属性注入
 * - 可被其他 @Service / @Component 通过 @Autowired 注入
 */
@RedisComponent({ name: 'UserCacheService' })
class UserCacheService {
  /**
   * 通过 @Autowired 注入 UserRepository（DI 容器自动处理）
   *
   * TypeScript: @Autowired()
   * Java: @Autowired UserRepository userRepository;
   */
  @Autowired()
  private userRepository!: UserRepository;

  /**
   * 查询用户（带缓存）
   *
   * TypeScript: @Cacheable({ key: 'user', ttl: 300 })
   * Java: @Cacheable(value = "user", key = "#id")
   */
  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    console.log(`  [DB] 查询数据库: getUserById(${id})`);
    return this.userRepository.findById(id);
  }

  /**
   * 更新用户（更新缓存）
   *
   * TypeScript: @CachePut({ key: 'user', ttl: 300 })
   * Java: @CachePut(value = "user", key = "#result.id")
   */
  @CachePut({ key: 'user', ttl: 300, keyGenerator: (_id, user) => String((user as User).id) })
  async updateUser(_id: number, user: User): Promise<User> {
    console.log(`  [DB] 更新数据库: updateUser(${user.id})`);
    return this.userRepository.save(user);
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
    this.userRepository.delete(id);
  }

  /**
   * 清空所有用户缓存
   *
   * TypeScript: @CacheEvict({ key: 'user', allEntries: true })
   * Java: @CacheEvict(value = "user", allEntries = true)
   */
  @CacheEvict({ key: 'user', allEntries: true })
  async clearAll(): Promise<void> {
    console.log('  [Cache] 清空所有用户缓存');
  }
}

// ==================== 使用示例 ====================

async function main() {
  console.log('=== @ai-first/cache User Cache Example ===\n');

  // 1. 查看 RedisComponent 元数据
  const meta = getRedisComponentMetadata(UserCacheService);
  console.log('RedisComponent Metadata:', meta);
  console.log('');

  // 2. 通过 DI 容器解析（@RedisComponent 已自动注册为单例）
  //
  // TypeScript: Container.resolve(UserCacheService)
  // Java: @Autowired UserCacheService userCacheService;
  console.log('--- DI 容器解析 ---');
  const userService = Container.resolve(UserCacheService);
  console.log('DI resolved UserCacheService:', userService.constructor.name);
  console.log('');

  // 3. @Cacheable - 查询用户（第一次访问 DB，有 Redis 时第二次命中缓存）
  console.log('--- @Cacheable ---');
  console.log('第一次查询（访问 DB）:');
  const user1 = await userService.getUserById(1);
  console.log('  result:', user1);

  console.log('第二次查询（有 Redis 则命中缓存，不访问 DB）:');
  const user1Cached = await userService.getUserById(1);
  console.log('  result:', user1Cached);
  console.log('');

  // 4. @CachePut - 更新用户并同步缓存
  console.log('--- @CachePut ---');
  const updated = await userService.updateUser(1, { ...user1!, name: '张三（已更新）' });
  console.log('  updated:', updated);
  console.log('');

  // 5. @CacheEvict - 删除用户并清除缓存
  console.log('--- @CacheEvict ---');
  await userService.deleteUser(2);
  console.log('  deleteUser(2) done');
  await userService.clearAll();
  console.log('  clearAll() done');
  console.log('');

  console.log('=== Example Complete ===');
}

main().catch(console.error);
