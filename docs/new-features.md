# AI-First Framework — 新特性功能 Summary

> 本文档覆盖四项新增能力：**文件上传**（`MultipartFile` + `@RequestPart`）、**请求绑定参数装饰器**（`@ModelAttribute` + `@RequestAttribute`）、**异步与响应式支持**（`@Async`）以及 **JSON 序列化格式化**（`@JsonFormat`）。
>
> 这些能力均已集成到新一代 **Aiko Boot** 框架（`@ai-partner-x/aiko-boot-starter-web` + `@ai-partner-x/aiko-boot`），支持 Spring Boot 风格的自动配置（AutoConfiguration）和配置化能力（`@ConfigurationProperties`）。
>
> 完整示例代码见 [`app/examples/api-extend/`](../app/examples/api-extend/)。

---

## 一、文件上传 — `MultipartFile` + `@RequestPart`

### 功能概述

提供与 Spring Boot `@RequestPart` + `org.springframework.web.multipart.MultipartFile` 完全对齐的文件上传 API：

- 在 `@RestController` 方法的参数上标注 `@RequestPart(fieldName)`，框架**自动注入** multer `memoryStorage` 中间件，无需手动配置。
- 框架将 multer 原始文件对象包装为 `MultipartFile` 接口，暴露与 Java 完全一致的方法签名。
- 支持单文件、指定自定义字段名、以及同一方法内多文件字段并存。
- 文件大小限制通过 `spring.servlet.multipart.*` 配置统一管理，遵循 Spring Boot 规范。

| TypeScript | Java Spring 对应 |
|---|---|
| `@RequestPart(name?)` | `@RequestPart` |
| `MultipartFile` 接口 | `org.springframework.web.multipart.MultipartFile` |
| `MultipartProperties` | `spring.servlet.multipart.*` 配置 |

### 开发思路

1. **元数据驱动**：`@RequestPart` 通过 `reflect-metadata` 在方法的参数维度写入字段名（使用字符串 key `'aiko-boot:requestPart'`，确保跨 ESM 模块共享）；路由注册阶段读取元数据，若存在则自动挂载 multer 中间件。
2. **零配置**：开发者无需在 Express 层手动 `app.use(multer(...))` 或在路由上添加中间件，只需在参数上加装饰器。
3. **AutoConfiguration 集成**：`WebAutoConfiguration` 在启动时读取 `spring.servlet.multipart.*` 配置，将文件大小限制传递给 `createExpressRouter`，再由 multer 的 `limits` 选项统一控制。
4. **Spring 接口对齐**：包装对象严格对标 `MultipartFile` 接口，使 AI 能基于 Spring Boot 知识生成代码，同时支持未来的 TypeScript → Java 转译。

### 技术实现

#### `MultipartFile` 接口（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export interface MultipartFile {
  /** 返回表单字段名（multipart part name） */
  getName(): string;
  /** 返回客户端文件系统中的原始文件名 */
  getOriginalFilename(): string;
  /** 返回文件 Content-Type，未设置时返回 null */
  getContentType(): string | null;
  /** 返回文件字节数 */
  getSize(): number;
  /** 以 Buffer 返回文件内容 */
  getBytes(): Buffer;
  /** 文件是否为空（size === 0） */
  isEmpty(): boolean;
  /** 将文件写入目标路径 */
  transferTo(dest: string): Promise<void>;
}
```

#### `@RequestPart` 参数装饰器（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export function RequestPart(name?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const requestParts = Reflect.getMetadata('aiko-boot:requestPart', target, propertyKey) || {};
    requestParts[parameterIndex] = { name: name || 'file' };
    Reflect.defineMetadata('aiko-boot:requestPart', requestParts, target, propertyKey);
  };
}
```

#### `MultipartProperties` 配置类（`packages/aiko-boot-starter-web/src/auto-configuration.ts`）

```typescript
@ConfigurationProperties('spring.servlet.multipart')
export class MultipartProperties {
  enabled?: boolean = true;
  maxFileSize?: string = '1MB';     // spring.servlet.multipart.max-file-size
  maxRequestSize?: string = '10MB'; // spring.servlet.multipart.max-request-size
}
```

`WebAutoConfiguration` 启动时读取该配置并将大小限制传递给 multer，同时用 `server.maxHttpPostSize` 控制 JSON body-parser 的限制：

```typescript
// packages/aiko-boot-starter-web/src/auto-configuration.ts (WebAutoConfiguration)

// JSON body-parser 大小限制：来自 server.maxHttpPostSize（默认 10mb）
const maxHttpPostSizeStr = ConfigLoader.get<string>('server.maxHttpPostSize', '10mb');

// multipart 单文件大小限制：来自 spring.servlet.multipart.maxFileSize
const multipartOptions = multipartEnabled
  ? { maxFileSize: parseSizeToBytes(maxFileSizeStr) }  // "1MB" → 1048576
  : undefined;  // undefined 表示禁用 multer 中间件

app.use(express.json({ limit: resolvedBodyLimit }));
app.use(createExpressRouter(validControllers, {
  prefix: contextPath,
  verbose,
  multipart: multipartOptions,   // undefined = 禁用上传; { maxFileSize } = 启用
}));
```

#### 路由注册时的自动 multer 挂载（`packages/aiko-boot-starter-web/src/express-router.ts`）

```typescript
const uploadMiddleware = (Object.keys(partParams).length > 0 && multipart !== undefined)
  ? multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: multipart?.maxFileSize,    // from spring.servlet.multipart.max-file-size
      },
    }).fields(
      Object.values(partParams).map(p => ({ name: p.name, maxCount: 1 }))
    )
  : null;
```

### 快速开始

#### 1. 配置文件（`app.config.ts`）

```typescript
export default {
  server: {
    port: 3001,
    servlet: { contextPath: '/api' },
  },
  spring: {
    servlet: {
      multipart: {
        enabled: true,
        maxFileSize: '5MB',       // 单个文件上限
        maxRequestSize: '20MB',   // 整个请求上限
      },
    },
  },
};
```

#### 2. 控制器

```typescript
import {
  RestController, PostMapping,
  RequestPart, type MultipartFile,
} from '@ai-partner-x/aiko-boot-starter-web';

@RestController({ path: '/upload' })
export class UploadController {
  /** 单文件上传 */
  @PostMapping('/single')
  async uploadSingle(
    @RequestPart('file') file: MultipartFile,
  ): Promise<object> {
    if (file.isEmpty()) throw new Error('No file uploaded');
    return {
      filename: file.getOriginalFilename(),
      type:     file.getContentType(),
      size:     file.getSize(),
    };
  }

  /** 多字段文件上传 */
  @PostMapping('/multi')
  async uploadMulti(
    @RequestPart('document')  document:  MultipartFile,
    @RequestPart('thumbnail') thumbnail: MultipartFile,
  ): Promise<object> {
    // Use path.basename() to strip any path separators from the client-supplied
    // filename and prevent path-traversal attacks.
    const docName  = path.basename(document.getOriginalFilename()  ?? 'document');
    const thumbName = path.basename(thumbnail.getOriginalFilename() ?? 'thumbnail');
    await document.transferTo(`/tmp/uploads/${docName}`);
    await thumbnail.transferTo(`/tmp/uploads/${thumbName}`);
    return { saved: [docName, thumbName] };
  }
}
```

**curl 测试：**

```bash
# 单文件
curl -X POST http://localhost:3001/api/upload/single -F "file=@photo.png"

# 多文件
curl -X POST http://localhost:3001/api/upload/multi \
  -F "document=@doc.pdf" -F "thumbnail=@thumb.png"
```

---

## 二、参数装饰器 — `@ModelAttribute` + `@RequestAttribute`

### 功能概述

两个补充参数装饰器，覆盖 Spring MVC 中除 `@RequestParam` / `@RequestBody` / `@PathVariable` 之外的常见场景：

| TypeScript 装饰器 | Java Spring 对应 | 使用场景 |
|---|---|---|
| `@ModelAttribute(name?)` | `@ModelAttribute` | 将 URL query string 与 form body 合并注入为一个对象 DTO，适合多可选参数的搜索接口和 HTML 表单提交 |
| `@RequestAttribute(name)` | `@RequestAttribute` | 读取 Express 中间件写入 `req` 对象的自定义属性（如认证信息 `req.currentUser`、租户 ID `req.tenantId`） |

### 开发思路

#### `@ModelAttribute`

- Spring MVC 中 `@ModelAttribute` 将整个模型（query + body）绑定为一个对象，避免为每个可选字段逐一写 `@RequestParam`。
- 框架实现：在路由处理器内将 `req.query` 与 `req.body` 做浅合并（`{ ...req.query, ...req.body }`），将结果注入到标注了 `@ModelAttribute` 的参数。
- 元数据 key 使用字符串 `'aiko-boot:modelAttribute'`，确保跨 ESM 模块一致性。

#### `@RequestAttribute`

- Spring MVC 的 `HandlerInterceptor.preHandle` 可向 `request` 对象写入属性，控制器通过 `@RequestAttribute` 读取。
- Express 中间件同样可以向 `req` 对象写入属性。`@RequestAttribute(name)` 直接从 `req[name]` 读取并注入参数，不需要控制器感知中间件实现。
- 元数据 key 使用字符串 `'aiko-boot:requestAttribute'`。

### 技术实现

#### `@ModelAttribute` 装饰器（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export function ModelAttribute(name?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const modelAttrs = Reflect.getMetadata('aiko-boot:modelAttribute', target, propertyKey) || {};
    modelAttrs[parameterIndex] = { name: name || '' };
    Reflect.defineMetadata('aiko-boot:modelAttribute', modelAttrs, target, propertyKey);
  };
}
```

路由处理器内注入逻辑：

```typescript
for (const idx of Object.keys(modelAttrs)) {
  const queryObj = req.query || {};
  const bodyObj  = (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body))
    ? req.body : {};
  args[Number(idx)] = { ...queryObj, ...bodyObj };   // query 优先级低于 body
}
```

#### `@RequestAttribute` 装饰器（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export function RequestAttribute(name: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const reqAttrs = Reflect.getMetadata('aiko-boot:requestAttribute', target, propertyKey) || {};
    reqAttrs[parameterIndex] = { name };
    Reflect.defineMetadata('aiko-boot:requestAttribute', reqAttrs, target, propertyKey);
  };
}
```

路由处理器内注入逻辑：

```typescript
for (const [idx, attr] of Object.entries(requestAttrs)) {
  const { name } = attr as { name: string };
  args[Number(idx)] = req[name];   // 直接读取 Express req 对象上的属性
}
```

### 快速开始

#### `@ModelAttribute` — 搜索接口 / 表单绑定

```typescript
import {
  RestController, GetMapping, PostMapping,
  ModelAttribute,
} from '@ai-partner-x/aiko-boot-starter-web';

interface SearchDto  { keyword?: string; page?: string; category?: string }
interface RegisterDto { username?: string; email?: string }

@RestController({ path: '/form' })
export class FormController {
  /** GET /api/form/search?keyword=alice&page=1&category=admin */
  @GetMapping('/search')
  search(@ModelAttribute() query: SearchDto): object {
    return { keyword: query.keyword, page: Number(query.page ?? 1) };
  }

  /** POST /api/form/register  (Content-Type: application/x-www-form-urlencoded) */
  @PostMapping('/register')
  register(@ModelAttribute('user') dto: RegisterDto): object {
    return { username: dto.username, email: dto.email };
  }
}
```

```bash
# URL 查询参数 → @ModelAttribute
curl "http://localhost:3001/api/form/search?keyword=alice&page=2"

# form-urlencoded body → @ModelAttribute
curl -X POST http://localhost:3001/api/form/register \
  -d "username=alice&email=alice@example.com"
```

#### `@RequestAttribute` — 读取中间件注入属性

```typescript
// 外层 Express 应用注册认证中间件（在 createApp 之前）
app.use((req, _res, next) => {
  (req as any).currentUser = { id: 1, name: 'Alice', role: 'admin' };
  (req as any).tenantId    = 'tenant-42';
  next();
});

// 控制器直接声明依赖，无需感知中间件实现
import {
  RestController, GetMapping,
  RequestAttribute,
} from '@ai-partner-x/aiko-boot-starter-web';

@RestController({ path: '/form' })
export class FormController {
  @GetMapping('/profile')
  profile(
    @RequestAttribute('currentUser') user: { id: number; name: string; role: string },
  ): object {
    return { user };
  }

  /** 同一方法可使用多个 @RequestAttribute */
  @GetMapping('/tenant-info')
  tenantInfo(
    @RequestAttribute('tenantId')    tenantId: string,
    @RequestAttribute('currentUser') user: object,
  ): object {
    return { tenantId, user };
  }
}
```

```bash
curl http://localhost:3001/api/form/profile
curl http://localhost:3001/api/form/tenant-info
```

---

## 四、JSON 序列化格式化 — `@JsonFormat`

### 功能概述

`@JsonFormat` 是 `@ai-partner-x/aiko-boot-starter-web` 提供的**属性装饰器**，对应 Spring Boot / Jackson 的 `@JsonFormat` 注解。最常见的场景是将 DTO 中的 `Date` 字段以人类可读的字符串格式（而非默认 ISO-8601）输出到 JSON 响应中。

- 在 DTO 类的 `Date` 类型属性上标注 `@JsonFormat`，控制器返回该对象时框架**自动格式化**，无需手动调用任何转换函数。
- 支持 Java `SimpleDateFormat` 风格的 `pattern`（`yyyy-MM-dd HH:mm:ss` 等）。
- 支持 IANA 时区（`Asia/Shanghai`、`UTC`、`America/New_York` 等）。
- 支持 `shape: 'NUMBER'` 将日期序列化为 Unix 毫秒时间戳。
- 格式化逻辑由 `applyJsonFormat()` 递归遍历整个对象图；数组、嵌套对象均可正确处理。

| TypeScript | Java Spring 对应 |
|---|---|
| `@JsonFormat({ pattern, timezone, shape })` | `@com.fasterxml.jackson.annotation.JsonFormat` |
| `formatDate(date, pattern, timezone?)` | Jackson 内部 `_format.format(date)` |
| `applyJsonFormat(value)` | Jackson `ObjectMapper` 序列化管道 |

### 开发思路

1. **元数据驱动**：`@JsonFormat` 通过 `reflect-metadata` 将格式配置写入类原型（key `'aiko-boot:jsonFormat'`），以属性名为键存储。路由层在序列化响应时读取元数据，按配置格式化对应字段。
2. **自动应用**：`createExpressRouter` 中的响应处理器在 `res.json()` 之前自动调用 `applyJsonFormat(result)`，控制器代码无需任何修改即可享受格式化能力。
3. **无侵入**：未标注 `@JsonFormat` 的 `Date` 字段保持默认行为（`JSON.stringify` 输出 ISO-8601 字符串）；非 `Date` 字段不受影响。
4. **性能友好**：格式化 token 键表 `SORTED_DATE_TOKEN_KEYS` 在模块加载时一次性按长度降序排好，`formatDate()` 每次调用仅构建一个 `tokenValues` Map，不再重新排序。

### 技术实现

#### `JsonFormatOptions` 类型（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export interface JsonFormatOptions {
  /**
   * Java SimpleDateFormat 风格的日期格式字符串。
   * 支持 token：yyyy yy MM M dd d HH H mm m ss s SSS S
   * @example 'yyyy-MM-dd HH:mm:ss'
   */
  pattern?: string;
  /**
   * IANA 时区标识符，省略时使用进程本地时区。
   * @example 'Asia/Shanghai'  'UTC'  'America/New_York'
   */
  timezone?: string;
  /**
   * 序列化形态：'STRING'（默认，使用 pattern 格式化）或 'NUMBER'（Unix 毫秒时间戳）
   */
  shape?: 'STRING' | 'NUMBER';
}
```

#### `@JsonFormat` 装饰器（`packages/aiko-boot-starter-web/src/decorators.ts`）

```typescript
export function JsonFormat(options: JsonFormatOptions = {}) {
  return function (target: object, propertyKey: string) {
    const formats = Reflect.getMetadata('aiko-boot:jsonFormat', target) || {};
    formats[propertyKey] = options;
    Reflect.defineMetadata('aiko-boot:jsonFormat', formats, target);
  };
}
```

#### `formatDate` 工具函数（`packages/aiko-boot-starter-web/src/decorators.ts`）

```typescript
// 支持 token（从长到短处理，避免 'MM' 被误识别为 'M'+'M'）：
// yyyy  4 位年  yy   2 位年
// MM    2 位月  M    不补零月
// dd    2 位日  d    不补零日
// HH    2 位时  H    不补零时
// mm    2 位分  m    不补零分
// ss    2 位秒  s    不补零秒
// SSS   3 位毫秒  S   不补零毫秒

formatDate(new Date('2024-03-09T08:05:06.007Z'), 'yyyy/MM/dd HH:mm:ss.SSS', 'Asia/Shanghai')
// → '2024/03/09 16:05:06.007'  (UTC+8)
```

#### `applyJsonFormat` 递归序列化（`packages/aiko-boot-starter-web/src/decorators.ts`）

```typescript
// 自动在路由响应中调用，无需手动使用
export function applyJsonFormat(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(item => applyJsonFormat(item));
  if (value instanceof Date) return value;          // 无注解时原样保留
  if (typeof value === 'object' && value !== null) {
    const proto   = Object.getPrototypeOf(value);
    const formats = proto !== Object.prototype
      ? Reflect.getMetadata('aiko-boot:jsonFormat', proto) || {}
      : {};
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      const val = (value as any)[key];
      const fmt = formats[key];
      if (fmt && val instanceof Date) {
        result[key] = fmt.shape === 'NUMBER'
          ? val.getTime()
          : (fmt.pattern ? formatDate(val, fmt.pattern, fmt.timezone) : val.toISOString());
      } else {
        result[key] = applyJsonFormat(val);         // 递归嵌套对象
      }
    }
    return result;
  }
  return value;
}
```

#### 路由层自动应用（`packages/aiko-boot-starter-web/src/express-router.ts`）

```typescript
// 控制器方法执行完成后，在 res.json() 之前自动格式化
const result = await controllerMethod.apply(instance, args);
res.json({ success: true, data: applyJsonFormat(result) });
```

### 快速开始

#### 1. 在 DTO 中标注 `@JsonFormat`

```typescript
import { JsonFormat } from '@ai-partner-x/aiko-boot-starter-web';

export class UserDto {
  id!: number;
  name!: string;

  /** 格式化为上海时区字符串 */
  @JsonFormat({ pattern: 'yyyy-MM-dd HH:mm:ss', timezone: 'Asia/Shanghai' })
  createTime?: Date;

  /** 仅日期，不含时间 */
  @JsonFormat({ pattern: 'yyyy-MM-dd' })
  birthday?: Date;

  /** Unix 毫秒时间戳（数字类型） */
  @JsonFormat({ shape: 'NUMBER' })
  updatedAt?: Date;
}
```

#### 2. 控制器返回 DTO — 无需额外代码

```typescript
import {
  RestController, GetMapping, PathVariable,
} from '@ai-partner-x/aiko-boot-starter-web';

@RestController({ path: '/users' })
export class UserController {
  @GetMapping('/:id')
  getUser(@PathVariable('id') id: string): UserDto {
    const dto = new UserDto();
    dto.id         = Number(id);
    dto.name       = 'Alice';
    dto.createTime = new Date('2024-01-15T00:30:00Z');
    dto.birthday   = new Date('1995-06-20T00:00:00Z');
    dto.updatedAt  = new Date('2024-03-09T08:00:00Z');
    return dto;
  }
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Alice",
    "createTime": "2024-01-15 08:30:00",
    "birthday":   "1995-06-20",
    "updatedAt":  1709971200000
  }
}
```

#### 3. `curl` 测试

```bash
curl http://localhost:3001/api/users/1
```

#### 支持的 `pattern` token 速查

| Token | 含义 | 示例（2024-03-09 08:05:06.007） |
|---|---|---|
| `yyyy` | 4 位年 | `2024` |
| `yy` | 2 位年 | `24` |
| `MM` | 2 位月（补零） | `03` |
| `M` | 月（不补零） | `3` |
| `dd` | 2 位日（补零） | `09` |
| `d` | 日（不补零） | `9` |
| `HH` | 2 位 24 制小时（补零） | `08` |
| `H` | 小时（不补零） | `8` |
| `mm` | 2 位分钟（补零） | `05` |
| `m` | 分钟（不补零） | `5` |
| `ss` | 2 位秒（补零） | `06` |
| `s` | 秒（不补零） | `6` |
| `SSS` | 3 位毫秒（补零） | `007` |
| `S` | 毫秒（不补零） | `7` |

---

## 五、异步与响应式支持 — `@Async`

### 功能概述

`@Async` 来自 `@ai-partner-x/aiko-boot`，对应 Spring Boot 的 `@Async`（fire-and-forget 语义）：

- 调用方**立即**收到 `void` 返回值，HTTP 响应几乎在 0ms 内返回。
- 被装饰方法的真实逻辑通过 `setImmediate` 在下一个事件循环 tick 中执行，与调用方的执行路径完全解耦。
- 支持通过 `onError` 选项自定义后台异常处理器，后台异常不会影响调用方，也不会造成未处理的 Promise 拒绝。
- `@ai-partner-x/aiko-boot-starter-web` 重新导出 `@Async`，使开发者可以从一个包完成所有导入。

| TypeScript | Java Spring 对应 |
|---|---|
| `@Async()` | `@Async`（返回 `void`，fire-and-forget） |
| `@Async({ onError })` | `@Async` + `AsyncUncaughtExceptionHandler` |

### 开发思路

1. **装饰器包装原方法**：`@Async` 将原始方法替换为一个立即返回 `void` 的同步函数，原始逻辑被推入 `setImmediate` 队列。
2. **错误隔离**：通过 `try/catch` 包裹后台逻辑；若用户未提供 `onError`，则使用默认的 `console.error` 处理器。这确保后台任务的任何异常都不会变成未处理的 Promise 拒绝，也不会向调用方传播。
3. **DI 兼容**：`@Async` 仅修改方法描述符，与 `@Service` / `@Component` 正交，可同时使用，无需特殊配置。
4. **统一导出**：`@ai-partner-x/aiko-boot-starter-web` 将 `@Async` 重新导出，Web 层开发者无需额外依赖 `@ai-partner-x/aiko-boot`。

### 技术实现

#### `AsyncOptions` 类型（`@ai-partner-x/aiko-boot`）

```typescript
export interface AsyncOptions {
  /**
   * 后台任务抛出未处理异常时的回调。
   * 默认行为：console.error
   */
  onError?: (error: unknown, methodName: string) => void;
}
```

#### `@Async` 装饰器实现（`packages/aiko-boot/src/boot/lifecycle.ts`）

```typescript
export function Async(options: AsyncOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(ASYNC_METADATA, { ...options }, target, propertyKey);

    const original = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      const ctx = this;
      setImmediate(async () => {
        try {
          await original.apply(ctx, args);
        } catch (error) {
          const handler = options.onError ?? defaultAsyncErrorHandler;
          handler(error, propertyKey);
        }
      });
      // 立即返回 void — fire-and-forget
    };
    return descriptor;
  };
}
```

#### 导出路径

```
@ai-partner-x/aiko-boot           → Async, isAsync, getAsyncOptions, AsyncOptions
@ai-partner-x/aiko-boot-starter-web → re-exports all above (one-stop import)
```

### 快速开始

#### 基本用法 — fire-and-forget 邮件通知

```typescript
import { Service } from '@ai-partner-x/aiko-boot';
import { Async } from '@ai-partner-x/aiko-boot-starter-web'; // 或从 @ai-partner-x/aiko-boot 导入

@Service()
export class NotificationService {
  /** 发送欢迎邮件 — 调用方不等待，立即返回 void */
  @Async()
  async sendWelcomeEmail(to: string, userId: number): Promise<void> {
    await sendMailViaSmtp(to, `Welcome, user #${userId}`);   // 真实 I/O，~500ms
    console.log(`[Notification] Welcome email sent to ${to}`);
  }
}
```

```typescript
// 控制器：调用异步服务，returnedInMs ≈ 0
import {
  RestController, PostMapping, RequestBody,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';

@RestController({ path: '/user' })
export class UserController {
  @Autowired() private notificationService!: NotificationService;

  @PostMapping('/register')
  async register(@RequestBody() dto: { email: string; id: number }): Promise<object> {
    const t0 = Date.now();
    this.notificationService.sendWelcomeEmail(dto.email, dto.id);  // fire-and-forget
    return { message: 'Registered', returnedInMs: Date.now() - t0 };
  }
}
```

#### 自定义错误处理 — `onError`

```typescript
import { Service } from '@ai-partner-x/aiko-boot';
import { Async } from '@ai-partner-x/aiko-boot-starter-web';

@Service()
export class ReportService {
  /**
   * 生成报告（1s 重计算）— 失败时由 onError 捕获，调用方不受影响
   */
  @Async({
    onError: (err, method) => {
      console.error(`[ReportService] Custom onError in "${method}":`, (err as Error).message);
    },
  })
  async generateSalesReport(month: string): Promise<void> {
    await heavyComputation(month);
    if (noData) throw new Error('Data source unavailable');
  }
}
```

---

## 六、功能对照表

| 功能 | 装饰器 / 类型 | 所在包 | Spring Boot 对应 |
|---|---|---|---|
| 文件上传字段注入 | `@RequestPart(name?)` | `@ai-partner-x/aiko-boot-starter-web` | `@RequestPart` |
| 上传文件抽象接口 | `MultipartFile` | `@ai-partner-x/aiko-boot-starter-web` | `org.springframework.web.multipart.MultipartFile` |
| 文件上传配置类 | `MultipartProperties` | `@ai-partner-x/aiko-boot-starter-web` | `spring.servlet.multipart.*` |
| 文件大小解析工具 | `parseSizeToBytes(str)` | `@ai-partner-x/aiko-boot-starter-web` | — |
| 表单 / query 对象绑定 | `@ModelAttribute(name?)` | `@ai-partner-x/aiko-boot-starter-web` | `@ModelAttribute` |
| 中间件属性注入 | `@RequestAttribute(name)` | `@ai-partner-x/aiko-boot-starter-web` | `@RequestAttribute` |
| fire-and-forget 后台任务 | `@Async(options?)` | `@ai-partner-x/aiko-boot` / re-exported via web-starter | `@Async` |
| 后台异常处理 | `AsyncOptions.onError` | `@ai-partner-x/aiko-boot` | `AsyncUncaughtExceptionHandler` |
| JSON 日期格式化 | `@JsonFormat({ pattern, timezone, shape })` | `@ai-partner-x/aiko-boot-starter-web` | `@com.fasterxml.jackson.annotation.JsonFormat` |
| 日期格式工具函数 | `formatDate(date, pattern, timezone?)` | `@ai-partner-x/aiko-boot-starter-web` | Jackson 内部序列化管道 |
| 递归 JSON 格式化 | `applyJsonFormat(value)` | `@ai-partner-x/aiko-boot-starter-web` | Jackson `ObjectMapper` |

---

## 七、安装与运行示例

```bash
# 1. 安装依赖（仓库根目录）
pnpm install

# 2. 构建所有 @ai-partner-x/* 包
pnpm --filter "@ai-partner-x/*" build

# 3. 进入示例目录并启动
cd app/examples/api-extend
pnpm dev
# → http://localhost:3001
```

### 示例配置文件（`app.config.ts`）

```typescript
// 完整展示 server + spring.servlet.multipart 两层配置
export default {
  logging: { level: { root: 'debug' } },
  server: {
    port: 3001,
    servlet: { contextPath: '/api' },
    shutdown: 'graceful',
  },
  spring: {
    servlet: {
      multipart: {
        enabled: true,
        maxFileSize: '5MB',
        maxRequestSize: '20MB',
      },
    },
  },
};
```
