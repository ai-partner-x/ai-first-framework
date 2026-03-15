/**
 * Spring Boot Style API Decorators for Next.js
 * Web layer (MVC) - completely aligned with Spring Boot
 */
import 'reflect-metadata';
import { Injectable, Singleton, inject, injectAutowiredProperties } from '@ai-partner-x/aiko-boot/di/server';

// Metadata keys (使用字符串而非 Symbol，以便跨 ESM 模块共享)
const CONTROLLER_METADATA = 'aiko-boot:controller';
const REQUEST_MAPPING_METADATA = 'aiko-boot:requestMapping';
const PATH_VARIABLE_METADATA = 'aiko-boot:pathVariable';
const REQUEST_PARAM_METADATA = 'aiko-boot:requestParam';
const REQUEST_BODY_METADATA = 'aiko-boot:requestBody';
const REQUEST_HEADER_METADATA = 'aiko-boot:requestHeader';

/** 导出供 ApiContract 复用的元数据 key */
export { CONTROLLER_METADATA, REQUEST_MAPPING_METADATA };

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * @RestController options (like Spring Boot @RestController + @RequestMapping)
 */
export interface RestControllerOptions {
  /** Base path for all routes in this controller */
  path?: string;
  /** Controller description */
  description?: string;
}

/**
 * @RequestMapping options
 */
export interface RequestMappingOptions {
  /** Route path */
  path?: string;
  /** HTTP method */
  method?: HttpMethod;
  /** Operation description */
  description?: string;
}

/**
 * @RestController - Mark a class as REST controller
 * Equivalent to Spring Boot: @RestController + @RequestMapping("/api/users")
 * Supports @Autowired property injection
 */
export function RestController(options: RestControllerOptions = {}) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    // Save controller metadata
    Reflect.defineMetadata(CONTROLLER_METADATA, {
      ...options,
      className: target.name,
    }, target);
    
    // Auto inject constructor dependencies
    const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
    paramTypes.forEach((type: any, index: number) => {
      inject(type)(target, undefined as any, index);
    });
    
    // Apply DI decorators
    Injectable()(target);
    Singleton()(target);
    
    // 包装构造函数，支持 @Autowired 属性注入
    const originalConstructor = target;
    const newConstructor = function (this: any, ...args: any[]) {
      const instance = new (originalConstructor as any)(...args);
      injectAutowiredProperties(instance);
      return instance;
    } as unknown as T;
    
    newConstructor.prototype = originalConstructor.prototype;
    Object.setPrototypeOf(newConstructor, originalConstructor);
    
    // 复制 metadata
    const metadataKeys = Reflect.getMetadataKeys(originalConstructor);
    metadataKeys.forEach(key => {
      const value = Reflect.getMetadata(key, originalConstructor);
      Reflect.defineMetadata(key, value, newConstructor);
    });
    
    return newConstructor;
  };
}

/**
 * @GetMapping - Map GET request (like Spring Boot @GetMapping)
 */
export function GetMapping(path: string = '', description?: string) {
  return RequestMapping({ path, method: 'GET', description });
}

/**
 * @PostMapping - Map POST request (like Spring Boot @PostMapping)
 */
export function PostMapping(path: string = '', description?: string) {
  return RequestMapping({ path, method: 'POST', description });
}

/**
 * @PutMapping - Map PUT request (like Spring Boot @PutMapping)
 */
export function PutMapping(path: string = '', description?: string) {
  return RequestMapping({ path, method: 'PUT', description });
}

/**
 * @DeleteMapping - Map DELETE request (like Spring Boot @DeleteMapping)
 */
export function DeleteMapping(path: string = '', description?: string) {
  return RequestMapping({ path, method: 'DELETE', description });
}

/**
 * @PatchMapping - Map PATCH request (like Spring Boot @PatchMapping)
 */
export function PatchMapping(path: string = '', description?: string) {
  return RequestMapping({ path, method: 'PATCH', description });
}

/**
 * @RequestMapping - Generic request mapping (like Spring Boot @RequestMapping)
 */
export function RequestMapping(options: RequestMappingOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const mappings = Reflect.getMetadata(REQUEST_MAPPING_METADATA, target.constructor) || {};
    mappings[propertyKey] = options;
    Reflect.defineMetadata(REQUEST_MAPPING_METADATA, mappings, target.constructor);
    return descriptor;
  };
}

/**
 * @PathVariable - Extract path variable (like Spring Boot @PathVariable)
 */
export function PathVariable(name?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const pathVars = Reflect.getMetadata(PATH_VARIABLE_METADATA, target, propertyKey) || {};
    pathVars[parameterIndex] = name || 'param' + parameterIndex;
    Reflect.defineMetadata(PATH_VARIABLE_METADATA, pathVars, target, propertyKey);
  };
}

/**
 * @RequestParam - Extract query parameter (like Spring Boot @RequestParam)
 */
export function RequestParam(name?: string, required: boolean = false) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const requestParams = Reflect.getMetadata(REQUEST_PARAM_METADATA, target, propertyKey) || {};
    requestParams[parameterIndex] = { name: name || 'param' + parameterIndex, required };
    Reflect.defineMetadata(REQUEST_PARAM_METADATA, requestParams, target, propertyKey);
  };
}

/**
 * @QueryParam - Alias for @RequestParam
 */
export const QueryParam = RequestParam;

/**
 * @RequestHeader - Extract HTTP header (like Spring Boot @RequestHeader)
 */
export function RequestHeader(name?: string, required: boolean = false) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const requestHeaders = Reflect.getMetadata(REQUEST_HEADER_METADATA, target, propertyKey) || {};
    requestHeaders[parameterIndex] = { name: name || 'header' + parameterIndex, required };
    Reflect.defineMetadata(REQUEST_HEADER_METADATA, requestHeaders, target, propertyKey);
  };
}

/**
 * @RequestBody - Extract request body (like Spring Boot @RequestBody)
 */
export function RequestBody() {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const requestBody = Reflect.getMetadata(REQUEST_BODY_METADATA, target, propertyKey) || {};
    requestBody[parameterIndex] = true;
    Reflect.defineMetadata(REQUEST_BODY_METADATA, requestBody, target, propertyKey);
  };
}

// ==================== Metadata Getters ====================

export function getControllerMetadata(target: any): RestControllerOptions | undefined {
  return Reflect.getMetadata(CONTROLLER_METADATA, target);
}

export function getRequestMappings(target: any): Record<string, RequestMappingOptions> {
  return Reflect.getMetadata(REQUEST_MAPPING_METADATA, target) || {};
}

export function getPathVariables(target: any, methodName: string): Record<number, string> {
  return Reflect.getMetadata(PATH_VARIABLE_METADATA, target, methodName) || {};
}

export function getRequestParams(target: any, methodName: string): Record<number, { name: string; required: boolean }> {
  return Reflect.getMetadata(REQUEST_PARAM_METADATA, target, methodName) || {};
}

export function getRequestBody(target: any, methodName: string): Record<number, boolean> {
  return Reflect.getMetadata(REQUEST_BODY_METADATA, target, methodName) || {};
}

export function getRequestHeaders(target: any, methodName: string): Record<number, { name: string; required: boolean }> {
  return Reflect.getMetadata(REQUEST_HEADER_METADATA, target, methodName) || {};
}
