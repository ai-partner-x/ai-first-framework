# JWT 认证策略示例

本示例展示如何使用 JWT（JSON Web Token）进行认证和授权。

## 概述

JWT 是一种无状态的认证机制，适用于 RESTful API 和微服务架构。

## 特点

- ✅ 无状态，易于扩展
- ✅ 跨域友好
- ✅ 移动端友好
- ⚠️ Token 无法主动撤销（需要额外实现）
- ⚠️ Token 泄露后直到过期前都有效

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
      secret: process.env.JWT_SECRET || 'your-secret-key', // 生产环境必须使用环境变量！
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
}
```

## DTO 定义

### LoginDto

```typescript
import { IsEmail, IsNotEmpty, MinLength } from '@ai-partner-x/aiko-boot-starter-validation';

export class LoginDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  username!: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度至少 6 位' })
  password!: string;
}
```

### RegisterDto

```typescript
import { IsEmail, IsNotEmpty, MinLength, Matches } from '@ai-partner-x/aiko-boot-starter-validation';

export class RegisterDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名长度至少 3 位' })
  username!: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码长度至少 8 位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  })
  password!: string;
}
```

## 服务层

### UserService

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity.js';
import bcrypt from 'bcrypt';

@Service()
export class UserService {
  @Autowired()
  private userMapper!: BaseMapper<User>;

  async findByUsername(username: string): Promise<User | null> {
    const users = await this.userMapper.selectList({
      where: { username }
    });
    return users[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.userMapper.selectList({
      where: { email }
    });
    return users[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    return this.userMapper.selectById(id);
  }

  async create(userData: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password || '', 10);
    const user = {
      ...userData,
      password: hashedPassword,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = await this.userMapper.insert(user);
    return this.userMapper.selectById(id) as Promise<User>;
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    await this.userMapper.updateById(id, {
      ...userData,
      updatedAt: new Date(),
    });
    return this.userMapper.selectById(id) as Promise<User>;
  }

  async delete(id: number): Promise<boolean> {
    return this.userMapper.deleteById(id) > 0;
  }
}
```

### AuthService

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { AuthService as SecurityAuthService } from '@ai-partner-x/aiko-boot-starter-security';
import { UserService } from './user.service.js';
import type { RegisterDto } from '../dto/register.dto.js';

@Service()
export class AuthService {
  @Autowired()
  private securityAuthService!: SecurityAuthService;

  @Autowired()
  private userService!: UserService;

  async login(username: string, password: string) {
    return this.securityAuthService.login({ username, password });
  }

  async register(userData: RegisterDto) {
    return this.securityAuthService.register(userData);
  }

  async refreshToken(refreshToken: string) {
    return this.securityAuthService.refreshToken(refreshToken);
  }

  async logout(token: string) {
    return this.securityAuthService.logout(token);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    return this.securityAuthService.changePassword(userId, oldPassword, newPassword);
  }
}
```

## 控制器层

### AuthController

```typescript
import { RestController, PostMapping, RequestBody } from '@ai-partner-x/aiko-boot-starter-web';
import { Public } from '@ai-partner-x/aiko-boot-starter-security';
import { AuthService } from '../service/auth.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';

@RestController({ path: '/auth' })
export class AuthController {
  @Autowired()
  private authService!: AuthService;

  @PostMapping('/login')
  @Public()
  async login(@RequestBody() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @PostMapping('/register')
  @Public()
  async register(@RequestBody() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @PostMapping('/refresh')
  async refresh(@RequestBody() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @PostMapping('/logout')
  async logout(@RequestBody() body: { token: string }) {
    return this.authService.logout(body.token);
  }

  @PostMapping('/change-password')
  async changePassword(@RequestBody() body: { userId: number; oldPassword: string; newPassword: string }) {
    return this.authService.changePassword(body.userId, body.oldPassword, body.newPassword);
  }
}
```

### UserController

```typescript
import { RestController, GetMapping, PostMapping, RequestBody } from '@ai-partner-x/aiko-boot-starter-web';
import { Public, PreAuthorize, RolesAllowed } from '@ai-partner-x/aiko-boot-starter-security';
import { UserService } from '../service/user.service.js';

@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  @GetMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async list(): Promise<any[]> {
    return this.userService.findAll();
  }

  @GetMapping('/profile')
  async profile(): Promise<any> {
    const securityContext = SecurityContext.getInstance();
    const currentUser = securityContext.getCurrentUser();
    return currentUser;
  }

  @GetMapping('/public')
  @Public()
  async publicInfo(): Promise<any> {
    return { message: '公开 API', timestamp: new Date() };
  }

  @PostMapping('/admin-only')
  @RolesAllowed('ADMIN')
  async adminAction(): Promise<any> {
    return { message: '仅管理员可访问', action: 'admin-operation' };
  }
}
```

## 使用示例

### 1. 用户注册

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

响应：
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "enabled": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. 用户登录

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123"
  }'
```

响应：
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "enabled": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### 3. 访问受保护的 API

```bash
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. 刷新 Token

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## 安全建议

### 生产环境配置

⚠️ **重要**：生产环境必须使用强密钥！

```bash
# 生成安全的 JWT 密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```typescript
export default {
  security: {
    jwt: {
      secret: process.env.JWT_SECRET,      // 必须设置！
      expiresIn: '1h',                     // 生产环境建议 1 小时
    },
  },
} satisfies AppConfig;
```

### Token 安全

- 使用短的过期时间（15-60 分钟）
- 实现 refresh token 轮换
- 安全存储 token（Web 使用 httpOnly cookies）
- 实现 token 黑名单机制

### 密码安全

- 使用 bcrypt 加密密码（cost factor >= 10）
- 强制最小密码长度（>= 8 字符）
- 考虑密码复杂度要求
- 实现密码泄露检测

## 常见问题

### Q: Token 过期后如何处理？

A: 使用 refresh token 获取新的 access token。如果 refresh token 也过期，需要重新登录。

### Q: 如何实现 Token 撤销？

A: 可以使用 Redis 存储黑名单，或者在 token 中包含版本号，用户修改密码时更新版本号。

### Q: 如何防止 Token 被窃取？

A: 使用 HTTPS，设置 httpOnly cookies，实现 IP 绑定，使用短期 token。

## 更多信息

- [JWT 官方网站](https://jwt.io/)
- [Aiko Boot Security 文档](../../../../../packages/aiko-boot-starter-security/README.md)
