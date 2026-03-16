# Local 认证策略示例

本示例展示如何使用 Local 策略进行传统的表单登录认证。

## 概述

Local 策略是传统的用户名/密码认证方式，通常配合 JWT 或 Session 策略使用。

## 特点

- ✅ 简单直接，易于理解
- ✅ 适用于传统表单登录
- ✅ 配合 JWT 或 Session 使用
- ⚠️ 需要配合其他策略使用

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
}
```

## DTO 定义

### LoginDto

```typescript
import { IsNotEmpty, MinLength } from '@ai-partner-x/aiko-boot-starter-validation';

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

### ChangePasswordDto

```typescript
import { IsNotEmpty, MinLength } from '@ai-partner-x/aiko-boot-starter-validation';

export class ChangePasswordDto {
  @IsNotEmpty({ message: '旧密码不能为空' })
  oldPassword!: string;

  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(8, { message: '新密码长度至少 8 位' })
  newPassword!: string;
}
```

## 服务层

### UserService

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity.js';

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
    const user = {
      ...userData,
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
import { ChangePasswordDto } from '../dto/change-password.dto.js';

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
  async changePassword(@RequestBody() dto: ChangePasswordDto) {
    const securityContext = SecurityContext.getInstance();
    const currentUser = securityContext.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('未登录');
    }

    return this.authService.changePassword(
      currentUser.id,
      dto.oldPassword,
      dto.newPassword
    );
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

### 3. 修改密码

```bash
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "oldPassword": "Test@123",
    "newPassword": "NewTest@456"
  }'
```

### 4. 访问受保护的 API

```bash
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 密码安全

### 密码加密

Local 策略使用 bcrypt 加密密码，cost factor 默认为 10。

```typescript
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

const verifyPassword = async (hashedPassword: string, plainPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
```

### 密码验证规则

- 最小长度：8 位
- 必须包含大小写字母
- 必须包含数字
- 必须包含特殊字符

```typescript
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
  message: '密码必须包含大小写字母、数字和特殊字符'
})
```

## 安全建议

### 1. 密码强度

- 强制最小密码长度（>= 8 字符）
- 实现密码复杂度要求
- 考虑密码泄露检测（如 Have I Been Pwned API）

### 2. 登录限制

实现登录速率限制，防止暴力破解：

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 5,                      // 5 次尝试
  message: { error: '登录尝试次数过多，请稍后再试' },
});
```

### 3. 密码重置

实现安全的密码重置流程：

1. 用户请求重置密码
2. 发送包含 token 的邮件
3. token 有效期短（15-30 分钟）
4. token 使用后立即失效
5. 重置成功后通知用户

### 4. 账户锁定

实现账户锁定机制：

- 连续失败 5 次后锁定账户 30 分钟
- 管理员可以手动解锁账户
- 记录登录失败日志

## 常见问题

### Q: Local 策略可以单独使用吗？

A: Local 策略通常需要配合 JWT 或 Session 策略使用，因为 Local 策略本身不提供 token 生成功能。

### Q: 如何实现"记住我"功能？

A: 可以使用长期有效的 refresh token，或者使用持久化的 Session。

### Q: 如何防止密码重放攻击？

A: 使用 HTTPS，实现 CSRF 保护，使用短期 token。

### Q: 如何实现密码历史记录？

A: 在数据库中存储密码历史，防止用户重复使用旧密码。

## 与其他策略的配合

### Local + JWT

最常用的组合，Local 策略处理登录，JWT 策略生成 token。

### Local + Session

适用于传统 Web 应用，Session 策略管理会话状态。

## 更多信息

- [Passport Local 文档](http://www.passportjs.org/packages/passport-local/)
- [bcrypt 文档](https://github.com/kelektiv/node.bcrypt.js/)
- [Aiko Boot Security 文档](../../../../../packages/aiko-boot-starter-security/README.md)
