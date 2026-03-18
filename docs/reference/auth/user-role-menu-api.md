# 用户/角色/菜单 CRUD 接口规范

## 概述

本文档描述了系统管理模块中用户、角色、菜单三个核心模块的 CRUD 接口。所有接口都需要 **JWT 认证**，并且需要相应的权限才能访问。

## 权限控制说明

所有接口使用 `@ApiPermission` 注解进行权限控制，权限标识格式为 `{资源}:{操作}`。

### 权限标识说明

| 模块 | 资源标识 | 操作标识 | 说明 |
|------|----------|----------|------|
| 用户管理 | user | page, read, create, update, delete, reset-password | 用户相关操作 |
| 角色管理 | role | list, read, create, update, delete, read-menus, assign-menus | 角色相关操作 |
| 菜单管理 | menu | tree, user-tree, read, create, update, delete | 菜单相关操作 |

---

## 1. 用户管理接口

### 接口路径前缀

`/api/sys/user`

### 接口列表

#### 1.1 分页查询用户列表

**GET** `/api/sys/user/page`

**权限**：`user:page`

分页查询用户列表，支持按用户名和状态筛选。

##### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| pageNo | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页条数 |
| username | string | 否 | - | 用户名（模糊查询） |
| status | number | 否 | - | 状态（0-禁用，1-启用） |

##### 请求示例

```bash
curl -X GET "http://localhost:3001/api/sys/user/page?pageNo=1&pageSize=10&username=admin&status=1" \
  -H "Authorization: Bearer <token>"
```

##### 响应格式

```typescript
{
  "list": [
    {
      "id": 1,
      "username": "admin",
      "realName": "超级管理员",
      "email": "admin@example.com",
      "phone": "13800138000",
      "status": 1,
      "roles": ["SUPER_ADMIN"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "pageNo": 1,
  "pageSize": 10
}
```

##### 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 查询成功 |
| 401 | 未登录或 Token 无效 |
| 403 | 权限不足 |

---

#### 1.2 获取用户详情

**GET** `/api/sys/user/{id}`

**权限**：`user:read`

根据用户 ID 获取用户详细信息。

##### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 用户 ID（路径参数） |

##### 请求示例

```bash
curl -X GET "http://localhost:3001/api/sys/user/1" \
  -H "Authorization: Bearer <token>"
```

##### 响应格式

```typescript
{
  "id": 1,
  "username": "admin",
  "realName": "超级管理员",
  "email": "admin@example.com",
  "phone": "13800138000",
  "status": 1,
  "roles": ["SUPER_ADMIN"],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### 1.3 创建用户

**POST** `/api/sys/user`

**权限**：`user:create`

创建新用户。

##### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| username | string | 是 | - | 用户名 |
| password | string | 是 | - | 密码 |
| realName | string | 否 | - | 真实姓名 |
| email | string | 否 | - | 邮箱 |
| phone | string | 否 | - | 手机号 |
| status | number | 否 | 1 | 状态（0-禁用，1-启用） |
| roleIds | number[] | 否 | - | 角色 ID 列表 |

##### 请求示例

```typescript
// 请求体
{
  "username": "testuser",
  "password": "Test@123",
  "realName": "测试用户",
  "email": "test@example.com",
  "phone": "13900139000",
  "status": 1,
  "roleIds": [1, 2]
}
```

```bash
curl -X POST "http://localhost:3001/api/sys/user" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123",
    "realName": "测试用户",
    "email": "test@example.com",
    "phone": "13900139000",
    "status": 1,
    "roleIds": [1, 2]
  }'
```

---

#### 1.4 更新用户

**PUT** `/api/sys/user/{id}`

**权限**：`user:update`

更新用户信息。

##### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 用户 ID（路径参数） |
| realName | string | 否 | 真实姓名 |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |
| status | number | 否 | 状态 |
| roleIds | number[] | 否 | 角色 ID 列表 |

---

#### 1.5 删除用户

**DELETE** `/api/sys/user/{id}`

**权限**：`user:delete`

删除用户。

##### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 用户 ID（路径参数） |

##### 响应格式

```typescript
{
  "message": "删除成功"
}
```

---

#### 1.6 重置用户密码

**PUT** `/api/sys/user/{id}/password`

**权限**：`user:reset-password`

重置用户密码。

##### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 用户 ID（路径参数） |
| newPassword | string | 是 | 新密码 |

##### 请求示例

```typescript
// 请求体
{
  "newPassword": "NewPass@123"
}
```

##### 响应格式

```typescript
{
  "message": "密码重置成功"
}
```

---

## 2. 角色管理接口

### 接口路径前缀

`/api/sys/role`

### 接口列表

#### 2.1 获取角色列表

**GET** `/api/sys/role/list`

**权限**：`role:list`

获取所有角色列表（不分页）。

##### 响应格式

```typescript
[
  {
    "id": 1,
    "roleCode": "SUPER_ADMIN",
    "roleName": "超级管理员",
    "description": "拥有全部权限",
    "status": 1
  }
]
```

---

#### 2.2 获取角色详情

**GET** `/api/sys/role/{id}`

**权限**：`role:read`

根据角色 ID 获取角色详情。

---

#### 2.3 创建角色

**POST** `/api/sys/role`

**权限**：`role:create`

创建新角色。

##### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| roleCode | string | 是 | - | 角色编码 |
| roleName | string | 是 | - | 角色名称 |
| description | string | 否 | - | 描述 |
| status | number | 否 | 1 | 状态 |
| menuIds | number[] | 否 | - | 菜单 ID 列表 |

---

#### 2.4 更新角色

**PUT** `/api/sys/role/{id}`

**权限**：`role:update`

更新角色信息。

---

#### 2.5 删除角色

**DELETE** `/api/sys/role/{id}`

**权限**：`role:delete`

删除角色。

##### 响应格式

```typescript
{
  "message": "删除成功"
}
```

---

#### 2.6 获取角色菜单

**GET** `/api/sys/role/{id}/menus`

**权限**：`role:read-menus`

获取角色关联的菜单 ID 列表。

##### 响应格式

```typescript
{
  "menuIds": [1, 2, 3, 4, 5]
}
```

---

#### 2.7 分配角色菜单

**PUT** `/api/sys/role/{id}/menus`

**权限**：`role:assign-menus`

为角色分配菜单权限。

##### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 角色 ID（路径参数） |
| menuIds | number[] | 是 | 菜单 ID 列表 |

##### 请求示例

```typescript
// 请求体
{
  "menuIds": [1, 2, 3, 4, 5]
}
```

---

## 3. 菜单管理接口

### 接口路径前缀

`/api/sys/menu`

### 菜单类型说明

| 类型值 | 说明 |
|--------|------|
| 1 | 目录 |
| 2 | 菜单 |
| 3 | 按钮 |

### 接口列表

#### 3.1 获取完整菜单树

**GET** `/api/sys/menu/tree`

**权限**：`menu:tree`

获取系统完整的菜单树结构。

##### 响应格式

```typescript
[
  {
    "id": 1,
    "parentId": 0,
    "menuName": "系统管理",
    "menuType": 1,
    "path": "",
    "component": "",
    "permission": "",
    "icon": "Settings",
    "sortOrder": 100,
    "status": 1,
    "children": [
      {
        "id": 2,
        "parentId": 1,
        "menuName": "用户管理",
        "menuType": 2,
        "path": "/sys/user",
        "component": "sys/user/index",
        "permission": "sys:user:list",
        "icon": "User",
        "sortOrder": 1,
        "status": 1,
        "children": [
          {
            "id": 3,
            "parentId": 2,
            "menuName": "查询用户",
            "menuType": 3,
            "permission": "sys:user:query",
            "sortOrder": 1,
            "status": 1
          }
        ]
      }
    ]
  }
]
```

---

#### 3.2 获取用户菜单树

**GET** `/api/sys/menu/user-tree`

**权限**：`menu:user-tree`

根据用户权限获取菜单树。

##### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _perms | string | 是 | 权限标识列表，逗号分隔 |

##### 请求示例

```bash
curl -X GET "http://localhost:3001/api/sys/menu/user-tree?_perms=sys:user:list,sys:user:query" \
  -H "Authorization: Bearer <token>"
```

---

#### 3.3 获取菜单详情

**GET** `/api/sys/menu/{id}`

**权限**：`menu:read`

根据菜单 ID 获取菜单详情。

---

#### 3.4 创建菜单

**POST** `/api/sys/menu`

**权限**：`menu:create`

创建新菜单。

##### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| parentId | number | 否 | 0 | 父菜单 ID |
| menuName | string | 是 | - | 菜单名称 |
| menuType | number | 是 | - | 菜单类型（1-目录，2-菜单，3-按钮） |
| path | string | 否 | - | 路由路径 |
| component | string | 否 | - | 组件路径 |
| permission | string | 否 | - | 权限标识 |
| icon | string | 否 | - | 图标 |
| sortOrder | number | 否 | 0 | 排序 |
| status | number | 否 | 1 | 状态 |

---

#### 3.5 更新菜单

**PUT** `/api/sys/menu/{id}`

**权限**：`menu:update`

更新菜单信息。

---

#### 3.6 删除菜单

**DELETE** `/api/sys/menu/{id}`

**权限**：`menu:delete`

删除菜单。

##### 响应格式

```typescript
{
  "message": "删除成功"
}
```

---

## 通用响应状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或 Token 无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 按钮权限说明

除了接口权限外，部分操作还配置了按钮权限（`@ButtonPermission`），用于前端按钮的显示控制：

| 模块 | 按钮权限标识 | 按钮 ID | 说明 |
|------|--------------|---------|------|
| 用户管理 | user:create | btn-create-user | 创建用户按钮 |
| 用户管理 | user:update | btn-update-user | 更新用户按钮 |
| 用户管理 | user:delete | btn-delete-user | 删除用户按钮 |
| 用户管理 | user:reset-password | btn-reset-password | 重置密码按钮 |
| 角色管理 | role:create | btn-create-role | 创建角色按钮 |
| 角色管理 | role:update | btn-update-role | 更新角色按钮 |
| 角色管理 | role:delete | btn-delete-role | 删除角色按钮 |
| 角色管理 | role:assign-menus | btn-assign-menus | 分配菜单按钮 |
| 菜单管理 | menu:create | btn-create-menu | 创建菜单按钮 |
| 菜单管理 | menu:update | btn-update-menu | 更新菜单按钮 |
| 菜单管理 | menu:delete | btn-delete-menu | 删除菜单按钮 |
