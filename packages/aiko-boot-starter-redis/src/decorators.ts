/**
 * Redis Decorators - Spring Data Redis Compatible Style
 * 
 * 提供与 Spring Data Redis 风格兼容的装饰器，支持：
 * 1. TypeScript 运行时
 * 2. 转译为 Java Spring Data Redis 代码
 */

import 'reflect-metadata';
import { Injectable, Singleton, inject } from '@ai-partner-x/aiko-boot/di/server';

// ==================== Metadata Keys ====================

export const REDIS_REPOSITORY_METADATA = 'aiko-boot:redis:repository';
export const REDIS_HASH_METADATA = 'aiko-boot:redis:hash';
export const REDIS_KEY_METADATA = 'aiko-boot:redis:key';
export const REDIS_VALUE_METADATA = 'aiko-boot:redis:value';

// ==================== Types ====================

/** Redis 仓库选项 - 对应 @RedisHash */
export interface RedisHashOptions {
  /** 哈希名称 */
  value?: string;
  /** 时间戳 */
  timeToLive?: number;
}

/** Redis 键选项 - 对应 @Id */
export interface RedisKeyOptions {
  /** 键类型 */
  type?: 'STRING' | 'NUMBER';
}

/** Redis 值选项 - 对应 @Indexed */
export interface RedisValueOptions {
  /** 是否索引 */
  indexed?: boolean;
}

/** Redis 仓库选项 - 对应 @Repository */
export interface RedisRepositoryOptions {
  /** 关联的实体类 */
  entity?: Function;
}

// ==================== Entity Decorators ====================

/**
 * @RedisHash 装饰器 - 标记 Redis 哈希实体类
 */
export function RedisHash(options: RedisHashOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    const hashName = options.value || target.name.toLowerCase();
    
    Reflect.defineMetadata(REDIS_HASH_METADATA, {
      ...options,
      value: hashName,
      className: target.name,
    }, target);
    
    return target;
  };
}

// ==================== Field Decorators ====================

/**
 * @RedisKey 装饰器 - 标记 Redis 键字段
 */
export function RedisKey(options: RedisKeyOptions = {}) {
  return function (target: Object, propertyKey: string | symbol): void {
    const constructor = target.constructor;
    const existingKeys = Reflect.getMetadata(REDIS_KEY_METADATA, constructor) || {};
    
    existingKeys[String(propertyKey)] = {
      ...options,
      type: options.type || 'STRING',
      propertyName: String(propertyKey),
    };
    
    Reflect.defineMetadata(REDIS_KEY_METADATA, existingKeys, constructor);
  };
}

/**
 * @Id 装饰器 - @RedisKey 的别名
 */
export const Id = RedisKey;

/**
 * @RedisValue 装饰器 - 标记 Redis 值字段
 */
export function RedisValue(options: RedisValueOptions = {}) {
  return function (target: Object, propertyKey: string | symbol): void {
    const constructor = target.constructor;
    const existingValues = Reflect.getMetadata(REDIS_VALUE_METADATA, constructor) || {};
    
    existingValues[String(propertyKey)] = {
      ...options,
      indexed: options.indexed || false,
      propertyName: String(propertyKey),
    };
    
    Reflect.defineMetadata(REDIS_VALUE_METADATA, existingValues, constructor);
  };
}

/**
 * @Indexed 装饰器 - @RedisValue 的别名
 */
export const Indexed = RedisValue;

// ==================== Repository Decorators ====================

/**
 * @RedisRepository 装饰器 - 标记 Redis 仓库接口
 * 自动注册到 DI 容器
 */
export function RedisRepository(entity?: Function) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    Reflect.defineMetadata(REDIS_REPOSITORY_METADATA, {
      entity,
      entityName: entity?.name,
      className: target.name,
    }, target);
    
    // Auto inject constructor dependencies
    const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
    paramTypes.forEach((type: any, index: number) => {
      inject(type)(target, undefined as any, index);
    });
    
    // Apply DI decorators
    Injectable()(target);
    Singleton()(target);
    
    return target;
  };
}

/**
 * @Repository 装饰器 - @RedisRepository 的别名
 */
export const RedisRepo = RedisRepository;

// ==================== Metadata Helpers ====================

/**
 * 获取 Redis 哈希元数据
 */
export function getRedisHashMetadata(target: Function): (RedisHashOptions & { value: string; className: string }) | undefined {
  return Reflect.getMetadata(REDIS_HASH_METADATA, target);
}

/**
 * 获取 Redis 键元数据
 */
export function getRedisKeyMetadata(target: Function): Record<string, RedisKeyOptions & { propertyName: string }> | undefined {
  return Reflect.getMetadata(REDIS_KEY_METADATA, target);
}

/**
 * 获取 Redis 值元数据
 */
export function getRedisValueMetadata(target: Function): Record<string, RedisValueOptions & { propertyName: string }> | undefined {
  return Reflect.getMetadata(REDIS_VALUE_METADATA, target);
}

/**
 * 获取 Redis 仓库元数据
 */
export function getRedisRepositoryMetadata(target: Function): (RedisRepositoryOptions & { className: string }) | undefined {
  return Reflect.getMetadata(REDIS_REPOSITORY_METADATA, target);
}