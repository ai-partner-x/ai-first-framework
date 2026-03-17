# Log Integration Guide

本特性为 `aiko-boot` API 服务集成统一日志能力（基于 `@ai-partner-x/aiko-boot-starter-log`），包括：

- 统一 logger（命名 logger、默认元数据、文件/控制台输出）
- HTTP 请求日志中间件（记录请求/响应耗时、状态码等）
- 全局错误日志（捕获未处理异常并记录上下文）

## 1. 安装依赖

在目标 API 服务的 `package.json` 中添加：

- `@ai-partner-x/aiko-boot-starter-log`

> 若你使用 `aiko-boot-create add-feature --feature log`，会自动完成依赖写入。

## 2. 配置 `app.config.ts`

增加 `logging` 配置节点（示例字段）：

- `level`: 日志级别（`error|warn|info|http|verbose|debug|silly`）
- `format`: 输出格式（`json|cli|pretty|simple`）
- `transports`: 输出目标（console/file）

> `add-feature` 会在检测到缺失 `logging:` 时注入一份默认配置。

## 3. 在 `src/server.ts` 启用日志

建议包含以下行为：

- `autoInit()`：启动时初始化 logger
- `getLogger('server')`：获取命名 logger
- `expressApp.use(RequestLogService.requestLogMiddleware)`：启用请求日志
- 全局 error middleware：记录未捕获错误并返回 500

## 4. 使用方式

你可以直接使用 starter 的 logger：

```ts
import { getLogger } from '@ai-partner-x/aiko-boot-starter-log';

const logger = getLogger('module');
logger.info('hello', { foo: 'bar' });
```

也可以使用本特性提供的适配器：

```ts
import { logService } from './service/log.service';

logService.info('something happened', { id: 1 });
```

