import 'reflect-metadata';
import { Service, Transactional } from '@ai-first/core';
import { Autowired } from '@ai-first/di/server';
import { validateDto } from '@ai-first/validation';
import { User } from '../entity/user.entity.js';
import { UserMapper } from '../mapper/user.mapper.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';

@Service()
export class UserService {
  @Autowired()
  private userMapper!: UserMapper;

  async getUserById(id: number): Promise<User | null> {
    return this.userMapper.selectById(id);
  }

  async getUserList(page = 1, pageSize = 10) {
    return this.userMapper.selectPage({ pageNo: page, pageSize });
  }

  async getAllUsers(): Promise<User[]> {
    return this.userMapper.selectList();
  }

  @Transactional()
  async createUser(dto: CreateUserDto): Promise<User> {
    const result = await validateDto(CreateUserDto, dto);
    if (!result.success) {
      throw new Error(result.errors?.map(e => e.message).join(', ') || 'Validation failed');
    }

    const existing = await this.userMapper.selectByUsername(dto.username);
    if (existing) {
      throw new Error('用户名已存在');
    }

    const user: Omit<User, 'id'> = {
      username: dto.username,
      email: dto.email,
      age: dto.age,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.userMapper.insert(user);
  }

  @Transactional()
  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const result = await validateDto(UpdateUserDto, dto);
    if (!result.success) {
      throw new Error(result.errors?.map(e => e.message).join(', ') || 'Validation failed');
    }

    const user = await this.userMapper.selectById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (dto.username !== undefined) user.username = dto.username;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.age !== undefined) user.age = dto.age;
    user.updatedAt = new Date();

    return this.userMapper.updateById(user);
  }

  @Transactional()
  async deleteUser(id: number): Promise<boolean> {
    const user = await this.userMapper.selectById(id);
    if (!user) {
      throw new Error('用户不存在');
    }
    return this.userMapper.deleteById(id);
  }
}
