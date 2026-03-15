/**
 * 权限类型枚举
 */
export enum PermissionType {
  /** API端点权限 */
  API = 'API',
  /** 方法权限 */
  METHOD = 'METHOD',
  /** 按钮权限 */
  BUTTON = 'BUTTON',
  /** 菜单权限 */
  MENU = 'MENU',
  /** 其他自定义权限 */
  OTHER = 'OTHER',
}

/**
 * 权限接口
 */
export interface Permission {
  id: number;
  name: string;
  /** 权限类型：API、METHOD、BUTTON、MENU、OTHER */
  type: PermissionType;
  /** 资源标识，如：user、user.create、button.delete */
  resource: string;
  /** 操作标识，如：read、write、delete */
  action: string;
  /** 权限标识符，格式：type:resource:action，如：api:user:read */
  permissionCode: string;
  /** 权限描述 */
  description?: string;
  /** 父权限ID，用于权限层级结构 */
  parentId?: number;
  /** 路由路径，用于API或菜单权限 */
  path?: string;
  /** HTTP方法，用于API权限：GET、POST、PUT、DELETE等 */
  httpMethod?: string;
  /** 按钮标识，用于按钮权限 */
  buttonId?: string;
  /** 权限组，用于权限分类 */
  group?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 排序序号 */
  sort?: number;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * 菜单接口
 */
export interface Menu {
  id: number;
  name: string;
  path?: string;
  icon?: string;
  parentId?: number;
  sort?: number;
  enabled?: boolean;
  permissions?: Permission[];
}

/**
 * 用户角色关联接口
 */
export interface UserRole {
  userId: number;
  roleId: number;
}

/**
 * 角色权限关联接口
 */
export interface RolePermission {
  roleId: number;
  permissionId: number;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  username: string;
  password?: string;
  email: string;
  roles?: Role[];
  permissions?: string[]; // 添加权限列表字段，支持业务代码中的权限结构
}
