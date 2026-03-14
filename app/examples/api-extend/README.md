# New-Features Example

演示 `@ai-partner-x/aiko-boot` 和 `@ai-partner-x/aiko-boot-starter-web` 的新增特性：
文件上传、参数装饰器、和异步后台任务。

## 快速启动

```bash
# 从仓库根目录安装依赖
pnpm install

# 构建依赖包
pnpm --filter "@ai-partner-x/*" build

# 进入示例目录，启动开发服务器（支持热重载）
cd app/examples/api-extend
pnpm dev
```

服务器默认监听 **http://localhost:3003**（可在 `app.config.ts` 中修改）。

## 配置（`app.config.ts`）

此示例展示 Aiko Boot AutoConfiguration + `@ConfigurationProperties` 能力：

```typescript
export default {
  server: {
    port: 3003,
    servlet: { contextPath: '/api' },
  },
  spring: {
    servlet: {
      multipart: {
        enabled: true,
        maxFileSize: '10MB',     // spring.servlet.multipart.max-file-size
      },
    },
  },
} satisfies AppConfig;
```

---

## Feature 1 — `@Async` (fire-and-forget 后台任务)

**包**: `@ai-partner-x/aiko-boot`

`@Async()` 将方法变为后台任务：调用方立即拿到 `void` 返回值，真正的逻辑在
`setImmediate` 后的事件循环 tick 中执行，不阻塞 HTTP 响应。

### 接口

#### `POST /api/async/send-email`
```bash
curl -X POST http://localhost:3003/api/async/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"alice@example.com","userId":42}'
```
响应（`returnedInMs ≈ 0`，500ms 后任务完成）：
```json
{ "data": { "message": "✅ Email task submitted", "returnedInMs": 0 } }
```

#### `POST /api/async/send-password-reset`
```bash
curl -X POST http://localhost:3003/api/async/send-password-reset \
  -H "Content-Type: application/json" -d '{"to":"bob@example.com"}'
```

#### `POST /api/async/generate-report`
1000ms 重计算任务，调用方不等待：
```bash
curl -X POST http://localhost:3003/api/async/generate-report \
  -H "Content-Type: application/json" -d '{"month":"2024-03"}'
```

#### `POST /api/async/trigger-error`
必然失败的任务 — 演示 `@Async({ onError })` 错误隔离，调用方仍收到 `200 OK`：
```bash
curl -X POST http://localhost:3003/api/async/trigger-error \
  -H "Content-Type: application/json" -d '{"reportType":"quarterly"}'
```

#### `GET /api/async/log`
查看后台任务执行结果（POST 后等 1-2 秒再查）：
```bash
curl http://localhost:3003/api/async/log
```

#### `DELETE /api/async/log`
清空日志：
```bash
curl -X DELETE http://localhost:3003/api/async/log
```

---

## Feature 2 & 3 — `@RequestPart` + `MultipartFile` (文件上传)

**包**: `@ai-partner-x/aiko-boot-starter-web`

含 `@RequestPart` 的路由**自动获得** `multer memoryStorage` 中间件。
文件大小限制由 `app.config.ts` 的 `spring.servlet.multipart.*` 配置统一管理。
接收到的文件被包装为 `MultipartFile` 接口，提供与 Spring Boot 一致的 API：
`getName() / getOriginalFilename() / getContentType() / getSize() / getBytes() / isEmpty() / transferTo(dest)`。

### 接口

#### `POST /api/upload/single`
上传单个文件（field name = `file`）：
```bash
curl -X POST http://localhost:3003/api/upload/single \
  -F "file=@/path/to/photo.png"
```
```json
{
  "data": {
    "fieldName": "file",
    "originalFilename": "photo.png",
    "contentType": "image/png",
    "sizeBytes": 12345,
    "isEmpty": false
  }
}
```

#### `POST /api/upload/avatar`
自定义 field name `avatar`，演示 `getBytes()` 读取二进制内容：
```bash
curl -X POST http://localhost:3003/api/upload/avatar \
  -F "avatar=@/path/to/avatar.jpg"
```

#### `POST /api/upload/multi`
同时上传两个文件（演示多个 `@RequestPart` 参数共存）：
```bash
curl -X POST http://localhost:3003/api/upload/multi \
  -F "document=@/path/to/doc.pdf" \
  -F "thumbnail=@/path/to/thumb.png"
```

---

## Feature 4 — `@ModelAttribute` (query / form 绑定)

**包**: `@ai-partner-x/aiko-boot-starter-web`

将 `req.query`（URL 参数）和 `req.body`（form urlencoded body）合并注入为一个对象，
无需逐个声明 `@RequestParam`，适合多可选参数的搜索 / 表单场景。

### 接口

#### `GET /api/form/search` — 从 query string 绑定
```bash
curl "http://localhost:3003/api/form/search?keyword=alice&page=2&size=20&category=admin"
```
```json
{
  "data": {
    "received": { "keyword": "alice", "page": "2", "size": "20", "category": "admin" },
    "parsed": { "keyword": "alice", "page": 2, "size": 20, "category": "admin" }
  }
}
```

#### `POST /api/form/register` — 从 form-urlencoded body 绑定
```bash
curl -X POST http://localhost:3003/api/form/register \
  -d "username=alice&email=alice@example.com&age=30"
```
```json
{ "data": { "received": { "username": "alice", "email": "alice@example.com", "age": "30" } } }
```

---

## Feature 5 — `@RequestAttribute` (读取中间件注入的 req 属性)

**包**: `@ai-partner-x/aiko-boot-starter-web`

读取 Express 中间件在 `req` 对象上设置的自定义属性（等同于 Spring Boot
`HandlerInterceptor.preHandle` → `request.setAttribute()`）。

`server.ts` 中的模拟 Auth 中间件在所有请求前设置：
```typescript
req.currentUser = { id: 1, name: 'Alice', role: 'admin' };
req.tenantId = 'tenant-42';
```

### 接口

#### `GET /api/form/profile` — 读取 `req.currentUser`
```bash
curl http://localhost:3003/api/form/profile
```
```json
{
  "data": {
    "user": { "id": 1, "name": "Alice", "role": "admin" },
    "message": "✅ currentUser injected via @RequestAttribute"
  }
}
```

#### `GET /api/form/tenant-info` — 同一方法多个 `@RequestAttribute`
```bash
curl http://localhost:3003/api/form/tenant-info
```
```json
{
  "data": {
    "tenantId": "tenant-42",
    "user": { "id": 1, "name": "Alice", "role": "admin" }
  }
}
```

---

## 代码结构

```
app/examples/api-extend/
├── app.config.ts                       # Aiko Boot 配置（port、multipart、logging）
├── src/
│   ├── server.ts                       # useExpressApp() + createApp() 自动配置
│   ├── service/
│   │   ├── task-log.service.ts         # 内存日志单例（@Async 任务写入）
│   │   ├── notification.service.ts     # @Async 邮件发送示例
│   │   └── report.service.ts           # @Async 重计算 + onError 示例
│   └── controller/
│       ├── async.controller.ts         # Feature 1: @Async
│       ├── upload.controller.ts        # Feature 2/3: @RequestPart + MultipartFile
│       ├── form.controller.ts          # Feature 4/5: @ModelAttribute + @RequestAttribute
│       └── json-format.controller.ts   # Feature 6: @JsonFormat
```

## 相关包

| 包 | 新增特性 |
|---|---|
| [`@ai-partner-x/aiko-boot`](../../../packages/aiko-boot) | `@Async(options?)`, `@Service`, `@Autowired` |
| [`@ai-partner-x/aiko-boot-starter-web`](../../../packages/aiko-boot-starter-web) | `@RequestPart`, `MultipartFile`, `@ModelAttribute`, `@RequestAttribute`, `MultipartProperties` |
