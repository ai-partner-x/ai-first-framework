/**
 * 用户缓存服务
 *
 * 展示 @ai-first/cache 在实际应用中的用法：
 * - @RedisComponent 标记缓存组件，同时自动注册到 DI 容器（Injectable + Singleton）
 * - @Autowired 属性注入（由 DI 容器管理，等同于 Spring @Autowired）
 * - @Cacheable 读通缓存（查询）
 * - @CachePut 写通缓存（更新）
 * - @CacheEvict 缓存失效（创建/删除）
 *
 * 对应 Java Spring Boot:
 * @Service
 * public class UserCacheService {
 *   @Autowired
 *   private UserRepository userRepository;
 * }
 */

import { RedisComponent, Cacheable, CachePut, CacheEvict, Autowired } from '@ai-first/cache';
import { type User } from '../entity/user.entity.js';
import { UserRepository } from '../entity/user.repository.js';

@RedisComponent({ name: 'UserCacheService' })
export class UserCacheService {
  /**
   * 通过 @Autowired 注入 UserRepository（DI 容器自动管理）
   *
   * TypeScript: @Autowired()
   * Java: @Autowired UserRepository userRepository;
   */
  @Autowired()
  private userRepository!: UserRepository;

  /**
   * 查询单个用户（带缓存）
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
   * 查询用户列表（带缓存）
   *
   * TypeScript: @Cacheable({ key: 'user:list', ttl: 60 })
   * Java: @Cacheable(value = "user:list")
   */
  @Cacheable({ key: 'user:list', ttl: 60 })
  async getUserList(): Promise<User[]> {
    console.log('  [DB] 查询数据库: getUserList()');
    return this.userRepository.findAll();
  }

  /**
   * 创建用户（清除列表缓存）
   *
   * TypeScript: @CacheEvict({ key: 'user:list', allEntries: true })
   * Java: @CacheEvict(value = "user:list", allEntries = true)
   */
  @CacheEvict({ key: 'user:list', allEntries: true })
  async createUser(data: Omit<User, 'id'>): Promise<User> {
    console.log('  [DB] 写入数据库: createUser()');
    return this.userRepository.save(data);
  }

  /**
   * 更新用户（更新单条缓存）
   *
   * TypeScript: @CachePut({ key: 'user', ttl: 300 })
   * Java: @CachePut(value = "user", key = "#id")
   */
  @CachePut({ key: 'user', ttl: 300, keyGenerator: (id: unknown) => String(id as number) })
  async updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User> {
    console.log(`  [DB] 更新数据库: updateUser(${id})`);
    return this.userRepository.update(id, data);
  }

  /**
   * 删除用户（清除单条缓存）
   *
   * TypeScript: @CacheEvict({ key: 'user' })
   * Java: @CacheEvict(value = "user", key = "#id")
   */
  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<boolean> {
    console.log(`  [DB] 删除数据库: deleteUser(${id})`);
    return this.userRepository.remove(id);
  }
}
