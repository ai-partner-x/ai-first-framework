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
  getRequestHeaders,
  getModelAttributes,
  getRequestAttributes,
  applyJsonFormat,
  type MultipartFile,
} from './decorators.js';
import { Router, IRouter, type Response as ExpressResponse } from 'express';
import { Container, injectAutowiredProperties } from '@ai-partner-x/aiko-boot/di/server';
import multer from 'multer';
import { writeFile } from 'fs/promises';

/** Default maximum file size (1 MB) applied when multipart is enabled but maxFileSize is not configured. */
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024;

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
   * 注意：框架不支持整个 multipart 请求的大小限制，如需限制请在应用层通过 Express 中间件自行实现。
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

type AnyRequest = {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  file?: MulterFile;
  files?: Record<string, MulterFile[]>;
  [key: string]: any;
};

type AnyResponse = Pick<ExpressResponse, 'json' | 'status' | 'set' | 'send'>;

type NextFn = (err?: any) => void;

type Handler = (req: AnyRequest, res: AnyResponse, next: NextFn) => void | Promise<void>;

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
    const headerParams    = getRequestHeaders(ControllerClass.prototype, methodName);
    const partParams      = getRequestParts(ControllerClass.prototype, methodName);
    const modelAttrs      = getModelAttributes(ControllerClass.prototype, methodName);
    const requestAttrs    = getRequestAttributes(ControllerClass.prototype, methodName);

    // Build multer middleware when the handler has @RequestPart parameters AND
    // multipart uploads are enabled (multipart !== undefined).
    // Fail fast during route registration if @RequestPart is used but multipart
    // is not configured, so the error is clear rather than silently producing
    // undefined parameters at runtime.
    const hasRequestParts = Object.keys(partParams).length > 0;

    if (hasRequestParts && multipart === undefined) {
      throw new Error(
        `[aiko-boot] Multipart processing is disabled but route ` +
        `${ControllerClass.name}.${String(methodName)} uses @RequestPart. ` +
        'Please enable multipart support (e.g. spring.servlet.multipart.enabled=true) ' +
        'and configure ExpressRouterOptions.multipart.',
      );
    }

    const uploadMiddleware = (hasRequestParts && multipart !== undefined)
      ? (() => {
          const partParamList = Object.values(partParams);
          const seenNames = new Map<string, number>();
          for (const p of partParamList) {
            const count = (seenNames.get(p.name) ?? 0) + 1;
            if (count > 1) {
              throw new Error(
                `Duplicate @RequestPart name '${p.name}' in ` +
                `${ControllerClass.name}.${String(methodName)}. ` +
                'Each @RequestPart on a method must have a unique name.',
              );
            }
            seenNames.set(p.name, count);
          }
          return multer({
            storage: multer.memoryStorage(),
            limits: {
              // Default to DEFAULT_MAX_FILE_SIZE if maxFileSize is not specified, to avoid unbounded memory usage.
              fileSize: multipart?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
            },
          }).fields(partParamList.map(p => ({ name: p.name, maxCount: 1 })));
        })()
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

        // 注入 @RequestHeader
        for (const [idx, param] of Object.entries(headerParams)) {
          const { name } = param as { name: string; required: boolean };
          const headerValue = req.headers[name.toLowerCase()]; // Headers are case-insensitive
          if (!headerValue && param.required) {
            throw new Error(`Header "${name}" is required but not provided.`);
          }
          args[Number(idx)] = headerValue || '';
        }

        // 注入 @RequestPart (multipart file upload)
        for (const [idx, part] of Object.entries(partParams)) {
          const { name } = part as { name: string };
          const multerFiles = req.files as Record<string, MulterFile[]> | undefined;
          const multerFile = multerFiles?.[name]?.[0];
          if (multerFile) {
            // 文件部分：转换为 Spring 兼容的 MultipartFile
            args[Number(idx)] = createMultipartFile(multerFile);
          } else {
            // 非文件部分：从 multipart 表单的字段中读取 (req.body)
            const bodyObj =
              req.body &&
              typeof req.body === 'object' &&
              !Buffer.isBuffer(req.body)
                ? (req.body as Record<string, unknown>)
                : undefined;
            if (bodyObj && Object.prototype.hasOwnProperty.call(bodyObj, name)) {
              args[Number(idx)] = bodyObj[name];
            }
          }
        }

        // 注入 @ModelAttribute (合并 query + body 表单字段)
        for (const idx of Object.keys(modelAttrs)) {
          const queryObj = req.query || {};
          const bodyObj = (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && !Array.isArray(req.body))
            ? req.body
            : {};
          if (Array.isArray(req.body)) {
            console.warn('[aiko-boot] @ModelAttribute received array body. Only object types are supported. Using empty object.');
          }
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
