# 日志 Starter（aiko-boot-starter-log）

`@ai-partner-x/aiko-boot-starter-log` 为 Aiko Boot 提供统一日志能力，支持：

- 多级别日志（error/warn/info/http/verbose/debug/silly）
- 多输出（console / file）与格式化（json/cli/pretty/simple）
- 默认元数据（service/version/env 等）
- 装饰器（如 `@Slf4j` / `@Log`）与门面函数（`getLogger()` / `autoInit()`）

## 快速开始

在你的 API 工程中安装依赖：

```bash
pnpm add @ai-partner-x/aiko-boot-starter-log
```

在 `app.config.ts` 中增加 `logging` 配置（示例字段）：

- `level`：日志级别
- `format`：输出格式
- `transports`：传输器列表（console/file）

在 `src/server.ts` 中初始化：

```ts
import { autoInit, getLogger } from '@ai-partner-x/aiko-boot-starter-log';

autoInit();
const logger = getLogger('server');
logger.info('Starting...');
```

> 脚手架推荐直接使用 `aiko-boot-create add-feature --feature log` 自动注入配置与中间件。

