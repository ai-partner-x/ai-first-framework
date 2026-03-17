import 'reflect-metadata';
import { PermissionType } from '../entities/index.js';

const PRE_AUTHORIZE_METADATA = 'aiko-boot:preAuthorize';
const POST_AUTHORIZE_METADATA = 'aiko-boot:postAuthorize';
const SECURED_METADATA = 'aiko-boot:secured';
const REQUIRE_PERMISSION_METADATA = 'aiko-boot:requirePermission';
const API_PERMISSION_METADATA = 'aiko-boot:apiPermission';
const METHOD_PERMISSION_METADATA = 'aiko-boot:methodPermission';
const BUTTON_PERMISSION_METADATA = 'aiko-boot:buttonPermission';
const ROLE_PERMISSION_METADATA = 'aiko-boot:rolePermission';
const MENU_PERMISSION_METADATA = 'aiko-boot:menuPermission';
const OTHER_PERMISSION_METADATA = 'other:permission';  // 添加常量

/**
 * 权限定义接口
 */
export interface PermissionDefinition {
  /** 权限类型 */
  type: PermissionType;
  /** 权限码 */
  permissionCode?: string;  // ✅ 添加
  /** 数据权限范围 */
  dataScope?: string;  // ✅ 添加
  /** 资源标识 */
  resource: string;
  /** 操作标识 */
  action: string;
  /** 权限描述 */
  description?: string;
  /** 权限组 */
  group?: string;
  /** 是否必需 */
  required?: boolean;
  /** 角色标识，用于角色权限 */
  roles?: string[];
  /** 菜单标识，用于菜单权限 */
  menuId?: string;
  /** 按钮标识，用于按钮权限 */
  buttonId?: string;
  /** 路由路径，用于API权限 */
  path?: string;
  /** HTTP方法，用于API权限 */
  httpMethod?: string;
}

/**
 * @PreAuthorize - Spring Security 风格的前置授权表达式
 *
 * @param expression - SpEL表达式，如 "hasRole('ADMIN')" 或 "hasPermission(#userId, 'read')"
 *
 * @example
 * ```typescript
 * @RestController('/users')
 * export class UserController {
 *   @GetMapping()
 *   @PreAuthorize("hasRole('ADMIN')")
 *   async list() { ... }
 *
 *   @GetMapping('/:id')
 *   @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
 *   async getById(@PathVariable('id') id: number) { ... }
 * }
 * ```
 */
export function PreAuthorize(expression: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(PRE_AUTHORIZE_METADATA, expression, target, propertyKey);
    return descriptor;
  };
}

/**
 * @PostAuthorize - 后置授权表达式，在方法执行后检查返回结果
 *
 * @param expression - SpEL表达式
 *
 * @example
 * ```typescript
 * @GetMapping('/sensitive')
 * @PostAuthorize("returnObject.owner == authentication.principal.id")
 * async getSensitiveData(): Promise<SensitiveData> { ... }
 * ```
 */
export function PostAuthorize(expression: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(POST_AUTHORIZE_METADATA, expression, target, propertyKey);
    return descriptor;
  };
}

/**
 * @Secured - 基于权限字符串列表的授权
 *
 * @param permissions - 权限字符串列表，用户需要拥有其中任意一个权限
 *
 * @example
 * ```typescript
 * @PostMapping()
 * @Secured('user:create', 'user:write')
 * async create() { ... }
 * ```
 */
export function Secured() {
  const permissions = Array.prototype.slice.call(arguments);
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(SECURED_METADATA, permissions, target, propertyKey);
    return descriptor;
  };
}

/**
 * @RequirePermission - 通用的权限需求装饰器
 *
 * @param permission - 权限定义
 *
 * @example
 * ```typescript
 * @PostMapping()
 * @RequirePermission({
 *   type: PermissionType.API,
 *   resource: 'user',
 *   action: 'create',
 *   description: '创建用户'
 * })
 * async create() { ... }
 * ```
 */
export function RequirePermission(permission: PermissionDefinition) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(REQUIRE_PERMISSION_METADATA, permission, target, propertyKey);
    return descriptor;
  };
}

/**
 * @ApiPermission - API端点权限装饰器
 *
 * @param resource - 资源标识，如 'user'、'order'
 * @param action - 操作标识，如 'create'、'read'、'update'、'delete'
 * @param options - 选项
 *
 * @example
 * ```typescript
 * @GetMapping()
 * @ApiPermission('user', 'read', {
 *   description: '查看用户列表',
 *   group: '用户管理'
 * })
 * async list() { ... }
 * ```
 */
export function ApiPermission(resource: string, action: string, options?: {
  description?: string;
  group?: string;
  required?: boolean;
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const permission: PermissionDefinition = {
      type: PermissionType.API,
      resource,
      action,
      description: options?.description,
      group: options?.group,
      required: options?.required !== false, // 默认为必需
    };
    Reflect.defineMetadata(API_PERMISSION_METADATA, permission, target, propertyKey);
    return descriptor;
  };
}

/**
 * @MethodPermission - 方法权限装饰器
 *
 * 用于Service层的方法权限控制
 *
 * @param resource - 资源标识
 * @param action - 操作标识
 * @param options - 选项
 *
 * @example
 * ```typescript
 * @Service()
 * export class UserService {
 *   @MethodPermission('user', 'create', {
 *     description: '创建用户服务方法',
 *     group: '用户服务'
 *   })
 *   async createUser() { ... }
 * }
 * ```
 */
export function MethodPermission(resource: string, action: string, options?: {
  description?: string;
  group?: string;
  required?: boolean;
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const permission: PermissionDefinition = {
      type: PermissionType.METHOD,
      resource,
      action,
      description: options?.description,
      group: options?.group,
      required: options?.required !== false,
    };
    Reflect.defineMetadata(METHOD_PERMISSION_METADATA, permission, target, propertyKey);
    return descriptor;
  };
}

/**
 * @ButtonPermission - 按钮权限装饰器
 *
 * 用于前端按钮的权限控制
 *
 * @param resource - 资源标识
 * @param action - 操作标识
 * @param options - 选项
 *
 * @example
 * ```typescript
 * @GetMapping('/users')
 * @ButtonPermission('user', 'delete', {
 *   description: '删除用户按钮',
 *   group: '用户管理',
 *   buttonId: 'btn-delete-user'
 * })
 * async list() { ... }
 * ```
 */
export function ButtonPermission(resource: string, action: string, options?: {
  description?: string;
  group?: string;
  buttonId?: string;
  required?: boolean;
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const permission: PermissionDefinition = {
      type: PermissionType.BUTTON,
      resource,
      action,
      description: options?.description,
      group: options?.group,
      required: options?.required !== false,
    };
    if (options?.buttonId) {
      (permission as any).buttonId = options.buttonId;
    }
    Reflect.defineMetadata(BUTTON_PERMISSION_METADATA, permission, target, propertyKey);
    return descriptor;
  };
}

// ==================== 元数据获取函数 ====================

export function getPreAuthorizeMetadata(target: any, propertyKey: string): string | undefined {
  return Reflect.getMetadata(PRE_AUTHORIZE_METADATA, target, propertyKey);
}

export function getPostAuthorizeMetadata(target: any, propertyKey: string): string | undefined {
  return Reflect.getMetadata(POST_AUTHORIZE_METADATA, target, propertyKey);
}

export function getSecuredMetadata(target: any, propertyKey: string): string[] {
  return Reflect.getMetadata(SECURED_METADATA, target, propertyKey) || [];
}

export function getRequirePermissionMetadata(target: any, propertyKey: string): PermissionDefinition | undefined {
  return Reflect.getMetadata(REQUIRE_PERMISSION_METADATA, target, propertyKey);
}

export function getApiPermissionMetadata(target: any, propertyKey: string): PermissionDefinition | undefined {
  return Reflect.getMetadata(API_PERMISSION_METADATA, target, propertyKey);
}

export function getMethodPermissionMetadata(target: any, propertyKey: string): PermissionDefinition | undefined {
  return Reflect.getMetadata(METHOD_PERMISSION_METADATA, target, propertyKey);
}

export function getButtonPermissionMetadata(target: any, propertyKey: string): PermissionDefinition | undefined {
  return Reflect.getMetadata(BUTTON_PERMISSION_METADATA, target, propertyKey);
}

export function getRolePermissionMetadata(target: any, propertyKey: string): PermissionDefinition | undefined {
  return Reflect.getMetadata(ROLE_PERMISSION_METADATA, target, propertyKey);
}

export function getMenuPermissionMetadata(target: any, propertyKey: string): PermissionDefinition | undefined {
  return Reflect.getMetadata(MENU_PERMISSION_METADATA, target, propertyKey);
}

/**
 * 获取所有权限定义（包括所有类型的权限装饰器）
 */
export function getAllPermissionMetadata(target: any, propertyKey: string): PermissionDefinition[] {
  const permissions: PermissionDefinition[] = [];

  const apiPerm = getApiPermissionMetadata(target, propertyKey);
  if (apiPerm) permissions.push(apiPerm);

  const methodPerm = getMethodPermissionMetadata(target, propertyKey);
  if (methodPerm) permissions.push(methodPerm);

  const buttonPerm = getButtonPermissionMetadata(target, propertyKey);
  if (buttonPerm) permissions.push(buttonPerm);

  const rolePerm = getRolePermissionMetadata(target, propertyKey);
  if (rolePerm) permissions.push(rolePerm);

  const menuPerm = getMenuPermissionMetadata(target, propertyKey);
  if (menuPerm) permissions.push(menuPerm);

  const requirePerm = getRequirePermissionMetadata(target, propertyKey);
  if (requirePerm) permissions.push(requirePerm);

  return permissions;
}

/**
 * @RolePermission - 角色权限装饰器
 *
 * 基于用户角色的权限控制
 *
 * @param roles - 允许的角色列表
 *
 * @example
 * ```typescript
 * @GetMapping('/admin')
 * @RolePermission('ADMIN', 'SUPER_ADMIN')
 * async adminPanel() { ... }
 * ```
 */
export function RolePermission(...roles: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const permission: PermissionDefinition = {
      type: PermissionType.OTHER,
      resource: 'role',
      action: roles.join('|'),
      description: `角色权限：${roles.join(', ')}`,
      roles,
    };
    Reflect.defineMetadata(ROLE_PERMISSION_METADATA, permission, target, propertyKey);
    return descriptor;
  };
}

/**
 * @MenuPermission - 菜单权限装饰器
 *
 * 基于菜单标识的权限控制
 *
 * @param menuId - 菜单标识
 * @param options - 选项
 *
 * @example
 * ```typescript
 * @GetMapping('/user/menu')
 * @MenuPermission('user-management')
 * async getUserMenu() { ... }
 * ```
 */
export function MenuPermission(menuId: string, options?: {
  description?: string;
  group?: string;
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const permission: PermissionDefinition = {
      type: PermissionType.MENU,
      resource: 'menu',
      action: 'access',
      permissionCode: `menu:${menuId}:access`,
      description: options?.description || `菜单权限：${menuId}`,
      menuId,
      group: options?.group || '菜单管理',
    };
    Reflect.defineMetadata(MENU_PERMISSION_METADATA, permission, target, propertyKey);
    return descriptor;
  };
}

/**
 * @DataPermission - 数据权限装饰器
 *
 * 基于数据标识的权限控制
 *
 * @param dataScope - 数据权限范围
 * @param options - 选项
 *
 * @example
 * ```typescript
 * @GetMapping('/sensitive-data')
 * @DataPermission('sensitive', {
 *   description: '敏感数据访问权限',
 *   group: '数据安全',
 * })
 * async getSensitiveData() { ... }
 * ```
 */
export function DataPermission(dataScope: string, options?: {
  description?: string;
  group?: string;
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const permission: PermissionDefinition = {
      type: PermissionType.OTHER,
      resource: 'data',
      action: 'access',
      permissionCode: `data:${dataScope}:access`,
      description: options?.description || `数据权限：${dataScope}`,
      group: options?.group || '数据安全',
      dataScope,
    };
    Reflect.defineMetadata(OTHER_PERMISSION_METADATA, permission, target, propertyKey);  // 使用常量键
    return descriptor;
  };
}
