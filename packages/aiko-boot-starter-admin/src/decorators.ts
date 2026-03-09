/**
 * Admin Framework Decorators
 * 
 * 提供管理门户相关的装饰器，支持：
 * 1. TypeScript 运行时
 * 2. 转译为 Java Spring Boot 代码
 */

import 'reflect-metadata';
import { Injectable, Singleton, inject } from '@ai-partner-x/aiko-boot/di/server';

// ==================== Metadata Keys ====================

export const ADMIN_MENU_METADATA = 'aiko-boot:admin:menu';
export const ADMIN_ROUTE_METADATA = 'aiko-boot:admin:route';
export const ADMIN_PERMISSION_METADATA = 'aiko-boot:admin:permission';
export const ADMIN_MODULE_METADATA = 'aiko-boot:admin:module';

// ==================== Types ====================

/** 菜单选项 */
export interface MenuOptions {
  /** 菜单名称 */
  name: string;
  /** 菜单路径 */
  path: string;
  /** 菜单图标 */
  icon?: string;
  /** 权限编码 */
  permission?: string;
  /** 父菜单 */
  parent?: string;
  /** 排序号 */
  order?: number;
  /** 是否可见 */
  visible?: boolean;
}

/** 路由选项 */
export interface RouteOptions {
  /** 路由路径 */
  path: string;
  /** 组件名称 */
  component?: string;
  /** 权限编码 */
  permission?: string;
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 标题 */
  title?: string;
}

/** 权限选项 */
export interface PermissionOptions {
  /** 权限编码 */
  code: string;
  /** 权限名称 */
  name: string;
  /** 权限描述 */
  description?: string;
  /** 父权限 */
  parent?: string;
}

/** 模块选项 */
export interface ModuleOptions {
  /** 模块名称 */
  name: string;
  /** 模块编码 */
  code: string;
  /** 模块描述 */
  description?: string;
  /** 版本 */
  version?: string;
}

// ==================== Menu Decorators ====================

/**
 * @AdminMenu 装饰器 - 标记菜单
 */
export function AdminMenu(options: MenuOptions) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    Reflect.defineMetadata(ADMIN_MENU_METADATA, {
      ...options,
      className: target.name,
    }, target);
    
    return target;
  };
}

// ==================== Route Decorators ====================

/**
 * @AdminRoute 装饰器 - 标记路由
 */
export function AdminRoute(options: RouteOptions) {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const existingRoutes = Reflect.getMetadata(ADMIN_ROUTE_METADATA, target.constructor) || {};
    
    existingRoutes[String(propertyKey)] = {
      ...options,
      methodName: String(propertyKey),
    };
    
    Reflect.defineMetadata(ADMIN_ROUTE_METADATA, existingRoutes, target.constructor);
  };
}

// ==================== Permission Decorators ====================

/**
 * @AdminPermission 装饰器 - 标记权限
 */
export function AdminPermission(options: PermissionOptions) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    Reflect.defineMetadata(ADMIN_PERMISSION_METADATA, {
      ...options,
      className: target.name,
    }, target);
    
    return target;
  };
}

// ==================== Module Decorators ====================

/**
 * @AdminModule 装饰器 - 标记管理模块
 */
export function AdminModule(options: ModuleOptions) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    Reflect.defineMetadata(ADMIN_MODULE_METADATA, {
      ...options,
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
 * 获取菜单元数据
 */
export function getAdminMenuMetadata(target: Function): (MenuOptions & { className: string }) | undefined {
  return Reflect.getMetadata(ADMIN_MENU_METADATA, target);
}

/**
 * 获取路由元数据
 */
export function getAdminRouteMetadata(target: Function): Record<string, RouteOptions & { methodName: string }> | undefined {
  return Reflect.getMetadata(ADMIN_ROUTE_METADATA, target);
}

/**
 * 获取权限元数据
 */
export function getAdminPermissionMetadata(target: Function): (PermissionOptions & { className: string }) | undefined {
  return Reflect.getMetadata(ADMIN_PERMISSION_METADATA, target);
}

/**
 * 获取模块元数据
 */
export function getAdminModuleMetadata(target: Function): (ModuleOptions & { className: string }) | undefined {
  return Reflect.getMetadata(ADMIN_MODULE_METADATA, target);
}