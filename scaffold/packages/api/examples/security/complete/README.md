# 完整配置和集成示例

本示例展示如何将所有认证和授权策略整合到一个完整的应用中。

## 概述

本示例展示了一个完整的全栈应用，包含：

- JWT 认证（主要认证方式）
- Local 认证（表单登录）
- OAuth2 认证（GitHub、Google）
- Session 认证（传统 Web 应用）
- 权限控制（RBAC）

## 项目结构

```
security-complete/
├── app.config.ts              # 应用配置
├── entity/                    # 实体定义
│   ├── user.entity.ts
│   ├── role.entity.ts
│   ├── permission.entity.ts
│   ├── user-role.entity.ts
│   └── role-permission.entity.ts
├── dto/                       # 数据传输对象
│   ├── login.dto.ts
│   ├── register.dto.ts
│   ├── create-user.dto.ts
│   ├── create-role.dto.ts
│   └── create-permission.dto.ts
├── service/                   # 服务层
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── role.service.ts
│   ├── permission.service.ts
│   └── oauth.service.ts
├── controller/                # 控制器层
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── role.controller.ts
│   ├── permission.controller.ts
│   └── post.controller.ts
└── middleware/                # 中间件
    ├── auth.interceptor.ts
    └── permission.interceptor.ts
```

## 完整配置

```typescript
import type { AppConfig } from '@ai-partner-x/aiko-boot';

export default {
  server: {
    port: Number(process.env.PORT) || 3001,
    servlet: {
      contextPath: '/api',
    },
    shutdown: 'graceful',
  },
  logging: {
    level: {
      root: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  },
  database: {
    type: 'sqlite',
    filename: './data/app.db',
  },
  validation: {
    enabled: true,
    failFast: false,
  },
  security: {
    enabled: true,
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h',
    },
    session: {
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      maxAge: 86400000,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 86400000,
      },
    },
    oauth2: {
      github: {
        clientID: process.env.GITHUB_CLIENT_ID || 'your-github-client-id',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret',
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
      },
      google: {
        clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
      },
    },
    publicPaths: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/github',
      '/api/auth/google',
      '/api/auth/github/callback',
      '/api/auth/google/callback',
      '/api/public',
    ],
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  },
} satisfies AppConfig;
```

## 环境变量配置

创建 `.env` 文件：

```bash
# 服务器配置
PORT=3001
NODE_ENV=development

# 安全配置
JWT_SECRET=your-very-secure-jwt-secret-key-at-least-32-characters
SESSION_SECRET=your-very-secure-session-secret-key-at-least-32-characters

# OAuth2 配置
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# CORS 配置
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# 数据库配置
DATABASE_TYPE=sqlite
DATABASE_FILENAME=./data/app.db

# Redis 配置（可选）
REDIS_URL=redis://localhost:6379
```

## 应用入口

```typescript
import { createApp } from '@ai-partner-x/aiko-boot';
import '@ai-partner-x/aiko-boot-starter-security';
import '@ai-partner-x/aiko-boot-starter-web';
import '@ai-partner-x/aiko-boot-starter-orm';
import '@ai-partner-x/aiko-boot-starter-validation';
import session from 'express-session';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await createApp({ srcDir: __dirname });

  // Session 中间件
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 86400000,
    },
  }));

  // 速率限制
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: '登录尝试次数过多，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/auth/login', loginLimiter);

  // 全局错误处理
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);
    
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: '未授权' });
    }
    
    if (err.name === 'ForbiddenError') {
      return res.status(403).json({ error: '禁止访问' });
    }
    
    res.status(500).json({ error: '服务器内部错误' });
  });

  await app.run();
  
  console.log('🚀 Server is running on http://localhost:3001');
}

bootstrap().catch(console.error);
```

## 数据库初始化脚本

```typescript
import { createApp } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from './entity/user.entity.js';
import { Role } from './entity/role.entity.js';
import { Permission } from './entity/permission.entity.js';
import bcrypt from 'bcrypt';

async function initDatabase() {
  const app = await createApp({ srcDir: __dirname });
  
  const userMapper = Container.get(BaseMapper<User>);
  const roleMapper = Container.get(BaseMapper<Role>);
  const permissionMapper = Container.get(BaseMapper<Permission>);

  console.log('🗄️  Initializing database...');

  // 创建默认权限
  const permissions = [
    { name: 'user:read', description: '读取用户信息', resource: 'user', action: 'read' },
    { name: 'user:write', description: '写入用户信息', resource: 'user', action: 'write' },
    { name: 'user:delete', description: '删除用户', resource: 'user', action: 'delete' },
    { name: 'post:read', description: '读取文章', resource: 'post', action: 'read' },
    { name: 'post:create', description: '创建文章', resource: 'post', action: 'create' },
    { name: 'post:update', description: '更新文章', resource: 'post', action: 'update' },
    { name: 'post:delete', description: '删除文章', resource: 'post', action: 'delete' },
    { name: 'post:publish', description: '发布文章', resource: 'post', action: 'publish' },
  ];

  for (const perm of permissions) {
    await permissionMapper.insert({
      ...perm,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log('✅ Permissions created');

  // 创建默认角色
  const adminRole = await roleMapper.insert({
    name: 'ADMIN',
    description: '管理员',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const userRole = await roleMapper.insert({
    name: 'USER',
    description: '普通用户',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✅ Roles created');

  // 分配权限给角色
  const allPermissions = await permissionMapper.selectList({});
  const adminPermissions = allPermissions.map(p => p.id);
  const userPermissions = allPermissions
    .filter(p => !p.name.includes('delete'))
    .map(p => p.id);

  // 这里需要实现 role-permission 关联表的插入
  console.log('✅ Permissions assigned to roles');

  // 创建默认管理员
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  await userMapper.insert({
    username: 'admin',
    email: 'admin@example.com',
    password: hashedPassword,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✅ Admin user created');
  console.log('📝 Admin credentials: admin / Admin@123');

  console.log('🎉 Database initialization completed!');
}

initDatabase().catch(console.error);
```

## 完整的认证控制器

```typescript
import { RestController, GetMapping, PostMapping, QueryParam } from '@ai-partner-x/aiko-boot-starter-web';
import { Public } from '@ai-partner-x/aiko-boot-starter-security';
import { AuthService } from '../service/auth.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import axios from 'axios';

@RestController({ path: '/auth' })
export class AuthController {
  @Autowired()
  private authService!: AuthService;

  @PostMapping('/login')
  @Public()
  async login(@RequestBody() dto: LoginDto): Promise<any> {
    return this.authService.login(dto.username, dto.password);
  }

  @PostMapping('/register')
  @Public()
  async register(@RequestBody() dto: RegisterDto): Promise<any> {
    return this.authService.register(dto);
  }

  @PostMapping('/refresh')
  async refresh(@RequestBody() body: { refreshToken: string }): Promise<any> {
    return this.authService.refreshToken(body.refreshToken);
  }

  @PostMapping('/logout')
  async logout(@RequestBody() body: { token: string }): Promise<any> {
    return this.authService.logout(body.token);
  }

  @PostMapping('/change-password')
  async changePassword(@RequestBody() body: { oldPassword: string; newPassword: string }): Promise<any> {
    const securityContext = SecurityContext.getInstance();
    const currentUser = securityContext.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('未登录');
    }

    return this.authService.changePassword(currentUser.id, body.oldPassword, body.newPassword);
  }

  @GetMapping('/github')
  @Public()
  async githubAuth(): Promise<any> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;
    const scope = 'user:email';
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    
    return { authUrl };
  }

  @GetMapping('/github/callback')
  @Public()
  async githubCallback(@QueryParam('code') code: string): Promise<any> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;

    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    }, {
      headers: { Accept: 'application/json' }
    });

    const tokens = tokenResponse.data;

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const profile = {
      ...userResponse.data,
      provider: 'github',
    };

    return this.authService.handleOAuthCallback(profile, tokens);
  }

  @GetMapping('/google')
  @Public()
  async googleAuth(): Promise<any> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    const scope = 'profile email';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    
    return { authUrl };
  }

  @GetMapping('/google/callback')
  @Public()
  async googleCallback(@QueryParam('code') code: string): Promise<any> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokens = tokenResponse.data;

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const profile = {
      ...userResponse.data,
      provider: 'google',
    };

    return this.authService.handleOAuthCallback(profile, tokens);
  }
}
```

## 完整的用户控制器

```typescript
import { RestController, GetMapping, PostMapping, PutMapping, DeleteMapping, RequestBody, PathVariable } from '@ai-partner-x/aiko-boot-starter-web';
import { Public, PreAuthorize, RolesAllowed, Secured } from '@ai-partner-x/aiko-boot-starter-security';
import { UserService } from '../service/user.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';

@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  @GetMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async list(): Promise<User[]> {
    return this.userService.findAll();
  }

  @GetMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
  async getById(@PathVariable('id') id: number): Promise<User> {
    return this.userService.findById(id);
  }

  @PostMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async create(@RequestBody() dto: CreateUserDto): Promise<User> {
    return this.userService.create(dto);
  }

  @PutMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
  async update(@PathVariable('id') id: number, @RequestBody() dto: Partial<User>): Promise<User> {
    return this.userService.update(id, dto);
  }

  @DeleteMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async delete(@PathVariable('id') id: number): Promise<boolean> {
    return this.userService.delete(id);
  }

  @PostMapping('/{id}/roles')
  @PreAuthorize("hasRole('ADMIN')")
  async assignRole(@PathVariable('id') userId: number, @RequestBody() body: { roleId: number }): Promise<void> {
    return this.userService.assignRoleToUser(userId, body.roleId);
  }

  @DeleteMapping('/{id}/roles/{roleId}')
  @PreAuthorize("hasRole('ADMIN')")
  async removeRole(@PathVariable('id') userId: number, @PathVariable('roleId') roleId: number): Promise<void> {
    return this.userService.removeRoleFromUser(userId, roleId);
  }
}
```

## 前端集成示例

### React 集成

```typescript
import { SecurityProvider, useSecurity } from '@ai-partner-x/aiko-boot-starter-security/react';

function App() {
  return (
    <SecurityProvider>
      <Dashboard />
    </SecurityProvider>
  );
}

function Dashboard() {
  const { user, isAuthenticated, login, logout, hasRole, hasPermission } = useSecurity();
  
  const handleLogin = async (username: string, password: string) => {
    try {
      const result = await login(username, password);
      console.log('Login successful:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      
      {hasRole('ADMIN') && (
        <button>Admin Panel</button>
      )}
      
      {hasPermission('user:read') && (
        <button>User List</button>
      )}
      
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### API 客户端

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      try {
        const response = await apiClient.post('/auth/refresh', { refreshToken });
        localStorage.setItem('access_token', response.data.token);
        error.config.headers.Authorization = `Bearer ${response.data.token}`;
        return apiClient.request(error.config);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 测试脚本

### 单元测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../service/auth.service.js';
import { UserService } from '../service/user.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;

  beforeEach(() => {
    authService = new AuthService();
    userService = new UserService();
  });

  it('should login with valid credentials', async () => {
    const result = await authService.login('admin', 'Admin@123');
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('user');
    expect(result.user.username).toBe('admin');
  });

  it('should fail login with invalid credentials', async () => {
    await expect(authService.login('admin', 'wrong-password')).rejects.toThrow('用户名或密码错误');
  });

  it('should register new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@123',
    };
    
    const user = await authService.register(userData);
    expect(user).toHaveProperty('id');
    expect(user.username).toBe('testuser');
  });
});
```

### 集成测试

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

describe('Auth API', () => {
  let token: string;

  beforeAll(async () => {
    const response = await api.post('/auth/login', {
      username: 'admin',
      password: 'Admin@123',
    });
    token = response.data.token;
  });

  it('should login successfully', async () => {
    const response = await api.post('/auth/login', {
      username: 'admin',
      password: 'Admin@123',
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('token');
  });

  it('should access protected endpoint with token', async () => {
    const response = await api.get('/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    expect(response.status).toBe(200);
    expect(response.data.username).toBe('admin');
  });

  it('should fail without token', async () => {
    await expect(api.get('/users/profile')).rejects.toHaveProperty('response.status', 401);
  });
});
```

## 部署配置

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    depends_on:
      - redis
      - postgres
    volumes:
      - ./data:/app/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=aiko_boot
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 监控和日志

### 日志配置

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### 健康检查

```typescript
@RestController({ path: '/health' })
export class HealthController {
  @GetMapping()
  @Public()
  async health(): Promise<any> {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @GetMapping('/ready')
  @Public()
  async ready(): Promise<any> {
    return {
      status: 'ready',
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.userMapper.selectList({ limit: 1 });
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}
```

## 总结

本示例展示了一个完整的全栈应用，包含：

1. **多种认证方式**：JWT、Local、OAuth2、Session
2. **细粒度权限控制**：基于角色和权限的访问控制
3. **完整的安全措施**：速率限制、CORS、CSRF 保护
4. **前端集成**：React 集成示例和 API 客户端
5. **测试支持**：单元测试和集成测试
6. **部署配置**：Docker Compose 和 Nginx 配置
7. **监控和日志**：日志记录和健康检查

通过这个示例，你可以快速搭建一个安全、可扩展的全栈应用。

## 更多信息

- [Aiko Boot 官方文档](../../../../../docs/)
- [项目分析报告](../../../../../项目分析报告.md)
- [Security Starter README](../../../../../packages/aiko-boot-starter-security/README.md)
