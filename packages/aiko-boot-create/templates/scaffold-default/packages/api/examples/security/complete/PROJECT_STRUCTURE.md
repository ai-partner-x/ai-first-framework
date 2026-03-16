# 项目结构说明

```
complete/
├── app.config.ts              # 应用配置文件
├── app.ts                     # 应用入口文件
├── package.json               # 项目依赖配置
├── tsconfig.json              # TypeScript 配置
├── .env.example               # 环境变量示例
├── .gitignore                 # Git 忽略文件
├── init.sql                   # 数据库初始化脚本
├── seed.sql                   # 数据库种子数据脚本
├── README.md                  # 项目文档
│
├── entity/                    # 实体定义
│   ├── user.entity.ts         # 用户实体
│   ├── role.entity.ts         # 角色实体
│   ├── permission.entity.ts   # 权限实体
│   ├── user-role.entity.ts    # 用户角色关联实体
│   ├── role-permission.entity.ts # 角色权限关联实体
│   ├── oauth-account.entity.ts   # OAuth 账户实体
│   └── index.ts               # 实体导出
│
├── dto/                       # 数据传输对象
│   ├── login.dto.ts           # 登录 DTO
│   ├── register.dto.ts        # 注册 DTO
│   ├── create-user.dto.ts     # 创建用户 DTO
│   ├── create-role.dto.ts     # 创建角色 DTO
│   ├── create-permission.dto.ts # 创建权限 DTO
│   ├── oauth-profile.dto.ts   # OAuth 配置文件 DTO
│   ├── change-password.dto.ts # 修改密码 DTO
│   └── index.ts               # DTO 导出
│
├── service/                   # 服务层
│   ├── auth.service.ts        # 认证服务
│   ├── user.service.ts        # 用户服务
│   ├── role.service.ts        # 角色服务
│   ├── permission.service.ts  # 权限服务
│   ├── oauth.service.ts       # OAuth 服务
│   └── index.ts               # 服务导出
│
├── controller/                # 控制器层
│   ├── auth.controller.ts     # 认证控制器
│   ├── user.controller.ts     # 用户控制器
│   ├── role.controller.ts     # 角色控制器
│   ├── permission.controller.ts # 权限控制器
│   └── index.ts               # 控制器导出
│
└── middleware/                # 中间件
    ├── auth.interceptor.ts    # 认证拦截器
    ├── permission.interceptor.ts # 权限拦截器
    └── index.ts               # 中间件导出
```

## 核心功能说明

### 1. 认证功能
- **JWT 认证**：基于 Token 的无状态认证
- **Local 认证**：传统的用户名密码认证
- **OAuth2 认证**：支持 GitHub 和 Google 第三方登录
- **Session 认证**：基于会话的认证方式

### 2. 授权功能
- **基于角色的访问控制（RBAC）**
- **基于权限的访问控制**
- **权限表达式支持**：`hasRole()`, `hasPermission()`, `hasAnyRole()`, `hasAllPermissions()`
- **装饰器支持**：`@Public`, `@Authenticated`, `@RolesAllowed`, `@PreAuthorize`, `@PostAuthorize`, `@Secured`

### 3. 用户管理
- 用户注册、登录、登出
- 密码修改
- 用户信息查询和更新
- 角色分配和移除

### 4. 角色管理
- 角色创建、更新、删除
- 角色查询
- 权限分配和移除

### 5. 权限管理
- 权限创建、更新、删除
- 权限查询
- 权限与资源的关联

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入实际的配置
```

### 3. 初始化数据库
```bash
# 创建数据库表
sqlite3 data/app.db < init.sql

# 插入种子数据
sqlite3 data/app.db < seed.sql
```

### 4. 启动应用
```bash
npm run dev
```

### 5. 测试 API
应用将在 `http://localhost:3001` 启动，API 前缀为 `/api`

## API 端点

### 认证端点
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/refresh` - 刷新 Token
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/change-password` - 修改密码
- `GET /api/auth/github` - GitHub OAuth 授权
- `GET /api/auth/github/callback` - GitHub OAuth 回调
- `GET /api/auth/google` - Google OAuth 授权
- `GET /api/auth/google/callback` - Google OAuth 回调

### 用户端点
- `GET /api/users` - 获取用户列表（需要 ADMIN 角色）
- `GET /api/users/:id` - 获取用户详情
- `POST /api/users` - 创建用户（需要 ADMIN 角色）
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户（需要 ADMIN 角色）
- `POST /api/users/:id/roles` - 为用户分配角色（需要 ADMIN 角色）
- `DELETE /api/users/:id/roles/:roleId` - 移除用户角色（需要 ADMIN 角色）

### 角色端点
- `GET /api/roles` - 获取角色列表（需要 ADMIN 角色）
- `GET /api/roles/:id` - 获取角色详情（需要 ADMIN 角色）
- `POST /api/roles` - 创建角色（需要 ADMIN 角色）
- `PUT /api/roles/:id` - 更新角色（需要 ADMIN 角色）
- `DELETE /api/roles/:id` - 删除角色（需要 ADMIN 角色）
- `POST /api/roles/:id/permissions` - 为角色分配权限（需要 ADMIN 角色）
- `DELETE /api/roles/:id/permissions/:permissionId` - 移除角色权限（需要 ADMIN 角色）

### 权限端点
- `GET /api/permissions` - 获取权限列表（需要 ADMIN 角色）
- `GET /api/permissions/:id` - 获取权限详情（需要 ADMIN 角色）
- `POST /api/permissions` - 创建权限（需要 ADMIN 角色）
- `PUT /api/permissions/:id` - 更新权限（需要 ADMIN 角色）
- `DELETE /api/permissions/:id` - 删除权限（需要 ADMIN 角色）

## 默认账户

### 管理员账户
- 用户名：`admin`
- 密码：`Admin123!`
- 角色：ADMIN

### 普通用户账户
- 用户名：`user`
- 密码：`User123!`
- 角色：USER

## 安全建议

1. **生产环境配置**
   - 修改 JWT_SECRET 和 SESSION_SECRET 为强密码
   - 启用 HTTPS
   - 配置 CORS 白名单
   - 启用 CSRF 保护

2. **密码安全**
   - 使用强密码策略
   - 定期要求用户修改密码
   - 实施密码重置流程

3. **OAuth 安全**
   - 在 OAuth 提供商处配置正确的回调 URL
   - 使用 HTTPS 进行 OAuth 通信
   - 验证 state 参数防止 CSRF 攻击

4. **Session 安全**
   - 设置合理的 session 过期时间
   - 使用 httpOnly 和 secure cookie
   - 实施并发登录控制

## 扩展功能

### 添加新的认证策略
1. 创建新的策略类继承自 `AuthStrategy`
2. 实现必要的认证方法
3. 在 `app.config.ts` 中配置新策略

### 添加新的权限装饰器
1. 创建新的装饰器函数
2. 在 `PermissionInterceptor` 中添加处理逻辑
3. 更新权限表达式解析器

### 集成其他数据库
修改 `app.config.ts` 中的数据库配置，支持 MySQL、PostgreSQL 等。

## 故障排查

### 常见问题
1. **数据库连接失败**：检查数据库文件路径和权限
2. **Token 验证失败**：检查 JWT_SECRET 配置
3. **OAuth 回调失败**：检查回调 URL 配置和 OAuth 应用设置
4. **权限不足**：检查用户角色和权限配置

## 技术栈
- **框架**：Aiko Boot
- **数据库**：SQLite (better-sqlite3)
- **认证**：JWT、OAuth2、Session
- **验证**：class-validator
- **密码加密**：bcrypt
- **HTTP 客户端**：axios

## 许可证
MIT License
