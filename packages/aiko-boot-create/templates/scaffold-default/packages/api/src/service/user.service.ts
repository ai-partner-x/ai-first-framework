import 'reflect-metadata';
import { Injectable, Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { MethodPermission } from '@ai-partner-x/aiko-boot-starter-security';
import bcrypt from 'bcryptjs';
import { UserMapper } from '../mapper/user.mapper.js';
import { UserRoleMapper } from '../mapper/user-role.mapper.js';
import { RoleMapper } from '../mapper/role.mapper.js';
import type { CreateUserDto, UpdateUserDto, UserPageDto, UserVo } from '../dto/user.dto.js';

@Injectable()
export class UserService {
  @Autowired(UserMapper)
  private userMapper!: UserMapper;

  @Autowired(UserRoleMapper)
  private userRoleMapper!: UserRoleMapper;

  @Autowired(RoleMapper)
  private roleMapper!: RoleMapper;

  @MethodPermission('user', 'page', {
    description: '查询用户分页服务方法',
    group: '用户服务',
  })
  async pageUsers(params: UserPageDto) {
    const allUsers = await this.userMapper.selectList();
    let filtered = allUsers;
    if (params.username) {
      const username = params.username;
      const temp: typeof allUsers = [];
      for (let i = 0; i < filtered.length; i++) {
        const u = filtered[i];
        if (u.username.includes(username)) {
          temp.push(u);
        }
      }
      filtered = temp;
    }
    if (params.status !== undefined) {
      const status = params.status;
      const temp: typeof allUsers = [];
      for (let i = 0; i < filtered.length; i++) {
        const u = filtered[i];
        if (u.status === status) {
          temp.push(u);
        }
      }
      filtered = temp;
    }
    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 10;
    const total = filtered.length;
    const start = (pageNo - 1) * pageSize;
    const end = start + pageSize;
    const records = filtered.slice(start, end);
    const usersWithRoles: UserVo[] = [];
    for (let i = 0; i < records.length; i++) {
      const u = records[i];
      const vo = await this.toVo(this.parseEntityDates(u));
      usersWithRoles.push(vo);
    }
    return { records: usersWithRoles, total, pageNo, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  @MethodPermission('user', 'read', {
    description: '查询用户服务方法',
    group: '用户服务',
  })
  async getById(id: number): Promise<UserVo> {
    const user = await this.userMapper.selectById(id);
    if (!user) throw new Error('用户不存在');
    return this.toVo(this.parseEntityDates(user));
  }



  @MethodPermission('user', 'create', {
    description: '创建用户服务方法',
    group: '用户服务',
  })
  async createUser(dto: CreateUserDto): Promise<UserVo> {
    const exists = await this.userMapper.selectByUsername(dto.username);
    if (exists) throw new Error('用户名已存在');
    const hashed = await bcrypt.hash(dto.password, 10);
    const status = dto.status !== undefined ? dto.status : 1;
    await this.userMapper.insert({
      username: dto.username,
      passwordHash: hashed,
      realName: dto.realName,
      email: dto.email,
      phone: dto.phone,
      status: status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const user = await this.userMapper.selectByUsername(dto.username);
    if (!user) throw new Error('创建用户失败');
    if (dto.roleIds !== undefined && dto.roleIds.length > 0) await this.assignRoles(user.id, dto.roleIds);
    return this.toVo(this.parseEntityDates(user));
  }



  @MethodPermission('user', 'update', {
    description: '更新用户服务方法',
    group: '用户服务',
  })
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



  @MethodPermission('user', 'delete', {
    description: '删除用户服务方法',
    group: '用户服务',
  })
  async deleteUser(id: number): Promise<boolean> {
    let user = await this.userMapper.selectById(id);
    if (!user) throw new Error('用户不存在');
    await this.userRoleMapper.delete({ userId: id });
    return this.userMapper.deleteById(id);
  }


  @MethodPermission('user', 'reset-password', {
    description: '重置密码服务方法',
    group: '用户服务',
  })
  async resetPassword(id: number, newPassword: string): Promise<void> {
    let user = await this.userMapper.selectById(id);
    if (!user) throw new Error('用户不存在');
    user = this.parseEntityDates(user);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
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
    for (let i = 0; i < userRoles.length; i++) {
      const ur = userRoles[i];
      const role = await this.roleMapper.selectById(ur.roleId);
      if (role) roles.push(role.roleCode);
    }
    const safe: any = {};
    for (const key in user) {
      if (key !== 'password') {
        safe[key] = user[key];
      }
    }
    return { ...safe, roles };
  }
}
