import 'reflect-metadata';
import {
  AutoConfiguration,
  ConditionalOnProperty,
  OnApplicationReady,
  Bean,
  ConditionalOnMissingBean,
} from '@ai-partner-x/aiko-boot/boot';
import { Component } from '@ai-partner-x/aiko-boot';
import { JwtStrategy } from './auth/strategies/jwt.strategy.js';
import { OAuth2Strategy } from './auth/strategies/oauth2.strategy.js';
import { SessionStrategy } from './auth/strategies/session.strategy.js';
import { LocalStrategy } from './auth/strategies/local.strategy.js';
import { AuthService } from './auth/auth.service.js';
import { PermissionService } from './permission/permission.service.js';
import { PermissionGuard } from './permission/guard.js';
import { PermissionExpressionParser } from './permission/expression-parser.js';
import { SecurityContext } from './context/security.context.js';
import { AuthInterceptor } from './interceptor/auth.interceptor.js';
import { PermissionInterceptor } from './interceptor/permission.interceptor.js';

export interface SecurityProperties {
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

@AutoConfiguration({ order: 10 })
@ConditionalOnProperty('security.enabled', { havingValue: 'true', matchIfMissing: true })
@Component()
export class SecurityAutoConfiguration {

  @OnApplicationReady({ order: -50 })
  async initializeSecurity(): Promise<void> {
    console.log('[Security] Initializing security components...');
  }

  @Bean()
  @ConditionalOnMissingBean(JwtStrategy)
  createJwtStrategy(): JwtStrategy {
    return new JwtStrategy();
  }

  @Bean()
  @ConditionalOnMissingBean(OAuth2Strategy)
  createOAuth2Strategy(): OAuth2Strategy {
    return new OAuth2Strategy();
  }

  @Bean()
  @ConditionalOnMissingBean(SessionStrategy)
  createSessionStrategy(): SessionStrategy {
    return new SessionStrategy();
  }

  @Bean()
  @ConditionalOnMissingBean(LocalStrategy)
  createLocalStrategy(): LocalStrategy {
    return new LocalStrategy();
  }

  @Bean()
  @ConditionalOnMissingBean(AuthService)
  createAuthService(): AuthService {
    return new AuthService();
  }

  @Bean()
  @ConditionalOnMissingBean(PermissionService)
  createPermissionService(): PermissionService {
    return new PermissionService();
  }

  @Bean()
  @ConditionalOnMissingBean(PermissionGuard)
  createPermissionGuard(): PermissionGuard {
    return new PermissionGuard();
  }

  @Bean()
  @ConditionalOnMissingBean(PermissionExpressionParser)
  createPermissionExpressionParser(): PermissionExpressionParser {
    return new PermissionExpressionParser();
  }

  @Bean()
  @ConditionalOnMissingBean(SecurityContext)
  createSecurityContext(): SecurityContext {
    return new SecurityContext();
  }

  @Bean()
  @ConditionalOnMissingBean(AuthInterceptor)
  createAuthInterceptor(): AuthInterceptor {
    return new AuthInterceptor();
  }

  @Bean()
  @ConditionalOnMissingBean(PermissionInterceptor)
  createPermissionInterceptor(): PermissionInterceptor {
    return new PermissionInterceptor();
  }
}
