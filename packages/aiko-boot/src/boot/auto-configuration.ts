/**
 * AutoConfiguration Discovery - Spring Boot Style Auto Configuration
 * 
 * 支持:
 * 1. @AutoConfiguration - 自动配置类标记
 * 2. @AutoConfigureBefore / @AutoConfigureAfter - 配置顺序
 * 3. @EnableAutoConfiguration - 启用自动配置
 * 4. AutoConfigurationLoader - 加载 aiko-boot.config.json 中定义的自动配置
 * 
 * 发现机制:
 * 1. 包内定义 aiko-boot.config.json 声明自动配置类
 * 2. createApp() 启动时扫描并加载所有自动配置
 * 
 * @example
 * ```json
 * // packages/mq/aiko-boot.config.json
 * {
 *   "autoConfiguration": [
 *     "./dist/MqAutoConfiguration.js"
 *   ]
 * }
 * ```
 * 
 * ```typescript
 * @AutoConfiguration()
 * @ConditionalOnProperty('mq.enabled', { havingValue: 'true' })
 * export class MqAutoConfiguration {
 *   @Bean()
 *   createMqTemplate(): MqTemplate {
 *     return new MqTemplate();
 *   }
 * }
 * ```
 */
import 'reflect-metadata';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { Injectable, Singleton } from '../di/server.js';
import { processConfiguration, shouldLoadConfiguration } from './conditional.js';
import { registerLifecycleListenersFromClass } from './lifecycle.js';

// Metadata keys (使用字符串而非 Symbol，以便跨模块共享)
const AUTO_CONFIGURATION_METADATA = 'aiko-boot:autoConfiguration';
const AUTO_CONFIGURE_ORDER_METADATA = 'aiko-boot:autoConfigureOrder';

// 使用 globalThis 存储，以便跨 ESM 模块实例共享
const AUTO_CONFIG_CLASSES_KEY = Symbol.for('aiko-boot:autoConfigurationClasses');
const AUTO_CONFIG_LOADED_KEY = Symbol.for('aiko-boot:autoConfigurationLoaded');
const AUTO_CONFIG_EXCLUDED_KEY = Symbol.for('aiko-boot:autoConfigurationExcluded');

interface AutoConfigEntry {
  target: Function;
  exportName?: string;
  order: number;
  before: string[];
  after: string[];
}

function getAutoConfigClassesStorage(): AutoConfigEntry[] {
  if (!(globalThis as any)[AUTO_CONFIG_CLASSES_KEY]) {
    (globalThis as any)[AUTO_CONFIG_CLASSES_KEY] = [];
  }
  return (globalThis as any)[AUTO_CONFIG_CLASSES_KEY];
}

function isAutoConfigLoaded(): boolean {
  return (globalThis as any)[AUTO_CONFIG_LOADED_KEY] === true;
}

function setAutoConfigLoaded(value: boolean): void {
  (globalThis as any)[AUTO_CONFIG_LOADED_KEY] = value;
}

function getExcludedConfigs(): Set<string> {
  if (!(globalThis as any)[AUTO_CONFIG_EXCLUDED_KEY]) {
    (globalThis as any)[AUTO_CONFIG_EXCLUDED_KEY] = new Set<string>();
  }
  return (globalThis as any)[AUTO_CONFIG_EXCLUDED_KEY];
}

// 已注册的自动配置类（使用 globalThis 存储）
const autoConfigurationClasses = getAutoConfigClassesStorage();

/**
 * @AutoConfiguration - 标记自动配置类
 * 
 * 自动配置类会在应用启动时被自动发现和加载
 * 
 * @param options - 配置选项
 * 
 * @example
 * ```typescript
 * @AutoConfiguration({ order: 100 })
 * @ConditionalOnClass([Redis])
 * export class RedisAutoConfiguration {
 *   @Bean()
 *   @ConditionalOnMissingBean(RedisClient)
 *   createRedisClient(): RedisClient {
 *     return new RedisClient();
 *   }
 * }
 * ```
 */
export function AutoConfiguration(options: {
  /** 加载顺序，数字越小越先加载，默认 0 */
  order?: number;
} = {}) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    const { order = 0 } = options;
    
    // 只标记元数据，不自动注册到列表
    // 注册由 AutoConfigurationLoader.loadStarterPackage 统一处理
    Reflect.defineMetadata(AUTO_CONFIGURATION_METADATA, { 
      className: target.name,
      order,
    }, target);

    // Apply DI decorators
    Injectable()(target);
    Singleton()(target);

    return target;
  };
}

/**
 * @AutoConfigureBefore - 在指定配置类之前加载
 * 
 * @param classes - 需要在之前加载的配置类名数组
 */
export function AutoConfigureBefore(...classNames: string[]) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    const orderMeta = Reflect.getMetadata(AUTO_CONFIGURE_ORDER_METADATA, target) || { before: [], after: [] };
    orderMeta.before.push(...classNames);
    Reflect.defineMetadata(AUTO_CONFIGURE_ORDER_METADATA, orderMeta, target);
    return target;
  };
}

/**
 * @AutoConfigureAfter - 在指定配置类之后加载
 * 
 * @param classes - 需要在之后加载的配置类名数组
 */
export function AutoConfigureAfter(...classNames: string[]) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    const orderMeta = Reflect.getMetadata(AUTO_CONFIGURE_ORDER_METADATA, target) || { before: [], after: [] };
    orderMeta.after.push(...classNames);
    Reflect.defineMetadata(AUTO_CONFIGURE_ORDER_METADATA, orderMeta, target);
    return target;
  };
}

/**
 * @EnableAutoConfiguration - 启用自动配置（用于主应用类）
 * 
 * @param options - 配置选项
 * 
 * @example
 * ```typescript
 * @EnableAutoConfiguration({ exclude: ['RedisAutoConfiguration'] })
 * export class Application { }
 * ```
 */
export function EnableAutoConfiguration(options: {
  /** 排除的自动配置类名 */
  exclude?: string[];
  /** 要扫描的额外包路径 */
  scanPackages?: string[];
} = {}) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    Reflect.defineMetadata('enableAutoConfiguration', options, target);
    return target;
  };
}

/**
 * AutoConfiguration 加载器
 */
export class AutoConfigurationLoader {
  /**
   * 设置要排除的配置类
   */
  static exclude(classNames: string[]): void {
    const excluded = getExcludedConfigs();
    classNames.forEach(name => excluded.add(name));
  }

  /**
   * 扫描并加载所有自动配置
   * 
   * 扫描顺序:
   * 1. node_modules 中带有 aiko-boot.config.json 的包
   * 2. 项目根目录的 aiko-boot.config.json
   */
  static async loadAll(options: {
    basePath?: string;
    verbose?: boolean;
  } = {}): Promise<void> {
    if (isAutoConfigLoaded()) return;

    const { basePath = process.cwd(), verbose = true } = options;

    // 1. 扫描 node_modules
    await this.scanNodeModules(basePath, verbose);

    // 2. 扫描项目根目录
    await this.scanProjectConfig(basePath, verbose);

    // 3. 按顺序处理所有自动配置
    this.processAutoConfigurations(verbose);

    setAutoConfigLoaded(true);
  }

  /**
   * 扫描 node_modules 中的自动配置
   */
  private static async scanNodeModules(basePath: string, verbose: boolean): Promise<void> {
    const nodeModulesPath = join(basePath, 'node_modules');
    if (!existsSync(nodeModulesPath)) {
      if (verbose) {
        console.log(`🔍 [aiko-boot] No node_modules found at: ${nodeModulesPath}`);
      }
      return;
    }

    if (verbose) {
      console.log(`🔍 [aiko-boot] Scanning node_modules at: ${nodeModulesPath}`);
    }

    // 扫描 @ai-partner-x 命名空间的 aiko-boot-starter-* 包（约定优于配置）
    const aiPartnerXPath = join(nodeModulesPath, '@ai-partner-x');
    if (existsSync(aiPartnerXPath)) {
      const packages = readdirSync(aiPartnerXPath);
      // 只扫描 aiko-boot-starter-* 包
      const starterPackages = packages.filter(pkg => pkg.startsWith('aiko-boot-starter-'));
      if (verbose && starterPackages.length > 0) {
        console.log(`   Found starter packages: ${starterPackages.join(', ')}`);
      }
      for (const pkg of starterPackages) {
        await this.loadStarterPackage(join(aiPartnerXPath, pkg), pkg, verbose);
      }
    }
  }

  /**
   * 扫描项目配置（保留兼容性）
   */
  private static async scanProjectConfig(_basePath: string, _verbose: boolean): Promise<void> {
    // 项目自身不需要扫描，自动配置只来自 starter 包
  }

  /**
   * 加载 starter 包的自动配置（约定优于配置）
   *
   * 约定：
   * 1. 包名以 aiko-boot-starter-* 开头
   * 2. 自动配置类从 dist/index.js 导出
   * 3. 类使用 @AutoConfiguration 装饰器标记
   */
  private static async loadStarterPackage(packagePath: string, packageName: string, verbose: boolean): Promise<void> {
    // 约定：从 dist/index.js 加载
    const modulePath = join(packagePath, 'dist/index.js');

    if (!existsSync(modulePath)) {
      if (verbose) {
        console.log(`   Skipping ${packageName}: dist/index.js not found`);
      }
      return;
    }

    try {
      // 动态导入模块 - 在Windows环境下需要使用file://协议
      let importPath = modulePath;
      if (process.platform === 'win32') {
        // Windows环境下，绝对路径需要转换为file:// URL
        // 将反斜杠转换为正斜杠，并添加file://前缀
        importPath = `file:///${modulePath.replace(/\\/g, '/')}`;
      }
      const module = await import(importPath);
      
      // 扫描模块导出，找到带有 @AutoConfiguration 元数据的类
      for (const exportName of Object.keys(module)) {
        const exported = module[exportName];
        if (typeof exported === 'function') {
          const meta = Reflect.getMetadata(AUTO_CONFIGURATION_METADATA, exported);
          if (meta) {
            // 使用导出名作为类名（因为打包后 target.name 可能变成 newConstructor）
            const className = exportName;
            // 检查是否已注册（避免重复）
            const alreadyRegistered = autoConfigurationClasses.some(
              c => c.exportName === className
            );
            if (!alreadyRegistered) {
              const orderMeta = Reflect.getMetadata(AUTO_CONFIGURE_ORDER_METADATA, exported) || { before: [], after: [] };
              autoConfigurationClasses.push({
                target: exported,
                exportName: className,
                order: meta.order || 0,
                before: orderMeta.before,
                after: orderMeta.after,
              });
              if (verbose) {
                console.log(`📦 [aiko-boot] Auto-configured: ${className} (from ${packageName})`);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[aiko-boot] Failed to load ${packageName}: ${(e as Error).message}`);
    }
  }

  /**
   * 按顺序处理所有自动配置
   */
  private static processAutoConfigurations(verbose: boolean): void {
    // 排序自动配置类
    const sorted = this.sortAutoConfigurations();

    if (verbose) {
      console.log(`🔧 [aiko-boot] Found ${sorted.length} auto-configuration(s)`);
      sorted.forEach(({ target }) => console.log(`   - ${target.name}`));
    }

    for (const { target, exportName } of sorted) {
      // 使用 exportName 作为显示名称（因为打包后 target.name 变成 newConstructor）
      const className = exportName || target.name;

      // 检查是否被排除
      if (getExcludedConfigs().has(className)) {
        if (verbose) {
          console.log(`⏭️  [aiko-boot] Skipped (excluded): ${className}`);
        }
        continue;
      }

      // 检查条件
      if (!shouldLoadConfiguration(target)) {
        if (verbose) {
          console.log(`⏭️  [aiko-boot] Skipped (condition not met): ${className}`);
        }
        continue;
      }

      try {
        // 注册 lifecycle 监听器（解决 ESM 模块实例不共享的问题）
        registerLifecycleListenersFromClass(target, exportName);
        
        processConfiguration(target);
        if (verbose) {
          console.log(`✅ [aiko-boot] Processed: ${className}`);
        }
      } catch (e) {
        console.error(`❌ [aiko-boot] Failed to process ${className}: ${(e as Error).message}`);
      }
    }
  }

  /**
   * 拓扑排序自动配置类
   */
  private static sortAutoConfigurations(): Array<{ target: Function; order: number; exportName?: string }> {
    const configs = [...autoConfigurationClasses];
    // 使用 exportName 作为 key（因为打包后 target.name 都变成 newConstructor）
    const getName = (c: typeof configs[0]) => c.exportName || c.target.name;
    const nameToConfig = new Map(configs.map(c => [getName(c), c]));
    
    // 构建依赖图
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    for (const config of configs) {
      const name = getName(config);
      if (!graph.has(name)) {
        graph.set(name, new Set());
        inDegree.set(name, 0);
      }
    }

    // before: A before B 表示 A -> B（A 先于 B）
    // after: A after B 表示 B -> A（B 先于 A）
    for (const config of configs) {
      const name = getName(config);
      
      for (const beforeName of config.before) {
        if (graph.has(beforeName)) {
          graph.get(name)!.add(beforeName);
          inDegree.set(beforeName, (inDegree.get(beforeName) || 0) + 1);
        }
      }
      
      for (const afterName of config.after) {
        if (graph.has(afterName)) {
          graph.get(afterName)!.add(name);
          inDegree.set(name, (inDegree.get(name) || 0) + 1);
        }
      }
    }

    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    const result: Array<{ target: Function; order: number; exportName?: string }> = [];

    // 先按 order 排序，再加入队列
    const zeroInDegree = configs
      .filter(c => (inDegree.get(getName(c)) || 0) === 0)
      .sort((a, b) => a.order - b.order);
    
    for (const config of zeroInDegree) {
      queue.push(getName(config));
    }

    while (queue.length > 0) {
      const name = queue.shift()!;
      const config = nameToConfig.get(name)!;
      result.push({ target: config.target, order: config.order, exportName: config.exportName });

      for (const neighbor of graph.get(name) || []) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  /**
   * 重置状态（用于测试）
   */
  static reset(): void {
    setAutoConfigLoaded(false);
    getExcludedConfigs().clear();
    autoConfigurationClasses.length = 0;
  }
}

/**
 * 获取自动配置元数据
 */
export function getAutoConfigurationMetadata(target: any): { className: string; order: number } | undefined {
  return Reflect.getMetadata(AUTO_CONFIGURATION_METADATA, target);
}

/**
 * 获取所有注册的自动配置类
 */
export function getAutoConfigurationClasses(): Array<{ target: Function; order: number }> {
  return autoConfigurationClasses.map(c => ({ target: c.target, order: c.order }));
}
