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
  RequestHeader,
  getControllerMetadata,
  getRequestMappings,
  getPathVariables,
  getRequestParams,
  getRequestBody,
  getRequestHeaders,
  type RestControllerOptions,
  type RequestMappingOptions,
  type HttpMethod,
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
  getServerConfig,
  setServerConfig,
  getExpressApp,
  ExpressHttpServer,
} from './auto-configuration.js';

// Config Augmentation (扩展 @ai-partner-x/aiko-boot 的 AppConfig)
import './config-augment.js';

