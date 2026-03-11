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
  getRequestParts,
  getModelAttributes,
  getRequestAttributes,
  applyJsonFormat,
  type MultipartFile,
} from './decorators.js';
import { Router, IRouter } from 'express';
import { Container, injectAutowiredProperties } from '@ai-partner-x/aiko-boot/di/server';
import multer from 'multer';
import { writeFile } from 'fs/promises';

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
  /**
   * 文件上传限制（由 spring.servlet.multipart.* 配置驱动）
   * 未设置（undefined）时视为 multipart 功能已禁用，含 @RequestPart 的路由不会挂载 multer 中间件。
   * 单个文件大小限制（maxFileSize）由 multer limits.fileSize 控制。
   * 整个 multipart 请求的大小限制不由本 Router 自动配置；
   * 如需限制请在应用层通过 express.json / server.maxHttpPostSize 等中间件自行设置。
   */
  multipart?: {
    /** 单个文件最大字节数 (spring.servlet.multipart.max-file-size) */
    maxFileSize?: number;
  };
}

type MulterFile = {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type AnyRequest  = {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  file?: MulterFile;
  files?: Record<string, MulterFile[]>;
  [key: string]: any;
};
type AnyResponse = { json: (data: any) => void; status: (code: number) => AnyResponse };
type NextFn      = (err?: any) => void;
type Handler     = (req: AnyRequest, res: AnyResponse, next: NextFn) => void;

interface MiniRouter {
  get(path: string, ...handlers: any[]): void;
  post(path: string, ...handlers: any[]): void;
  put(path: string, ...handlers: any[]): void;
  delete(path: string, ...handlers: any[]): void;
  patch(path: string, ...handlers: any[]): void;
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
  const { prefix = '/api', verbose = true, instances = [], multipart } = options;

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
    registerController(router, ControllerClass, instance, prefix, verbose, multipart);
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
  verbose: boolean,
  multipart?: ExpressRouterOptions['multipart']
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

    const pathVars        = getPathVariables(ControllerClass.prototype, methodName);
    const bodyParams      = getRequestBody(ControllerClass.prototype, methodName);
    const queryParams     = getRequestParams(ControllerClass.prototype, methodName);
    const partParams      = getRequestParts(ControllerClass.prototype, methodName);
    const modelAttrs      = getModelAttributes(ControllerClass.prototype, methodName);
    const requestAttrs    = getRequestAttributes(ControllerClass.prototype, methodName);

    // Build multer middleware when the handler has @RequestPart parameters AND
    // multipart uploads are enabled (multipart !== undefined).
    // When multipart is undefined the feature is considered disabled and file
    // upload routes are left without multer so they return a normal 400/500 rather
    // than silently consuming unbounded memory.
    const uploadMiddleware = (Object.keys(partParams).length > 0 && multipart !== undefined)
      ? multer({
          storage: multer.memoryStorage(),
          limits: {
            fileSize: multipart?.maxFileSize,
          },
        }).fields(
          Object.values(partParams).map(p => ({ name: p.name, maxCount: 1 }))
        )
      : null;

    const handler: Handler = async (req, res, _next) => {
      const start = Date.now();
      try {
        const controllerMethod = instance[methodName];

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

        // 注入 @RequestPart (multipart file upload)
        for (const [idx, part] of Object.entries(partParams)) {
          const { name } = part as { name: string };
          const multerFiles = req.files as Record<string, MulterFile[]> | undefined;
          const multerFile = multerFiles?.[name]?.[0];
          if (multerFile) {
            args[Number(idx)] = createMultipartFile(multerFile);
          }
        }

        // 注入 @ModelAttribute (合并 query + body 表单字段)
        for (const idx of Object.keys(modelAttrs)) {
          const queryObj = req.query || {};
          const bodyObj  = (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body))
            ? req.body
            : {};
          args[Number(idx)] = { ...queryObj, ...bodyObj };
        }

        // 注入 @RequestAttribute (Express req 对象上的自定义属性)
        for (const [idx, attr] of Object.entries(requestAttrs)) {
          const { name } = attr as { name: string };
          args[Number(idx)] = req[name];
        }

        const result = await controllerMethod.apply(instance, args);

        if (verbose) {
          console.log(`[aiko-boot] ← ${httpMethod.toUpperCase()} ${fullPath} 200 (${Date.now() - start}ms)`);
        }

        res.json({ success: true, data: applyJsonFormat(result) });
      } catch (error: any) {
        if (verbose) {
          console.error(`[aiko-boot] ← ${httpMethod.toUpperCase()} ${fullPath} 400 (${Date.now() - start}ms) ${error.message}`);
        }
        res.status(400).json({ success: false, error: error.message });
      }
    };

    if (uploadMiddleware) {
      router[httpMethod](fullPath, uploadMiddleware, handler);
    } else {
      router[httpMethod](fullPath, handler);
    }
  }
}

/**
 * Create a Spring Boot compatible MultipartFile from a multer file object.
 */
function createMultipartFile(multerFile: MulterFile): MultipartFile {
  return {
    getName: () => multerFile.fieldname,
    getOriginalFilename: () => multerFile.originalname,
    getContentType: () => multerFile.mimetype || null,
    getSize: () => multerFile.size,
    getBytes: () => multerFile.buffer,
    isEmpty: () => multerFile.size === 0,
    transferTo: async (dest: string) => {
      await writeFile(dest, multerFile.buffer);
    },
  };
}
