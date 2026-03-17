/**
 * 日志装饰器元数据管理
 * 使用 Reflect Metadata API 存储和检索装饰器元数据
 */

import { ILogger } from '../types';

// 一次性检查 Reflect Metadata 支持状态
const HAS_REFLECT_METADATA = typeof Reflect === 'object' && 
  (Reflect as any).defineMetadata && 
  (Reflect as any).getMetadata && 
  (Reflect as any).hasMetadata && 
  (Reflect as any).deleteMetadata;

// 安全地访问 Reflect.metadata 方法
const ReflectMetadata = HAS_REFLECT_METADATA ? {
  defineMetadata: (metadataKey: any, metadataValue: any, target: any): void => {
    if (!target) return;
    (Reflect as any).defineMetadata(metadataKey, metadataValue, target);
  },
  
  getMetadata: (metadataKey: any, target: any): any => {
    if (!target) return undefined;
    return (Reflect as any).getMetadata(metadataKey, target);
  },
  
  hasMetadata: (metadataKey: any, target: any): boolean => {
    if (!target) return false;
    return (Reflect as any).hasMetadata(metadataKey, target);
  },
  
  deleteMetadata: (metadataKey: any, target: any): boolean => {
    if (!target) return false;
    return (Reflect as any).deleteMetadata(metadataKey, target);
  }
} : {
  defineMetadata: (metadataKey: any, metadataValue: any, target: any): void => {
    if (!target) return;
    // 不支持 Reflect Metadata，静默失败
  },
  
  getMetadata: (metadataKey: any, target: any): any => {
    if (!target) return undefined;
    return undefined;
  },
  
  hasMetadata: (metadataKey: any, target: any): boolean => {
    if (!target) return false;
    return false;
  },
  
  deleteMetadata: (metadataKey: any, target: any): boolean => {
    if (!target) return false;
    return false;
  }
};

/** 元数据键定义 */
export const LOGGER_METADATA_KEY = Symbol('aiko:logger');
export const LOGGER_NAME_METADATA_KEY = Symbol('aiko:logger:name');
export const LOGGER_OPTIONS_METADATA_KEY = Symbol('aiko:logger:options');

/**
 * 日志元数据管理器
 */
export class LoggerMetadata {
  /**
   * 设置类的日志记录器实例
   */
  static setLogger(target: any, logger: ILogger): void {
    ReflectMetadata.defineMetadata(LOGGER_METADATA_KEY, logger, target);
  }

  /**
   * 获取类的日志记录器实例
   */
  static getLogger(target: any): ILogger | undefined {
    return ReflectMetadata.getMetadata(LOGGER_METADATA_KEY, target);
  }

  /**
   * 设置类的日志记录器名称
   */
  static setName(target: any, name: string): void {
    ReflectMetadata.defineMetadata(LOGGER_NAME_METADATA_KEY, name, target);
  }

  /**
   * 获取类的日志记录器名称
   */
  static getName(target: any): string | undefined {
    return ReflectMetadata.getMetadata(LOGGER_NAME_METADATA_KEY, target);
  }

  /**
   * 设置类的日志记录器选项
   */
  static setOptions(target: any, options: any): void {
    ReflectMetadata.defineMetadata(LOGGER_OPTIONS_METADATA_KEY, options, target);
  }

  /**
   * 获取类的日志记录器选项
   */
  static getOptions(target: any): any {
    return ReflectMetadata.getMetadata(LOGGER_OPTIONS_METADATA_KEY, target);
  }

  /**
   * 检查类是否已注册日志记录器
   */
  static hasLogger(target: any): boolean {
    return ReflectMetadata.hasMetadata(LOGGER_METADATA_KEY, target);
  }

  /**
   * 清除类的所有日志元数据
   */
  static clear(target: any): void {
    ReflectMetadata.deleteMetadata(LOGGER_METADATA_KEY, target);
    ReflectMetadata.deleteMetadata(LOGGER_NAME_METADATA_KEY, target);
    ReflectMetadata.deleteMetadata(LOGGER_OPTIONS_METADATA_KEY, target);
  }
}