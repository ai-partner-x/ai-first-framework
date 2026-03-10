# Admin App API 测试文档

## 概述
本文档提供了 admin-app 后端 API 的测试说明，包括接口地址、请求方法、参数说明和示例请求。

## 访问地址
- **后端 API**：http://localhost:3003

## 认证接口
### 登录接口
- **接口地址**：`POST http://localhost:3003/api/auth/login`
- **请求参数**：
  ```json
  {
    "username": "admin",
    "password": "Admin@123"
  }
  ```
- **响应示例**：
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 1,
      "username": "admin",
      "realName": "管理员",
      "roles": ["SUPER_ADMIN"],
      "permissions": ["sys:user:list", "sys:role:list", "sys:menu:list"]
    }
  }
  ```

### 刷新令牌
- **接口地址**：`POST http://localhost:3003/api/auth/refresh`
- **请求参数**：
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 获取用户信息
- **接口地址**：`GET http://localhost:3003/api/auth/info?_uid=1`
- **请求参数**：`_uid=1`

## 用户管理接口
### 分页查询用户
- **接口地址**：`GET http://localhost:3003/api/sys/user/page?pageNo=1&pageSize=10&username=admin&status=1`
- **请求参数**：
  - `pageNo=1`
  - `pageSize=10`
  - `username=admin`（可选）
  - `status=1`（可选）

### 获取用户详情
- **接口地址**：`GET http://localhost:3003/api/sys/user/1`
- **请求示例**：`GET /api/sys/user/1`

### 创建用户
- **接口地址**：`POST http://localhost:3003/api/sys/user`
- **请求参数**：
  ```json
  {
    "username": "test",
    "password": "123456",
    "realName": "测试用户",
    "email": "test@example.com",
    "phone": "13800138000",
    "status": 1,
    "roleIds": [1, 2]
  }
  ```

### 更新用户
- **接口地址**：`PUT http://localhost:3003/api/sys/user/:id`
- **请求参数**：
  ```json
  {
    "realName": "测试用户",
    "email": "test@example.com",
    "phone": "13800138000",
    "status": 1,
    "roleIds": [1]
  }
  ```

### 删除用户
- **接口地址**：`DELETE http://localhost:3003/api/sys/user/:id`
- **请求示例**：`DELETE /api/sys/user/1`

### 重置密码
- **接口地址**：`PUT http://localhost:3003/api/sys/user/:id/password`
- **请求参数**：
  ```json
  {
    "newPassword": "654321"
  }
  ```

## 角色管理接口
### 查询角色列表
- **接口地址**：`GET http://localhost:3003/api/sys/role/list`

### 获取角色详情
- **接口地址**：`GET http://localhost:3003/api/sys/role/1`
- **请求示例**：`GET /api/sys/role/1`

### 创建角色
- **接口地址**：`POST http://localhost:3003/api/sys/role`
- **请求参数**：
  ```json
  {
    "roleCode": "admin",
    "roleName": "管理员",
    "description": "系统管理员",
    "status": 1,
    "menuIds": [1, 2, 3]
  }
  ```

### 更新角色
- **接口地址**：`PUT http://localhost:3003/api/sys/role/:id`
- **请求参数**：
  ```json
  {
    "roleName": "管理员",
    "description": "系统管理员",
    "status": 1,
    "menuIds": [1, 2, 3]
  }
  ```

### 删除角色
- **接口地址**：`DELETE http://localhost:3003/api/sys/role/:id`
- **请求示例**：`DELETE /api/sys/role/1`

### 获取角色菜单
- **接口地址**：`GET http://localhost:3003/api/sys/role/1/menus`
- **请求示例**：`GET /api/sys/role/1/menus`

### 分配菜单
- **接口地址**：`PUT http://localhost:3003/api/sys/role/:id/menus`
- **请求参数**：
  ```json
  {
    "menuIds": [1, 2, 3]
  }
  ```

## 菜单管理接口
### 获取菜单树
- **接口地址**：`GET http://localhost:3003/api/sys/menu/tree`

### 获取用户菜单树
- **接口地址**：`GET http://localhost:3003/api/sys/menu/user-tree?_perms=sys:user:list,sys:role:list`
- **请求参数**：`_perms=sys:user:list,sys:role:list`

### 获取菜单详情
- **接口地址**：`GET http://localhost:3003/api/sys/menu/1`
- **请求示例**：`GET /api/sys/menu/1`

### 创建菜单
- **接口地址**：`POST http://localhost:3003/api/sys/menu`
- **请求参数**：
  ```json
  {
    "parentId": 0,
    "menuName": "系统管理",
    "menuType": 1,
    "path": "/system",
    "component": "",
    "permission": "sys:system",
    "icon": "setting",
    "sortOrder": 0,
    "status": 1
  }
  ```

### 更新菜单
- **接口地址**：`PUT http://localhost:3003/api/sys/menu/:id`
- **请求参数**：
  ```json
  {
    "menuName": "系统管理",
    "menuType": 1,
    "path": "/system",
    "component": "",
    "permission": "sys:system",
    "icon": "setting",
    "sortOrder": 0,
    "status": 1
  }
  ```

### 删除菜单
- **接口地址**：`DELETE http://localhost:3003/api/sys/menu/:id`
- **请求示例**：`DELETE /api/sys/menu/1`

## 测试工具推荐
- **Postman**：https://www.postman.com/
- **curl**：命令行工具
- **Swagger**：如果项目集成了 Swagger，可以直接访问 http://localhost:3003/swagger

## 注意事项
1. 所有接口需要在请求头中携带 `Authorization: Bearer <accessToken>`
2. 密码在传输过程中建议使用 HTTPS 加密，后端使用 bcryptjs 进行哈希存储
3. 分页查询的默认页码是 1，默认每页大小是 10
4. 菜单类型分为：目录（1）、菜单（2）、按钮（3）
5. 角色权限通过 `sys_user_role` 和 `sys_role_menu` 两张关联表进行管理
6. 登录成功后返回的 `accessToken` 有效期为 2 小时，`refreshToken` 有效期为 7 天
