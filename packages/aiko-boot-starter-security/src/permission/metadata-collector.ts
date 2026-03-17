import 'reflect-metadata';
import { PermissionType } from '../entities/index.js';

/**
 * 权限元数据接口
 */
export interface PermissionMetadata {
  /** 权限码 */
  permissionCode: string;
  /** 权限类型 */
  type: PermissionType;
  /** 资源标识 */
  resource: string;
  /** 操作标识 */
  action: string;
  /** 权限描述 */
  description?: string;
  /** 权限组 */
  group?: string;
  /** 是否必需 */
  required?: boolean;
  /** 路由路径 */
  path?: string;
  /** HTTP方法 */
  httpMethod?: string;
  /** 装饰器类型 */
  decoratorType: 'api' | 'method' | 'button' | 'menu' | 'role' | 'general';
}

/**
 * 权限元数据收集器
 *
 * 自动收集应用中所有使用权限装饰器定义的权限，
 * 提供统一的权限查询和导出功能。
 */
export class PermissionMetadataCollector {
  private static instance: PermissionMetadataCollector;
  private metadata: Map<string, PermissionMetadata[]> = new Map();

  private constructor() {
    this.collectAllPermissions();
  }

  /**
   * 获取全局权限收集器实例（单例）
   */
  static getGlobalPermissionMetadataCollector(): PermissionMetadataCollector {
    if (!PermissionMetadataCollector.instance) {
      PermissionMetadataCollector.instance = new PermissionMetadataCollector();
    }
    return PermissionMetadataCollector.instance;
  }

  /**
   * 收集所有权限元数据
   */
  private collectAllPermissions(): void {
    // 这里应该扫描整个应用的类，收集权限装饰器定义的元数据
    // 由于实现复杂度较高，这里先提供一个简化版本
    // 实际应用中可以通过遍历已注册的类和装饰器元数据来收集
  }

  /**
   * 获取所有权限元数据
   */
  getAllMetadata(): PermissionMetadata[] {
    const allMetadata: PermissionMetadata[] = [];
    this.metadata.forEach(items => {
      allMetadata.push(...items);
    });
    return allMetadata;
  }

  /**
   * 按类型获取权限元数据
   */
  getMetadataByType(type: PermissionType): PermissionMetadata[] {
    const allMetadata = this.getAllMetadata();
    return allMetadata.filter(meta => meta.type === type);
  }

  /**
   * 按资源获取权限元数据
   */
  getMetadataByResource(resource: string): PermissionMetadata[] {
    const allMetadata = this.getAllMetadata();
    return allMetadata.filter(meta => meta.resource === resource);
  }

  /**
   * 按组获取权限元数据
   */
  getMetadataByGroup(group: string): PermissionMetadata[] {
    const allMetadata = this.getAllMetadata();
    return allMetadata.filter(meta => meta.group === group);
  }

  /**
   * 添加权限元数据
   */
  addPermissionMetadata(metadata: PermissionMetadata): void {
    const key = `${metadata.type}:${metadata.resource}:${metadata.action}`;
    if (!this.metadata.has(key)) {
      this.metadata.set(key, []);
    }
    const items = this.metadata.get(key)!;
    if (!items.find(item => item.permissionCode === metadata.permissionCode)) {
      items.push(metadata);
    }
  }

  /**
   * 获取权限统计信息
   */
  getStats(): {
    total: number;
    byType: Record<PermissionType, number>;
    byGroup: Record<string, number>;
    byResource: Record<string, number>;
  } {
    const allMetadata = this.getAllMetadata();
    const stats = {
      total: allMetadata.length,
      byType: {} as Record<PermissionType, number>,
      byGroup: {} as Record<string, number>,
      byResource: {} as Record<string, number>,
    };

    allMetadata.forEach(meta => {
      // 按类型统计
      stats.byType[meta.type] = (stats.byType[meta.type] || 0) + 1;

      // 按组统计
      if (meta.group) {
        stats.byGroup[meta.group] = (stats.byGroup[meta.group] || 0) + 1;
      }

      // 按资源统计
      if (meta.resource) {
        stats.byResource[meta.resource] = (stats.byResource[meta.resource] || 0) + 1;
      }
    });

    return stats;
  }
}

/**
 * 获取全局权限收集器
 */
export function getGlobalPermissionMetadataCollector(): PermissionMetadataCollector {
  return PermissionMetadataCollector.getGlobalPermissionMetadataCollector();
}

/**
 * 导出权限配置
 *
 * 返回应用的完整权限配置，包括权限列表、分组和资源信息。
 */
export function exportPermissionConfig(): {
  permissions: PermissionMetadata[];
  groups: string[];
  resources: string[];
  types: PermissionType[];
  stats: ReturnType<PermissionMetadataCollector['getStats']>;
} {
  const collector = getGlobalPermissionMetadataCollector();
  const allMetadata = collector.getAllMetadata();

  // 提取所有权限组
  const groups = new Set<string>();
  allMetadata.forEach(meta => {
    if (meta.group) {
      groups.add(meta.group);
    }
  });

  // 提取所有资源
  const resources = new Set<string>();
  allMetadata.forEach(meta => {
    if (meta.resource) {
      resources.add(meta.resource);
    }
  });

  // 提取所有权限类型
  const types = new Set<PermissionType>();
  allMetadata.forEach(meta => {
    types.add(meta.type);
  });

  return {
    permissions: allMetadata,
    groups: Array.from(groups).sort(),
    resources: Array.from(resources).sort(),
    types: Array.from(types),
    stats: collector.getStats(),
  };
}

/**
 * 权限码格式化
 *
 * 将权限信息格式化为统一的权限码格式：{type}:{resource}:{action}
 */
export function formatPermissionCode(
  type: PermissionType,
  resource: string,
  action: string
): string {
  return `${type.toLowerCase()}:${resource}:${action}`;
}

/**
 * 解析权限码
 *
 * 将权限码解析为权限信息的各个部分
 */
export function parsePermissionCode(permissionCode: string): {
  type: string;
  resource: string;
  action: string;
} | null {
  const parts = permissionCode.split(':');
  if (parts.length !== 3) {
    return null;
  }

  return {
    type: parts[0],
    resource: parts[1],
    action: parts[2],
  };
}
