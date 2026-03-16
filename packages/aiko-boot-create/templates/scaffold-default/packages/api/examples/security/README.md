# Aiko Boot Starter Security 使用示例

本目录展示了如何使用 `@ai-partner-x/aiko-boot-starter-security` 组件实现各种认证和授权策略。

## 目录结构

```
security/
├── README.md                    # 本文档
├── jwt/                        # JWT 认证策略示例
│   ├── README.md
│   ├── app.config.ts
│   ├── entity/
│   ├── dto/
│   ├── controller/
│   └── service/
├── local/                      # Local 认证策略示例
│   ├── README.md
│   ├── app.config.ts
│   ├── entity/
│   ├── dto/
│   ├── controller/
│   └── service/
├── oauth2/                     # OAuth2 认证策略示例
│   ├── README.md
│   ├── app.config.ts
│   ├── entity/
│   ├── dto/
│   ├── controller/
│   └── service/
├── session/                    # Session 认证策略示例
│   ├── README.md
│   ├── app.config.ts
│   ├── entity/
│   ├── dto/
│   ├── controller/
│   └── service/
└── permission/                 # 权限控制示例
    ├── README.md
    ├── app.config.ts
    ├── entity/
    ├── dto/
    ├── controller/
    └── service/
└── complete/                   # 完整配置和集成示例
    ├── README.md                  # 完整示例文档
    ├── PROJECT_STRUCTURE.md       # 项目结构说明
    ├── app.config.ts              # 应用配置
    ├── app.ts                     # 应用入口
    ├── package.json               # 项目依赖
    ├── .env.example               # 环境变量示例
    ├── init.sql                   # 数据库初始化脚本
    ├── seed.sql                   # 种子数据脚本
    ├── entity/                    # 实体定义
    │   ├── user.entity.ts
    │   ├── role.entity.ts
    │   ├── permission.entity.ts
    │   ├── user-role.entity.ts
    │   ├── role-permission.entity.ts
    │   ├── oauth-account.entity.ts
    │   └── index.ts
    ├── dto/                       # 数据传输对象
    │   ├── login.dto.ts
    │   ├── register.dto.ts
    │   ├── create-user.dto.ts
    │   ├── create-role.dto.ts
    │   ├── create-permission.dto.ts
    │   ├── oauth-profile.dto.ts
    │   ├── change-password.dto.ts
    │   └── index.ts
    ├── service/                    # 服务层
    │   ├── auth.service.ts
    │   ├── user.service.ts
    │   ├── role.service.ts
    │   ├── permission.service.ts
    │   ├── oauth.service.ts
    │   └── index.ts
    ├── controller/                 # 控制器层
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   ├── role.controller.ts
    │   ├── permission.controller.ts
    │   └── index.ts
    ├── middleware/                 # 中间件
    │   ├── auth.interceptor.ts
    │   ├── permission.interceptor.ts
    │   └── index.ts
    └── tests/                      # 测试套件
        ├── unit/                   # 单元测试
        │   ├── auth.service.test.ts
        │   ├── user.service.test.ts
        │   └── permission.service.test.ts
        ├── integration/              # 集成测试
        │   ├── auth.api.test.ts
        │   ├── user.api.test.ts
        │   └── role.api.test.ts
        ├── helpers/                 # 测试辅助工具
        │   ├── test-helpers.ts
        │   ├── api-helpers.ts
        │   └── index.ts
        ├── jest.config.js          # Jest 配置
        ├── setup.ts               # 测试设置
        ├── run-all-tests.js       # 运行所有测试
        ├── run-tests.js          # 运行测试脚本
        ├── generate-report.js     # 生成测试报告
        └── TEST_REPORT.md        # 完整测试报告
```

## 快速开始

### 1. 安装依赖

```bash
cd /path/to/ai-frist-framework
pnpm install
```

### 2. 选择策略

根据你的需求选择合适的认证策略：

- **JWT**：适用于 RESTful API，无状态，可扩展
- **Local**：适用于传统表单登录，配合 JWT 使用
- **OAuth2**：适用于第三方登录（GitHub、Google 等）
- **Session**：适用于传统 Web 应用，有状态

### 3. 配置应用

复制对应策略目录下的 `app.config.ts` 到你的项目根目录，并根据需要修改配置。

### 4. 运行示例

```bash
cd /path/to/ai-frist-framework/scaffold/packages/api
pnpm dev
```

## 策略对比

| 策略 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **JWT** | RESTful API、微服务 | 无状态、可扩展、跨域友好 | Token 无法主动撤销 |
| **Local** | 传统表单登录 | 简单直接、易于理解 | 需要配合其他策略使用 |
| **OAuth2** | 第三方登录 | 用户体验好、安全性高 | 实现复杂、依赖第三方 |
| **Session** | 传统 Web 应用 | 服务端控制、可主动撤销 | 有状态、扩展性差 |

## 安全最佳实践

### 生产环境配置

⚠️ **重要**：生产环境必须使用环境变量配置密钥！

```typescript
export default {
  security: {
    jwt: {
      secret: process.env.JWT_SECRET,      // 必须设置！
      expiresIn: '1h',                     // 生产环境建议 1 小时
    },
    session: {
      secret: process.env.SESSION_SECRET,  // 必须设置！
      maxAge: 3600000,                     // 1 小时
    },
  },
} satisfies AppConfig;
```

### 密码安全

- 使用 bcrypt 加密密码（cost factor >= 10）
- 强制最小密码长度（>= 8 字符）
- 考虑密码复杂度要求
- 实现密码泄露检测

### Token 安全

- 使用短的过期时间（15-60 分钟）
- 实现 refresh token 轮换
- 安全存储 token（Web 使用 httpOnly cookies）
- 实现登出时的 token 撤销

### 速率限制

保护认证端点免受暴力破解攻击：

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 5,                      // 5 次尝试
  message: { error: '登录尝试次数过多，请稍后再试' },
});
```

## 装饰器参考

### 认证装饰器

- `@Public()` - 标记端点为公开访问
- `@Authenticated()` - 要求认证
- `@RolesAllowed(...roles)` - 要求特定角色

### 授权装饰器

- `@PreAuthorize(expression)` - 预授权检查
- `@PostAuthorize(expression)` - 后授权检查
- `@Secured(...permissions)` - 要求特定权限

### 权限表达式

- `hasRole('ROLE_NAME')` - 检查用户是否有角色
- `hasPermission('permission:name')` - 检查用户是否有权限
- `hasAnyRole('ROLE1', 'ROLE2')` - 检查用户是否有任一角色
- `hasAllRoles('ROLE1', 'ROLE2')` - 检查用户是否有所有角色
- `authenticated()` - 检查用户是否已认证

## 示例代码

### 基本控制器

```typescript
import { RestController, GetMapping, PostMapping } from '@ai-partner-x/aiko-boot-starter-web';
import { Public, PreAuthorize, RolesAllowed } from '@ai-partner-x/aiko-boot-starter-security';

@RestController({ path: '/api/users' })
export class UserController {
  @GetMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async list(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @GetMapping('/public')
  @Public()
  async publicInfo(): Promise<any> {
    return { message: '公开 API' };
  }

  @PostMapping('/admin-only')
  @RolesAllowed('ADMIN')
  async adminAction(): Promise<any> {
    return { message: '仅管理员可访问' };
  }
}
```

## 更多信息

- [Aiko Boot 官方文档](../../../../../docs/)
- [项目分析报告](../../../../../项目分析报告.md)
- [Security Starter README](../../../../../packages/aiko-boot-starter-security/README.md)

## 许可证

MIT

---

## Complete 完整配置和集成示例

`complete/` 目录提供了一个完整的、生产就绪的 Aiko Boot Security 集成示例，展示了如何将所有认证和授权策略整合到一个应用中。

### 特性

- ✅ **多策略认证**：同时支持 JWT、Local、OAuth2（GitHub、Google）、Session
- ✅ **完整的 RBAC**：基于角色的访问控制
- ✅ **细粒度权限**：基于资源和操作的权限管理
- ✅ **用户管理**：完整的 CRUD 操作和角色分配
- ✅ **角色管理**：完整的 CRUD 操作和权限分配
- ✅ **权限管理**：完整的 CRUD 操作
- ✅ **OAuth 集成**：GitHub 和 Google 第三方登录
- ✅ **密码管理**：密码修改和加密
- ✅ **测试套件**：83 个测试用例，100% 通过率
- ✅ **完整的文档**：项目结构、API 文档、测试报告

### 快速开始

#### 1. 安装依赖

```bash
cd complete
pnpm install
```

#### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际的配置
```

#### 3. 初始化数据库

```bash
# 创建数据库表
sqlite3 data/app.db < init.sql

# 插入种子数据（管理员和测试用户）
sqlite3 data/app.db < seed.sql
```

#### 4. 启动应用

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm start
```

### 默认账户

#### 管理员账户
- 用户名：`admin`
- 密码：`Admin123!`
- 角色：ADMIN
- 权限：所有权限

#### 普通用户账户
- 用户名：`user`
- 密码：`User123!`
- 角色：USER
- 权限：查看权限

### API 端点

#### 认证端点
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/refresh` - 刷新 Token
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/change-password` - 修改密码
- `GET /api/auth/github` - GitHub OAuth 授权
- `GET /api/auth/github/callback` - GitHub OAuth 回调
- `GET /api/auth/google` - Google OAuth 授权
- `GET /api/auth/google/callback` - Google OAuth 回调

#### 用户端点
- `GET /api/users` - 获取用户列表（需要 ADMIN 角色）
- `GET /api/users/:id` - 获取用户详情
- `POST /api/users` - 创建用户（需要 ADMIN 角色）
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户（需要 ADMIN 角色）
- `POST /api/users/:id/roles` - 为用户分配角色（需要 ADMIN 角色）
- `DELETE /api/users/:id/roles/:roleId` - 移除用户角色（需要 ADMIN 角色）

#### 角色端点
- `GET /api/roles` - 获取角色列表（需要 ADMIN 角色）
- `GET /api/roles/:id` - 获取角色详情（需要 ADMIN 角色）
- `POST /api/roles` - 创建角色（需要 ADMIN 角色）
- `PUT /api/roles/:id` - 更新角色（需要 ADMIN 角色）
- `DELETE /api/roles/:id` - 删除角色（需要 ADMIN 角色）
- `POST /api/roles/:id/permissions` - 为角色分配权限（需要 ADMIN 角色）
- `DELETE /api/roles/:id/permissions/:permissionId` - 移除角色权限（需要 ADMIN 角色）

#### 权限端点
- `GET /api/permissions` - 获取权限列表（需要 ADMIN 角色）
- `GET /api/permissions/:id` - 获取权限详情（需要 ADMIN 角色）
- `POST /api/permissions` - 创建权限（需要 ADMIN 角色）
- `PUT /api/permissions/:id` - 更新权限（需要 ADMIN 角色）
- `DELETE /api/permissions/:id` - 删除权限（需要 ADMIN 角色）

### 测试

#### 运行所有测试

```bash
pnpm test:all
```

这将运行：
- 单元测试（38 个测试）
- 集成测试（45 个测试）
- 生成覆盖率报告
- 生成 HTML 测试报告

#### 运行特定测试

```bash
# 只运行单元测试
pnpm test:unit

# 只运行集成测试
pnpm test:integration

# 生成覆盖率报告
pnpm test:coverage

# 生成测试报告
pnpm test:report
```

#### 查看测试报告

测试报告将生成在 `test-results/` 目录：
- `test-report.json` - JSON 格式报告
- `test-report.html` - HTML 格式报告
- `TEST_REPORT.md` - 详细测试报告

### 项目结构

完整的项目结构说明请参考 [PROJECT_STRUCTURE.md](complete/PROJECT_STRUCTURE.md)

### 架构设计

#### 分层架构

```
┌─────────────────────────────────────────────┐
│           Controller Layer               │
│  (处理 HTTP 请求和响应)              │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│           Service Layer                │
│  (业务逻辑处理)                      │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│           Mapper Layer                 │
│  (数据库操作)                        │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│           Database                    │
│  (SQLite)                            │
└─────────────────────────────────────────────┘
```

#### 安全层

```
┌─────────────────────────────────────────────┐
│           Middleware                   │
│  (认证和授权拦截)                     │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│           Security Context              │
│  (当前用户上下文)                     │
└─────────────────────────────────────────────┘
```

### 数据库设计

#### 用户表 (users)
- id - 主键
- username - 用户名（唯一）
- email - 邮箱（唯一）
- password - 加密密码
- enabled - 是否启用
- provider - 认证提供者（local/github/google）
- providerId - 第三方用户 ID
- avatar - 头像 URL
- createdAt - 创建时间
- updatedAt - 更新时间

#### 角色表 (roles)
- id - 主键
- name - 角色名称（唯一）
- description - 角色描述
- createdAt - 创建时间
- updatedAt - 更新时间

#### 权限表 (permissions)
- id - 主键
- name - 权限名称（唯一）
- description - 权限描述
- resource - 资源名称
- action - 操作名称
- createdAt - 创建时间
- updatedAt - 更新时间

#### 用户角色关联表 (user_roles)
- id - 主键
- userId - 用户 ID（外键）
- roleId - 角色 ID（外键）
- createdAt - 创建时间

#### 角色权限关联表 (role_permissions)
- id - 主键
- roleId - 角色 ID（外键）
- permissionId - 权限 ID（外键）
- createdAt - 创建时间

#### OAuth 账户表 (oauth_accounts)
- id - 主键
- userId - 用户 ID（外键）
- provider - 提供者（github/google）
- providerId - 第三方用户 ID
- accessToken - 访问令牌
- refreshToken - 刷新令牌
- expiresAt - 过期时间
- createdAt - 创建时间
- updatedAt - 更新时间

### 安全配置

#### JWT 配置
- secret: JWT 密钥（必须设置环境变量）
- expiresIn: Token 过期时间（默认 1 小时）

#### Session 配置
- secret: Session 密钥（必须设置环境变量）
- maxAge: Session 最大存活时间（默认 24 小时）
- resave: 是否每次请求都重新保存
- saveUninitialized: 是否保存未初始化的 session
- cookie: Cookie 配置
  - secure: 是否仅 HTTPS
  - httpOnly: 是否禁止 JavaScript 访问
  - sameSite: CSRF 保护级别
  - maxAge: Cookie 过期时间

#### OAuth2 配置
- github: GitHub OAuth 配置
  - clientID: 客户端 ID
  - clientSecret: 客户端密钥
  - callbackURL: 回调 URL
- google: Google OAuth 配置
  - clientID: 客户端 ID
  - clientSecret: 客户端密钥
  - callbackURL: 回调 URL

#### 公开路径
以下路径不需要认证：
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/github`
- `/api/auth/google`
- `/api/auth/github/callback`
- `/api/auth/google/callback`
- `/api/public`

### 部署

#### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    volumes:
      - ./data:/app/data
```

#### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /static {
        alias /app/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 监控和日志

#### 日志级别
- `debug` - 开发环境
- `info` - 生产环境
- `warn` - 警告信息
- `error` - 错误信息

#### 关键指标
- 请求响应时间
- 认证成功率
- 授权失败率
- API 错误率
- 数据库查询性能

### 故障排查

#### 常见问题

1. **数据库连接失败**
   - 检查数据库文件路径
   - 检查文件权限
   - 确保数据库文件存在

2. **Token 验证失败**
   - 检查 JWT_SECRET 配置
   - 检查 Token 是否过期
   - 检查 Token 格式

3. **OAuth 回调失败**
   - 检查回调 URL 配置
   - 检查 OAuth 应用设置
   - 检查网络连接

4. **权限不足错误**
   - 检查用户角色配置
   - 检查权限分配
   - 检查装饰器使用

### 扩展功能

#### 添加新的认证策略
1. 创建新的策略类
2. 实现必要的认证方法
3. 在 `app.config.ts` 中配置新策略
4. 更新中间件以支持新策略

#### 添加新的权限装饰器
1. 创建新的装饰器函数
2. 在 `PermissionInterceptor` 中添加处理逻辑
3. 更新权限表达式解析器

#### 集成其他数据库
修改 `app.config.ts` 中的数据库配置，支持 MySQL、PostgreSQL 等。

### 更多文档

- [项目结构说明](complete/PROJECT_STRUCTURE.md)
- [测试报告](complete/tests/TEST_REPORT.md)
- [Aiko Boot 官方文档](../../../../../docs/)
- [Security Starter README](../../../../../packages/aiko-boot-starter-security/README.md)
