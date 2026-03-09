/**
 * Security 全局配置
 * 
 * 在 createApp 时设置安全配置
 */

// ==================== Types ====================

/** 安全配置 */
export interface SecurityConfig {
  /** JWT 配置 */
  jwt?: {
    /** 密钥 */
    secret: string;
    /** 过期时间（秒） */
    expiresIn: number;
    /** 刷新时间（秒） */
    refreshIn?: number;
  };
  /** OAuth2 配置 */
  oauth2?: {
    /** 客户端 ID */
    clientId: string;
    /** 客户端密钥 */
    clientSecret: string;
    /** 授权服务器 URL */
    authorizationUrl: string;
    /** 令牌服务器 URL */
    tokenUrl: string;
    /** 用户信息 URL */
    userInfoUrl: string;
  };
  /** 记住我配置 */
  rememberMe?: {
    /** 密钥 */
    key: string;
    /** 过期时间（秒） */
    tokenValiditySeconds: number;
  };
  /** CORS 配置 */
  cors?: {
    /** 允许的源 */
    allowedOrigins: string[];
    /** 允许的方法 */
    allowedMethods: string[];
    /** 允许的头部 */
    allowedHeaders: string[];
    /** 是否允许凭证 */
    allowCredentials: boolean;
  };
}

// ==================== Global Config ====================

/** 全局安全配置 */
let globalSecurityConfig: SecurityConfig | null = null;

/**
 * 设置全局安全配置
 */
export function setSecurityConfig(config: SecurityConfig): void {
  globalSecurityConfig = config;
}

/**
 * 获取全局安全配置
 */
export function getSecurityConfig(): SecurityConfig | null {
  return globalSecurityConfig;
}

/**
 * 检查安全配置是否已设置
 */
export function isSecurityConfigured(): boolean {
  return globalSecurityConfig !== null;
}

// ==================== Default Config ====================

/**
 * 默认安全配置
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  jwt: {
    secret: 'default-secret-key',
    expiresIn: 3600,
    refreshIn: 86400
  },
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowCredentials: true
  }
};