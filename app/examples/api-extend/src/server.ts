/**
 * New-Features Example — API Server (Aiko Boot 风格自动配置)
 *
 * 演示 aiko-boot-starter-web 所有新增装饰器，通过 AutoConfiguration 自动启动 Express：
 *   1. @Async          — fire-and-forget 后台任务 (@ai-partner-x/aiko-boot)
 *   2. @RequestPart    — multipart 文件上传 (@ai-partner-x/aiko-boot-starter-web)
 *   3. MultipartFile   — Spring Boot 兼容文件接口 (@ai-partner-x/aiko-boot-starter-web)
 *   4. @ModelAttribute — query + form body 绑定 (@ai-partner-x/aiko-boot-starter-web)
 *   5. @RequestAttribute — Express req 自定义属性注入 (@ai-partner-x/aiko-boot-starter-web)
 *   6. @JsonFormat     — Date 属性 JSON 序列化格式化 (@ai-partner-x/aiko-boot-starter-web)
 *
 * 配置:
 *   - app.config.ts → server.port / server.servlet.contextPath
 *   - app.config.ts → spring.servlet.multipart.maxFileSize
 *
 * @RequestAttribute 说明:
 *   @RequestAttribute 读取的属性必须由在路由**之前**运行的 Express 中间件写入 req。
 *   使用 useExpressApp() 向 WebAutoConfiguration 传入一个已预配置好中间件的 Express 实例，
 *   使自定义中间件（如模拟 Auth）在路由注册前即挂载到 Express，从而正确注入 req 属性。
 */
import 'reflect-metadata';
import { createApp } from '@ai-partner-x/aiko-boot';
import { useExpressApp } from '@ai-partner-x/aiko-boot-starter-web';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express, { type Request, type Response, type NextFunction } from 'express';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 创建 Express 实例，在路由注册前注册自定义中间件 ─────────────────────────
const expressApp = express();

// urlencoded body 解析（供 @ModelAttribute form 演示使用）
expressApp.use(express.urlencoded({ extended: true }));

/**
 * 模拟 Auth 中间件：向 req 对象写入 currentUser 和 tenantId。
 * 真实项目中这里会验证 JWT token 并查询用户信息。
 * @RequestAttribute 的控制器参数可直接读取这些属性，无需感知中间件实现。
 */
expressApp.use((_req: Request, _res: Response, next: NextFunction) => {
  const req = _req as Request & { currentUser?: object; tenantId?: string };
  req.currentUser = { id: 1, name: 'Alice', role: 'admin' };
  req.tenantId = 'tenant-42';
  next();
});

// 将已预配置好中间件的 Express 实例注册给 WebAutoConfiguration，
// 使路由（CORS / body-parser / router / 错误处理器）追加在上述中间件之后。
useExpressApp(expressApp);

// ─── 创建应用（自动加载 app.config.ts，扫描 controller/ + service/，启动 Express） ──
const app = await createApp({
  srcDir: __dirname,
  configPath: join(__dirname, '..'),   // app.config.ts 在项目根目录
  scanDirs: ['controller', 'service'],
});

// ─── 启动 HTTP 服务器 ──────────────────────────────────────────────────────
await app.run();

console.log(`
──────────────────────────────────────────────────────────
Feature 1 — @Async (fire-and-forget 后台任务)
  POST   /api/async/send-email
  POST   /api/async/send-password-reset
  POST   /api/async/generate-report
  POST   /api/async/trigger-error
  GET    /api/async/log
  DELETE /api/async/log

Feature 2 & 3 — @RequestPart + MultipartFile (文件上传)
  POST   /api/upload/single     -F "file=@photo.png"
  POST   /api/upload/avatar     -F "avatar=@avatar.jpg"
  POST   /api/upload/multi      -F "document=@doc.pdf" -F "thumbnail=@thumb.png"

Feature 4 — @ModelAttribute (query / form 绑定)
  GET    /api/form/search?keyword=alice&page=1
  POST   /api/form/register    -d "username=alice&email=alice@example.com"

Feature 5 — @RequestAttribute (读取中间件设置的 req 属性)
  GET    /api/form/profile
  GET    /api/form/tenant-info

Feature 6 — @JsonFormat (JSON 日期序列化格式化)
  GET    /api/json-format/user/1    单个 DTO，三种格式化规则
  GET    /api/json-format/users     DTO 数组（递归格式化）
  GET    /api/json-format/compare   同一时刻：UTC / 上海时区 / 时间戳对比
──────────────────────────────────────────────────────────
`);

