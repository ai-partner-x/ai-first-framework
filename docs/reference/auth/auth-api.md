# 认证接口规范

## 概述

本文档描述了认证模块的所有接口，包括登录、Token 刷新、用户信息查询等功能。所有接口路径均以 `/api/auth` 为前缀。

## 认证流程

```
用户登录 → 验证凭据 → 生成 Token → 返回用户信息
         ↓
    访问受保护资源
         ↓
    验证 Token → 刷新 Token（可选）
```

## 接口列表

### 1. 用户登录

**POST** `/api/auth/login`

用户使用用户名和密码进行身份验证，成功后返回访问令牌和用户信息。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名，长度 1-50 字符 |
| password | string | 是 | 密码，至少 6 位 |

#### 请求示例

```typescript
// 请求体
{
  "username": "admin",
  "password": "Admin@123"
}
```

```bash
# curl 示例
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123"
  }'
```

#### 响应格式

**成功响应 (200 OK)**

```typescript
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userInfo": {
    "id": 1,
    "username": "admin",
    "realName": "超级管理员",
    "email": "admin@example.com",
    "roles": ["SUPER_ADMIN"],
    "permissions": ["sys:user:list", "sys:user:add", ...]
  }
}
```

#### 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 登录成功 |
| 400 | 参数错误（用户名或密码为空、长度不符合要求） |
| 401 | 认证失败（用户名或密码错误） |

---

### 2. 刷新 Token

**POST** `/api/auth/refresh`

使用刷新令牌获取新的访问令牌，延长会话有效期。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| refreshToken | string | 是 | 刷新令牌 |

#### 请求示例

```typescript
// 请求体
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

```bash
# curl 示例
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### 响应格式

**成功响应 (200 OK)**

```typescript
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 刷新成功 |
| 400 | 参数错误（refreshToken 为空） |
| 401 | Token 无效或已过期 |

---

### 3. 获取用户信息（通过用户ID）

**GET** `/api/auth/info`

根据用户 ID 获取用户详细信息。

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _uid | string | 是 | 用户 ID |

#### 请求示例

```bash
# curl 示例
curl -X GET "http://localhost:3001/api/auth/info?_uid=1"
```

#### 响应格式

**成功响应 (200 OK)**

```typescript
{
  "id": 1,
  "username": "admin",
  "realName": "超级管理员",
  "email": "admin@example.com",
  "roles": ["SUPER_ADMIN"],
  "permissions": ["sys:user:list", "sys:user:add", ...]
}
```

#### 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 获取成功 |
| 404 | 用户不存在 |

---

### 4. 获取当前用户信息（基于 Token）

**POST** `/api/auth/current`

根据 JWT Token 获取当前登录用户的信息。支持三种 Token 传递方式。

#### Token 传递方式

**方式 1：Authorization Header（推荐）**

```bash
curl -X POST http://localhost:3001/api/auth/current \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**方式 2：请求体**

```bash
curl -X POST http://localhost:3001/api/auth/current \
  -H "Content-Type: application/json" \
  -d '{
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**方式 3：URL 参数**

```bash
curl -X POST "http://localhost:3001/api/auth/current?authorization=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 注意事项

- **所有方式都支持** `"Bearer <token>"` 和 `"<token>"` 两种格式
- **优先级顺序**：Header > Body > URL 参数
- **支持大小写不敏感**：`Authorization`、`authorization`、`AUTHORIZATION` 均可

#### 请求参数

无需额外参数，Token 通过上述三种方式之一传递。

#### 响应格式

**成功响应 (200 OK)**

```typescript
{
  "id": 1,
  "username": "admin",
  "realName": "超级管理员",
  "email": "admin@example.com",
  "roles": ["SUPER_ADMIN"],
  "permissions": ["sys:user:list", "sys:user:add", ...]
}
```

#### 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 获取成功 |
| 400 | 未提供授权信息或 Token 格式无效 |
| 401 | Token 无效或已过期 |

## 安全说明

### 🔒 密码安全

- **密码使用 bcryptjs 加密存储**，永不明文存储
- **密码验证使用安全的哈希比较**，防止时序攻击
- **建议密码强度**：至少 8 位，包含大小写字母、数字和特殊字符

### 🔐 Token 安全

- **访问令牌 (accessToken)** 有效期：**2 小时**
- **刷新令牌 (refreshToken)** 有效期：**7 天**
- **Token 使用 JWT 签名**，防止篡改
- **生产环境必须修改 JWT_SECRET 和 JWT_REFRESH_SECRET**

### ⚠️ 安全最佳实践

1. **始终使用 HTTPS** 传输 Token，防止中间人攻击
2. **不要在 URL 中传递敏感 Token**（仅作为备用方式）
3. **前端应安全存储 Token**，使用 localStorage 或 secure cookie
4. **Token 过期后及时刷新**，使用 refreshToken 获取新的 accessToken
5. **用户登出时清除本地存储的 Token**
6. **定期轮换密钥**，提高安全性

### 🚫 常见安全错误

- ❌ 不要在客户端硬编码密钥
- ❌ 不要将 Token 记录到日志中
- ❌ 不要在未加密的连接上传输 Token
- ❌ 不要使用过短的 Token 有效期
