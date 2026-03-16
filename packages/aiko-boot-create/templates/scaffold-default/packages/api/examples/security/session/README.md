# Session 认证策略示例

本示例展示如何使用 Session 策略实现传统的基于会话的认证。

## 概述

Session 策略是传统的 Web 应用认证方式，使用服务端存储的会话状态来跟踪用户登录状态。

## 特点

- ✅ 服务端控制，可主动撤销
- ✅ 适用于传统 Web 应用
- ✅ 实现简单，易于理解
- ⚠️ 有状态，扩展性差
- ⚠️ 不适合微服务架构

## 配置

```typescript
import type { AppConfig } from '@ai-partner-x/aiko-boot';
import session from 'express-session';

export default {
  server: {
    port: Number(process.env.PORT) || 3001,
    servlet: {
      contextPath: '/api',
    },
  },
  security: {
    enabled: true,
    session: {
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      maxAge: 86400000, // 24 小时
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
        httpOnly: true, // 防止 XSS 攻击
        maxAge: 86400000,
      },
    },
    publicPaths: ['/api/auth/login', '/api/auth/register'],
  },
  database: {
    type: 'sqlite',
    filename: './data/app.db',
  },
} satisfies AppConfig;
```

## Session 中间件配置

```typescript
import session from 'express-session';
import { createApp } from '@ai-partner-x/aiko-boot';

const app = await createApp({ srcDir: __dirname });

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000,
  },
}));

app.run();
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

### Session 实体（可选）

如果需要将 Session 存储到数据库：

```typescript
import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'sessions' })
export class Session {
  @TableId()
  id!: string;

  @TableField()
  @Column()
  userId!: number;

  @TableField()
  @Column()
  data!: string;

  @TableField()
  @Column()
  expiresAt!: Date;

  @TableField()
  @Column()
  createdAt!: Date;
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
import { SessionStrategy } from '@ai-partner-x/aiko-boot-starter-security';
import { UserService } from './user.service.js';
import type { RegisterDto } from '../dto/register.dto.js';

@Service()
export class AuthService {
  @Autowired()
  private sessionStrategy!: SessionStrategy;

  @Autowired()
  private userService!: UserService;

  async login(request: any, username: string, password: string) {
    const user = await this.userService.findByUsername(username);

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    if (!user.enabled) {
      throw new Error('账户已被禁用');
    }

    const isValid = await bcrypt.compare(password, user.password || '');

    if (!isValid) {
      throw new Error('用户名或密码错误');
    }

    await this.sessionStrategy.login(request, user);

    return {
      user: this.sanitizeUser(user),
      message: '登录成功',
    };
  }

  async register(userData: RegisterDto) {
    const existingUser = await this.userService.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    const existingEmail = await this.userService.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('邮箱已存在');
    }

    const user = await this.userService.create(userData);
    return this.sanitizeUser(user);
  }

  async logout(request: any) {
    await this.sessionStrategy.logout(request);
    return { message: '登出成功' };
  }

  async getCurrentUser(request: any) {
    const user = await this.sessionStrategy.authenticate(request);
    if (!user) {
      throw new Error('未登录');
    }
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
```

## 控制器层

### AuthController

```typescript
import { RestController, PostMapping, GetMapping, RequestBody } from '@ai-partner-x/aiko-boot-starter-web';
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
  async login(@RequestBody() dto: LoginDto, request: any) {
    return this.authService.login(request, dto.username, dto.password);
  }

  @PostMapping('/register')
  @Public()
  async register(@RequestBody() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @PostMapping('/logout')
  async logout(request: any) {
    return this.authService.logout(request);
  }

  @GetMapping('/me')
  async getCurrentUser(request: any) {
    return this.authService.getCurrentUser(request);
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
  async profile(request: any): Promise<any> {
    const authService = Container.get(AuthService);
    return authService.getCurrentUser(request);
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
  -c cookies.txt \
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
  -c cookies.txt \
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
  "message": "登录成功"
}
```

### 3. 访问受保护的 API

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -b cookies.txt
```

响应：
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "enabled": true
}
```

### 4. 用户登出

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

响应：
```json
{
  "message": "登出成功"
}
```

## Session 存储

### 内存存储（默认）

```typescript
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false,
}));
```

### Redis 存储（推荐生产环境）

```typescript
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000,
  },
}));
```

### 数据库存储

```typescript
import session from 'express-session';
import { SessionMapper } from './mapper/session.mapper.js';

const DatabaseStore = session.Store;

class CustomDatabaseStore extends DatabaseStore {
  async get(sid: string, callback: Function) {
    try {
      const session = await SessionMapper.selectById(sid);
      callback(null, session ? JSON.parse(session.data) : null);
    } catch (error) {
      callback(error);
    }
  }

  async set(sid: string, session: any, callback: Function) {
    try {
      await SessionMapper.insert({
        id: sid,
        userId: session.userId,
        data: JSON.stringify(session),
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      });
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async destroy(sid: string, callback: Function) {
    try {
      await SessionMapper.deleteById(sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async all(callback: Function) {
    try {
      const sessions = await SessionMapper.selectList({});
      const result: Record<string, any> = {};
      for (const session of sessions) {
        result[session.id] = JSON.parse(session.data);
      }
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  }
}

app.use(session({
  store: new CustomDatabaseStore(),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
```

## 安全建议

### 1. Cookie 安全

```typescript
cookie: {
  secure: process.env.NODE_ENV === 'production', // 仅 HTTPS
  httpOnly: true, // 防止 XSS 攻击
  sameSite: 'strict', // 防止 CSRF 攻击
  maxAge: 86400000,
}
```

### 2. Session Secret

⚠️ **重要**：生产环境必须使用强密钥！

```bash
# 生成安全的 Session 密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```typescript
secret: process.env.SESSION_SECRET, // 必须设置！
```

### 3. Session 过期

```typescript
maxAge: 3600000, // 1 小时（生产环境建议更短）
```

### 4. Session 固定攻击防护

```typescript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 86400000,
  },
  rolling: true, // 每次请求都刷新 session
}));
```

### 5. CSRF 保护

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## 常见问题

### Q: Session 和 JWT 有什么区别？

A: Session 是有状态的，服务端存储会话信息；JWT 是无状态的，信息存储在 token 中。

### Q: 什么时候使用 Session？

A: 传统 Web 应用、需要服务端控制、需要主动撤销会话的场景。

### Q: 什么时候使用 JWT？

A: RESTful API、微服务架构、移动端应用、需要跨域的场景。

### Q: 如何实现 Session 轮换？

A: 使用 `rolling: true` 选项，每次请求都刷新 session。

### Q: 如何实现多设备登录控制？

A: 在数据库中存储所有 session，限制每个用户的最大 session 数量。

## 扩展功能

### 1. 记住我功能

```typescript
async login(request: any, username: string, password: string, rememberMe: boolean = false) {
  const user = await this.userService.findByUsername(username);
  
  if (!user || !await bcrypt.compare(password, user.password || '')) {
    throw new Error('用户名或密码错误');
  }

  await this.sessionStrategy.login(request, user);

  if (rememberMe) {
    request.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 天
  }

  return {
    user: this.sanitizeUser(user),
    message: '登录成功',
  };
}
```

### 2. Session 黑名单

```typescript
const sessionBlacklist = new Set<string>();

async logout(request: any) {
  const sessionId = request.sessionID;
  sessionBlacklist.add(sessionId);
  await this.sessionStrategy.logout(request);
  return { message: '登出成功' };
}

async checkSession(request: any) {
  const sessionId = request.sessionID;
  if (sessionBlacklist.has(sessionId)) {
    throw new Error('Session 已失效');
  }
}
```

### 3. 并发登录控制

```typescript
async login(request: any, username: string, password: string) {
  const user = await this.userService.findByUsername(username);
  
  if (!user || !await bcrypt.compare(password, user.password || '')) {
    throw new Error('用户名或密码错误');
  }

  const existingSessions = await this.getUserSessions(user.id);
  if (existingSessions.length >= 3) {
    await this.destroyOldestSession(user.id);
  }

  await this.sessionStrategy.login(request, user);

  return {
    user: this.sanitizeUser(user),
    message: '登录成功',
  };
}
```

## 性能优化

### 1. 使用 Redis 存储

Redis 提供快速的 Session 存储，适合高并发场景。

### 2. 减少 Session 大小

只存储必要的信息，避免在 Session 中存储大量数据。

### 3. 使用 CDN

静态资源使用 CDN，减少服务器负载。

## 更多信息

- [Express Session 文档](https://github.com/expressjs/session)
- [Redis Session 存储](https://github.com/tj/connect-redis)
- [CSRF 保护](https://github.com/expressjs/csurf)
- [Aiko Boot Security 文档](../../../../../packages/aiko-boot-starter-security/README.md)
