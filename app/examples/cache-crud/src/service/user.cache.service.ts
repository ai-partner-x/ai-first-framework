/**
 * 用户缓存服务
 *
 * 使用 @Service（通用 DI 装饰器）作为类装饰器，方法上使用缓存注解：
 * - @Cacheable 读通缓存（查询）
 * - @CachePut 写通缓存（更新）
 * - @CacheEvict 缓存失效（创建/删除）
 *
 * 底层数据访问通过 UserRepository（@Mapper + BaseMapper）读写 SQLite，
 * Redis 缓存命中时跳过 DB 访问。
 *
 * 对应 Java Spring Boot:
 * @Service
 * public class UserCacheService {
 *   @Autowired
 *   private UserRepository userRepository;
 *
 *   @Cacheable(value = "user", key = "#id")
 *   public User getUserById(Long id) { ... }
 * }
 */

import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Cacheable, CachePut, CacheEvict } from '@ai-partner-x/aiko-boot-starter-cache';
import { User } from '../entity/user.entity.js';
import { UserRepository } from '../entity/user.repository.js';

/**
 * @Service 作为类装饰器：
 * - 自动注册到 DI 容器（Injectable + Singleton）
 * - 支持 @Autowired 属性注入
 */
@Service({ name: 'UserCacheService' })
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
    return this.userRepository.selectById(id);
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
    return this.userRepository.selectList();
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
    await this.userRepository.insert(data);
    const list = await this.userRepository.selectList(data as Partial<User>);
    const created = list[list.length - 1];
    if (!created) throw new Error('Failed to create user');
    return created;
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
    const existing = await this.userRepository.selectById(id);
    if (!existing) throw new Error(`用户 ${id} 不存在`);
    const updated: User = { ...existing, ...data };
    await this.userRepository.updateById(updated);
    return updated;
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
    const affected = await this.userRepository.deleteById(id);
    return affected > 0;
  }
}
