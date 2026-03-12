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
const REQUEST_PART_METADATA = 'aiko-boot:requestPart';
const MODEL_ATTRIBUTE_METADATA = 'aiko-boot:modelAttribute';
const REQUEST_ATTRIBUTE_METADATA = 'aiko-boot:requestAttribute';
const JSON_FORMAT_METADATA = 'aiko-boot:jsonFormat';

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
 * @RequestBody - Extract request body (like Spring Boot @RequestBody)
 */
export function RequestBody() {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const requestBody = Reflect.getMetadata(REQUEST_BODY_METADATA, target, propertyKey) || {};
    requestBody[parameterIndex] = true;
    Reflect.defineMetadata(REQUEST_BODY_METADATA, requestBody, target, propertyKey);
  };
}

// ==================== Multipart / File Upload ====================

/**
 * MultipartFile - Spring Boot compatible interface for uploaded files.
 * Equivalent to Java: org.springframework.web.multipart.MultipartFile
 *
 * @example
 * @PostMapping('/upload')
 * async upload(@RequestPart('file') file: MultipartFile) {
 *   const bytes = file.getBytes();
 *   await file.transferTo('/tmp/uploaded_' + file.getOriginalFilename());
 *   return { filename: file.getOriginalFilename(), size: file.getSize() };
 * }
 */
export interface MultipartFile {
  /** Returns the name of the parameter in the multipart form. */
  getName(): string;
  /** Returns the original filename in the client's filesystem. */
  getOriginalFilename(): string;
  /** Returns the content type of the file, or null if not defined. */
  getContentType(): string | null;
  /** Returns the size of the file in bytes. */
  getSize(): number;
  /** Returns the contents of the file as a Buffer (byte array). */
  getBytes(): Buffer;
  /** Returns whether the uploaded file is empty. */
  isEmpty(): boolean;
  /** Transfer the received file to the given destination path. */
  transferTo(dest: string): Promise<void>;
}

/**
 * @RequestPart - Extract a part from a multipart/form-data request (like Spring Boot @RequestPart)
 *
 * Used with file uploads. Multer middleware is applied to the route only when multipart uploads
 * are enabled/configured (e.g. via `ExpressRouterOptions.multipart` or framework auto-configuration
 * such as `WebAutoConfiguration` / `spring.servlet.multipart.enabled`). If multipart support is not
 * configured/enabled for a route that uses `@RequestPart`, the router will fail fast and throw during
 * route registration instead of injecting an undefined parameter.
 *
 * @param name - The name of the form field (defaults to 'file')
 *
 * @example
 * @PostMapping('/upload')
 * async upload(@RequestPart('avatar') avatar: MultipartFile) { ... }
 */
export function RequestPart(name?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const requestParts = Reflect.getMetadata(REQUEST_PART_METADATA, target, propertyKey) || {};
    requestParts[parameterIndex] = { name: name || 'file' };
    Reflect.defineMetadata(REQUEST_PART_METADATA, requestParts, target, propertyKey);
  };
}

// ==================== Model Binding & Request Attributes ====================

/**
 * @ModelAttribute - Bind all request query parameters and form body fields into a
 * plain object parameter (like Spring Boot @ModelAttribute).
 *
 * The decorated parameter receives a merged flat object of `req.query` and `req.body`
 * (suitable for URL query-string search DTOs and `application/x-www-form-urlencoded`
 * form submissions).  The optional `name` argument is stored for documentation /
 * introspection purposes but is not used during binding — the entire merged object is
 * always passed.
 *
 * @param name - Optional logical name (mirrors Spring's model attribute name)
 *
 * @example
 * @GetMapping('/search')
 * async search(@ModelAttribute() query: SearchDto) {
 *   // query.keyword, query.page, query.size … all populated from URL params
 *   return this.userService.search(query);
 * }
 *
 * @example
 * @PostMapping('/register')
 * async register(@ModelAttribute('user') dto: RegisterDto) {
 *   // dto populated from application/x-www-form-urlencoded body
 *   return this.authService.register(dto);
 * }
 */
export function ModelAttribute(name?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const modelAttrs = Reflect.getMetadata(MODEL_ATTRIBUTE_METADATA, target, propertyKey) || {};
    modelAttrs[parameterIndex] = { name: name || '' };
    Reflect.defineMetadata(MODEL_ATTRIBUTE_METADATA, modelAttrs, target, propertyKey);
  };
}

/**
 * Type conversion helper for @ModelAttribute parameters
 * 
 * Automatically converts string values to appropriate types (number, boolean) when possible.
 * This helper reduces manual type conversion in controller methods.
 * 
 * @example
 * // Without helper (manual conversion required)
 * @GetMapping('/search')
 * async search(@ModelAttribute() query: SearchDto) {
 *   return {
 *     page: Number(query.page ?? 1),
 *     size: Number(query.size ?? 10),
 *     active: query.active === 'true',
 *   };
 * }
 * 
 * // With helper (automatic conversion)
 * @GetMapping('/search')
 * async search(@ModelAttribute() query: SearchDto) {
 *   const parsed = convertModelAttributes(query);
 *   return {
 *     page: parsed.page ?? 1,
 *     size: parsed.size ?? 10,
 *     active: parsed.active ?? false,
 *   };
 * }
 */
export function convertModelAttributes<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Try to convert to number
      const numValue = Number(value);
      if (!isNaN(numValue) && value.trim() !== '') {
        result[key] = numValue;
      } else if (value.toLowerCase() === 'true') {
        result[key] = true;
      } else if (value.toLowerCase() === 'false') {
        result[key] = false;
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * @RequestAttribute - Extract a named attribute set on the Express request object
 * by upstream middleware (like Spring Boot @RequestAttribute).
 *
 * Middlewares typically attach custom properties directly to the `req` object
 * (e.g. `req.user`, `req.tenantId`).  This decorator reads `(req as any)[name]`
 * and injects the value into the controller parameter.
 *
 * @param name - The property name on the Express request object
 *
 * @example
 * // In Express middleware:
 * // app.use((req, res, next) => { (req as any).currentUser = { id: 1 }; next(); });
 *
 * @GetMapping('/profile')
 * async profile(@RequestAttribute('currentUser') user: User) {
 *   return user;
 * }
 */
export function RequestAttribute(name: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const reqAttrs = Reflect.getMetadata(REQUEST_ATTRIBUTE_METADATA, target, propertyKey) || {};
    reqAttrs[parameterIndex] = { name };
    Reflect.defineMetadata(REQUEST_ATTRIBUTE_METADATA, reqAttrs, target, propertyKey);
  };
}

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

export function getRequestParts(target: any, methodName: string): Record<number, { name: string }> {
  return Reflect.getMetadata(REQUEST_PART_METADATA, target, methodName) || {};
}

export function getModelAttributes(target: any, methodName: string): Record<number, { name: string }> {
  return Reflect.getMetadata(MODEL_ATTRIBUTE_METADATA, target, methodName) || {};
}

export function getRequestAttributes(target: any, methodName: string): Record<number, { name: string }> {
  return Reflect.getMetadata(REQUEST_ATTRIBUTE_METADATA, target, methodName) || {};
}

// Token keys used by formatDate, sorted by length descending.
// Pre-computed at module load so formatDate never re-allocates or re-sorts on each call.
// The comparison inside formatDate is case-sensitive, so 'MM' (month) and
// 'mm' (minute) are never confused even though they share the same length.
const SORTED_DATE_TOKEN_KEYS: ReadonlyArray<string> = [
  'yyyy', 'SSS', 'yy', 'MM', 'dd', 'HH', 'mm', 'ss', 'M', 'd', 'H', 'm', 's', 'S',
];

/**
 * Serialization shape for @JsonFormat.
 * - `STRING` (default): serialize Date as a formatted string (uses `pattern`)
 * - `NUMBER`: serialize Date as epoch milliseconds (Unix timestamp × 1000)
 * 
 * @default 'STRING'
 */
export type JsonFormatShape = 'STRING' | 'NUMBER';

/**
 * Options for the @JsonFormat decorator.
 * Mirrors Jackson's @JsonFormat annotation in Spring Boot.
 */
export interface JsonFormatOptions {
  /**
   * Java SimpleDateFormat style pattern used when shape is STRING.
   * Supported tokens: yyyy yy MM M dd d HH H mm m ss s SSS S
   * @example 'yyyy-MM-dd HH:mm:ss'
   * @example 'yyyy/MM/dd'
   */
  pattern?: string;
  /**
   * IANA timezone identifier or fixed-offset string.
   * When omitted the local (process) timezone is used.
   * @example 'UTC'
   * @example 'Asia/Shanghai'
   * @example 'America/New_York'
   */
  timezone?: string;
  /**
   * How the value should be serialized.
   * Defaults to 'STRING'.
   */
  shape?: JsonFormatShape;
}

/**
 * @JsonFormat – Controls how a property is serialized in JSON responses.
 *
 * Equivalent to Jackson's `@JsonFormat` annotation in Spring Boot.
 * Most commonly used to format `Date` properties into human-readable strings.
 *
 * @example
 * ```typescript
 * class UserDto {
 *   \@JsonFormat({ pattern: 'yyyy-MM-dd HH:mm:ss', timezone: 'Asia/Shanghai' })
 *   createTime?: Date;
 *
 *   \@JsonFormat({ pattern: 'yyyy-MM-dd' })
 *   birthday?: Date;
 *
 *   \@JsonFormat({ shape: 'NUMBER' })
 *   updatedAt?: Date;
 * }
 * ```
 */
export function JsonFormat(options: JsonFormatOptions = {}) {
  return function (target: object, propertyKey: string) {
    const formats = Reflect.getMetadata(JSON_FORMAT_METADATA, target) || {};
    formats[propertyKey] = options;
    Reflect.defineMetadata(JSON_FORMAT_METADATA, formats, target);
  };
}

/**
 * Returns the @JsonFormat metadata map for the given prototype object.
 * Keys are property names; values are the associated JsonFormatOptions.
 */
export function getJsonFormatFields(target: object): Record<string, JsonFormatOptions> {
  return Reflect.getMetadata(JSON_FORMAT_METADATA, target) || {};
}

/**
 * Format a Date using a Java SimpleDateFormat-style pattern.
 *
 * Supported tokens (processed longest-first, so 'yyyy' beats 'yy', 'MM' beats 'M', etc.):
 *   yyyy  4-digit year       yy   2-digit year
 *   MM    2-digit month      M    1-digit month
 *   dd    2-digit day        d    1-digit day
 *   HH    2-digit hour(0-23) H    1-digit hour
 *   mm    2-digit minute     m    1-digit minute
 *   ss    2-digit second     s    1-digit second
 *   SSS   3-digit millis     S    unpadded millis (0-999)
 */
export function formatDate(date: Date, pattern: string, timezone?: string): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');

  let y = 0, mo = 0, d = 0, h = 0, mi = 0, s = 0, ms = 0;

  if (timezone) {
    try {
      const parts: Record<string, string> = {};
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23', // Ensure hours are in 0–23 range to avoid 24:00 edge cases
      }).formatToParts(date).forEach(p => { parts[p.type] = p.value; });
      y  = parseInt(parts.year, 10);
      mo = parseInt(parts.month, 10);
      d  = parseInt(parts.day, 10);
      h  = parseInt(parts.hour, 10);
      mi = parseInt(parts.minute, 10);
      s  = parseInt(parts.second, 10);
      ms = date.getMilliseconds(); // Milliseconds are sub-second precision; timezones offset by whole minutes only, so this value is timezone-independent
    } catch {
      // Fallback to local time if the timezone string is unrecognised
      y = date.getFullYear(); mo = date.getMonth() + 1; d = date.getDate();
      h = date.getHours();    mi = date.getMinutes();   s = date.getSeconds(); ms = date.getMilliseconds();
    }
  } else {
    y = date.getFullYear(); mo = date.getMonth() + 1; d = date.getDate();
    h = date.getHours();    mi = date.getMinutes();   s = date.getSeconds(); ms = date.getMilliseconds();
  }

  // Build the token → value map once per call, then walk the pattern using
  // the pre-sorted key list so no sorting happens at call time.
  const tokenValues: Record<string, string> = {
    yyyy: String(y),
    yy:   String(y).slice(-2),
    MM:   pad(mo),
    M:    String(mo),
    dd:   pad(d),
    d:    String(d),
    HH:   pad(h),
    H:    String(h),
    mm:   pad(mi),
    m:    String(mi),
    ss:   pad(s),
    s:    String(s),
    SSS:  pad(ms, 3),
    S:    String(ms),
  };

  let result = '';
  let i = 0;
  while (i < pattern.length) {
    let matched = false;
    for (const token of SORTED_DATE_TOKEN_KEYS) {
      if (pattern.startsWith(token, i)) {
        result += tokenValues[token];
        i += token.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += pattern[i++];
    }
  }
  return result;
}

/**
 * Recursively transform `value` by applying @JsonFormat rules found on any
 * class-instance prototypes within the object graph.
 *
 * - Class instances: own enumerable properties are copied via `Object.keys()`
 *   (non-enumerable properties and accessor-only getters are not included, which
 *   matches the default `JSON.stringify` behaviour); any `Date` property
 *   annotated with @JsonFormat is converted to a string (or number) according
 *   to the decorator options.
 * - Arrays: each element is recursively transformed.
 * - Plain objects: shallow-copied into a new plain object whose own enumerable
 *   properties are recursively transformed (nested objects are still walked).
 * - Primitives (`string`, `number`, `boolean`): returned unchanged.
 * - `Date` values without an annotation: returned unchanged (serialized to ISO
 *   string by JSON.stringify as usual).
 * - Non-plain built-in objects (Buffer, Map, Set, Error, etc.) are returned
 *   unchanged to preserve their native JSON serialisation behaviour.
 * - Circular / shared references are detected via a WeakMap; the
 *   already-transformed copy is returned so every reference to the same
 *   source object yields a consistently-formatted result.
 *
 * @param value The value to transform (typically the controller return value)
 * @param visited Internal WeakMap used to memoize transformed copies and detect circular references (do not pass)
 */
export function applyJsonFormat(value: unknown, visited: WeakMap<object, unknown> = new WeakMap()): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    // Handle arrays with memoization to support circular/shared references
    if (visited.has(value as object)) {
      return visited.get(value as object);
    }
    const out: unknown[] = [];
    // Register the array copy before recursing to break cycles
    visited.set(value as object, out);
    for (const item of value) {
      out.push(applyJsonFormat(item, visited));
    }
    return out;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'object') {
    // Return non-plain built-in types unchanged to preserve their default serialisation
    if (
      Buffer.isBuffer(value) ||
      value instanceof Map ||
      value instanceof Set ||
      value instanceof Error ||
      value instanceof Uint8Array ||
      value instanceof RegExp ||
      value instanceof URL ||
      value instanceof Date
    ) {
      return value;
    }

    // Return the already-transformed copy for circular/shared references
    if (visited.has(value)) {
      return visited.get(value);
    }

    // If the object defines a toJSON method, honor it and then apply formatting.
    // Guard against self-referential toJSON (e.g. toJSON returns `this`): if the
    // returned value is the same reference, fall through to standard object handling.
    const anyValue = value as any;
    if (typeof anyValue.toJSON === 'function') {
      const jsonValue = anyValue.toJSON.call(anyValue) as unknown;
      if (jsonValue !== value) {
        return applyJsonFormat(jsonValue, visited);
      }
    }

    const proto = Object.getPrototypeOf(value);
    const formats: Record<string, JsonFormatOptions> =
      proto && proto !== Object.prototype
        ? (Reflect.getMetadata(JSON_FORMAT_METADATA, proto) || {})
        : {};

    const result: Record<string, unknown> = {};
    // Register result in the map before recursing so circular refs resolve to the partial copy
    visited.set(value, result);
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const val = (value as Record<string, unknown>)[key];
      const fmt = formats[key];
      if (fmt && val instanceof Date) {
        if (fmt.shape === 'NUMBER') {
          result[key] = val.getTime();
        } else {
          result[key] = fmt.pattern
            ? formatDate(val, fmt.pattern, fmt.timezone)
            : val.toISOString();
        }
      } else {
        result[key] = applyJsonFormat(val, visited);
      }
    }
    return result;
  }
  return value;
}
