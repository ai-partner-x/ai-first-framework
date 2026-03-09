/**
 * Security Decorators - Spring Security Compatible Style
 * 
 * 提供与 Spring Security 风格兼容的装饰器，支持：
 * 1. TypeScript 运行时
 * 2. 转译为 Java Spring Security 代码
 */

import 'reflect-metadata';
import { Injectable, Singleton, inject } from '@ai-partner-x/aiko-boot/di/server';

// ==================== Metadata Keys ====================

export const SECURITY_PRE_AUTHORIZE_METADATA = 'aiko-boot:security:preAuthorize';
export const SECURITY_POST_AUTHORIZE_METADATA = 'aiko-boot:security:postAuthorize';
export const SECURITY_SECURED_METADATA = 'aiko-boot:security:secured';
export const SECURITY_ROLES_ALLOWED_METADATA = 'aiko-boot:security:rolesAllowed';
export const SECURITY_AUTHENTICATION_PRINCIPAL_METADATA = 'aiko-boot:security:authenticationPrincipal';
export const SECURITY_ENABLE_GLOBAL_METHOD_SECURITY_METADATA = 'aiko-boot:security:enableGlobalMethodSecurity';

// ==================== Types ====================

/** 预授权选项 - 对应 @PreAuthorize */
export interface PreAuthorizeOptions {
  /** 权限表达式 */
  value: string;
}

/** 后授权选项 - 对应 @PostAuthorize */
export interface PostAuthorizeOptions {
  /** 权限表达式 */
  value: string;
}

/** 安全选项 - 对应 @Secured */
export interface SecuredOptions {
  /** 角色列表 */
  value: string[];
}

/** 角色允许选项 - 对应 @RolesAllowed */
export interface RolesAllowedOptions {
  /** 角色列表 */
  value: string[];
}

/** 认证主体选项 - 对应 @AuthenticationPrincipal */
export interface AuthenticationPrincipalOptions {
  /** 是否转换 */
  convert?: boolean;
  /** 表达式 */
  expression?: string;
}

/** 全局方法安全选项 - 对应 @EnableGlobalMethodSecurity */
export interface EnableGlobalMethodSecurityOptions {
  /** 启用 prePost 注解 */
  prePostEnabled?: boolean;
  /** 启用 secured 注解 */
  securedEnabled?: boolean;
  /** 启用 jsr250 注解 */
  jsr250Enabled?: boolean;
}

// ==================== Method Security Decorators ====================

/**
 * @PreAuthorize 装饰器 - 方法执行前权限检查
 */
export function PreAuthorize(options: PreAuthorizeOptions | string) {
  const opts = typeof options === 'string' ? { value: options } : options;
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const existing = Reflect.getMetadata(SECURITY_PRE_AUTHORIZE_METADATA, target.constructor) || {};
    existing[String(propertyKey)] = {
      ...opts,
      methodName: String(propertyKey),
    };
    Reflect.defineMetadata(SECURITY_PRE_AUTHORIZE_METADATA, existing, target.constructor);
  };
}

/**
 * @PostAuthorize 装饰器 - 方法执行后权限检查
 */
export function PostAuthorize(options: PostAuthorizeOptions | string) {
  const opts = typeof options === 'string' ? { value: options } : options;
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const existing = Reflect.getMetadata(SECURITY_POST_AUTHORIZE_METADATA, target.constructor) || {};
    existing[String(propertyKey)] = {
      ...opts,
      methodName: String(propertyKey),
    };
    Reflect.defineMetadata(SECURITY_POST_AUTHORIZE_METADATA, existing, target.constructor);
  };
}

/**
 * @Secured 装饰器 - 方法安全检查
 */
export function Secured(options: SecuredOptions | string | string[]) {
  const opts = Array.isArray(options) ? { value: options } : typeof options === 'string' ? { value: [options] } : options;
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const existing = Reflect.getMetadata(SECURITY_SECURED_METADATA, target.constructor) || {};
    existing[String(propertyKey)] = {
      ...opts,
      methodName: String(propertyKey),
    };
    Reflect.defineMetadata(SECURITY_SECURED_METADATA, existing, target.constructor);
  };
}

/**
 * @RolesAllowed 装饰器 - 角色权限检查
 */
export function RolesAllowed(options: RolesAllowedOptions | string | string[]) {
  const opts = Array.isArray(options) ? { value: options } : typeof options === 'string' ? { value: [options] } : options;
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const existing = Reflect.getMetadata(SECURITY_ROLES_ALLOWED_METADATA, target.constructor) || {};
    existing[String(propertyKey)] = {
      ...opts,
      methodName: String(propertyKey),
    };
    Reflect.defineMetadata(SECURITY_ROLES_ALLOWED_METADATA, existing, target.constructor);
  };
}

// ==================== Parameter Decorators ====================

/**
 * @AuthenticationPrincipal 装饰器 - 获取认证主体
 */
export function AuthenticationPrincipal(options: AuthenticationPrincipalOptions = {}) {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number): void {
    const existing = Reflect.getMetadata(SECURITY_AUTHENTICATION_PRINCIPAL_METADATA, target.constructor) || {};
    existing[String(propertyKey)] = existing[String(propertyKey)] || {};
    existing[String(propertyKey)][parameterIndex] = {
      ...options,
      parameterIndex,
    };
    Reflect.defineMetadata(SECURITY_AUTHENTICATION_PRINCIPAL_METADATA, existing, target.constructor);
  };
}

// ==================== Class Decorators ====================

/**
 * @EnableGlobalMethodSecurity 装饰器 - 启用全局方法安全
 */
export function EnableGlobalMethodSecurity(options: EnableGlobalMethodSecurityOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    Reflect.defineMetadata(SECURITY_ENABLE_GLOBAL_METHOD_SECURITY_METADATA, {
      ...options,
      prePostEnabled: options.prePostEnabled ?? true,
      securedEnabled: options.securedEnabled ?? true,
      jsr250Enabled: options.jsr250Enabled ?? true,
      className: target.name,
    }, target);
    
    // Apply DI decorators
    Injectable()(target);
    Singleton()(target);
    
    return target;
  };
}

// ==================== Metadata Helpers ====================

/**
 * 获取预授权元数据
 */
export function getPreAuthorizeMetadata(target: Function): Record<string, PreAuthorizeOptions & { methodName: string }> | undefined {
  return Reflect.getMetadata(SECURITY_PRE_AUTHORIZE_METADATA, target);
}

/**
 * 获取后授权元数据
 */
export function getPostAuthorizeMetadata(target: Function): Record<string, PostAuthorizeOptions & { methodName: string }> | undefined {
  return Reflect.getMetadata(SECURITY_POST_AUTHORIZE_METADATA, target);
}

/**
 * 获取安全元数据
 */
export function getSecuredMetadata(target: Function): Record<string, SecuredOptions & { methodName: string }> | undefined {
  return Reflect.getMetadata(SECURITY_SECURED_METADATA, target);
}

/**
 * 获取角色允许元数据
 */
export function getRolesAllowedMetadata(target: Function): Record<string, RolesAllowedOptions & { methodName: string }> | undefined {
  return Reflect.getMetadata(SECURITY_ROLES_ALLOWED_METADATA, target);
}

/**
 * 获取认证主体元数据
 */
export function getAuthenticationPrincipalMetadata(target: Function): Record<string, Record<number, AuthenticationPrincipalOptions & { parameterIndex: number }>> | undefined {
  return Reflect.getMetadata(SECURITY_AUTHENTICATION_PRINCIPAL_METADATA, target);
}

/**
 * 获取全局方法安全元数据
 */
export function getEnableGlobalMethodSecurityMetadata(target: Function): (EnableGlobalMethodSecurityOptions & { className: string }) | undefined {
  return Reflect.getMetadata(SECURITY_ENABLE_GLOBAL_METHOD_SECURITY_METADATA, target);
}