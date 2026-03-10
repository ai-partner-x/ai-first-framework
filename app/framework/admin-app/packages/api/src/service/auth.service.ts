import 'reflect-metadata';
import { Injectable, Autowired } from '@ai-partner-x/aiko-boot/di/server';
import bcrypt from 'bcryptjs';
import { SysUserMapper } from '../mapper/sys-user.mapper.js';
import { SysUserRoleMapper } from '../mapper/sys-user-role.mapper.js';
import { SysRoleMapper } from '../mapper/sys-role.mapper.js';
import { SysRoleMenuMapper } from '../mapper/sys-role-menu.mapper.js';
import { SysMenuMapper } from '../mapper/sys-menu.mapper.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import type { TokenVo } from '../dto/auth.dto.js';

@Injectable()
export class AuthService {
  @Autowired()
  private userMapper!: SysUserMapper;

  @Autowired()
  private userRoleMapper!: SysUserRoleMapper;

  @Autowired()
  private roleMapper!: SysRoleMapper;

  @Autowired()
  private roleMenuMapper!: SysRoleMenuMapper;

  @Autowired()
  private menuMapper!: SysMenuMapper;

  async login(username: string, password: string): Promise<TokenVo> {
    const user = await this.userMapper.selectByUsername(username);
    if (!user) throw new Error('用户名或密码错误');
    if (user.status === 0) throw new Error('账户已被禁用');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('用户名或密码错误');

    const { roles, permissions } = await this.getUserRolesAndPermissions(user.id);

    const payload = { userId: user.id, username: user.username, roles, permissions };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken({ userId: user.id }),
      userInfo: { id: user.id, username: user.username, realName: user.realName, roles, permissions },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const payload = verifyRefreshToken(refreshToken);
    const user = await this.userMapper.selectById(payload.userId);
    if (!user || user.status === 0) throw new Error('用户不存在或已禁用');

    const { roles, permissions } = await this.getUserRolesAndPermissions(user.id);
    const accessToken = signAccessToken({ userId: user.id, username: user.username, roles, permissions });
    return { accessToken };
  }

  async getUserInfo(userId: number) {
    const user = await this.userMapper.selectById(userId);
    if (!user) throw new Error('用户不存在');
    const { roles, permissions } = await this.getUserRolesAndPermissions(userId);
    const { password: _p, ...safeUser } = user as any;
    return { ...safeUser, roles, permissions };
  }

  private async getUserRolesAndPermissions(userId: number) {
    const userRoles = await this.userRoleMapper.selectList({ userId });
    if (!userRoles.length) return { roles: [], permissions: [] };

    const roleIds = userRoles.map(ur => ur.roleId);
    const roles: string[] = [];
    const permissions: string[] = [];

    for (const roleId of roleIds) {
      const role = await this.roleMapper.selectById(roleId);
      if (role && role.status === 1) {
        roles.push(role.roleCode);
        const roleMenus = await this.roleMenuMapper.selectList({ roleId });
        for (const rm of roleMenus) {
          const menu = await this.menuMapper.selectById(rm.menuId);
          if (menu?.permission) permissions.push(menu.permission);
        }
      }
    }
    return { roles: [...new Set(roles)], permissions: [...new Set(permissions)] };
  }
}
