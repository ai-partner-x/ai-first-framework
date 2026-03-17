# 权限控制示例

本示例展示如何使用 Aiko Boot Security 的权限控制功能实现细粒度的访问控制。

## 概述

权限控制是保护应用程序资源的重要机制，Aiko Boot Security 提供了基于角色和权限的访问控制（RBAC）。

## 核心概念

### 角色（Role）

角色是用户的身份标识，如 ADMIN、USER、MODERATOR 等。

### 权限（Permission）

权限是具体的操作许可，如 `user:read`、`user:write`、`post:delete` 等。

### 权限表达式

权限表达式用于定义复杂的访问规则，如 `hasRole('ADMIN')`、`hasPermission('user:read')` 等。

## 配置

```typescript
import type { AppConfig } from '@ai-partner-x/aiko-boot';

export default {
  server: {
    port: Number(process.env.PORT) || 3001,
    servlet: {
      contextPath: '/api',
    },
  },
  security: {
    enabled: true,
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '24h',
    },
    publicPaths: ['/api/auth/login', '/api/auth/register'],
  },
  database: {
    type: 'sqlite',
    filename: './data/app.db',
  },
} satisfies AppConfig;
```

## 实体定义

### User 实体

```typescript
import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'users' })
export class User {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  username!: string;

  @TableField()
  @Column()
  email!: string;

  @TableField()
  @Column()
  password!: string;

  @TableField()
  @Column()
  enabled!: boolean;

  @TableField()
  @Column()
  createdAt!: Date;

  @TableField()
  @Column()
  updatedAt!: Date;

  roles?: Role[];
  permissions?: Permission[];
}
```

### Role 实体

```typescript
import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'roles' })
export class Role {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  name!: string;

  @TableField()
  @Column()
  description!: string;

  @TableField()
  @Column()
  createdAt!: Date;

  @TableField()
  @Column()
  updatedAt!: Date;

  permissions?: Permission[];
}
```

### Permission 实体

```typescript
import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'permissions' })
export class Permission {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  name!: string;

  @TableField()
  @Column()
  description!: string;

  @TableField()
  @Column()
  resource!: string;

  @TableField()
  @Column()
  action!: string;

  @TableField()
  @Column()
  createdAt!: Date;

  @TableField()
  @Column()
  updatedAt!: Date;
}
```

### UserRole 实体（关联表）

```typescript
import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'user_roles' })
export class UserRole {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  userId!: number;

  @TableField()
  @Column()
  roleId!: number;

  @TableField()
  @Column()
  createdAt!: Date;
}
```

### RolePermission 实体（关联表）

```typescript
import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'role_permissions' })
export class RolePermission {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  roleId!: number;

  @TableField()
  @Column()
  permissionId!: number;

  @TableField()
  @Column()
  createdAt!: Date;
}
```

## DTO 定义

### CreateUserDto

```typescript
import { IsEmail, IsNotEmpty, MinLength, IsArray } from '@ai-partner-x/aiko-boot-starter-validation';

export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  username!: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码长度至少 8 位' })
  password!: string;

  @IsArray({ message: '角色必须是数组' })
  roleIds!: number[];
}
```

### CreateRoleDto

```typescript
import { IsNotEmpty, IsArray } from '@ai-partner-x/aiko-boot-starter-validation';

export class CreateRoleDto {
  @IsNotEmpty({ message: '角色名称不能为空' })
  name!: string;

  description?: string;

  @IsArray({ message: '权限必须是数组' })
  permissionIds!: number[];
}
```

### CreatePermissionDto

```typescript
import { IsNotEmpty } from '@ai-partner-x/aiko-boot-starter-validation';

export class CreatePermissionDto {
  @IsNotEmpty({ message: '权限名称不能为空' })
  name!: string;

  description?: string;

  @IsNotEmpty({ message: '资源不能为空' })
  resource!: string;

  @IsNotEmpty({ message: '操作不能为空' })
  action!: string;
}
```

## 服务层

### PermissionService

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { Permission } from '../entity/permission.entity.js';
import { Role } from '../entity/role.entity.js';
import { User } from '../entity/user.entity.js';

@Service()
export class PermissionService {
  @Autowired()
  private permissionMapper!: BaseMapper<Permission>;

  @Autowired()
  private roleMapper!: BaseMapper<Role>;

  @Autowired()
  private userMapper!: BaseMapper<User>;

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await this.userMapper.selectById(userId);
    if (!user || !user.roles) {
      return [];
    }

    const permissions: Permission[] = [];
    for (const role of user.roles) {
      if (role.permissions) {
        permissions.push(...role.permissions);
      }
    }

    return permissions;
  }

  async hasPermission(userId: number, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.name === permissionName);
  }

  async hasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissionNames.some(name => permissions.some(p => p.name === name));
  }

  async hasAllPermissions(userId: number, permissionNames: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissionNames.every(name => permissions.some(p => p.name === name));
  }

  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    const permission = {
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = await this.permissionMapper.insert(permission);
    return this.permissionMapper.selectById(id) as Promise<Permission>;
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    const rolePermission = {
      roleId,
      permissionId,
      createdAt: new Date(),
    };
    await this.rolePermissionMapper.insert(rolePermission);
  }
}
```

### UserService

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity.js';
import { Role } from '../entity/role.entity.js';
import { PermissionService } from './permission.service.js';

@Service()
export class UserService {
  @Autowired()
  private userMapper!: BaseMapper<User>;

  @Autowired()
  private roleMapper!: BaseMapper<Role>;

  @Autowired()
  private permissionService!: PermissionService;

  async findById(id: number): Promise<User | null> {
    const user = await this.userMapper.selectById(id);
    if (!user) {
      return null;
    }

    user.roles = await this.getUserRoles(id);
    user.permissions = await this.permissionService.getUserPermissions(id);

    return user;
  }

  async getUserRoles(userId: number): Promise<Role[]> {
    const userRoles = await this.userRoleMapper.selectList({
      where: { userId }
    });

    const roles: Role[] = [];
    for (const userRole of userRoles) {
      const role = await this.roleMapper.selectById(userRole.roleId);
      if (role) {
        role.permissions = await this.getRolePermissions(role.id);
        roles.push(role);
      }
    }

    return roles;
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionMapper.selectList({
      where: { roleId }
    });

    const permissions: Permission[] = [];
    for (const rp of rolePermissions) {
      const permission = await this.permissionMapper.selectById(rp.permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }

    return permissions;
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    const userRole = {
      userId,
      roleId,
      createdAt: new Date(),
    };
    await this.userRoleMapper.insert(userRole);
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    const userRoles = await this.userRoleMapper.selectList({
      where: { userId, roleId }
    });

    for (const userRole of userRoles) {
      await this.userRoleMapper.deleteById(userRole.id);
    }
  }
}
```

## 控制器层

### UserController

```typescript
import { RestController, GetMapping, PostMapping, PutMapping, DeleteMapping, RequestBody, PathVariable } from '@ai-partner-x/aiko-boot-starter-web';
import { Public, PreAuthorize, RolesAllowed, Secured } from '@ai-partner-x/aiko-boot-starter-security';
import { UserService } from '../service/user.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';

@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  @GetMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async list(): Promise<User[]> {
    return this.userService.findAll();
  }

  @GetMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
  async getById(@PathVariable('id') id: number): Promise<User> {
    return this.userService.findById(id);
  }

  @PostMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async create(@RequestBody() dto: CreateUserDto): Promise<User> {
    return this.userService.create(dto);
  }

  @PutMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
  async update(@PathVariable('id') id: number, @RequestBody() dto: Partial<User>): Promise<User> {
    return this.userService.update(id, dto);
  }

  @DeleteMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async delete(@PathVariable('id') id: number): Promise<boolean> {
    return this.userService.delete(id);
  }

  @PostMapping('/{id}/roles')
  @PreAuthorize("hasRole('ADMIN')")
  async assignRole(@PathVariable('id') userId: number, @RequestBody() body: { roleId: number }): Promise<void> {
    return this.userService.assignRoleToUser(userId, body.roleId);
  }

  @DeleteMapping('/{id}/roles/{roleId}')
  @PreAuthorize("hasRole('ADMIN')")
  async removeRole(@PathVariable('id') userId: number, @PathVariable('roleId') roleId: number): Promise<void> {
    return this.userService.removeRoleFromUser(userId, roleId);
  }
}
```

### RoleController

```typescript
import { RestController, GetMapping, PostMapping, PutMapping, DeleteMapping, RequestBody, PathVariable } from '@ai-partner-x/aiko-boot-starter-web';
import { PreAuthorize, RolesAllowed } from '@ai-partner-x/aiko-boot-starter-security';
import { RoleService } from '../service/role.service.js';
import { CreateRoleDto } from '../dto/create-role.dto.js';

@RestController({ path: '/roles' })
export class RoleController {
  @Autowired()
  private roleService!: RoleService;

  @GetMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async list(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @GetMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async getById(@PathVariable('id') id: number): Promise<Role> {
    return this.roleService.findById(id);
  }

  @PostMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async create(@RequestBody() dto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(dto);
  }

  @PutMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async update(@PathVariable('id') id: number, @RequestBody() dto: Partial<Role>): Promise<Role> {
    return this.roleService.update(id, dto);
  }

  @DeleteMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async delete(@PathVariable('id') id: number): Promise<boolean> {
    return this.roleService.delete(id);
  }

  @PostMapping('/{id}/permissions')
  @PreAuthorize("hasRole('ADMIN')")
  async assignPermission(@PathVariable('id') roleId: number, @RequestBody() body: { permissionId: number }): Promise<void> {
    return this.roleService.assignPermissionToRole(roleId, body.permissionId);
  }

  @DeleteMapping('/{id}/permissions/{permissionId}')
  @PreAuthorize("hasRole('ADMIN')")
  async removePermission(@PathVariable('id') roleId: number, @PathVariable('permissionId') permissionId: number): Promise<void> {
    return this.roleService.removePermissionFromRole(roleId, permissionId);
  }
}
```

### PermissionController

```typescript
import { RestController, GetMapping, PostMapping, PutMapping, DeleteMapping, RequestBody, PathVariable } from '@ai-partner-x/aiko-boot-starter-web';
import { PreAuthorize, RolesAllowed } from '@ai-partner-x/aiko-boot-starter-security';
import { PermissionService } from '../service/permission.service.js';
import { CreatePermissionDto } from '../dto/create-permission.dto.js';

@RestController({ path: '/permissions' })
export class PermissionController {
  @Autowired()
  private permissionService!: PermissionService;

  @GetMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async list(): Promise<Permission[]> {
    return this.permissionService.findAll();
  }

  @GetMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async getById(@PathVariable('id') id: number): Promise<Permission> {
    return this.permissionService.findById(id);
  }

  @PostMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async create(@RequestBody() dto: CreatePermissionDto): Promise<Permission> {
    return this.permissionService.create(dto);
  }

  @PutMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async update(@PathVariable('id') id: number, @RequestBody() dto: Partial<Permission>): Promise<Permission> {
    return this.permissionService.update(id, dto);
  }

  @DeleteMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async delete(@PathVariable('id') id: number): Promise<boolean> {
    return this.permissionService.delete(id);
  }
}
```

### PostController（复杂权限示例）

```typescript
import { RestController, GetMapping, PostMapping, PutMapping, DeleteMapping, RequestBody, PathVariable } from '@ai-partner-x/aiko-boot-starter-web';
import { Public, PreAuthorize, PostAuthorize, Secured } from '@ai-partner-x/aiko-boot-starter-security';
import { PostService } from '../service/post.service.js';

@RestController({ path: '/posts' })
export class PostController {
  @Autowired()
  private postService!: PostService;

  @GetMapping()
  @Public()
  async list(): Promise<Post[]> {
    return this.postService.findAll();
  }

  @GetMapping('/{id}')
  @Public()
  async getById(@PathVariable('id') id: number): Promise<Post> {
    return this.postService.findById(id);
  }

  @PostMapping()
  @PreAuthorize("hasRole('ADMIN') or hasPermission('post:create')")
  async create(@RequestBody() dto: CreatePostDto): Promise<Post> {
    const securityContext = SecurityContext.getInstance();
    const currentUser = securityContext.getCurrentUser();
    return this.postService.create(dto, currentUser.id);
  }

  @PutMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN') or hasPermission('post:update')")
  @PostAuthorize("returnObject.authorId == authentication.principal.id or hasRole('ADMIN')")
  async update(@PathVariable('id') id: number, @RequestBody() dto: Partial<Post>): Promise<Post> {
    return this.postService.update(id, dto);
  }

  @DeleteMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN') or hasPermission('post:delete')")
  @PostAuthorize("returnObject.authorId == authentication.principal.id or hasRole('ADMIN')")
  async delete(@PathVariable('id') id: number): Promise<boolean> {
    return this.postService.delete(id);
  }

  @PostMapping('/{id}/publish')
  @Secured('post:publish')
  async publish(@PathVariable('id') id: number): Promise<Post> {
    return this.postService.publish(id);
  }

  @GetMapping('/drafts')
  @PreAuthorize("hasRole('ADMIN') or hasPermission('post:read')")
  async getDrafts(): Promise<Post[]> {
    const securityContext = SecurityContext.getInstance();
    const currentUser = securityContext.getCurrentUser();
    return this.postService.getDrafts(currentUser.id);
  }
}
```

## 权限装饰器详解

### @Public()

标记端点为公开访问，无需认证。

```typescript
@GetMapping('/public')
@Public()
async publicInfo(): Promise<any> {
  return { message: '公开 API' };
}
```

### @Authenticated()

要求用户已认证。

```typescript
@GetMapping('/profile')
@Authenticated()
async profile(): Promise<any> {
  const securityContext = SecurityContext.getInstance();
  return securityContext.getCurrentUser();
}
```

### @RolesAllowed(...roles)

要求用户具有指定的角色。

```typescript
@GetMapping('/admin')
@RolesAllowed('ADMIN')
async adminOnly(): Promise<any> {
  return { message: '仅管理员可访问' };
}

@GetMapping('/moderator-or-admin')
@RolesAllowed('MODERATOR', 'ADMIN')
async moderatorOrAdmin(): Promise<any> {
  return { message: '版主或管理员可访问' };
}
```

### @PreAuthorize(expression)

在方法执行前进行权限检查。

```typescript
@GetMapping('/users/{id}')
@PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
async getUser(@PathVariable('id') id: number): Promise<User> {
  return this.userService.findById(id);
}
```

### @PostAuthorize(expression)

在方法执行后进行权限检查，可以访问返回值。

```typescript
@PutMapping('/posts/{id}')
@PreAuthorize("hasRole('ADMIN') or hasPermission('post:update')")
@PostAuthorize("returnObject.authorId == authentication.principal.id or hasRole('ADMIN')")
async updatePost(@PathVariable('id') id: number, @RequestBody() dto: Partial<Post>): Promise<Post> {
  return this.postService.update(id, dto);
}
```

### @Secured(...permissions)

要求用户具有指定的权限。

```typescript
@PostMapping('/posts/{id}/publish')
@Secured('post:publish')
async publishPost(@PathVariable('id') id: number): Promise<Post> {
  return this.postService.publish(id);
}

@DeleteMapping('/users/{id}')
@Secured('user:delete')
async deleteUser(@PathVariable('id') id: number): Promise<boolean> {
  return this.userService.delete(id);
}
```

## 权限表达式

### 基本表达式

```typescript
// 检查角色
hasRole('ADMIN')
hasRole('USER')

// 检查权限
hasPermission('user:read')
hasPermission('post:create')

// 检查认证状态
authenticated()
```

### 复合表达式

```typescript
// 或逻辑
hasRole('ADMIN') or hasRole('MODERATOR')
hasPermission('user:read') or hasPermission('user:write')

// 与逻辑
hasRole('ADMIN') and hasPermission('user:delete')

// 非逻辑
not hasRole('BANNED')

// 混合逻辑
hasRole('ADMIN') or (hasPermission('post:update') and #id == authentication.principal.id)
```

### 参数引用

```typescript
@PreAuthorize("#id == authentication.principal.id")
async getUser(@PathVariable('id') id: number): Promise<User> {
  return this.userService.findById(id);
}

@PreAuthorize("#userId == authentication.principal.id")
async updateUser(@RequestBody() body: { userId: number }): Promise<User> {
  return this.userService.update(body.userId, body);
}
```

### 返回值引用

```typescript
@PostAuthorize("returnObject.authorId == authentication.principal.id or hasRole('ADMIN')")
async getPost(@PathVariable('id') id: number): Promise<Post> {
  return this.postService.findById(id);
}
```

## 使用示例

### 1. 创建角色和权限

```bash
# 创建权限
curl -X POST http://localhost:3001/api/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "user:read",
    "description": "读取用户信息",
    "resource": "user",
    "action": "read"
  }'

curl -X POST http://localhost:3001/api/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "user:write",
    "description": "写入用户信息",
    "resource": "user",
    "action": "write"
  }'

# 创建角色
curl -X POST http://localhost:3001/api/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "USER",
    "description": "普通用户",
    "permissionIds": [1, 2]
  }'
```

### 2. 分配角色给用户

```bash
curl -X POST http://localhost:3001/api/users/1/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "roleId": 1
  }'
```

### 3. 测试权限

```bash
# 普通用户访问自己的信息（成功）
curl -X GET http://localhost:3001/api/users/1 \
  -H "Authorization: Bearer YOUR_USER_TOKEN"

# 普通用户访问其他用户信息（失败）
curl -X GET http://localhost:3001/api/users/2 \
  -H "Authorization: Bearer YOUR_USER_TOKEN"

# 管理员访问所有用户信息（成功）
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 最佳实践

### 1. 权限命名规范

使用 `resource:action` 格式：

- `user:read` - 读取用户
- `user:write` - 写入用户
- `user:delete` - 删除用户
- `post:create` - 创建文章
- `post:update` - 更新文章
- `post:delete` - 删除文章
- `post:publish` - 发布文章

### 2. 角色设计

- **ADMIN** - 管理员，拥有所有权限
- **MODERATOR** - 版主，拥有内容管理权限
- **USER** - 普通用户，拥有基本权限
- **GUEST** - 访客，拥有只读权限

### 3. 权限粒度

- 粗粒度：`user:read`、`user:write`
- 中粒度：`user:read:basic`、`user:read:profile`
- 细粒度：`user:read:profile:email`、`user:read:profile:phone`

### 4. 权限缓存

使用 Redis 缓存用户权限，减少数据库查询：

```typescript
async getUserPermissions(userId: number): Promise<Permission[]> {
  const cacheKey = `user:${userId}:permissions`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const permissions = await this.loadUserPermissions(userId);
  await redis.setex(cacheKey, 3600, JSON.stringify(permissions));
  
  return permissions;
}
```

### 5. 权限审计

记录权限检查日志，便于审计和调试：

```typescript
async checkPermission(userId: number, permissionName: string): Promise<boolean> {
  const hasPermission = await this.hasPermission(userId, permissionName);
  
  await this.auditLog.create({
    userId,
    permission: permissionName,
    result: hasPermission,
    timestamp: new Date(),
  });

  return hasPermission;
}
```

## 常见问题

### Q: @PreAuthorize 和 @Secured 有什么区别？

A: @PreAuthorize 支持复杂的权限表达式，@Secured 只能检查权限名称。

### Q: 如何实现动态权限？

A: 使用 @PreAuthorize 配合自定义权限服务，在运行时检查权限。

### Q: 如何实现资源级别的权限？

A: 使用 @PostAuthorize 检查返回值，或者在方法内部手动检查权限。

### Q: 如何优化权限检查性能？

A: 使用缓存、批量查询、减少数据库访问次数。

## 更多信息

- [Spring Security 文档](https://docs.spring.io/spring-security/reference/)
- [RBAC 最佳实践](https://en.wikipedia.org/wiki/Role-based_access_control)
- [Aiko Boot Security 文档](../../../../../packages/aiko-boot-starter-security/README.md)
