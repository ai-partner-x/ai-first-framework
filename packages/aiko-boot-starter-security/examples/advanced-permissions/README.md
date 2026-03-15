# 高级权限控制使用指南

## 概述

Aiko Boot 安全组件现在支持细粒度的权限控制，包括：
- **API权限**：控制HTTP端点的访问权限
- **方法权限**：控制Service层方法的访问权限
- **按钮权限**：控制前端按钮的显示和操作权限

## 权限类型

系统支持以下权限类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| `API` | API端点权限 | `api:user:read` |
| `METHOD` | 方法权限 | `method:user:create` |
| `BUTTON` | 按钮权限 | `button:user:delete` |
| `MENU` | 菜单权限 | `menu:user` |
| `OTHER` | 其他自定义权限 | `other:custom` |

## 基本使用

### 1. API权限控制

使用 `@ApiPermission` 装饰器控制API端点的访问权限：

```typescript
import { RestController, GetMapping, PostMapping } from '@ai-partner-x/aiko-boot-starter-web';
import { ApiPermission, PermissionType } from '@ai-partner-x/aiko-boot-starter-security';

@RestController({ path: '/users' })
export class UserController {

  @GetMapping()
  @ApiPermission('user', 'read', {
    description: '查看用户列表',
    group: '用户管理',
  })
  async list(): Promise<User[]> {
    return this.userService.findAll();
  }

  @PostMapping()
  @ApiPermission('user', 'create', {
    description: '创建用户',
    group: '用户管理',
  })
  async create(@RequestBody() userData: CreateUserDto): Promise<User> {
    return this.userService.create(userData);
  }
}
```

### 2. 方法权限控制

使用 `@MethodPermission` 装饰器控制Service层方法的访问权限：

```typescript
import { Service } from '@ai-partner-x/aiko-boot';
import { MethodPermission } from '@ai-partner-x/aiko-boot-starter-security';

@Service()
export class UserService {

  @MethodPermission('user', 'read', {
    description: '查询用户服务方法',
    group: '用户服务',
  })
  async findAll(): Promise<User[]> {
    return this.userMapper.selectList();
  }

  @MethodPermission('user', 'create', {
    description: '创建用户服务方法',
    group: '用户服务',
  })
  async create(userData: CreateUserDto): Promise<User> {
    return this.userMapper.insert(userData);
  }
}
```

### 3. 按钮权限控制

使用 `@ButtonPermission` 装饰器控制前端按钮的权限：

```typescript
import { RestController, PutMapping } from '@ai-partner-x/aiko-boot-starter-web';
import { ButtonPermission } from '@ai-partner-x/aiko-boot-starter-security';

@RestController({ path: '/orders' })
export class OrderController {

  @PutMapping('/:id/approve')
  @ApiPermission('order', 'approve', {
    description: '审核订单',
    group: '订单管理',
  })
  @ButtonPermission('order', 'approve', {
    description: '通过订单按钮',
    group: '订单管理',
    buttonId: 'btn-approve-order',
  })
  @ButtonPermission('order', 'reject', {
    description: '拒绝订单按钮',
    group: '订单管理',
    buttonId: 'btn-reject-order',
  })
  async approve(
    @PathVariable('id') id: number,
    @RequestBody() body: { approved: boolean; reason?: string }
  ): Promise<Order> {
    return this.orderService.approve(id, body);
  }
}
```

## 前端集成

### 获取用户权限

前端可以通过API获取当前用户的权限列表：

```typescript
// 获取用户权限
const response = await fetch('/api/frontend/permissions/user');
const { permissions, buttons } = await response.json();

// permissions: ['api:user:read', 'api:user:create', ...]
// buttons: ['btn-delete-user', 'btn-approve-order', ...]
```

### 权限检查组件

创建一个权限检查组件：

```typescript
// PermissionCheck.tsx
import { useEffect, useState } from 'react';

interface PermissionCheckProps {
  permissionCode: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionCheck({ permissionCode, fallback = null, children }: PermissionCheckProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [permissionCode]);

  const checkPermission = async () => {
    try {
      const response = await fetch(`/api/frontend/permissions/check?permissionCode=${permissionCode}`);
      const { hasPermission } = await response.json();
      setHasPermission(hasPermission);
    } catch (error) {
      console.error('Permission check failed:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
```

### 按钮权限控制

使用权限检查组件控制按钮显示：

```typescript
import { PermissionCheck } from './PermissionCheck';

export function UserList() {
  return (
    <div>
      <table>
        {/* 表格内容 */}
      </table>

      {/* 只有有删除权限的用户才能看到删除按钮 */}
      <PermissionCheck permissionCode="button:user:delete">
        <button className="btn-delete">删除用户</button>
      </PermissionCheck>
    </div>
  );
}
```

## 权限管理API

系统提供完整的权限管理API：

### 导出权限配置

```bash
GET /api/permissions/export
```

返回应用的权限配置，包括所有权限、分组和资源。

### 导入权限到数据库

```bash
POST /api/permissions/import
```

将元数据收集器中的权限导入到数据库。

### 获取权限统计

```bash
GET /api/permissions/stats
```

返回权限的统计信息，按类型、组、资源分类。

### 查询权限

```bash
GET /api/permissions?type=API&group=用户管理
```

按条件查询权限列表。

## 权限码格式

权限码采用三层结构：`{类型}:{资源}:{操作}`

### 示例

- `api:user:read` - 查看用户API
- `method:user:create` - 创建用户方法
- `button:user:delete` - 删除用户按钮
- `api:order:approve` - 审核订单API
- `button:order:export` - 导出订单按钮

## 混合使用权限装饰器

可以混合使用不同类型的权限装饰器：

```typescript
@RestController({ path: '/orders' })
export class OrderController {

  @PutMapping('/:id/approve')
  @ApiPermission('order', 'approve', {  // API权限
    description: '审核订单',
    group: '订单管理',
  })
  @ButtonPermission('order', 'approve', {  // 按钮权限
    description: '通过订单按钮',
    group: '订单管理',
    buttonId: 'btn-approve-order',
  })
  @ButtonPermission('order', 'reject', {  // 另一个按钮权限
    description: '拒绝订单按钮',
    group: '订单管理',
    buttonId: 'btn-reject-order',
  })
  async approve(@PathVariable('id') id: number, @RequestBody() body: any): Promise<Order> {
    return this.orderService.approve(id, body);
  }
}
```

## 权限元数据收集

系统会自动收集所有使用权限装饰器定义的权限：

```typescript
import {
  getGlobalPermissionMetadataCollector,
  exportPermissionConfig
} from '@ai-partner-x/aiko-boot-starter-security';

// 获取全局收集器
const collector = getGlobalPermissionMetadataCollector();

// 导出权限配置
const config = exportPermissionConfig();

console.log('权限列表:', config.permissions);
console.log('权限组:', config.groups);
console.log('资源列表:', config.resources);

// 按类型查询
const apiPermissions = collector.getMetadataByType(PermissionType.API);

// 按资源查询
const userPermissions = collector.getMetadataByResource('user');

// 按组查询
const userManagementPerms = collector.getMetadataByGroup('用户管理');
```

## 最佳实践

### 1. 权限分组

将相关权限组织到同一个组中：

```typescript
@ApiPermission('user', 'read', {
  description: '查看用户列表',
  group: '用户管理',
})

@ApiPermission('user', 'create', {
  description: '创建用户',
  group: '用户管理',
})
```

### 2. 资源命名约定

使用统一的资源命名约定：

```typescript
// 用户资源
'user', 'user-role', 'user-permission'

// 订单资源
'order', 'order-item', 'order-status'

// 产品资源
'product', 'product-category', 'product-inventory'
```

### 3. 操作命名约定

使用标准的操作名称：

```typescript
// CRUD操作
'read', 'create', 'update', 'delete'

// 业务操作
'approve', 'reject', 'export', 'import', 'publish', 'archive'

// 其他操作
'reset-password', 'change-status', 'assign-role'
```

### 4. 按钮权限与API权限配合

为每个需要前端按钮的操作同时定义API权限和按钮权限：

```typescript
@PutMapping('/:id/delete')
@ApiPermission('user', 'delete', {
  description: '删除用户',
  group: '用户管理',
})
@ButtonPermission('user', 'delete', {
  description: '删除用户按钮',
  group: '用户管理',
  buttonId: 'btn-delete-user',
})
async delete(@PathVariable('id') id: number): Promise<boolean> {
  return this.userService.delete(id);
}
```

## 完整示例

查看 `example.controller.ts` 文件获取完整的示例代码，包括：
- API权限控制
- 方法权限控制
- 按钮权限控制
- 混合权限使用
- 公开API示例

## 注意事项

1. **权限码唯一性**：确保每个权限码在系统中是唯一的
2. **权限设计**：建议在开发初期设计好权限结构，避免后期重构
3. **性能考虑**：频繁的权限检查可能影响性能，建议缓存用户权限
4. **前后端同步**：确保前端和后端使用相同的权限码
5. **数据库设计**：建议在数据库中为权限表添加索引以提高查询性能

## 总结

Aiko Boot 安全组件的细粒度权限控制功能提供了完整的权限管理解决方案：

- ✅ 支持多种权限类型（API、方法、按钮）
- ✅ 提供丰富的权限装饰器
- ✅ 自动收集权限元数据
- ✅ 完整的权限管理API
- ✅ 前端友好的权限检查接口
- ✅ 灵活的权限分组和查询

通过合理使用这些功能，可以构建出安全、灵活、易于维护的权限控制系统。