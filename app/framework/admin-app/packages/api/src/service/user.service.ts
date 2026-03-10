import 'reflect-metadata';
import { Injectable, Autowired } from '@ai-partner-x/aiko-boot/di/server';
import bcrypt from 'bcryptjs';
import { SysUserMapper } from '../mapper/sys-user.mapper.js';
import { SysUserRoleMapper } from '../mapper/sys-user-role.mapper.js';
import { SysRoleMapper } from '../mapper/sys-role.mapper.js';
import type { CreateUserDto, UpdateUserDto, UserPageDto, UserVo } from '../dto/user.dto.js';

@Injectable()
export class UserService {
  @Autowired()
  private userMapper!: SysUserMapper;

  @Autowired()
  private userRoleMapper!: SysUserRoleMapper;

  @Autowired()
  private roleMapper!: SysRoleMapper;

  async pageUsers(params: UserPageDto) {
    const allUsers = await this.userMapper.selectList();
    let filtered = allUsers;
    if (params.username) {
      filtered = filtered.filter(u => u.username.includes(params.username!));
    }
    if (params.status !== undefined) {
      filtered = filtered.filter(u => u.status === params.status);
    }
    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 10;
    const total = filtered.length;
    const records = filtered.slice((pageNo - 1) * pageSize, pageNo * pageSize);
    const usersWithRoles = await Promise.all(records.map(u => this.toVo(this.parseEntityDates(u))));
    return { records: usersWithRoles, total, pageNo, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getById(id: number): Promise<UserVo> {
    const user = await this.userMapper.selectById(id);
    if (!user) throw new Error('用户不存在');
    return this.toVo(this.parseEntityDates(user));
  }



  async createUser(dto: CreateUserDto): Promise<UserVo> {
    const exists = await this.userMapper.selectByUsername(dto.username);
    if (exists) throw new Error('用户名已存在');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userMapper.insert({
      username: dto.username,
      password: hashed,
      realName: dto.realName,
      email: dto.email,
      phone: dto.phone,
      status: dto.status ?? 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (dto.roleIds?.length) await this.assignRoles(user.id, dto.roleIds);
    return this.toVo(this.parseEntityDates(user));
  }



  async updateUser(id: number, dto: UpdateUserDto): Promise<UserVo> {
    let user = await this.userMapper.selectById(id);
    if (!user) throw new Error('用户不存在');
    user = this.parseEntityDates(user);
    if (dto.realName !== undefined) user.realName = dto.realName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.status !== undefined) user.status = dto.status;
    user.updatedAt = new Date().toISOString();
    await this.userMapper.updateById(this.formatEntityDates(user));
    if (dto.roleIds !== undefined) await this.assignRoles(id, dto.roleIds);
    return this.toVo(this.parseEntityDates(user));
  }



  async deleteUser(id: number): Promise<boolean> {
    let user = await this.userMapper.selectById(id);
    if (!user) throw new Error('用户不存在');
    await this.userRoleMapper.delete({ userId: id });
    return this.userMapper.deleteById(id);
  }


  async resetPassword(id: number, newPassword: string): Promise<void> {
    let user = await this.userMapper.selectById(id);
    if (!user) throw new Error('用户不存在');
    user = this.parseEntityDates(user);
    user.password = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    await this.userMapper.updateById(this.formatEntityDates(user));
  }


  private async assignRoles(userId: number, roleIds: number[]) {
    await this.userRoleMapper.delete({ userId });
    for (const roleId of roleIds) {
      await this.userRoleMapper.insert({ userId, roleId });
    }
  }

  private parseEntityDates(entity: any): any {
    const parsed = { ...entity };
    if (parsed.createdAt && typeof parsed.createdAt === 'string') {
      parsed.createdAt = new Date(parsed.createdAt);
    }
    if (parsed.updatedAt && typeof parsed.updatedAt === 'string') {
      parsed.updatedAt = new Date(parsed.updatedAt);
    }
    return parsed;
  }

  private formatEntityDates(entity: any): any {
    const formatted = { ...entity };
    if (formatted.createdAt && formatted.createdAt instanceof Date) {
      formatted.createdAt = formatted.createdAt.toISOString();
    }
    if (formatted.updatedAt && formatted.updatedAt instanceof Date) {
      formatted.updatedAt = formatted.updatedAt.toISOString();
    }
    return formatted;
  }

  private async toVo(user: any): Promise<UserVo> {
    const userRoles = await this.userRoleMapper.selectList({ userId: user.id });
    const roles: string[] = [];
    for (const ur of userRoles) {
      const role = await this.roleMapper.selectById(ur.roleId);
      if (role) roles.push(role.roleCode);
    }
    const { password: _p, ...safe } = user;
    return { ...safe, roles };
  }
}
