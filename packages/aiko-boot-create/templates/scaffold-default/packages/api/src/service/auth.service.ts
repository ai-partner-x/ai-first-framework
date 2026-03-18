import 'reflect-metadata';
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // 只用于refresh token，access token使用安全组件
import { JwtStrategy } from '@ai-partner-x/aiko-boot-starter-security';
import { UserMapper } from '../mapper/user.mapper.js';
import { UserRoleMapper } from '../mapper/user-role.mapper.js';
import { RoleMapper } from '../mapper/role.mapper.js';
import { RoleMenuMapper } from '../mapper/role-menu.mapper.js';
import { MenuMapper } from '../mapper/menu.mapper.js';
import type { User } from '@ai-partner-x/aiko-boot-starter-security';

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

  @Autowired(JwtStrategy)
  private jwtStrategy!: JwtStrategy;

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

    // 生成JWT token - 使用安全组件的JwtStrategy
    const accessToken = await this.jwtStrategy.generateToken(frameworkUser as User);
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

    const accessToken = await this.jwtStrategy.generateToken(frameworkUser as User);
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
    try {
      // 使用安全组件的JwtStrategy验证token
      const user = await this.jwtStrategy.validate(accessToken);
      if (!user) {
        throw new Error('Invalid token');
      }
      return this.getUserInfo(user.id);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token: ' + error.message);
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token not active yet');
      }
      throw error;
    }
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

  // Refresh token 方法（使用独立的secret，与安全组件的JWT分离）
  private generateRefreshToken(userId: number): string {
    const secret = process.env.JWT_REFRESH_SECRET || 'ai-first-refresh-secret-change-in-production';
    const expiresIn = '7d';

    return jwt.sign({ userId }, secret, { expiresIn } as any);
  }

  private verifyRefreshToken(token: string): any {
    const secret = process.env.JWT_REFRESH_SECRET || 'ai-first-refresh-secret-change-in-production';
    return jwt.verify(token, secret);
  }
}

