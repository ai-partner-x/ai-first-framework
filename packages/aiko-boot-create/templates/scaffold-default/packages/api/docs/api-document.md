# API 接口文档

基础路径: `http://localhost:3001/api`

---

## 1. 认证模块 (Auth)

### 1.1 用户登录

**POST** `http://localhost:3001/api/auth/login`

**请求体:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 (1-50字符) |
| password | string | 是 | 密码 (至少6位) |

**响应:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "userInfo": {
      "id": 1,
      "username": "admin",
      "realName": "管理员",
      "email": "admin@example.com",
      "roles": ["admin"],
      "permissions": ["*:*:*"]
    }
  }
}
```

---

### 1.2 刷新令牌

**POST** `http://localhost:3001/api/auth/refresh`

**请求体:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 1.3 获取用户信息

**GET** `http://localhost:3001/api/auth/info?_uid={userId}`

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _uid | string | 是 | 用户ID |

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "管理员",
    "email": "admin@example.com",
    "roles": ["admin"],
    "permissions": ["*:*:*"]
  }
}
```

---

## 2. 用户管理模块 (User)

### 2.1 分页查询用户

**GET** `http://localhost:3001/api/sys/user/page`

**参数:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNo | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页数量 |
| username | string | 否 | - | 用户名模糊查询 |
| status | number | 否 | - | 状态 (1启用 0禁用) |

**响应:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "username": "admin",
        "realName": "管理员",
        "email": "admin@example.com",
        "phone": "13800138000",
        "status": 1,
        "roles": ["admin"],
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "pageNo": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

---

### 2.2 获取用户详情

**GET** `http://localhost:3001/api/sys/user/:id`

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "status": 1,
    "roles": ["admin"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2.3 创建用户

**POST** `http://localhost:3001/api/sys/user`

**请求体:**
```json
{
  "username": "test",
  "password": "123456",
  "realName": "测试用户",
  "email": "test@example.com",
  "phone": "13800138001",
  "status": 1,
  "roleIds": [1]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| realName | string | 否 | 真实姓名 |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |
| status | number | 否 | 状态 (1启用 0禁用)，默认1 |
| roleIds | number[] | 否 | 角色ID数组 |

---

### 2.4 更新用户

**PUT** `http://localhost:3001/api/sys/user/:id`

**请求体:**
```json
{
  "realName": "新名称",
  "email": "new@example.com",
  "phone": "13800138002",
  "status": 1,
  "roleIds": [2, 3]
}
```

---

### 2.5 删除用户

**DELETE** `http://localhost:3001/api/sys/user/:id`

**响应:**
```json
{
  "success": true,
  "data": true
}
```

---

### 2.6 重置密码

**PUT** `http://localhost:3001/api/sys/user/:id/password`

**请求体:**
```json
{
  "password": "newPassword123"
}
```

---

## 3. 角色管理模块 (Role)

### 3.1 获取角色列表

**GET** `http://localhost:3001/api/sys/role/list`

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "roleCode": "admin",
      "roleName": "管理员",
      "description": "系统管理员",
      "status": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 3.2 获取角色详情

**GET** `http://localhost:3001/api/sys/role/:id`

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "roleCode": "admin",
    "roleName": "管理员",
    "description": "系统管理员",
    "status": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "menuIds": [1, 2, 3]
  }
}
```

---

### 3.3 创建角色

**POST** `http://localhost:3001/api/sys/role`

**请求体:**
```json
{
  "roleCode": "editor",
  "roleName": "编辑员",
  "description": "内容编辑人员",
  "status": 1,
  "menuIds": [1, 2]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roleCode | string | 是 | 角色编码 |
| roleName | string | 是 | 角色名称 |
| description | string | 否 | 描述 |
| status | number | 否 | 状态，默认1 |
| menuIds | number[] | 否 | 菜单ID数组 |

---

### 3.4 更新角色

**PUT** `http://localhost:3001/api/sys/role/:id`

**请求体:**
```json
{
  "roleName": "新角色名",
  "description": "新描述",
  "status": 1,
  "menuIds": [1, 2, 3]
}
```

---

### 3.5 删除角色

**DELETE** `http://localhost:3001/api/sys/role/:id`

---

### 3.6 获取角色菜单

**GET** `http://localhost:3001/api/sys/role/:id/menus`

**响应:**
```json
{
  "success": true,
  "data": [1, 2, 3]
}
```

---

### 3.7 更新角色菜单

**PUT** `http://localhost:3001/api/sys/role/:id/menus`

**请求体:**
```json
{
  "menuIds": [1, 2, 3, 4]
}
```

---

## 4. 菜单管理模块 (Menu)

### 4.1 获取完整菜单树

**GET** `http://localhost:3001/api/sys/menu/tree`

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "parentId": 0,
      "menuName": "系统管理",
      "menuType": 1,
      "path": "/system",
      "component": "Layout",
      "permission": "",
      "icon": "setting",
      "sortOrder": 1,
      "status": 1,
      "children": [
        {
          "id": 2,
          "parentId": 1,
          "menuName": "用户管理",
          "menuType": 2,
          "path": "/system/user",
          "component": "system/user/index",
          "permission": "system:user:list",
          "icon": "user",
          "sortOrder": 1,
          "status": 1
        }
      ]
    }
  ]
}
```

---

### 4.2 获取用户菜单树

**GET** `http://localhost:3001/api/sys/menu/user-tree?_perms={permissions}`

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _perms | string | 否 | 权限标识，逗号分隔 |

**响应:** 同 4.1

---

### 4.3 获取菜单详情

**GET** `http://localhost:3001/api/sys/menu/:id`

---

### 4.4 创建菜单

**POST** `http://localhost:3001/api/sys/menu`

**请求体:**
```json
{
  "parentId": 0,
  "menuName": "系统管理",
  "menuType": 1,
  "path": "/system",
  "component": "Layout",
  "permission": "",
  "icon": "setting",
  "sortOrder": 1,
  "status": 1
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| parentId | number | 否 | 父菜单ID，默认0 |
| menuName | string | 是 | 菜单名称 |
| menuType | number | 是 | 类型: 1目录 2菜单 3按钮 |
| path | string | 否 | 路由路径 |
| component | string | 否 | 组件路径 |
| permission | string | 否 | 权限标识 |
| icon | string | 否 | 图标 |
| sortOrder | number | 否 | 排序，默认0 |
| status | number | 否 | 状态，默认1 |

---

### 4.5 更新菜单

**PUT** `http://localhost:3001/api/sys/menu/:id`

**请求体:** 同 4.4，所有字段可选

---

### 4.6 删除菜单

**DELETE** `http://localhost:3001/api/sys/menu/:id`

**响应:**
```json
{
  "success": true,
  "data": { "message": "删除成功" }
}
```

---

## 通用响应格式

所有接口返回格式:

**成功:**
```json
{
  "success": true,
  "data": { ... }
}
```

**失败:**
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
