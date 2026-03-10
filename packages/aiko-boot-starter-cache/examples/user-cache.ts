/**
 * User Cache Example - 用户缓存示例
 *
 * 展示 @ai-partner-x/aiko-boot-starter-cache 与通用 DI 装饰器的结合用法：
 * - 使用 @Service（来自 @ai-partner-x/aiko-boot）作为类装饰器
 * - 方法上使用 @Cacheable / @CachePut / @CacheEvict（来自 @ai-partner-x/aiko-boot-starter-cache）
 * - 对应 Java Spring Boot: @Service 类 + @Cacheable 方法
 *
 * 注意：装饰器示例无需 Redis 即可运行（未初始化时自动降级为直接调用）
 *       完整 RedisTemplate 操作需要运行中的 Redis 实例（默认 localhost:6379）
 */

import 'reflect-metadata';
import {
  Cacheable,
  CachePut,
  CacheEvict,
  Autowired,
} from '../src/index.js';
import { Container, Service } from '@ai-partner-x/aiko-boot';

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
 * TypeScript: @Service() — 通用 DI 装饰器
 * Java: @Service
 *
 * 方法上的 @Cacheable/@CachePut/@CacheEvict 对应 Java 的 Spring Cache 注解，
 * Spring Boot 会自动为带有这些注解的方法启用缓存代理。
 */
@Service({ name: 'UserCacheService' })
class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;

  /** 对应 Java: @Cacheable(value = "user", key = "#id") */
  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    console.log(`  [DB] 查询数据库: getUserById(${id})`);
    return this.userRepository.findById(id);
  }

  /** 对应 Java: @CachePut(value = "user", key = "#result.id") */
  @CachePut({ key: 'user', ttl: 300, keyGenerator: (_id, user) => String((user as User).id) })
  async updateUser(_id: number, user: User): Promise<User> {
    console.log(`  [DB] 更新数据库: updateUser(${user.id})`);
    return this.userRepository.save(user);
  }

  /** 对应 Java: @CacheEvict(value = "user", key = "#id") */
  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<void> {
    console.log(`  [DB] 删除数据库: deleteUser(${id})`);
    this.userRepository.delete(id);
  }

  /** 对应 Java: @CacheEvict(value = "user", allEntries = true) */
  @CacheEvict({ key: 'user', allEntries: true })
  async clearAll(): Promise<void> {
    console.log('  [Cache] 清空所有用户缓存');
  }
}

// ==================== 使用示例 ====================

async function main() {
  console.log('=== @ai-partner-x/aiko-boot-starter-cache User Cache Example ===\n');

  // 通过 DI 容器解析（@Service 已注册为单例，@Autowired 依赖自动注入）
  // 对应 Java: @Autowired UserCacheService userCacheService;
  const userService = Container.resolve(UserCacheService);
  console.log('DI resolved UserCacheService:', userService.constructor.name);
  console.log('');

  // @Cacheable - 查询用户（第一次访问 DB，有 Redis 时第二次命中缓存）
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

  console.log('=== Example Complete ===');
}

main().catch(console.error);

