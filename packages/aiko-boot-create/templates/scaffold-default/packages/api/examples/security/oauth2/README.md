# OAuth2 认证策略示例

本示例展示如何使用 OAuth2 策略实现第三方登录（如 GitHub、Google 等）。

## 概述

OAuth2 是一种授权协议，允许用户使用第三方账号（如 GitHub、Google）登录你的应用。

## 特点

- ✅ 用户体验好，无需记住密码
- ✅ 安全性高，由第三方管理认证
- ✅ 支持多种第三方平台
- ⚠️ 依赖第三方服务
- ⚠️ 实现相对复杂

## 支持的平台

- GitHub
- Google
- Facebook
- Twitter
- Microsoft
- 自定义 OAuth2 提供商

## 配置

### GitHub OAuth2 配置

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
    publicPaths: ['/api/auth/github', '/api/auth/google', '/api/auth/github/callback', '/api/auth/google/callback'],
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
  provider!: string;

  @TableField()
  @Column()
  providerId!: string;

  @TableField()
  @Column()
  avatar!: string;

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

### OAuthAccount 实体

```typescript
import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'oauth_accounts' })
export class OAuthAccount {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  userId!: number;

  @TableField()
  @Column()
  provider!: string;

  @TableField()
  @Column()
  providerId!: string;

  @TableField()
  @Column()
  accessToken!: string;

  @TableField()
  @Column()
  refreshToken!: string;

  @TableField()
  @Column()
  expiresAt!: Date;

  @TableField()
  @Column()
  createdAt!: Date;

  @TableField()
  @Column()
  updatedAt!: Date;
}
```

## DTO 定义

### OAuthCallbackDto

```typescript
export class OAuthCallbackDto {
  code!: string;
  state?: string;
}
```

### OAuthProfileDto

```typescript
export class OAuthProfileDto {
  id!: string;
  username!: string;
  email!: string;
  avatar?: string;
  provider!: string;
}
```

## 服务层

### OAuthService

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity.js';
import { OAuthAccount } from '../entity/oauth-account.entity.js';
import type { OAuthProfileDto } from '../dto/oauth-profile.dto.js';

@Service()
export class OAuthService {
  @Autowired()
  private userMapper!: BaseMapper<User>;

  @Autowired()
  private oauthAccountMapper!: BaseMapper<OAuthAccount>;

  async findOrCreateUser(profile: OAuthProfileDto): Promise<User> {
    let user = await this.findByProvider(profile.provider, profile.providerId);

    if (!user) {
      user = await this.createUser(profile);
    }

    return user;
  }

  async findByProvider(provider: string, providerId: string): Promise<User | null> {
    const accounts = await this.oauthAccountMapper.selectList({
      where: { provider, providerId }
    });

    if (accounts.length === 0) {
      return null;
    }

    const account = accounts[0];
    return this.userMapper.selectById(account.userId);
  }

  async createUser(profile: OAuthProfileDto): Promise<User> {
    const user = {
      username: profile.username,
      email: profile.email,
      provider: profile.provider,
      providerId: profile.providerId,
      avatar: profile.avatar || '',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userId = await this.userMapper.insert(user);
    return this.userMapper.selectById(userId) as Promise<User>;
  }

  async saveOAuthAccount(userId: number, profile: OAuthProfileDto, tokens: any): Promise<void> {
    const account = {
      userId,
      provider: profile.provider,
      providerId: profile.providerId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000) : new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.oauthAccountMapper.insert(account);
  }

  async updateOAuthTokens(userId: number, provider: string, tokens: any): Promise<void> {
    const accounts = await this.oauthAccountMapper.selectList({
      where: { userId, provider }
    });

    if (accounts.length > 0) {
      const account = accounts[0];
      await this.oauthAccountMapper.updateById(account.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || account.refreshToken,
        expiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000) : account.expiresAt,
        updatedAt: new Date(),
      });
    }
  }
}
```

### AuthService

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { AuthService as SecurityAuthService } from '@ai-partner-x/aiko-boot-starter-security';
import { OAuthService } from './oauth.service.js';

@Service()
export class AuthService {
  @Autowired()
  private securityAuthService!: SecurityAuthService;

  @Autowired()
  private oauthService!: OAuthService;

  async handleOAuthCallback(profile: any, tokens: any): Promise<any> {
    const profileDto: OAuthProfileDto = {
      id: profile.id,
      username: profile.username || profile.login,
      email: profile.email,
      avatar: profile.avatar_url || profile.picture,
      provider: profile.provider,
    };

    const user = await this.oauthService.findOrCreateUser(profileDto);
    await this.oauthService.saveOAuthAccount(user.id, profileDto, tokens);

    const token = await this.securityAuthService.login({
      username: user.username,
      password: '',
    });

    return token;
  }
}
```

## 控制器层

### AuthController

```typescript
import { RestController, GetMapping, PostMapping, RequestBody, QueryParam } from '@ai-partner-x/aiko-boot-starter-web';
import { Public } from '@ai-partner-x/aiko-boot-starter-security';
import { AuthService } from '../service/auth.service.js';
import axios from 'axios';

@RestController({ path: '/auth' })
export class AuthController {
  @Autowired()
  private authService!: AuthService;

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

## 使用示例

### 1. GitHub 登录流程

#### 步骤 1：获取授权 URL

```bash
curl -X GET http://localhost:3001/api/auth/github
```

响应：
```json
{
  "authUrl": "https://github.com/login/oauth/authorize?client_id=xxx&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fgithub%2Fcallback&scope=user%3Aemail"
}
```

#### 步骤 2：用户授权

用户访问返回的 `authUrl`，在 GitHub 页面授权。

#### 步骤 3：GitHub 回调

GitHub 重定向到 `callbackURL`，携带 `code` 参数。

```bash
curl -X GET "http://localhost:3001/api/auth/github/callback?code=xxx"
```

响应：
```json
{
  "user": {
    "id": 1,
    "username": "githubuser",
    "email": "user@example.com",
    "provider": "github",
    "avatar": "https://avatars.githubusercontent.com/u/xxx?v=4",
    "enabled": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### 2. Google 登录流程

#### 步骤 1：获取授权 URL

```bash
curl -X GET http://localhost:3001/api/auth/google
```

响应：
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fgoogle%2Fcallback&scope=profile%20email&response_type=code"
}
```

#### 步骤 2：用户授权

用户访问返回的 `authUrl`，在 Google 页面授权。

#### 步骤 3：Google 回调

Google 重定向到 `callbackURL`，携带 `code` 参数。

```bash
curl -X GET "http://localhost:3001/api/auth/google/callback?code=xxx"
```

响应：
```json
{
  "user": {
    "id": 1,
    "username": "googleuser",
    "email": "user@gmail.com",
    "provider": "google",
    "avatar": "https://lh3.googleusercontent.com/xxx",
    "enabled": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

## 第三方平台配置

### GitHub OAuth2 应用配置

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息：
   - Application name: 你的应用名称
   - Homepage URL: `http://localhost:3001`
   - Authorization callback URL: `http://localhost:3001/api/auth/github/callback`
4. 获取 `Client ID` 和 `Client Secret`

### Google OAuth2 应用配置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID：
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback`
5. 获取 `Client ID` 和 `Client Secret`

## 安全建议

### 1. State 参数

使用 `state` 参数防止 CSRF 攻击：

```typescript
const state = crypto.randomBytes(16).toString('hex');
session.oauthState = state;

const authUrl = `https://github.com/login/oauth/authorize?state=${state}&...`;
```

### 2. HTTPS

生产环境必须使用 HTTPS：

```typescript
const callbackURL = process.env.GITHUB_CALLBACK_URL || 'https://yourdomain.com/api/auth/github/callback';
```

### 3. Token 存储

安全存储 OAuth token：

- 使用加密存储
- 定期刷新 token
- 实现 token 撤销机制

### 4. 邮箱验证

验证用户邮箱，防止恶意注册：

```typescript
if (!profile.email_verified) {
  throw new Error('邮箱未验证');
}
```

## 常见问题

### Q: 如何处理多个 OAuth 账号绑定到同一个用户？

A: 可以在用户设置中提供绑定功能，让用户主动绑定其他 OAuth 账号。

### Q: 如何实现"首次登录"和"再次登录"的区别？

A: 检查 `findByProvider` 的返回值，如果返回 `null` 则是首次登录。

### Q: 如何获取用户的额外信息？

A: 在获取用户信息后，可以调用第三方 API 获取更多信息，如用户仓库、好友列表等。

### Q: 如何实现账号解绑？

A: 提供 API 删除 `oauth_accounts` 表中的记录，但需要确保用户至少有一种登录方式。

## 扩展功能

### 1. 多账号绑定

允许用户绑定多个 OAuth 账号：

```typescript
async bindOAuthAccount(userId: number, profile: OAuthProfileDto, tokens: any): Promise<void> {
  const existing = await this.findByProvider(profile.provider, profile.providerId);
  if (existing) {
    throw new Error('该账号已绑定');
  }
  await this.saveOAuthAccount(userId, profile, tokens);
}
```

### 2. 账号合并

当检测到相同的邮箱时，询问用户是否合并账号：

```typescript
async mergeAccounts(targetUserId: number, sourceUserId: number): Promise<void> {
  const accounts = await this.oauthAccountMapper.selectList({
    where: { userId: sourceUserId }
  });

  for (const account of accounts) {
    await this.oauthAccountMapper.updateById(account.id, {
      userId: targetUserId,
      updatedAt: new Date(),
    });
  }

  await this.userMapper.deleteById(sourceUserId);
}
```

### 3. Token 刷新

自动刷新过期的 OAuth token：

```typescript
async refreshOAuthToken(accountId: number): Promise<void> {
  const account = await this.oauthAccountMapper.selectById(accountId);
  
  const newTokens = await this.refreshToken(account.provider, account.refreshToken);
  
  await this.oauthAccountMapper.updateById(accountId, {
    accessToken: newTokens.access_token,
    refreshToken: newTokens.refresh_token || account.refreshToken,
    expiresAt: newTokens.expires_at ? new Date(newTokens.expires_at * 1000) : new Date(Date.now() + 3600000),
    updatedAt: new Date(),
  });
}
```

## 更多信息

- [OAuth2 官方文档](https://oauth.net/2/)
- [GitHub OAuth 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)
- [Passport OAuth2 文档](http://www.passportjs.org/packages/passport-oauth2/)
- [Aiko Boot Security 文档](../../../../../packages/aiko-boot-starter-security/README.md)
