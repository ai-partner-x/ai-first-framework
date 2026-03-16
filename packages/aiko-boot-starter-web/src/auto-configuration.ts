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
 *     prefix: '/api',
 *     cors: true,
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

/**
 * Servlet 配置（Spring Boot 风格）
 */
export class ServletProperties {
  /** 上下文路径，默认 /api */
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

    // 创建 Express 应用
    const app = express();

    // CORS (默认启用)
    const corsModule = await import('cors');
    app.use(corsModule.default());

    // Body parser
    app.use(express.json({ limit: maxHttpPostSize }));

    // 注册到应用上下文（在路由注册之前，允许添加自定义中间件）
    context.registerHttpServer(new ExpressHttpServer(app));

    // 收集 Controller 并注册路由
    const controllers = context.components.get('controller') || [];
    const validControllers = controllers.filter((c: Function) => getControllerMetadata(c)) as (new (...args: any[]) => any)[];

    if (validControllers.length > 0) {
      app.use(createExpressRouter(validControllers, { prefix: contextPath, verbose }));
      if (verbose) {
        console.log(`📡 [aiko-web] Registered ${validControllers.length} controller(s)`);
      }
    } else {
      console.warn('[aiko-web] No controllers found!');
    }

    // 全局异常处理
    ExceptionHandlerRegistry.initialize();
    app.use(createErrorHandler());
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
