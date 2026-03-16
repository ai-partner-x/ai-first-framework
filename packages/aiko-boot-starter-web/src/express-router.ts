/**
 * Express Router - 将 @RestController 装饰器自动注册为 Express 路由
 *
 * @example
 * ```typescript
 * // 方式1: 自动扫描 + DI 注入（推荐）
 * import express from 'express';
 * import { createExpressRouter } from '@ai-partner-x/aiko-boot-starter-web';
 * import * as controllers from './controller/index.js';
 *
 * const app = express();
 * app.use(express.json());
 * app.use(createExpressRouter(controllers));
 *
 * // 方式2: 手动传入实例（无 DI 场景）
 * app.use(createExpressRouter([UserController], { instances: [userController] }));
 * ```
 */
import {
  getControllerMetadata,
  getRequestMappings,
  getPathVariables,
  getRequestBody,
  getRequestParams,
  getRequestHeaders,
} from './decorators.js';
import { Router, IRouter } from 'express';
import { Container, injectAutowiredProperties } from '@ai-partner-x/aiko-boot/di/server';

export interface ExpressRouterOptions {
  /**
   * Controller 实例列表（仅在不使用 DI 时需要）
   * 不传此参数时，框架会通过 DI Container 自动解析 Controller 及其依赖
   */
  instances?: Record<string, (...args: any[]) => Promise<any>>[];
  /** API 路径前缀，默认 "/api" */
  prefix?: string;
  /** 是否打印路由注册日志，默认 true */
  verbose?: boolean;
}

type AnyRequest  = { params: Record<string, string>; query: Record<string, string>; body: any };
type AnyResponse = { json: (data: any) => void; status: (code: number) => AnyResponse };
type NextFn      = (err?: any) => void;
type Handler     = (req: AnyRequest, res: AnyResponse, next: NextFn) => void;

interface MiniRouter {
  get(path: string, handler: Handler): void;
  post(path: string, handler: Handler): void;
  put(path: string, handler: Handler): void;
  delete(path: string, handler: Handler): void;
  patch(path: string, handler: Handler): void;
}

/**
 * 创建 Express Router，自动注册所有 @RestController 路由
 * 
 * @param controllers - Controller 类数组，或模块导出对象 (import * as controllers)
 */
export function createExpressRouter(
  controllers: (new (...args: any[]) => any)[] | Record<string, any>,
  options: ExpressRouterOptions = {}
): IRouter {
  const { prefix = '/api', verbose = true, instances = [] } = options;

  const router = Router();

  // 支持数组和模块导出两种形式
  const controllerClasses = Array.isArray(controllers)
    ? controllers
    : Object.values(controllers).filter(
        (exported): exported is new (...args: any[]) => any =>
          typeof exported === 'function' && exported.prototype
      );

  controllerClasses.forEach((ControllerClass, i) => {
    // 优先使用传入的实例，否则通过 DI Container 解析
    const instance = instances[i] ?? resolveController(ControllerClass);
    registerController(router, ControllerClass, instance, prefix, verbose);
  });

  return router;
}

/**
 * 通过 DI Container 解析 Controller 及其依赖
 */
function resolveController(ControllerClass: new (...args: any[]) => any): any {
  try {
    const instance = Container.resolve(ControllerClass);
    // 确保 @Autowired 属性被注入
    injectAutowiredProperties(instance);
    return instance;
  } catch (e: any) {
    // DI 解析失败时回退到直接实例化（无依赖场景）
    console.warn(`[aiko-boot] DI resolve failed for ${ControllerClass.name}: ${e.message}`);
    const instance = new ControllerClass();
    injectAutowiredProperties(instance);
    return instance;
  }
}

function registerController(
  router: MiniRouter,
  ControllerClass: new (...args: any[]) => any,
  instance: Record<string, (...args: any[]) => Promise<any>>,
  prefix: string,
  verbose: boolean
) {
  const controllerMeta = getControllerMetadata(ControllerClass);
  if (!controllerMeta) {
    console.warn(`[aiko-boot] No @RestController metadata found on ${ControllerClass.name}`);
    return;
  }

  const basePath = controllerMeta.path || '';
  const mappings = getRequestMappings(ControllerClass);

  for (const [methodName, mapping] of Object.entries(mappings)) {
    const httpMethod = (mapping.method || 'GET').toLowerCase() as keyof MiniRouter;
    const fullPath = prefix + basePath + (mapping.path || '');

    if (verbose) {
      console.log(`[aiko-boot] ${httpMethod.toUpperCase().padEnd(7)} ${fullPath}`);
    }

    const handler: Handler = async (req, res, _next) => {
      const start = Date.now();
      try {
        const controllerMethod = instance[methodName];
        const pathVars   = getPathVariables(ControllerClass.prototype, methodName);
        const bodyParams = getRequestBody(ControllerClass.prototype, methodName);
        const queryParams = getRequestParams(ControllerClass.prototype, methodName);
        const headerParams = getRequestHeaders(ControllerClass.prototype, methodName);

        const paramCount = controllerMethod.length;
        const args: any[] = new Array(paramCount);

        // 注入 @PathVariable
        for (const [idx, varName] of Object.entries(pathVars)) {
          args[Number(idx)] = req.params[varName as string];
        }

        // 注入 @RequestBody
        for (const idx of Object.keys(bodyParams)) {
          args[Number(idx)] = req.body;
        }

        // 注入 @RequestParam / @QueryParam
        for (const [idx, param] of Object.entries(queryParams)) {
          const { name } = param as { name: string; required: boolean };
          args[Number(idx)] = req.query[name];
        }

        // 注入 @RequestHeader
        for (const [idx, param] of Object.entries(headerParams)) {
          const { name } = param as { name: string; required: boolean };
          const headerValue = req.headers[name.toLowerCase()]; // Headers are case-insensitive
          if (!headerValue && param.required) {
            throw new Error(`Header "${name}" is required but not provided.`);
          }
          args[Number(idx)] = headerValue || '';
        }

        const result = await controllerMethod.apply(instance, args);

        if (verbose) {
          console.log(`[aiko-boot] ← ${httpMethod.toUpperCase()} ${fullPath} 200 (${Date.now() - start}ms)`);
        }

        res.json({ success: true, data: result });
      } catch (error: any) {
        if (verbose) {
          console.error(`[aiko-boot] ← ${httpMethod.toUpperCase()} ${fullPath} 400 (${Date.now() - start}ms) ${error.message}`);
        }
        res.status(400).json({ success: false, error: error.message });
      }
    };

    router[httpMethod](fullPath, handler);
  }
}
