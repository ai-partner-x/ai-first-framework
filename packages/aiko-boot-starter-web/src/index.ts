/**
 * @ai-partner-x/aiko-boot-starter-web
 * 
 * Spring Boot Style Web Starter with HTTP decorators and Express router
 * 
 * Features:
 * - Auto-configuration based on server.* config
 * - Spring Boot style decorators (@RestController, @GetMapping, etc.)
 * - Express router auto-generation
 * - Feign-style API client
 */

// Export decorators
export {
  RestController,
  GetMapping,
  PostMapping,
  PutMapping,
  DeleteMapping,
  PatchMapping,
  RequestMapping,
  PathVariable,
  RequestParam,
  QueryParam,
  RequestBody,
  RequestPart,
  ModelAttribute,
  RequestAttribute,
  JsonFormat,
  convertModelAttributes,
  applyJsonFormat,
  formatDate,
  getControllerMetadata,
  getRequestMappings,
  getPathVariables,
  getRequestParams,
  getRequestBody,
  getRequestParts,
  getModelAttributes,
  getRequestAttributes,
  getJsonFormatFields,
  type RestControllerOptions,
  type RequestMappingOptions,
  type HttpMethod,
  type MultipartFile,
  type JsonFormatOptions,
  type JsonFormatShape,
} from './decorators.js';

// Export Express router
export { createExpressRouter, type ExpressRouterOptions } from './express-router.js';

// Re-export createApp from boot-starter for convenience
export { 
  createApp,
  type AppOptions,
  type ApplicationContext,
  type HttpServer,
} from '@ai-partner-x/aiko-boot/boot';

// Export Feign-style API client (with reflect-metadata)
export {
  ApiContract,
  createApiClient,
  type ApiClientOptions,
} from './client.js';

// Export lite API client (no reflect-metadata, SSR safe)
export {
  createApiClientFromMeta,
  type ApiMetadata,
} from './client-lite.js';

// Export Auto Configuration
export {
  WebAutoConfiguration,
  ServerProperties,
  ServletProperties,
  MultipartProperties,
  parseSizeToBytes,
  getServerConfig,
  setServerConfig,
  getExpressApp,
  useExpressApp,
  ExpressHttpServer,
} from './auto-configuration.js';

// Config Augmentation (扩展 @ai-partner-x/aiko-boot 的 AppConfig)
import './config-augment.js';

// Re-export @Async and related helpers from @ai-partner-x/aiko-boot for convenient one-stop import
export {
  Async,
  isAsync,
  getAsyncOptions,
  type AsyncOptions,
} from '@ai-partner-x/aiko-boot';

