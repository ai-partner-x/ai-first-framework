import { Autowired } from '@ai-partner-x/aiko-boot';
import { PermissionGuard } from '../permission/guard.js';
import { SecurityContext } from '../context/security.context.js';
import { type Permission } from '../entities/index.js';
import {
  getPreAuthorizeMetadata,
  getSecuredMetadata,
  getApiPermissionMetadata,
  getMethodPermissionMetadata,
  getButtonPermissionMetadata,
  getRolePermissionMetadata,
  getMenuPermissionMetadata,
  type PermissionDefinition,
} from '../permission/decorators.js';

// 移除 @Injectable() 和 @Singleton() 装饰器
// 让 SecurityAutoConfiguration 通过 @Bean() 和 @ConditionalOnMissingBean() 来管理Bean创建
export class PermissionInterceptor {
  @Autowired()
  private permissionGuard!: PermissionGuard;

  @Autowired()
  private securityContext!: SecurityContext;

  async intercept(request: any, response: any, next: any): Promise<void> {
    const handler = request.route?.stack?.[request.route?.stack?.length - 1];
    if (!handler) {
      next();
      return;
    }

    const target = handler.handle?.bind(handler);
    if (!target) {
      next();
      return;
    }

    // 检查细粒度权限装饰器
    const apiPermission = getApiPermissionMetadata(target, request.method.toLowerCase());
    const methodPermission = getMethodPermissionMetadata(target, request.method.toLowerCase());
    const buttonPermission = getButtonPermissionMetadata(target, request.method.toLowerCase());
    const menuPermission = getMenuPermissionMetadata(target, request.method.toLowerCase());  // 添加菜单权限检查
    const rolePermission = getRolePermissionMetadata(target, request.method.toLowerCase());  // 添加角色权限检查

    // 检查传统权限装饰器
    const preAuthorize = getPreAuthorizeMetadata(target, request.method.toLowerCase());
    const secured = getSecuredMetadata(target, request.method.toLowerCase());

    // 如果没有任何权限要求，直接放行
    if (!apiPermission && !methodPermission && !buttonPermission && !menuPermission && !rolePermission && !preAuthorize && (!secured || secured.length === 0)) {
      next();
      return;
    }

    const user = this.securityContext.getCurrentUser();

    // 1. 检查细粒度权限
    if (apiPermission) {
      const canAccess = await this.checkApiPermission(user, apiPermission);
      if (!canAccess) {
        this.sendForbidden(response, `Access denied. Required API permission: ${this.generatePermissionCode(apiPermission)}`);
        return;
      }
    }

    if (methodPermission) {
      const canAccess = await this.checkMethodPermission(user, methodPermission);
      if (!canAccess) {
        this.sendForbidden(response, `Access denied. Required method permission: ${this.generatePermissionCode(methodPermission)}`);
        return;
      }
    }

    if (buttonPermission) {
      const canAccess = await this.checkButtonPermission(user, buttonPermission);
      if (!canAccess) {
        this.sendForbidden(response, `Access denied. Required button permission: ${this.generatePermissionCode(buttonPermission)}`);
        return;
      }
    }

    // 2. 检查传统权限装饰器
    if (preAuthorize) {
      const canAccess = await this.permissionGuard.canActivate(user, preAuthorize);
      if (!canAccess) {
        this.sendForbidden(response, 'Access denied. You do not have permission to access this resource.');
        return;
      }
    }
    // 2.1 检查菜单权限
    if (menuPermission) {
      const canAccess = await this.permissionGuard.canActivate(user, this.generatePermissionCode(menuPermission));
      if (!canAccess) {
        this.sendForbidden(response, `Access denied. Required menu permission: ${this.generatePermissionCode(menuPermission)}`);
        return;
      }
    }
    // 2.2 检查角色权限
    if (rolePermission) {
      const canAccess = await this.permissionGuard.canActivate(user, this.generatePermissionCode(rolePermission));
      if (!canAccess) {
        this.sendForbidden(response, `Access denied. Required role permission: ${this.generatePermissionCode(rolePermission)}`);
        return;
      }
    }

    if (secured && secured.length > 0) {
      // 合并所有权限要求（包括菜单和角色权限）
      const allPermissions: string[] = [...secured];
      if (menuPermission) allPermissions.push(this.generatePermissionCode(menuPermission));
      if (rolePermission) allPermissions.push(this.generatePermissionCode(rolePermission));

      const canAccess = await this.permissionGuard.canActivateWithPermissions(user, allPermissions);
      if (!canAccess) {
        this.sendForbidden(response, 'Access denied. Required permissions: ' + allPermissions.join(', '));
        return;
      }
    }

    next();
  }

  /**
   * 检查API权限
   *
   * @param user - 当前用户
   * @param permission - 权限定义
   * @returns 是否有权限
   */
  async checkApiPermission(user: any, permission: PermissionDefinition): Promise<boolean> {
    const permissionCode = this.generatePermissionCode(permission);

    // 如果用户有直接的permissions字段，优先检查
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permissionCode);
    }

    // 否则检查roles中的权限
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some((role: any) => {
        const rolePermissions = typeof role === 'string' ? [] : (role.permissions || []);
        return rolePermissions.some((perm: Permission | string) => {
          const permCode = typeof perm === 'string' ? perm : perm.permissionCode;
          return permCode === permissionCode;
        });
      });
    }

    return false;
  }

  /**
   * 检查方法权限
   *
   * @param user - 当前用户
   * @param permission - 权限定义
   * @returns 是否有权限
   */
  async checkMethodPermission(user: any, permission: PermissionDefinition): Promise<boolean> {
    return this.checkApiPermission(user, permission); // 方法权限和API权限使用相同的检查逻辑
  }

  /**
   * 检查按钮权限
   *
   * @param user - 当前用户
   * @param permission - 权限定义
   * @returns 是否有权限
   */
  async checkButtonPermission(user: any, permission: PermissionDefinition): Promise<boolean> {
    return this.checkApiPermission(user, permission); // 按钮权限和API权限使用相同的检查逻辑
  }

  /**
   * 检查权限（通用方法）
   *
   * @param target - 目标对象
   * @param propertyKey - 属性键
   * @param _request - 请求对象（未使用，保留为参数）
   * @returns 是否有权限
   */
  async checkPermission(target: any, propertyKey: string, _request: any): Promise<boolean> {
    // 检查细粒度权限
    const apiPermission = getApiPermissionMetadata(target, propertyKey);
    const methodPermission = getMethodPermissionMetadata(target, propertyKey);
    const buttonPermission = getButtonPermissionMetadata(target, propertyKey);

    // 检查传统权限
    const preAuthorize = getPreAuthorizeMetadata(target, propertyKey);
    const secured = getSecuredMetadata(target, propertyKey);

    const user = this.securityContext.getCurrentUser();

    // 优先检查细粒度权限
    if (apiPermission) {
      const canAccess = await this.checkApiPermission(user, apiPermission);
      if (!canAccess) return false;
    }

    if (methodPermission) {
      const canAccess = await this.checkMethodPermission(user, methodPermission);
      if (!canAccess) return false;
    }

    if (buttonPermission) {
      const canAccess = await this.checkButtonPermission(user, buttonPermission);
      if (!canAccess) return false;
    }

    // 检查传统权限
    if (preAuthorize) {
      return this.permissionGuard.canActivate(user, preAuthorize);
    }

    if (secured && secured.length > 0) {
      return this.permissionGuard.canActivateWithPermissions(user, secured);
    }

    return true;
  }

  /**
   * 检查是否有任意一个权限
   *
   * @param permissions - 权限定义列表
   * @returns 是否有任意一个权限
   */
  async hasAnyPermission(permissions: PermissionDefinition[]): Promise<boolean> {
    const user = this.securityContext.getCurrentUser();
    if (!user) return false;

    for (const permission of permissions) {
      const hasPerm = await this.checkApiPermission(user, permission);
      if (hasPerm) return true;
    }

    return false;
  }

  /**
   * 检查是否有所有权限
   *
   * @param permissions - 权限定义列表
   * @returns 是否有所有权限
   */
  async hasAllPermissions(permissions: PermissionDefinition[]): Promise<boolean> {
    const user = this.securityContext.getCurrentUser();
    if (!user) return false;

    for (const permission of permissions) {
      const hasPerm = await this.checkApiPermission(user, permission);
      if (!hasPerm) return false;
    }

    return true;
  }

  /**
   * 生成权限码
   *
   * @param permission - 权限定义
   * @returns 权限码
   */
  private generatePermissionCode(permission: PermissionDefinition): string {
    const typeStr = permission.type.toLowerCase();
    return `${typeStr}:${permission.resource}:${permission.action}`;
  }

  /**
   * 发送403禁止访问响应
   *
   * @param response - 响应对象
   * @param message - 错误消息
   */
  private sendForbidden(response: any, message: string): void {
    response.status(403).json({
      error: 'Forbidden',
      message,
    });
  }
}
