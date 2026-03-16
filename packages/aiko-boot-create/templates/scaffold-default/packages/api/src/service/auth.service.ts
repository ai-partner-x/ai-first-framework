import 'reflect-metadata';
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserMapper } from '../mapper/user.mapper.js';
import { UserRoleMapper } from '../mapper/user-role.mapper.js';
import { RoleMapper } from '../mapper/role.mapper.js';
import { RoleMenuMapper } from '../mapper/role-menu.mapper.js';
import { MenuMapper } from '../mapper/menu.mapper.js';

import type { LoginDto, LoginResultDto } from '../dto/auth.dto.js';

@Service()
export class AuthService {
  @Autowired(UserMapper)
  private userMapper!: UserMapper;

  @Autowired(UserRoleMapper)
  private userRoleMapper!: UserRoleMapper;

  @Autowired(RoleMapper)
  private roleMapper!: RoleMapper;

  @Autowired(RoleMenuMapper)
  private roleMenuMapper!: RoleMenuMapper;

  @Autowired(MenuMapper)
  private menuMapper!: MenuMapper;

  async login(dto: LoginDto): Promise<LoginResultDto> {
    const user = await this.userMapper.selectByUsername(dto.username);
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    if (user.status === 0) throw new Error('账户已被禁用');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new Error('用户名或密码错误');

    const userRolesAndPerms = await this.getUserRolesAndPermissions(user.id);
    const roles = userRolesAndPerms.roles;
    const permissions = userRolesAndPerms.permissions;

    // 使用框架的User类型，包含roles和permissions字段
    const frameworkUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: roles.map(function(r) { return { id: 0, name: r }; }), // 转换为框架格式
      permissions: permissions, // 使用字符串数组格式
    };

    // 生成JWT token - 这里简化处理，实际应该通过框架的JwtStrategy
    const accessToken = this.generateAccessToken(frameworkUser);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      userInfo: { id: user.id, username: user.username, realName: user.realName, email: user.email, roles, permissions },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.userMapper.selectById(payload.userId);
    if (!user || user.status === 0) throw new Error('用户不存在或已禁用');

    const userRolesAndPerms = await this.getUserRolesAndPermissions(user.id);
    const roles = userRolesAndPerms.roles;
    const permissions = userRolesAndPerms.permissions;

    const frameworkUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: roles.map(function(r) { return { id: 0, name: r }; }),
      permissions: permissions,
    };

    const accessToken = this.generateAccessToken(frameworkUser);
    return { accessToken };
  }

  async getUserInfo(userId: number): Promise<LoginResultDto['userInfo']> {
    const user = await this.userMapper.selectById(userId);
    if (!user) throw new Error('用户不存在');
    const userRolesAndPerms = await this.getUserRolesAndPermissions(userId);
    const roles = userRolesAndPerms.roles;
    const permissions = userRolesAndPerms.permissions;
    const safeUser: any = {};
    for (const key in user) {
      if (key !== 'password') {
        safeUser[key] = user[key];
      }
    }
    return { ...safeUser, roles, permissions };
  }

  async getCurrentUserByToken(accessToken: string): Promise<LoginResultDto['userInfo']> {
    const payload = this.verifyAccessToken(accessToken);
    // JWT payload uses 'sub' field for user ID
    const userId = payload.sub || payload.userId;
    if (!userId) {
      throw new Error('Invalid token payload: missing user ID');
    }
    return this.getUserInfo(userId);
  }

  private async getUserRolesAndPermissions(userId: number) {
    const userRoles = await this.userRoleMapper.selectList({ userId });
    if (!userRoles.length) return { roles: [] as string[], permissions: [] as string[] };

    const roleIds: number[] = [];
    for (let i = 0; i < userRoles.length; i++) {
      roleIds.push(userRoles[i].roleId);
    }
    const roles: string[] = [];
    const permissions: string[] = [];

    for (let i = 0; i < roleIds.length; i++) {
      const roleId = roleIds[i];
      const role = await this.roleMapper.selectById(roleId);
      if (role && role.status === 1) {
        roles.push(role.roleCode);
        const roleMenus = await this.roleMenuMapper.selectList({ roleId });
        for (let j = 0; j < roleMenus.length; j++) {
          const rm = roleMenus[j];
          const menu = await this.menuMapper.selectById(rm.menuId);
          if (menu && menu.permission) permissions.push(menu.permission);
        }
      }
    }
    return { roles: [...new Set(roles)], permissions: [...new Set(permissions)] };
  }

  // 临时JWT生成方法，应该与框架的JwtStrategy保持一致
  private generateAccessToken(user: any): string {
    const secret = process.env.JWT_SECRET || 'aiko-boot-admin-secret-2025-develop-change';
    const expiresIn = '2h';

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles?.map(function(r) { return typeof r === 'string' ? r : r.name; }) || [],
      permissions: user.permissions || [],
    };
    return jwt.sign(payload, secret, { expiresIn } as any);
  }

  private generateRefreshToken(userId: number): string {
    const secret = process.env.JWT_REFRESH_SECRET || 'ai-first-refresh-secret-change-in-production';
    const expiresIn = '7d';

    return jwt.sign({ userId }, secret, { expiresIn } as any);
  }

  private verifyAccessToken(token: string): any {
    const secret = process.env.JWT_SECRET || 'aiko-boot-admin-secret-2025-develop-change';
    return jwt.verify(token, secret);
  }

  private verifyRefreshToken(token: string): any {
    const secret = process.env.JWT_REFRESH_SECRET || 'ai-first-refresh-secret-change-in-production';
    return jwt.verify(token, secret);
  }
}

