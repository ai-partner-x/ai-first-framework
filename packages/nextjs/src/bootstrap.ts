/**
 * Express App Bootstrap - Spring Boot 风格的自动配置
 * 
 * @example
 * ```typescript
 * import { createApp } from '@ai-first/nextjs';
 * 
 * const app = await createApp({
 *   srcDir: import.meta.dirname,
 *   database: { type: 'sqlite', filename: ':memory:' },
 *   cache: { type: 'redis', host: '127.0.0.1', port: 6379 },
 * });
 * app.listen(3001, () => console.log('Server running on port 3001'));
 * ```
 */
import 'reflect-metadata';
import express, { Express } from 'express';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { pathToFileURL } from 'url';
import { createExpressRouter } from './express-router.js';
import { getControllerMetadata } from './decorators.js';
import { Injectable, Singleton } from '@ai-first/di/server';
import { createKyselyDatabase, type DatabaseConnectionConfig } from '@ai-first/orm';
import { initializeCaching, type CacheConfig } from '@ai-first/cache';

export type { DatabaseConnectionConfig };
export type { CacheConfig };

export interface AppOptions {
  /** 源代码目录，默认自动扫描 controller/, service/, mapper/ */
  srcDir: string;
  /** API 路径前缀，默认 "/api" */
  prefix?: string;
  /** 数据库配置 */
  database?: DatabaseConnectionConfig;
  /**
   * 缓存配置 — 通过 `type` 字段选择后端（对应 Spring Boot spring.cache.type）
   *
   * 提供此选项时，createApp 会自动调用 initializeCaching(config) 初始化对应后端；
   * 初始化失败则抛出 CacheInitializationError 并阻止启动。
   *
   * 目前支持的后端类型：
   * - `'redis'` — Redis 缓存（对应 spring.data.redis.*）
   *
   * @example Redis 单机
   * ```typescript
   * createApp({ cache: { type: 'redis', host: '127.0.0.1', port: 6379 } })
   * ```
   *
   * @example Redis Sentinel（高可用）
   * ```typescript
   * createApp({
   *   cache: {
   *     type: 'redis',
   *     mode: 'sentinel',
   *     masterName: 'mymaster',
   *     sentinels: [{ host: '127.0.0.1', port: 26379 }],
   *   },
   * })
   * ```
   */
  cache?: CacheConfig;
  /** 是否启用 CORS，默认 true */
  cors?: boolean;
  /** 是否打印详细日志，默认 true */
  verbose?: boolean;
}

/**
 * 创建 Express 应用，自动扫描并注册所有组件
 * 
 * 扫描顺序（确保依赖正确加载）：
 * 1. mapper/ - 数据访问层
 * 2. service/ - 业务逻辑层
 * 3. controller/ - 控制器层
 */
export async function createApp(options: AppOptions): Promise<Express> {
  const { 
    srcDir, 
    prefix = '/api', 
    database,
    cache,
    cors: enableCors = true, 
    verbose = true 
  } = options;

  // 初始化数据库
  if (database) {
    await createKyselyDatabase(database);
    if (verbose) {
      console.log(`🗄️  [AI-First] Database: ${database.type}`);
    }
  }

  // 初始化缓存后端（根据 cache.type 自动选择）
  if (cache) {
    await initializeCaching(cache);
    if (verbose) {
      console.log(`🔴 [AI-First] Cache: ${describeCacheConfig(cache)}`);
    }
  }

  if (verbose) {
    console.log('\n🚀 [AI-First] Starting application...');
    console.log(`📁 Source directory: ${srcDir}`);
  }

  // 按依赖顺序扫描目录
  const scanDirs = ['mapper', 'service', 'controller'];
  const controllers: (new (...args: any[]) => any)[] = [];

  for (const dir of scanDirs) {
    const dirPath = join(srcDir, dir);
    if (!existsSync(dirPath)) continue;

    const modules = await scanAndImport(dirPath, verbose);
    
    // 收集并注册所有类到 DI 容器
    for (const mod of modules) {
      const exports = Object.values(mod);
      for (const exported of exports) {
        if (typeof exported === 'function' && exported.prototype) {
          // 显式调用 DI 装饰器，确保 TypeInfo 被设置
          try {
            Injectable()(exported as any);
            Singleton()(exported as any);
          } catch {
            // 已注册则跳过
          }
          
          // 只收集 Controller
          if (dir === 'controller' && getControllerMetadata(exported)) {
            controllers.push(exported as new (...args: any[]) => any);
          }
        }
      }
    }
  }

  // 创建 Express 应用
  const app = express();
  
  if (enableCors) {
    // 动态导入 cors（避免强依赖）
    const corsModule = await import('cors');
    app.use(corsModule.default());
  }
  app.use(express.json());

  // 注册所有 Controller 路由
  if (controllers.length > 0) {
    app.use(createExpressRouter(controllers, { prefix, verbose }));
  } else {
    console.warn('[AI-First] No controllers found!');
  }

  if (verbose) {
    console.log(`\n✅ [AI-First] Application ready!`);
  }

  return app;
}

/**
 * 扫描目录并动态导入所有模块
 */
async function scanAndImport(dirPath: string, verbose: boolean): Promise<any[]> {
  const modules: any[] = [];
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      const subModules = await scanAndImport(filePath, verbose);
      modules.push(...subModules);
    } else if (isModuleFile(file)) {
      try {
        const fileUrl = pathToFileURL(filePath).href;
        const mod = await import(fileUrl);
        modules.push(mod);
        
        if (verbose) {
          console.log(`📦 [AI-First] Loaded: ${file}`);
        }
      } catch (e: any) {
        console.error(`❌ [AI-First] Failed to load ${file}: ${e.message}`);
      }
    }
  }

  return modules;
}

/**
 * 生成缓存配置的可读描述字符串（用于启动日志）
 */
function describeCacheConfig(config: CacheConfig): string {
  if (config.type === 'redis') {
    const c = config as { type: 'redis'; mode?: string; host?: string; port?: number };
    if (c.mode === 'sentinel') {
      const sc = config as { type: 'redis'; mode: 'sentinel'; masterName: string; sentinels: { host: string; port: number }[] };
      return `Redis (sentinel) master=${sc.masterName}`;
    }
    if (c.mode === 'cluster') {
      const cc = config as { type: 'redis'; mode: 'cluster'; nodes: { host: string; port: number }[] };
      return `Redis (cluster) nodes=${cc.nodes.length}`;
    }
    return `Redis @ ${c.host ?? '127.0.0.1'}:${c.port ?? 6379}`;
  }
  // Future backends: add descriptions here
  return `${(config as { type: string }).type}`;
}

/**
 * 判断是否为有效的模块文件
 */
function isModuleFile(filename: string): boolean {
  const ext = extname(filename);
  // 支持 .js, .mjs, .ts
  // 排除 .d.ts, .map, .test.ts, index.ts 等
  if (ext === '.js' || ext === '.mjs') {
    return !filename.endsWith('.d.js') && !filename.endsWith('.test.js');
  }
  if (ext === '.ts') {
    return !filename.endsWith('.d.ts') && 
           !filename.endsWith('.test.ts') && 
           !filename.endsWith('.spec.ts') &&
           filename !== 'index.ts';
  }
  return false;
}
