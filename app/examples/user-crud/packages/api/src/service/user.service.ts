import 'reflect-metadata';
import { Service, Transactional, Autowired, Async } from '@ai-partner-x/aiko-boot';
import { QueryWrapper, UpdateWrapper } from '@ai-partner-x/aiko-boot-starter-orm';
import {
  Cacheable,
  CachePut,
  CacheEvict,
} from '@ai-partner-x/aiko-boot-starter-cache';
import { User } from '../entity/user.entity.js';
import { UserMapper } from '../mapper/user.mapper.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';

/**
 * 用户搜索参数
 */
export interface UserSearchParams {
  username?: string;      // 用户名模糊搜索
  email?: string;         // 邮箱模糊搜索
  minAge?: number;        // 最小年龄
  maxAge?: number;        // 最大年龄
  page?: number;          // 页码
  pageSize?: number;      // 每页条数
  orderBy?: string;       // 排序字段: 'id' | 'username' | 'age' | 'createdAt'
  orderDir?: string;      // 排序方向: 'asc' | 'desc'
}

/**
 * 用户搜索结果
 */
export interface UserSearchResult {
  data: User[];
  total: number;
}

@Service()
export class UserService {
  @Autowired()
  private userMapper!: UserMapper;

  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    return this.userMapper.selectById(id);
  }

  @Cacheable({ key: 'users', ttl: 60, keyGenerator: () => 'all' })
  async getUserList(_page: number, _pageSize: number): Promise<User[]> {
    // 简化版分页查询，返回用户列表
    return this.userMapper.selectList();
  }

  @Cacheable({ key: 'users', ttl: 60 })
  async getAllUsers(): Promise<User[]> {
    return this.userMapper.selectList();
  }

  /**
   * 使用 QueryWrapper 进行高级搜索
   *
   * @example
   * ```typescript
   * // 搜索年龄在 20-30 之间，用户名包含 "test" 的用户
   * await userService.searchUsers({
   *   username: 'test',
   *   minAge: 20,
   *   maxAge: 30,
   *   orderBy: 'createdAt',
   *   orderDir: 'desc'
   * });
   * ```
   */
  async searchUsers(params: UserSearchParams): Promise<UserSearchResult> {
    const username = params.username;
    const email = params.email;
    const minAge = params.minAge;
    const maxAge = params.maxAge;
    const page = params.page !== undefined ? params.page : 1;
    const pageSize = params.pageSize !== undefined ? params.pageSize : 10;
    const orderBy = params.orderBy !== undefined ? params.orderBy : 'id';
    const orderDir = params.orderDir !== undefined ? params.orderDir : 'desc';

    // 构建 QueryWrapper - MyBatis-Plus 风格
    const wrapper = new QueryWrapper<User>();

    // 用户名模糊搜索
    if (username) {
      wrapper.like('username', username);
    }

    // 邮箱模糊搜索
    if (email) {
      wrapper.like('email', email);
    }

    // 年龄范围查询
    if (minAge !== undefined && maxAge !== undefined) {
      wrapper.between('age', minAge, maxAge);
    } else if (minAge !== undefined) {
      wrapper.ge('age', minAge);
    } else if (maxAge !== undefined) {
      wrapper.le('age', maxAge);
    }

    // 排序
    if (orderDir === 'asc') {
      wrapper.orderByAsc(orderBy as keyof User);
    } else {
      wrapper.orderByDesc(orderBy as keyof User);
    }

    // 分页
    wrapper.page(page, pageSize);

    // 执行查询
    const data = await this.userMapper.selectListByWrapper(wrapper);

    // 统计总数（不带分页的 wrapper）
    const countWrapper = new QueryWrapper<User>();
    if (username) countWrapper.like('username', username);
    if (email) countWrapper.like('email', email);
    if (minAge !== undefined && maxAge !== undefined) {
      countWrapper.between('age', minAge, maxAge);
    } else if (minAge !== undefined) {
      countWrapper.ge('age', minAge);
    } else if (maxAge !== undefined) {
      countWrapper.le('age', maxAge);
    }
    const total = await this.userMapper.selectCountByWrapper(countWrapper);

    const result: UserSearchResult = { data, total };
    return result;
  }

  /**
   * 使用 QueryWrapper 查询活跃用户（示例：年龄 > 18 且邮箱不为空）
   */
  async getActiveUsers(): Promise<User[]> {
    const wrapper = new QueryWrapper<User>()
      .gt('age', 18)
      .isNotNull('email')
      .orderByDesc('createdAt');

    return this.userMapper.selectListByWrapper(wrapper);
  }

  /**
   * 使用 OR 条件查询（示例：用户名或邮箱包含关键字）
   */
  async searchByKeyword(keyword: string): Promise<User[]> {
    const wrapper = new QueryWrapper<User>()
      .or(w => w.like('username', keyword).like('email', keyword))
      .orderByDesc('id');

    return this.userMapper.selectListByWrapper(wrapper);
  }

  @Transactional()
  @CacheEvict({ key: 'users', allEntries: true })
  async createUser(dto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existingWrapper = new QueryWrapper<User>().eq('username', dto.username);
    const existingList = await this.userMapper.selectListByWrapper(existingWrapper);
    if (existingList.length > 0) {
      throw new Error('用户名已存在');
    }

    const user: User = {
      id: 0,  // 自增字段，会被数据库覆盖
      username: dto.username,
      email: dto.email,
      age: dto.age,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.userMapper.insert(user);
    // 返回新创建的用户
    const newUserWrapper = new QueryWrapper<User>().eq('username', dto.username);
    const newUserList = await this.userMapper.selectListByWrapper(newUserWrapper);
    return newUserList[0];
  }

  @Transactional()
  @CacheEvict({ key: 'users', allEntries: true })
  @CachePut({ key: 'user', ttl: 300, keyGenerator: (id) => String(id) })
  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userMapper.selectById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (dto.username !== undefined) user.username = dto.username;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.age !== undefined) user.age = dto.age;
    user.updatedAt = new Date();

    await this.userMapper.updateById(user);
    // 返回更新后的用户
    return (await this.userMapper.selectById(id))!;
  }

  @Transactional()
  @CacheEvict({ key: 'user', keyGenerator: (id) => String(id) })
  @CacheEvict({ key: 'users', allEntries: true })
  async deleteUser(id: number): Promise<boolean> {
    const user = await this.userMapper.selectById(id);
    if (!user) {
      throw new Error('用户不存在');
    }
    const affected = await this.userMapper.deleteById(id);
    return affected > 0;
  }

  // ==================== UpdateWrapper 示例 ====================

  /**
   * 使用 UpdateWrapper 批量更新用户年龄
   *
   * @example
   * ```typescript
   * // 将所有 username 包含 'test' 的用户年龄设置为 25
   * await userService.batchUpdateAge('test', 25);
   * ```
   */
  @Transactional()
  @CacheEvict({ key: 'user', allEntries: true })
  @CacheEvict({ key: 'users', allEntries: true })
  async batchUpdateAge(usernameKeyword: string, newAge: number): Promise<number> {
    const wrapper = new UpdateWrapper<User>()
      .set('age', newAge)
      .set('updatedAt', new Date().toISOString())
      .like('username', usernameKeyword);

    return this.userMapper.updateWithWrapper(wrapper);
  }

  /**
   * 使用 UpdateWrapper 根据条件更新邮箱
   *
   * @example
   * ```typescript
   * // 将 ID 为 1 的用户邮箱更新为 new@test.com
   * await userService.updateEmailById(1, 'new@test.com');
   * ```
   */
  @Transactional()
  @CacheEvict({ key: 'user', keyGenerator: (id) => String(id) })
  @CacheEvict({ key: 'users', allEntries: true })
  async updateEmailById(id: number, newEmail: string): Promise<number> {
    const wrapper = new UpdateWrapper<User>()
      .set('email', newEmail)
      .set('updatedAt', new Date().toISOString())
      .eq('id', id);

    return this.userMapper.updateWithWrapper(wrapper);
  }

  /**
   * 使用 QueryWrapper 批量删除（示例：删除指定年龄范围的用户）
   */
  @Transactional()
  @CacheEvict({ key: 'user', allEntries: true })
  @CacheEvict({ key: 'users', allEntries: true })
  async batchDeleteByAgeRange(minAge: number, maxAge: number): Promise<number> {
    const wrapper = new QueryWrapper<User>()
      .between('age', minAge, maxAge);
    
    return this.userMapper.deleteByWrapper(wrapper);
  }

  // ==================== @Async 示例 ====================

  /**
   * @Async - 异步后台审计日志（fire-and-forget，调用方不阻塞）
   *
   * 等同于 Spring Boot @Async：方法立即返回，实际逻辑在后台事件循环中执行。
   * 适用于发送通知、写入审计日志、触发异步流水线等场景。
   *
   * @example
   * // 在 controller 中调用后立即返回，不等待日志写入完成
   * this.userService.recordAuditLog('CREATE', userId, operatorId);
   */
  @Async()
  async recordAuditLog(action: string, userId: number, operatorId?: number): Promise<void> {
    // 模拟异步日志写入（如写入数据库或外部日志服务）
    const timestamp = new Date().toISOString();
    console.log(`[AuditLog] ${timestamp} action=${action} userId=${userId} operator=${operatorId ?? 'anonymous'}`);
  }

  /**
   * 更新用户最后修改时间（头像上传后调用）
   */
  @Transactional()
  async updateAvatar(id: number): Promise<User> {
    const user = await this.userMapper.selectById(id);
    if (!user) {
      throw new Error('用户不存在');
    }
    user.updatedAt = new Date();
    await this.userMapper.updateById(user);
    return (await this.userMapper.selectById(id))!;
  }
}
