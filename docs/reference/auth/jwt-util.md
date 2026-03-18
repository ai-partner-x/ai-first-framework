# JWT 工具类使用说明

## 概述

JWT（JSON Web Token）工具类位于 `src/utils/jwt.util.ts`，提供了令牌的生成、验证和解析功能。该工具类是系统认证体系的核心组件，用于实现无状态的身份验证。

## 核心功能

### 1. 环境变量配置

工具类支持通过环境变量自定义密钥和有效期：

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| JWT_SECRET | `ai-first-admin-secret-change-in-production` | 访问令牌签名密钥 |
| JWT_REFRESH_SECRET | `ai-first-refresh-secret-change-in-production` | 刷新令牌签名密钥 |

### 2. Token 有效期

| Token 类型 | 有效期 | 说明 |
|------------|--------|------|
| accessToken | 2 小时 | 用于 API 访问的短期令牌 |
| refreshToken | 7 天 | 用于刷新 accessToken 的长期令牌 |

## JwtPayload 接口

JWT 载荷包含以下字段：

```typescript
interface JwtPayload {
  userId: number;           // 用户 ID
  username: string;         // 用户名
  roles: string[];          // 角色列表
  permissions: string[];    // 权限标识列表
}
```

## API 文档

### signAccessToken

生成访问令牌。

**函数签名：**
```typescript
function signAccessToken(payload: JwtPayload): string;
```

**参数：**
- `payload` - JWT 载荷对象

**返回值：**
- 生成的 JWT 字符串

**调用示例：**
```typescript
import { signAccessToken } from '../utils/jwt.util.js';

const token = signAccessToken({
  userId: 1,
  username: 'admin',
  roles: ['SUPER_ADMIN'],
  permissions: ['sys:user:list', 'sys:user:add']
});

console.log('Access Token:', token);
```

---

### signRefreshToken

生成刷新令牌。

**函数签名：**
```typescript
function signRefreshToken(payload: Pick<JwtPayload, 'userId'>): string;
```

**参数：**
- `payload` - 仅包含 userId 的载荷对象

**返回值：**
- 生成的刷新令牌字符串

**调用示例：**
```typescript
import { signRefreshToken } from '../utils/jwt.util.js';

const refreshToken = signRefreshToken({
  userId: 1
});

console.log('Refresh Token:', refreshToken);
```

---

### verifyAccessToken

验证并解析访问令牌。

**函数签名：**
```typescript
function verifyAccessToken(token: string): JwtPayload;
```

**参数：**
- `token` - JWT 令牌字符串

**返回值：**
- 解析后的 JwtPayload 对象

**异常：**
- Token 无效或过期时抛出异常

**调用示例：**
```typescript
import { verifyAccessToken } from '../utils/jwt.util.js';

try {
  const payload = verifyAccessToken(token);
  console.log('User ID:', payload.userId);
  console.log('Username:', payload.username);
  console.log('Roles:', payload.roles);
  console.log('Permissions:', payload.permissions);
} catch (error) {
  console.error('Token 验证失败:', error.message);
}
```

---

### verifyRefreshToken

验证并解析刷新令牌。

**函数签名：**
```typescript
function verifyRefreshToken(token: string): Pick<JwtPayload, 'userId'>;
```

**参数：**
- `token` - 刷新令牌字符串

**返回值：**
- 仅包含 userId 的对象

**异常：**
- Token 无效或过期时抛出异常

**调用示例：**
```typescript
import { verifyRefreshToken } from '../utils/jwt.util.js';

try {
  const payload = verifyRefreshToken(refreshToken);
  console.log('User ID:', payload.userId);
} catch (error) {
  console.error('Refresh Token 验证失败:', error.message);
}
```

## 完整使用示例

### 用户登录流程

```typescript
import { signAccessToken, signRefreshToken } from '../utils/jwt.util.js';

async function login(username: string, password: string) {
  // 1. 验证用户凭据
  const user = await validateUser(username, password);
  
  // 2. 获取用户角色和权限
  const roles = await getUserRoles(user.id);
  const permissions = await getUserPermissions(user.id);
  
  // 3. 生成 Token
  const accessToken = signAccessToken({
    userId: user.id,
    username: user.username,
    roles,
    permissions
  });
  
  const refreshToken = signRefreshToken({
    userId: user.id
  });
  
  return { accessToken, refreshToken, userInfo: user };
}
```

### Token 刷新流程

```typescript
import { verifyRefreshToken, signAccessToken } from '../utils/jwt.util.js';

async function refreshToken(refreshToken: string) {
  // 1. 验证刷新令牌
  const { userId } = verifyRefreshToken(refreshToken);
  
  // 2. 重新获取用户信息
  const user = await getUserById(userId);
  const roles = await getUserRoles(userId);
  const permissions = await getUserPermissions(userId);
  
  // 3. 生成新的访问令牌
  const accessToken = signAccessToken({
    userId: user.id,
    username: user.username,
    roles,
    permissions
  });
  
  return { accessToken };
}
```

### 中间件验证 Token

```typescript
import { verifyAccessToken } from '../utils/jwt.util.js';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
  
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: '令牌无效或已过期' });
  }
}
```

## 异常处理

### 常见异常类型

| 异常原因 | 错误描述 |
|----------|----------|
| Token 格式错误 | `jwt malformed` |
| Token 签名无效 | `invalid signature` |
| Token 已过期 | `jwt expired` |
| Token 受众不匹配 | `invalid audience` |
| Token 发行者不匹配 | `invalid issuer` |

### 异常处理示例

```typescript
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt.util.js';

try {
  const payload = verifyAccessToken(token);
  // 处理正常逻辑
} catch (error) {
  if (error instanceof jwt.JsonWebTokenError) {
    switch (error.message) {
      case 'jwt expired':
        console.error('Token 已过期');
        // 提示用户重新登录或刷新 Token
        break;
      case 'invalid signature':
        console.error('Token 签名无效');
        // Token 可能被篡改
        break;
      case 'jwt malformed':
        console.error('Token 格式错误');
        // Token 格式不正确
        break;
      default:
        console.error('Token 验证失败:', error.message);
    }
  } else {
    console.error('未知错误:', error);
  }
}
```

## 安全最佳实践

### 1. 密钥管理

**⚠️ 生产环境必须修改默认密钥！**

```bash
# .env 文件示例
JWT_SECRET=your-strong-access-token-secret-key-here-change-it
JWT_REFRESH_SECRET=your-strong-refresh-token-secret-key-here-change-it
```

**密钥生成建议：**
```bash
# 使用 Node.js 生成强密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Token 有效期设置

| 场景 | accessToken 有效期 | refreshToken 有效期 |
|------|-------------------|--------------------|
| 高安全要求 | 15-30 分钟 | 1-3 天 |
| 中等安全 | 1-2 小时 | 7 天 |
| 低安全 | 24 小时 | 30 天 |

### 3. 传输安全

- ✅ **始终使用 HTTPS** 传输 Token
- ✅ **使用 Authorization Header** 传递 Token
- ✅ **避免在 URL 参数**中传递敏感 Token
- ❌ **不要在日志中记录完整 Token**

### 4. 存储安全

**前端存储建议：**

| 存储方式 | 优点 | 缺点 | 推荐场景 |
|----------|------|------|----------|
| localStorage | 简单易用 | XSS 风险 | SPA 应用 |
| sessionStorage | 更安全（标签页关闭即清除） | 无法跨标签页 | 短期会话 |
| HttpOnly Cookie | 防止 XSS | 需要后端配合 | 传统 Web 应用 |

**推荐方案：**
```typescript
// 前端存储示例
const TOKEN_KEY = 'auth_token';

export function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Token 存储失败:', e);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}
```

### 5. Token 刷新策略

**推荐刷新时机：**
1. accessToken 过期前 5-10 分钟自动刷新
2. 收到 401 响应时尝试刷新
3. 用户主动操作时刷新

```typescript
// 自动刷新示例
let refreshTimer: NodeJS.Timeout | null = null;

function scheduleTokenRefresh(token: string, refreshToken: string) {
  // 清除之前的定时器
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  
  // 解析 Token 过期时间
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  
  // 在过期前 5 分钟刷新
  const refreshIn = expiresAt - now - 5 * 60 * 1000;
  
  if (refreshIn > 0) {
    refreshTimer = setTimeout(async () => {
      const newToken = await refreshAccessToken(refreshToken);
      saveToken(newToken);
      scheduleTokenRefresh(newToken, refreshToken);
    }, refreshIn);
  }
}
```

### 6. Token 撤销

虽然 JWT 是无状态的，但可以通过以下方式实现撤销：

1. **黑名单机制**：在 Redis 中存储已撤销的 Token
2. **缩短有效期**：使用较短的 accessToken 有效期
3. **强制重新登录**：修改用户密码时强制所有 Token 失效

### 7. 防止攻击

| 攻击类型 | 防护措施 |
|----------|----------|
| XSS | HttpOnly Cookie、内容安全策略 (CSP) |
| CSRF | SameSite Cookie、CSRF Token |
| 重放攻击 | 短有效期、一次性 nonce |
| 中间人攻击 | 强制 HTTPS、HSTS |

## 故障排查

### Token 验证失败

**问题：** Token 验证抛出异常

**排查步骤：**
1. 检查 Token 格式是否正确（3 个点分隔）
2. 检查密钥是否匹配
3. 检查 Token 是否已过期
4. 检查服务器时间是否正确

### Token 过期处理

**问题：** 用户频繁被踢出登录

**解决方案：**
1. 适当延长 accessToken 有效期
2. 实现自动刷新机制
3. 优化用户体验（静默刷新）

### 性能优化

**大量 Token 验证时的性能优化：**
1. 使用 Redis 缓存已验证的 Token
2. 考虑使用更高效的算法（如 HS256）
3. 避免在验证时进行数据库查询
