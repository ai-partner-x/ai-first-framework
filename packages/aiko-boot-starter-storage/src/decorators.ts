/**
 * @ai-partner-x/aiko-boot-starter-storage
 * 存储相关装饰器
 *
 * @Uploadable  - 标记一个类支持图片上传（注入 StorageService）
 * @StorageField - 标记实体字段存储上传后的文件 URL
 */
import 'reflect-metadata';
import type { UploadOptions } from './types.js';

export const UPLOADABLE_METADATA: unique symbol = Symbol('aiko-boot:uploadable');
export const STORAGE_FIELD_METADATA: unique symbol = Symbol('aiko-boot:storageField');

/** @Uploadable 装饰器选项 */
export interface UploadableOptions extends UploadOptions {
  /**
   * 上传存储目录
   * @example 'products/images'
   */
  folder?: string;
  /**
   * 最大文件大小（字节）
   * @default 5 * 1024 * 1024
   */
  maxSize?: number;
  /**
   * 允许的 MIME 类型白名单
   * @default ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
   */
  allowedTypes?: string[];
}

/** @StorageField 装饰器选项 */
export interface StorageFieldOptions {
  /**
   * 上传存储目录（与 @Uploadable 中的 folder 相同效果）
   * @example 'avatars'
   */
  folder?: string;
  /**
   * 最大文件大小（字节）
   * @default 5 * 1024 * 1024
   */
  maxSize?: number;
  /**
   * 允许的 MIME 类型白名单
   * @default ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
   */
  allowedTypes?: string[];
}

/**
 * @Uploadable - 标记一个类支持图片上传
 *
 * 记录上传策略元数据（folder、maxSize、allowedTypes），
 * 在 StorageService 中使用这些元数据做文件校验。
 *
 * @example
 * @Uploadable({
 *   folder: 'products',
 *   maxSize: 5 * 1024 * 1024,
 *   allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
 * })
 * export class ProductImageUploader {}
 */
export function Uploadable(options: UploadableOptions = {}): ClassDecorator {
  return function (target: Function): void {
    Reflect.defineMetadata(
      UPLOADABLE_METADATA,
      {
        ...options,
        folder: options.folder ?? 'uploads',
        maxSize: options.maxSize ?? 5 * 1024 * 1024,
        allowedTypes: options.allowedTypes ?? ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        className: target.name,
      },
      target,
    );
  };
}

/**
 * @StorageField - 标记实体类中的字段为存储文件 URL 的字段
 *
 * 配合 aiko-boot-starter-orm 的 @TableField 使用，描述该字段对应的上传配置。
 *
 * @example
 * @Entity({ table: 'products' })
 * export class Product {
 *   @StorageField({ folder: 'products', allowedTypes: ['image/jpeg', 'image/png'] })
 *   @TableField()
 *   imageUrl!: string;
 * }
 */
export function StorageField(options: StorageFieldOptions = {}): (target: object, propertyKey: string | symbol) => void {
  return function (target: object, propertyKey: string | symbol): void {
    const constructor = (target as any).constructor;
    const existing: Record<string, StorageFieldOptions & { propertyName: string }> =
      Reflect.getMetadata(STORAGE_FIELD_METADATA, constructor) || {};
    existing[String(propertyKey)] = {
      ...options,
      folder: options.folder ?? 'uploads',
      maxSize: options.maxSize ?? 5 * 1024 * 1024,
      allowedTypes: options.allowedTypes ?? ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      propertyName: String(propertyKey),
    };
    Reflect.defineMetadata(STORAGE_FIELD_METADATA, existing, constructor);
  };
}

/**
 * 获取 @Uploadable 元数据
 */
export function getUploadableMetadata(target: Function): (UploadableOptions & { className: string }) | undefined {
  return Reflect.getMetadata(UPLOADABLE_METADATA, target);
}

/**
 * 获取 @StorageField 元数据（返回该类上所有带 @StorageField 的字段）
 */
export function getStorageFieldMetadata(target: Function): Record<string, StorageFieldOptions & { propertyName: string }> | undefined {
  return Reflect.getMetadata(STORAGE_FIELD_METADATA, target);
}
