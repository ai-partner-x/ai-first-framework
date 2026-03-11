# @ai-partner-x/aiko-boot-starter-security

Aiko Boot Security Starter - Spring Boot style authentication and authorization for AI-First Framework.

## Features

- **Multiple Authentication Strategies**: JWT, OAuth2, Session, Local
- **Role-Based Access Control (RBAC)**: Comprehensive permission system
- **Declarative Security**: Decorator-based security configuration
- **Auto Configuration**: Zero-config startup with sensible defaults
- **Type Safe**: Full TypeScript support
- **Java Compatible**: Decorators can be transpiled to Spring Security annotations

## Installation

```bash
pnpm add @ai-partner-x/aiko-boot-starter-security
```

## Quick Start

```typescript
import { createApp } from '@ai-partner-x/aiko-boot';
import '@ai-partner-x/aiko-boot-starter-security';

const app = await createApp({ srcDir: __dirname });
app.run();
```

## Usage

### Controller with Security Decorators

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
    return { message: 'Public API' };
  }
}
```

### Configuration

```typescript
import type { AppConfig } from '@ai-partner-x/aiko-boot';

export default {
  security: {
    enabled: true,
    jwt: {
      secret: process.env.JWT_SECRET, // REQUIRED in production!
      expiresIn: '1h', // Shorter expiration for production
    },
    publicPaths: ['/api/auth/login', '/api/auth/register'],
  },
} satisfies AppConfig;
```

## Decorators

### Authentication

- `@Public()` - Mark endpoint as publicly accessible
- `@Authenticated()` - Require authentication
- `@RolesAllowed(...roles)` - Require specific roles

### Authorization

- `@PreAuthorize(expression)` - Pre-authorization check
- `@PostAuthorize(expression)` - Post-authorization check
- `@Secured(...permissions)` - Require specific permissions

## Permission Expressions

- `hasRole('ROLE_NAME')` - Check if user has role
- `hasPermission('permission:name')` - Check if user has permission
- `hasAnyRole('ROLE1', 'ROLE2')` - Check if user has any of the roles
- `hasAllRoles('ROLE1', 'ROLE2')` - Check if user has all roles
- `authenticated()` - Check if user is authenticated

## React Integration

```typescript
import { SecurityProvider, useSecurity, HasPermission } from '@ai-partner-x/aiko-boot-starter-security/react';

function App() {
  return (
    <SecurityProvider>
      <Dashboard />
    </SecurityProvider>
  );
}

function Dashboard() {
  const { user, isAuthenticated, hasRole } = useSecurity();
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return (
    <HasPermission permission="user:read">
      <UserList />
    </HasPermission>
  );
}
```

## Security Best Practices

### Production Configuration

**CRITICAL**: Never use default secret keys in production!

```typescript
// ❌ NEVER do this in production
const config = {
  security: {
    jwt: { secret: 'your-secret-key' } // INSECURE!
  }
};

// ✅ Always use environment variables
const config = {
  security: {
    jwt: { 
      secret: process.env.JWT_SECRET, // Required!
      expiresIn: '1h'
    },
    session: {
      secret: process.env.SESSION_SECRET // Required!
    }
  }
};
```

### Rate Limiting

Protect your authentication endpoints from brute force attacks:

```typescript
import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();

// Rate limit login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to login endpoint
app.post('/api/auth/login', loginLimiter, authController.login);

// Stricter rate limit for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
});

app.post('/api/auth/forgot-password', passwordResetLimiter, authController.forgotPassword);
```

### Password Security

- Use strong password hashing (bcrypt with cost factor >= 10)
- Enforce minimum password length (>= 8 characters)
- Consider password complexity requirements
- Implement password breach detection

```typescript
// Example: Strong password validation
const validatePassword = (password: string): boolean => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false; // Uppercase
  if (!/[a-z]/.test(password)) return false; // Lowercase
  if (!/[0-9]/.test(password)) return false; // Number
  if (!/[!@#$%^&*]/.test(password)) return false; // Special char
  return true;
};
```

### Token Security

- Use short expiration times for access tokens (15-60 minutes)
- Implement refresh token rotation
- Store tokens securely (httpOnly cookies for web)
- Implement token revocation for logout

### CORS Configuration

```typescript
const config = {
  security: {
    cors: {
      enabled: true,
      origin: ['https://yourdomain.com'], // Specify exact origins
      credentials: true,
    }
  }
};
```

### Sensitive Data Protection

The `sanitizeUser` method automatically excludes sensitive fields:

```typescript
// These fields are automatically excluded from API responses:
// - password, passwordHash
// - salt, token, refreshToken
// - secret, apiKey, privateKey
```

## API Reference

### AuthService

```typescript
interface AuthService {
  login(credentials: LoginDto): Promise<LoginResult>;
  register(userData: RegisterDto): Promise<User>;
  refreshToken(refreshToken: string): Promise<LoginResult>;
  logout(token: string): Promise<void>;
  changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean>;
}
```

### PermissionService

```typescript
interface PermissionService {
  hasPermission(user: User, permission: string): Promise<boolean>;
  hasPermissions(user: User, permissions: string[]): Promise<boolean>;
  hasAnyPermission(user: User, permissions: string[]): Promise<boolean>;
  hasRole(user: User, role: string): boolean;
  hasAllRoles(user: User, roles: string[]): boolean;
  hasAnyRole(user: User, roles: string[]): boolean;
}
```

### SecurityContext

```typescript
interface SecurityContext {
  getCurrentUser(): User | null;
  setCurrentUser(user: User | null): void;
  isAuthenticated(): boolean;
  hasRole(role: string): boolean;
  hasAnyRole(roles: string[]): boolean;
  clear(): void;
}
```

## License

MIT
