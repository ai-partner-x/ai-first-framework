/**
 * 用户缓存服务 - aiko-boot-starter-cache 使用示例
 *
 * 通过在 UserService 外层增加缓存装饰器，无需修改原有业务逻辑：
 * - @Cacheable  — 缓存查询结果（读通缓存）：命中直接返回，未命中执行方法后写入缓存
 * - @CachePut   — 执行方法并将返回值写入缓存（写通缓存）：每次都执行方法，确保缓存最新
 * - @CacheEvict — 数据变更时清除缓存条目或整个命名空间
 *
 * 启用缓存：在 app.config.ts 中将 cache.enabled 设为 true 并配置 Redis 地址。
 * 未配置 Redis 时，缓存装饰器自动降级为直接调用原方法，不影响功能。
 *
 * 对应 Java Spring Boot:
 * ```java
 * @Service
 * public class UserCacheService {
 *     @Autowired
 *     private UserService userService;
 *
 *     @Cacheable(value = "user", key = "#id")
 *     public User getUserById(Long id) { return userService.getUserById(id); }
 *
 *     @Cacheable(value = "users")
 *     public List<User> getAllUsers() { return userService.getAllUsers(); }
 *
 *     @CacheEvict(value = "users", allEntries = true)
 *     public User createUser(CreateUserDto dto) { return userService.createUser(dto); }
 *
 *     @CachePut(value = "user", key = "#id")
 *     public User updateUser(Long id, UpdateUserDto dto) { return userService.updateUser(id, dto); }
 *
 *     @CacheEvict(value = "user", key = "#id")
 *     public boolean deleteUser(Long id) { return userService.deleteUser(id); }
 * }
 * ```
 */
import 'reflect-metadata';
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import {
  Cacheable,
  CachePut,
  CacheEvict,
} from '@ai-partner-x/aiko-boot-starter-cache';
import { User } from '../entity/user.entity.js';
import { UserService } from './user.service.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';

@Service()
export class UserCacheService {
  @Autowired()
  private userService!: UserService;

  /**
   * 按 ID 查询用户（缓存命中时不访问数据库）
   *
   * @Cacheable - 先查缓存，命中则直接返回；未命中则执行方法并将结果写入缓存。
   * 对应 Java: @Cacheable(value = "user", key = "#id")
   *
   * 缓存 key: user::{id}，例如 user::1
   * TTL: 300 秒（5 分钟）
   */
  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    return this.userService.getUserById(id);
  }

  /**
   * 查询所有用户（缓存整个列表）
   *
   * @Cacheable - 缓存用户列表，使用较短的 TTL 避免数据长时间过期。
   * 对应 Java: @Cacheable(value = "users")
   *
   * 缓存 key: users::（无参数时退化为命名空间本身）
   * TTL: 60 秒（1 分钟）
   */
  @Cacheable({ key: 'users', ttl: 60 })
  async getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  /**
   * 创建用户（创建成功后清空列表缓存）
   *
   * @CacheEvict(allEntries=true) - 新用户插入后清空 users 列表缓存，
   *   确保下次查询列表时从数据库重新加载，包含最新数据。
   * 对应 Java: @CacheEvict(value = "users", allEntries = true)
   */
  @CacheEvict({ key: 'users', allEntries: true })
  async createUser(dto: CreateUserDto): Promise<User> {
    return this.userService.createUser(dto);
  }

  /**
   * 更新用户（更新数据库后同步写入缓存）
   *
   * @CachePut - 每次都执行方法（不跳过），并将返回值写入缓存，
   *   使缓存中的用户数据与数据库保持一致（写通缓存）。
   * 对应 Java: @CachePut(value = "user", key = "#id")
   *
   * keyGenerator 取第一个参数（id）作为缓存条目 key，
   *   确保与 getUserById 的 @Cacheable 使用相同的 key 格式：user::{id}
   * TTL: 300 秒（5 分钟）
   */
  @CachePut({ key: 'user', ttl: 300, keyGenerator: (id) => String(id) })
  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(id, dto);
  }

  /**
   * 删除用户（删除数据库记录后清除对应的缓存条目）
   *
   * @CacheEvict - 删除成功后清除该用户的缓存，防止读到已删除的旧数据。
   * 对应 Java: @CacheEvict(value = "user", key = "#id")
   *
   * keyGenerator 确保缓存 key 与 getUserById 的 @Cacheable 一致：user::{id}
   */
  @CacheEvict({ key: 'user', keyGenerator: (id) => String(id) })
  async deleteUser(id: number): Promise<boolean> {
    return this.userService.deleteUser(id);
  }
}
