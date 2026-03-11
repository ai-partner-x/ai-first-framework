import type { User } from './entities/index.js';

export interface IAuthStrategy {
  name: string;
  authenticate(request: any): Promise<User | null>;
  validate(token: string): Promise<User | null>;
  generateToken(user: User): Promise<string>;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResult {
  user: Partial<User>;
  token: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: number;
  username: string;
  roles: string[];
}

export interface SecurityConfig {
  enabled?: boolean;
  jwt?: {
    secret?: string;
    expiresIn?: string;
  };
  cors?: {
    enabled?: boolean;
    origin?: string | string[];
    credentials?: boolean;
  };
  session?: {
    secret?: string;
    maxAge?: number;
  };
  publicPaths?: string[];
}

/**
 * Default security configuration.
 * 
 * @warning SECURITY WARNING: The default secret keys below are for DEVELOPMENT ONLY.
 * You MUST change these values in production environments!
 * 
 * Production recommendations:
 * - JWT secret: Use a strong, randomly generated secret (at least 32 characters)
 * - Session secret: Use a different secret from JWT, also randomly generated
 * - Set secrets via environment variables: process.env.JWT_SECRET, process.env.SESSION_SECRET
 * 
 * @example
 * // Production configuration
 * const config: SecurityConfig = {
 *   jwt: {
 *     secret: process.env.JWT_SECRET, // Required in production!
 *     expiresIn: '1h', // Shorter expiration for production
 *   },
 *   session: {
 *     secret: process.env.SESSION_SECRET, // Required in production!
 *     maxAge: 3600000, // 1 hour
 *   },
 * };
 */
export const defaultSecurityConfig: SecurityConfig = {
  enabled: true,
  jwt: {
    // WARNING: DO NOT USE THIS DEFAULT SECRET IN PRODUCTION!
    // This is a placeholder for development only.
    // Set a strong secret via environment variable: process.env.JWT_SECRET
    secret: 'your-secret-key',
    expiresIn: '24h',
  },
  cors: {
    enabled: true,
    origin: '*',
    credentials: true,
  },
  session: {
    // WARNING: DO NOT USE THIS DEFAULT SECRET IN PRODUCTION!
    // This is a placeholder for development only.
    // Set a strong secret via environment variable: process.env.SESSION_SECRET
    secret: 'your-session-secret',
    maxAge: 86400000,
  },
  publicPaths: ['/api/auth/login', '/api/auth/register'],
};

/**
 * Sensitive fields that should never be exposed in API responses.
 * These fields are automatically excluded by the sanitizeUser function.
 */
export const SENSITIVE_FIELDS: readonly string[] = [
  'password',
  'passwordHash',
  'salt',
  'token',
  'refreshToken',
  'secret',
  'apiKey',
  'privateKey',
] as const;
