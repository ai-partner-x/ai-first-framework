/**
 * ORM Decorators - MyBatis-Plus Compatible Style
 * 
 * 提供与 MyBatis-Plus 风格兼容的装饰器，支持：
 * 1. TypeScript 运行时（通过 MikroORM）
 * 2. 转译为 Java MyBatis-Plus 代码
 */

import 'reflect-metadata';
import { Injectable, Singleton, inject, injectAutowiredProperties } from '@ai-partner-x/aiko-boot/di/server';
import { createAdapterFromEntity } from './config.js';
import { isDatabaseInitialized } from './database.js';

// ==================== Metadata Keys (使用字符串而非 Symbol，以便跨 ESM 模块共享) ====================

export const ENTITY_METADATA = 'aiko-boot:entity';
export const TABLE_ID_METADATA = 'aiko-boot:tableId';
export const TABLE_FIELD_METADATA = 'aiko-boot:tableField';
export const MAPPER_METADATA = 'aiko-boot:mapper';

// ==================== Types ====================

/** 实体选项 - 对应 @TableName */
export interface EntityOptions {
  /** 表名 */
  table?: string;
  /** 表名 (别名) */
  tableName?: string;
  /** 描述 */
  description?: string;
  /** Schema */
  schema?: string;
}

/** 主键选项 - 对应 @TableId */
export interface TableIdOptions {
  /** 主键类型 */
  type?: 'AUTO' | 'INPUT' | 'ASSIGN_ID' | 'ASSIGN_UUID';
  /** 列名 */
  column?: string;
}

/** 字段选项 - 对应 @TableField */
export interface TableFieldOptions {
  /** 列名 */
  column?: string;
  /** 是否存在于数据库 */
  exist?: boolean;
  /** 字段填充策略 */
  fill?: 'INSERT' | 'UPDATE' | 'INSERT_UPDATE';
  /** 是否是大字段 */
  select?: boolean;
  /** 字段类型 */
  jdbcType?: string;
}

/** Mapper 选项 - 对应 @Mapper */
export interface MapperOptions {
  /** 关联的实体类 */
  entity?: Function;
}

// ==================== Entity Decorators ====================

/**
 * @Entity 装饰器 - 标记实体类
 */
export function Entity(options: EntityOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    const tableName = options.table || options.tableName || target.name.toLowerCase() + 's';
    
    Reflect.defineMetadata(ENTITY_METADATA, {
      ...options,
      tableName,
      className: target.name,
    }, target);
    
    return target;
  };
}

/**
 * @TableName 装饰器 - @Entity 的别名
 */
export const TableName = Entity;

// ==================== Field Decorators ====================

/**
 * @TableId 装饰器 - 标记主键字段
 */
export function TableId(options: TableIdOptions = {}) {
  return function (target: Object, propertyKey: string | symbol): void {
    const constructor = target.constructor;
    const existingFields = Reflect.getMetadata(TABLE_ID_METADATA, constructor) || {};
    
    existingFields[String(propertyKey)] = {
      ...options,
      type: options.type || 'AUTO',
      propertyName: String(propertyKey),
    };
    
    Reflect.defineMetadata(TABLE_ID_METADATA, existingFields, constructor);
  };
}

/**
 * @TableField 装饰器 - 标记普通字段
 */
export function TableField(options: TableFieldOptions = {}) {
  return function (target: Object, propertyKey: string | symbol): void {
    const constructor = target.constructor;
    const existingFields = Reflect.getMetadata(TABLE_FIELD_METADATA, constructor) || {};
    
    existingFields[String(propertyKey)] = {
      ...options,
      propertyName: String(propertyKey),
      column: options.column || String(propertyKey),
    };
    
    Reflect.defineMetadata(TABLE_FIELD_METADATA, existingFields, constructor);
  };
}

/**
 * @Column 装饰器 - @TableField 的别名
 */
export const Column = TableField;

// ==================== Repository/Mapper Decorators ====================

/**
 * @Mapper 装饰器 - 标记 Mapper 接口
 * 自动注册到 DI 容器，自动设置数据库适配器
 * 
 * @example
 * @Mapper(User)
 * export class UserMapper extends BaseMapper<User> {}
 */
export function Mapper(entity?: Function) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    Reflect.defineMetadata(MAPPER_METADATA, {
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
    
    // 包装构造函数，在实例化时自动设置适配器
    if (entity) {
      const originalConstructor = target;
      const newConstructor = function (this: any, ...args: any[]) {
        const instance = new (originalConstructor as any)(...args);

        // 注入 @Autowired 属性
        injectAutowiredProperties(instance);

        // 如果数据库已初始化且实例有 setAdapter 方法，自动设置适配器
        if (isDatabaseInitialized() && typeof instance.setAdapter === 'function' && !instance.adapter) {
          try {
            const adapter = createAdapterFromEntity(entity as any);
            instance.setAdapter(adapter);
          } catch {
            // 忽略错误，允许手动设置
          }
        }

        return instance;
      } as unknown as T;
      
      // 复制原型和静态属性
      newConstructor.prototype = originalConstructor.prototype;
      Object.setPrototypeOf(newConstructor, originalConstructor);
      
      // 复制 metadata
      const metadataKeys = Reflect.getMetadataKeys(originalConstructor);
      metadataKeys.forEach(key => {
        const value = Reflect.getMetadata(key, originalConstructor);
        Reflect.defineMetadata(key, value, newConstructor);
      });
      
      return newConstructor;
    }
    
    return target;
  };
}

// ==================== Metadata Helpers ====================

/**
 * 获取实体元数据
 */
export function getEntityMetadata(target: Function): (EntityOptions & { tableName: string; className: string }) | undefined {
  return Reflect.getMetadata(ENTITY_METADATA, target);
}

/**
 * 获取主键字段元数据
 */
export function getTableIdMetadata(target: Function): Record<string, TableIdOptions & { propertyName: string }> | undefined {
  return Reflect.getMetadata(TABLE_ID_METADATA, target);
}

/**
 * 获取字段元数据
 */
export function getTableFieldMetadata(target: Function): Record<string, TableFieldOptions & { propertyName: string }> | undefined {
  return Reflect.getMetadata(TABLE_FIELD_METADATA, target);
}

/**
 * 获取 Mapper 元数据
 */
export function getMapperMetadata(target: Function): (MapperOptions & { className: string }) | undefined {
  return Reflect.getMetadata(MAPPER_METADATA, target);
}
