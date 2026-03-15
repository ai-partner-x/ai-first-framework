/**
 * Application Bootstrap - Spring Boot 风格的核心启动器
 * 
 * 提供应用的核心启动能力：
 * - 配置加载 (app.config.ts / json / yaml)
 * - 组件扫描与 DI 注册
 * - 自动配置加载
 * - 生命周期事件
 * - HTTP 服务器扩展点
 * 
 * @example
 * ```typescript
 * // 基础启动（无 HTTP 服务器）
 * const context = await createApp({ srcDir: __dirname });
 * 
 * // 配合 aiko-boot-starter-web（自动配置 Express）
 * const context = await createApp({ srcDir: __dirname });
 * context.run(); // 启动 HTTP 服务器
 * ```
 */
import 'reflect-metadata';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { pathToFileURL } from 'url';
import { Injectable, Singleton } from '../di/server.js';
import { ConfigLoader, initializeConfigurationProperties } from './config.js';
import { initializeConfigurations } from './conditional.js';
import { AutoConfigurationLoader } from './auto-configuration.js';
import { ApplicationLifecycle } from './lifecycle.js';

/**
 * HTTP 服务器接口 - 由 aiko-boot-starter-web 等扩展实现
 */
export interface HttpServer {
  /** 启动服务器 */
  listen(port: number, callback?: () => void): void;
  /** 服务器类型标识 */
  type: string;
  /** 底层服务器实例 */
  instance: any;
}

/**
 * 应用上下文 - 启动后返回的上下文对象
 */
export interface ApplicationContext {
  /** 配置访问 */
  config: typeof ConfigLoader;
  /** 已加载的组件类 */
  components: Map<string, Function[]>;
  /** 启动耗时 (ms) */
  startupTime: number;
  /** 运行环境 */
  profile: string;
  /** 源代码目录 */
  srcDir: string;
  /** 是否详细日志 */
  verbose: boolean;
  
  /** 注册 HTTP 服务器（由 aiko-boot-starter-web 等扩展调用） */
  registerHttpServer(server: HttpServer): void;
  /** 获取已注册的 HTTP 服务器 */
  getHttpServer(): HttpServer | undefined;
  
  /** 启动 HTTP 服务器（如果已注册） */
  run(port?: number): Promise<void>;
}

/**
 * 启动选项
 */
export interface AppOptions {
  /** 源代码目录，自动扫描 mapper/, service/, controller/ 等 */
  srcDir: string;
  /** 配置文件路径，默认为 srcDir */
  configPath?: string;
  /** 运行环境 profile，默认从 NODE_ENV 获取 */
  profile?: string;
  /** 是否启用自动配置，默认 true */
  enableAutoConfiguration?: boolean;
  /** 排除的自动配置类名 */
  excludeAutoConfigurations?: string[];
  /** 是否打印详细日志，默认从配置文件读取，否则 true */
  verbose?: boolean;
  /** 要扫描的目录列表，默认 ['mapper', 'service', 'controller'] */
  scanDirs?: string[];
  /** 是否启用 graceful shutdown，默认从配置文件读取，否则 true */
  enableGracefulShutdown?: boolean;
}

/** @deprecated 使用 AppOptions 代替 */
export type BootstrapOptions = AppOptions & {
  onComponentLoaded?: (type: string, component: Function) => void;
};

// 全局应用上下文（单例）
// 使用 globalThis 存储上下文，以便跨 ESM 模块实例共享
const CONTEXT_KEY = Symbol.for('aiko-boot:applicationContext');

/**
 * 获取全局应用上下文
 */
export function getApplicationContext(): ApplicationContext | null {
  return (globalThis as any)[CONTEXT_KEY] || null;
}

/**
 * 设置全局应用上下文（内部使用）
 */
function setGlobalContext(context: ApplicationContext | null): void {
  (globalThis as any)[CONTEXT_KEY] = context;
}

/**
 * 创建应用 - Spring Boot 风格的启动入口
 * 
 * 启动顺序：
 * 1. 加载配置文件 (app.config.ts > json > yaml > 环境变量)
 * 2. 触发 ApplicationStarting 事件
 * 3. 扫描并加载组件 (mapper/ -> service/ -> controller/)
 * 4. 处理自动配置（包括 ORM、Web 等）
 * 5. 初始化配置属性类
 * 6. 触发 ApplicationStarted 事件
 * 7. 触发 ApplicationReady 事件
 * 
 * @example
 * ```typescript
 * const app = await createApp({ srcDir: __dirname });
 * app.run(); // 启动 HTTP 服务器（如果 aiko-boot-starter-web 已配置）
 * ```
 */
export async function createApp(options: AppOptions): Promise<ApplicationContext> {
  const startTime = Date.now();
  const {
    srcDir,
    configPath = join(srcDir, '..'), // 默认为 srcDir 的父目录（项目根目录）
    profile = process.env.NODE_ENV || 'development',
    enableAutoConfiguration = true,
    excludeAutoConfigurations = [],
    scanDirs = ['mapper', 'service', 'controller'],
  } = options;

  // ========== Phase 1: 加载配置 ==========
  await ConfigLoader.loadAsync({
    basePath: configPath,
    profile,
  });

  // Spring Boot 风格配置读取
  // logging.level.root: debug | info | warn | error
  const loggingLevel = ConfigLoader.get<string>('logging.level.root', 'info');
  const verbose = options.verbose ?? (loggingLevel === 'debug');
  // server.shutdown: graceful | immediate (Spring Boot 风格)
  const shutdownMode = ConfigLoader.get<string>('server.shutdown', 'graceful');
  const enableGracefulShutdown = options.enableGracefulShutdown ?? (shutdownMode === 'graceful');

  if (verbose) {
    console.log('\n🚀 [aiko-boot] Starting application...');
    console.log(`📁 Source directory: ${srcDir}`);
    console.log(`🔧 Profile: ${profile}`);
    console.log('📋 [aiko-boot] Configuration loaded');
  }

  // ========== Phase 2: ApplicationStarting ==========
  await ApplicationLifecycle.emit('ApplicationStarting', verbose);

  // ========== Phase 3: 扫描组件 ==========
  const components = new Map<string, Function[]>();

  for (const dir of scanDirs) {
    const dirPath = join(srcDir, dir);
    if (!existsSync(dirPath)) continue;

    const loadedComponents: Function[] = [];
    const modules = await scanAndImport(dirPath, verbose);

    for (const mod of modules) {
      const exports = Object.values(mod);
      for (const exported of exports) {
        if (typeof exported === 'function' && exported.prototype) {
          try {
            Injectable()(exported as any);
            Singleton()(exported as any);
          } catch {
            // 已注册则跳过
          }
          loadedComponents.push(exported as Function);
        }
      }
    }

    components.set(dir, loadedComponents);
  }

  // ========== Phase 4: 处理自动配置 ==========
  if (enableAutoConfiguration) {
    if (excludeAutoConfigurations.length > 0) {
      AutoConfigurationLoader.exclude(excludeAutoConfigurations);
    }
    // 使用 configPath（项目根目录）扫描 node_modules 中的自动配置
    await AutoConfigurationLoader.loadAll({ basePath: configPath, verbose });
    initializeConfigurations();
  }

  // ========== Phase 5: 初始化配置属性 ==========
  initializeConfigurationProperties();

  // ========== Phase 6: ApplicationStarted ==========
  await ApplicationLifecycle.emit('ApplicationStarted', verbose);

  // ========== Graceful Shutdown ==========
  if (enableGracefulShutdown) {
    ApplicationLifecycle.setupGracefulShutdown();
  }

  // 创建应用上下文（必须在 ApplicationReady 之前，因为 AutoConfiguration 需要访问）
  let httpServer: HttpServer | undefined;

  const context: ApplicationContext = {
    config: ConfigLoader,
    components,
    startupTime: 0, // 稍后更新
    profile,
    srcDir,
    verbose,

    registerHttpServer(server: HttpServer) {
      httpServer = server;
      if (verbose) {
        console.log(`🌐 [aiko-boot] HTTP server registered: ${server.type}`);
      }
    },

    getHttpServer() {
      return httpServer;
    },

    async run(port?: number) {
      if (!httpServer) {
        console.warn('[aiko-boot] No HTTP server registered. Did you include aiko-boot-starter-web?');
        return;
      }

      const serverPort = port ?? ConfigLoader.get<number>('server.port', 3001);
      
      return new Promise<void>((resolve) => {
        httpServer!.listen(serverPort, () => {
          if (verbose) {
            // aiko-boot Logo
            console.log(`
   ╭─────────────────────────────────────╮
   │                                     │
   │        ╭───────────╮                │
   │       ╱             ╲               │
   │      │   ◐     ◑    │              │
   │      │               │              │
   │       ╲     ◡       ╱               │
   │        ╰───────────╯                │
   │                                     │
   │      ▄▀█ █ █▄▀ █▀█ ─ █▄▄ █▀█ █▀█ ▀█▀│
   │      █▀█ █ █ █ █▄█ ─ █▄█ █▄█ █▄█  █ │
   │                                  ✨ │
   ╰─────────────────────────────────────╯
`);
            console.log(`   ✅ Application ready in ${context.startupTime}ms!`);
            console.log(`   🚀 Server running at http://localhost:${serverPort}\n`);
          }
          resolve();
        });
      });
    },
  };

  // 设置全局上下文（必须在 ApplicationReady 之前）
  setGlobalContext(context);

  // ========== Phase 7: ApplicationReady ==========
  // 确保全局上下文已设置后再触发ApplicationReady事件
  // 这样@OnApplicationReady监听器可以正确获取到上下文
  await ApplicationLifecycle.emit('ApplicationReady', verbose);

  // 更新启动时间
  const startupTime = Date.now() - startTime;
  context.startupTime = startupTime;

  if (verbose && !httpServer) {
    console.log(`\n✅ [aiko-boot] Application context ready in ${startupTime}ms!`);
  }

  return context;
}

/**
 * @deprecated 使用 createApp 代替
 */
export async function bootstrap(options: BootstrapOptions): Promise<ApplicationContext> {
  return createApp(options);
}

/**
 * 设置优雅关闭
 */
export function setupGracefulShutdown(): void {
  ApplicationLifecycle.setupGracefulShutdown();
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
          console.log(`📦 [aiko-boot] Loaded: ${file}`);
        }
      } catch (e: any) {
        console.error(`❌ [aiko-boot] Failed to load ${file}: ${e.message}`);
      }
    }
  }

  return modules;
}

/**
 * 判断是否为有效的模块文件
 */
function isModuleFile(filename: string): boolean {
  const ext = extname(filename);
  if (ext === '.js' || ext === '.mjs') {
    return !filename.endsWith('.d.js') && !filename.endsWith('.test.js');
  }
  if (ext === '.ts') {
    return !filename.endsWith('.d.ts') &&
           !filename.endsWith('.test.ts') &&
           !filename.endsWith('.spec.ts') &&
           !filename.startsWith('app.config') &&
           filename !== 'index.ts';
  }
  return false;
}
