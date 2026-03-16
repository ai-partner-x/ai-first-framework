import { Service } from '@ai-partner-x/aiko-boot';
import type { User, Role, Permission } from '../entities/index.js';

@Service()
export class PermissionService {
  // 支持直接权限字符串列表（如业务代码中的permissions字段）
  // 或者通过嵌套的roles结构
  async hasPermission(user: User, permission: string): Promise<boolean> {
    // 优先使用直接的permissions字段（业务代码中的实现）
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permission);
    }

    // 降级到嵌套的roles结构
    if (!user.roles) return false;

    return user.roles.some(function (role: Role) {
      return role.permissions && role.permissions.some(function (perm: Permission) {
        // 支持字符串或对象格式
        const permName = typeof perm === 'string' ? perm : perm.name;
        return permName === permission;
      });
    });
  }

  async hasPermissions(user: User, permissions: string[]): Promise<boolean> {
    const self = this;
    const results = await Promise.all(
      permissions.map(function (p) {
        return self.hasPermission(user, p);
      })
    );
    return results.every(function (r) {
      return r;
    });
  }

  async hasAnyPermission(user: User, permissions: string[]): Promise<boolean> {
    const self = this;
    const results = await Promise.all(
      permissions.map(function (p) {
        return self.hasPermission(user, p);
      })
    );
    return results.some(function (r) {
      return r;
    });
  }

  hasRole(user: User, role: string): boolean {
    if (!user.roles) return false;
    // 支持role.name（嵌套结构）或直接字符串（扁平结构）
    return user.roles.some(function (r) {
      const roleName = typeof r === 'string' ? r : r.name;
      return roleName === role;
    });
  }

  hasAllRoles(user: User, roles: string[]): boolean {
    if (!user.roles) return false;
    const userRoles = user.roles.map(function (r) {
      return typeof r === 'string' ? r : r.name;
    });
    return roles.every(function (role) {
      return userRoles.indexOf(role) !== -1;
    });
  }

  hasAnyRole(user: User, roles: string[]): boolean {
    if (!user.roles) return false;
    return user.roles.some(function (r) {
      const roleName = typeof r === 'string' ? r : r.name;
      return roles.indexOf(roleName) !== -1;
    });
  }
}
