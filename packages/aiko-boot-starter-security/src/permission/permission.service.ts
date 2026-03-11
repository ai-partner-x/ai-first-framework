import { Service } from '@ai-partner-x/aiko-boot';
import type { User, Role, Permission } from '../entities/index.js';

@Service()
export class PermissionService {
  private userMapper: any = null;

  setMappers(userMapper: any, _roleMapper?: any, _permissionMapper?: any): void {
    this.userMapper = userMapper;
  }

  async hasPermission(user: User, permission: string): Promise<boolean> {
    if (!this.userMapper) return false;

    const userWithRoles = await this.userMapper.selectById(user.id);
    if (!userWithRoles || !userWithRoles.roles) return false;

    return userWithRoles.roles.some(function (role: Role) {
      return role.permissions && role.permissions.some(function (perm: Permission) {
        return perm.name === permission;
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
    return user.roles.some(function (r) {
      return r.name === role;
    });
  }

  hasAllRoles(user: User, roles: string[]): boolean {
    if (!user.roles) return false;
    const userRoles = user.roles.map(function (r) {
      return r.name;
    });
    return roles.every(function (role) {
      return userRoles.indexOf(role) !== -1;
    });
  }

  hasAnyRole(user: User, roles: string[]): boolean {
    if (!user.roles) return false;
    return user.roles.some(function (r) {
      return roles.indexOf(r.name) !== -1;
    });
  }
}
