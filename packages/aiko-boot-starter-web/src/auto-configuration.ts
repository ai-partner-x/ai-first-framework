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
  /** 整个 multipart 请求最大大小，默认 10MB (Spring Boot: spring.servlet.multipart.max-request-size) */
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
  /** 文件上传配置 (Spring Boot: spring.servlet.multipart.*) */
  multipart?: MultipartProperties = new MultipartProperties();
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
    const maxHttpPostSize = ConfigLoader.get<string>('server.maxHttpPostSize', '10mb');
    const verbose = context.verbose;

    // 读取 multipart 文件上传配置 (spring.servlet.multipart.*)
    const multipartEnabled    = ConfigLoader.get<boolean>('spring.servlet.multipart.enabled', true);
    const maxFileSizeStr      = ConfigLoader.get<string>('spring.servlet.multipart.maxFileSize', '1MB');
    const maxRequestSizeStr   = ConfigLoader.get<string>('spring.servlet.multipart.maxRequestSize', '10MB');
    // maxRequestSize 直接用作 Express body-parser 的 limit
    const resolvedBodyLimit = maxRequestSizeStr;

    let multipartOptions: { maxFileSize: number; maxRequestSize: number } | undefined;
    if (multipartEnabled) {
      try {
        multipartOptions = {
          maxFileSize:    parseSizeToBytes(maxFileSizeStr),
          maxRequestSize: parseSizeToBytes(maxRequestSizeStr),
        };
      } catch (e: any) {
        console.error(`[aiko-web] Misconfigured spring.servlet.multipart size: ${e.message}. File size limits will not be enforced.`);
      }
    }

    // 创建 Express 应用
    const app = express();

    // CORS (默认启用)
    const corsModule = await import('cors');
    app.use(corsModule.default());
    
    // Body parser (limit from spring.servlet.multipart.maxRequestSize > server.maxHttpPostSize)
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
