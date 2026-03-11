/**
 * Web Auto Configuration - Spring Boot 风格自动配置
 * 
 * 自动创建 Express 服务器并注册到 ApplicationContext
 * 
 * @example
 * ```typescript
 * // app.config.ts
 * export default {
 *   server: {
 *     port: 3001,
 *     servlet: {
 *       contextPath: '/api',
 *     },
 *   },
 *   spring: {
 *     servlet: {
 *       multipart: {
 *         enabled: true,
 *         maxFileSize: '5MB',
 *         maxRequestSize: '20MB',
 *       },
 *     },
 *   },
 * };
 * ```
 */
import 'reflect-metadata';
import express, { Express } from 'express';
import {
  AutoConfiguration,
  ConfigurationProperties,
  OnApplicationReady,
  ConfigLoader,
  getApplicationContext,
  type HttpServer,
} from '@ai-partner-x/aiko-boot/boot';
import { Component } from '@ai-partner-x/aiko-boot';
import { createExpressRouter } from './express-router.js';
import { getControllerMetadata } from './decorators.js';
import { ExceptionHandlerRegistry, createErrorHandler } from '@ai-partner-x/aiko-boot/boot';

// ==================== Multipart Properties ====================

/**
 * Spring Boot 风格文件上传配置
 * 
 * 对应 Spring Boot 的 spring.servlet.multipart.* 配置
 * @see https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#appendix.application-properties.web
 */
@ConfigurationProperties('spring.servlet.multipart')
export class MultipartProperties {
  /** 是否启用 multipart 上传，默认 true (Spring Boot: spring.servlet.multipart.enabled) */
  enabled?: boolean = true;
  /** 单个上传文件最大大小，默认 1MB (Spring Boot: spring.servlet.multipart.max-file-size) */
  maxFileSize?: string = '1MB';
  /**
   * 整个 multipart 请求最大大小，默认 10MB (Spring Boot: spring.servlet.multipart.max-request-size)
   *
   * 注意：此配置项**不会**被框架自动强制执行于 multipart/form-data 请求。
   * 如需限制整体请求体大小，请通过 server.maxHttpPostSize 配置 JSON body-parser 的 limit，
   * 或在应用层自行添加请求体大小检查中间件。
   */
  maxRequestSize?: string = '10MB';
}

/**
 * 将 Spring Boot 风格的文件大小字符串（如 "1MB", "512KB"）转换为字节数。
 * 如果字符串格式无法识别，抛出 Error。
 */
export function parseSizeToBytes(size: string): number {
  const str = size.trim().toUpperCase();
  const units: Record<string, number> = {
    B:  1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };
  const match = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/.exec(str);
  if (!match) {
    throw new Error(
      `[aiko-web] Invalid size string "${size}" in spring.servlet.multipart config. ` +
      'Use formats like "1MB", "512KB", "10GB".',
    );
  }
  const value = parseFloat(match[1]);
  const unit = match[2] || 'B';
  return Math.round(value * (units[unit] ?? 1));
}

// ==================== Servlet / Server Properties ====================

/**
 * Servlet 配置（Spring Boot 风格）
 */
export class ServletProperties {
  /** 上下文路径，默认 /api (Spring Boot: server.servlet.context-path) */
  contextPath?: string = '/api';
}

/**
 * Web 服务器配置属性类（Spring Boot 风格）
 * 
 * 对应 Spring Boot 的 server.* 配置
 * @see https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html
 */
@ConfigurationProperties('server')
export class ServerProperties {
  /** 服务器端口，默认 3001 (Spring Boot: server.port) */
  port?: number = 3001;
  
  /** Servlet 配置 (Spring Boot: server.servlet.*) */
  servlet?: ServletProperties = new ServletProperties();
  
  /** 关闭模式: graceful | immediate (Spring Boot: server.shutdown) */
  shutdown?: 'graceful' | 'immediate' = 'graceful';
  
  /** 请求体大小限制 (类似 Spring Boot: server.tomcat.max-http-post-size) */
  maxHttpPostSize?: string = '10mb';
}

/** 全局服务器配置 */
let globalServerConfig: ServerProperties = new ServerProperties();

/**
 * 获取全局服务器配置
 */
export function getServerConfig(): ServerProperties {
  return globalServerConfig;
}

/**
 * 设置全局服务器配置
 */
export function setServerConfig(config: Partial<ServerProperties>): void {
  globalServerConfig = { ...globalServerConfig, ...config };
}

/**
 * Express HTTP 服务器
 */
export class ExpressHttpServer implements HttpServer {
  type = 'express';
  
  constructor(public instance: Express) {}
  
  listen(port: number, callback?: () => void): void {
    this.instance.listen(port, callback);
  }
}

/**
 * 通过 useExpressApp() 预注册的 Express 实例（在路由挂载前由用户配置好）
 */
let _preConfiguredApp: Express | null = null;

/**
 * Web 自动配置类
 * 
 * 自动创建 Express 服务器并注册到 ApplicationContext
 */
@AutoConfiguration({ order: 200 })
@Component()
export class WebAutoConfiguration {

  /**
   * 应用启动时创建 Express 服务器
   */
  @OnApplicationReady({ order: 50 })
  async configureExpress(): Promise<void> {
    const context = getApplicationContext();
    if (!context) {
      console.warn('[aiko-web] ApplicationContext not available');
      return;
    }

    // Spring Boot 风格配置读取
    const contextPath = ConfigLoader.get<string>('server.servlet.contextPath', '/api');
    const verbose = context.verbose;

    // JSON body-parser 大小限制来自 server.maxHttpPostSize（类 Spring Boot server.tomcat.max-http-post-size）
    const maxHttpPostSizeStr = ConfigLoader.get<string>('server.maxHttpPostSize', '10mb');
    let resolvedBodyLimit = '10mb';
    try {
      // Validate the configured value is parseable; keep the raw string for body-parser
      parseSizeToBytes(maxHttpPostSizeStr);
      resolvedBodyLimit = maxHttpPostSizeStr;
    } catch (e: any) {
      console.error(`[aiko-web] Misconfigured server.maxHttpPostSize: ${e.message}. Falling back to 10mb.`);
    }

    // 读取 multipart 文件上传配置 (spring.servlet.multipart.*)
    const multipartEnabled    = ConfigLoader.get<boolean>('spring.servlet.multipart.enabled', true);
    const maxFileSizeStr      = ConfigLoader.get<string>('spring.servlet.multipart.maxFileSize', '1MB');

    let multipartOptions: { maxFileSize: number } | undefined;
    if (multipartEnabled) {
      try {
        multipartOptions = {
          maxFileSize: parseSizeToBytes(maxFileSizeStr),
        };
      } catch (e: any) {
        console.error(`[aiko-web] Misconfigured spring.servlet.multipart.maxFileSize: ${e.message}. File size limits will not be enforced.`);
      }
    }

    // 创建 Express 应用，优先使用调用方通过 useExpressApp() 预注册的实例。
    // 预注册实例允许用户在路由挂载前注册自定义中间件（如 Auth、urlencoded 解析器）。
    const app = _preConfiguredApp ?? express();
    _preConfiguredApp = null; // 使用后立即清空，避免跨请求复用

    // CORS (默认启用)
    const corsModule = await import('cors');
    app.use(corsModule.default());
    
    // Body parser (JSON 请求体大小限制由 server.maxHttpPostSize 配置，默认 10mb)
    app.use(express.json({ limit: resolvedBodyLimit }));

    // 收集 Controller 并注册路由
    const controllers = context.components.get('controller') || [];
    const validControllers = controllers.filter((c: Function) => getControllerMetadata(c)) as (new (...args: any[]) => any)[];
    
    if (validControllers.length > 0) {
      app.use(createExpressRouter(validControllers, {
        prefix: contextPath,
        verbose,
        multipart: multipartOptions,
      }));
      if (verbose) {
        console.log(`📡 [aiko-web] Registered ${validControllers.length} controller(s)`);
      }
    } else {
      console.warn('[aiko-web] No controllers found!');
    }

    // 全局异常处理
    ExceptionHandlerRegistry.initialize();
    app.use(createErrorHandler());

    // 注册到应用上下文
    context.registerHttpServer(new ExpressHttpServer(app));
  }
}

/**
 * 获取 Express 实例（供高级用法）
 */
export function getExpressApp(): Express | null {
  const context = getApplicationContext();
  const server = context?.getHttpServer();
  if (server?.type === 'express') {
    return server.instance as Express;
  }
  return null;
}

/**
 * 预注册一个已配置好中间件的 Express 实例，供 WebAutoConfiguration 使用。
 *
 * 调用此函数后再调用 createApp()，WebAutoConfiguration 会在已有 Express 实例上
 * 追加 CORS、body-parser、路由和全局错误处理器，而不是创建全新实例。
 * 这样用户在路由挂载**之前**注册的中间件（如 auth、urlencoded 解析器）就能正常工作。
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { useExpressApp } from '@ai-partner-x/aiko-boot-starter-web';
 * import { createApp } from '@ai-partner-x/aiko-boot';
 *
 * const expressApp = express();
 * expressApp.use(express.urlencoded({ extended: true }));
 * expressApp.use((req, _res, next) => {
 *   (req as any).currentUser = { id: 1, name: 'Alice' };
 *   next();
 * });
 *
 * useExpressApp(expressApp);
 * const app = await createApp({ srcDir: __dirname });
 * await app.run();
 * ```
 */
export function useExpressApp(app: Express): void {
  _preConfiguredApp = app;
}
