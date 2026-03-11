import 'reflect-metadata';
import { Service, Transactional, Autowired } from '@ai-partner-x/aiko-boot';
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
  username?: string;
  email?: string;
  minAge?: number;
  maxAge?: number;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: string;
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
    return this.userMapper.selectList();
  }

  @Cacheable({ key: 'users', ttl: 60 })
  async getAllUsers(): Promise<User[]> {
    return this.userMapper.selectList();
  }

  async searchUsers(params: UserSearchParams): Promise<UserSearchResult> {
    const username = params.username;
    const email = params.email;
    const minAge = params.minAge;
    const maxAge = params.maxAge;
    const page = params.page !== undefined ? params.page : 1;
    const pageSize = params.pageSize !== undefined ? params.pageSize : 10;
    const orderBy = params.orderBy !== undefined ? params.orderBy : 'id';
    const orderDir = params.orderDir !== undefined ? params.orderDir : 'desc';

    const wrapper = new QueryWrapper<User>();

    if (username) {
      wrapper.like('username', username);
    }

    if (email) {
      wrapper.like('email', email);
    }

    if (minAge !== undefined && maxAge !== undefined) {
      wrapper.between('age', minAge, maxAge);
    } else if (minAge !== undefined) {
      wrapper.ge('age', minAge);
    } else if (maxAge !== undefined) {
      wrapper.le('age', maxAge);
    }

    if (orderDir === 'asc') {
      wrapper.orderByAsc(orderBy as keyof User);
    } else {
      wrapper.orderByDesc(orderBy as keyof User);
    }

    wrapper.page(page, pageSize);

    const data = await this.userMapper.selectListByWrapper(wrapper);
    
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

  async getActiveUsers(): Promise<User[]> {
    const wrapper = new QueryWrapper<User>()
      .gt('age', 18)
      .isNotNull('email')
      .orderByDesc('createdAt');
    
    return this.userMapper.selectListByWrapper(wrapper);
  }

  async searchByKeyword(keyword: string): Promise<User[]> {
    const wrapper = new QueryWrapper<User>()
      .or(w => w.like('username', keyword).like('email', keyword))
      .orderByDesc('id');
    
    return this.userMapper.selectListByWrapper(wrapper);
  }

  @Transactional()
  @CacheEvict({ key: 'users', allEntries: true })
  async createUser(dto: CreateUserDto): Promise<User> {
    const existingWrapper = new QueryWrapper<User>().eq('username', dto.username);
    const existingList = await this.userMapper.selectListByWrapper(existingWrapper);
    if (existingList.length > 0) {
      throw new Error('用户名已存在');
    }

    const user: User = {
      id: 0,
      username: dto.username,
      email: dto.email,
      age: dto.age,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.userMapper.insert(user);
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

  @Transactional()
  @CacheEvict({ key: 'user', allEntries: true })
  @CacheEvict({ key: 'users', allEntries: true })
  async batchDeleteByAgeRange(minAge: number, maxAge: number): Promise<number> {
    const wrapper = new QueryWrapper<User>()
      .between('age', minAge, maxAge);
    
    return this.userMapper.deleteByWrapper(wrapper);
  }
}
