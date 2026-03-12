# @ai-partner-x/aiko-boot-starter-log

基于 Winston 的简化日志组件，提供简洁易用的 API。

## 目录结构

```
packages/aiko-boot-starter-log/
├── src/
│   ├── config.ts           # 配置加载器
│   ├── facade.ts           # 外观层 API（快捷函数）
│   ├── formatter.ts        # 格式化器
│   ├── index.ts            # 入口文件
│   ├── logger.ts           # 核心日志类实现
│   ├── loggerFactory.ts    # 日志工厂
│   └── types.ts            # 类型定义
├── examples/
│   └── basic-usage.ts      # 使用示例
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## 安装

```bash
pnpm add @ai-partner-x/aiko-boot-starter-log
# 或
npm install @ai-partner-x/aiko-boot-starter-log
```

## 快速开始

```typescript
import { getLogger, defaultLogger } from '@ai-partner-x/aiko-boot-starter-log';

// 使用默认 logger
defaultLogger.info('应用启动');
defaultLogger.debug('调试信息', { userId: 123 });
defaultLogger.error('发生错误', new Error('错误详情'));

// 获取命名 logger
const logger = getLogger('my-app');
logger.info('Hello World');
```

## API 文档

### 日志级别

支持以下日志级别（从高到低）：

| 级别 | 说明 |
|------|------|
| `error` | 错误信息 |
| `warn` | 警告信息 |
| `info` | 一般信息 |
| `http` | HTTP 请求日志 |
| `verbose` | 详细信息 |
| `debug` | 调试信息 |
| `silly` | 最详细的信息 |

### 快捷函数

#### 创建 Logger

```typescript
import {
  createConsoleLogger,
  createFileLogger,
  createCombinedLogger,
  getLogger,
} from '@ai-partner-x/aiko-boot-starter-log';

// 创建控制台 logger
const consoleLogger = createConsoleLogger('app', 'debug');

// 创建文件 logger
const fileLogger = createFileLogger('app', './logs/app.log', {
  level: 'info',
  maxSize: '10m',
  maxFiles: 5,
});

// 创建组合 logger（控制台 + 文件）
const combinedLogger = createCombinedLogger('app', './logs/app.log', {
  level: 'debug',
});

// 从工厂获取 logger
const logger = getLogger('my-module');
```

#### 初始化配置

```typescript
import {
  initLogging,
  initFromEnv,
  initFromFile,
  autoInit,
} from '@ai-partner-x/aiko-boot-starter-log';

// 手动配置
initLogging({
  level: 'debug',
  format: 'pretty',
  colorize: true,
  transports: [
    { type: 'console', level: 'debug', format: 'cli', colorize: true },
    { type: 'file', filename: './logs/app.log', level: 'info' },
  ],
});

// 从环境变量初始化
initFromEnv();

// 从配置文件初始化
initFromFile('./log.config.json');

// 自动加载（env > file > package.json > defaults）
autoInit({ configFile: './log.config.json' });
```

### Formatter 格式化器

```typescript
import { Formatter } from '@ai-partner-x/aiko-boot-starter-log';

// 预定义格式
Formatter.json();         // JSON 格式
Formatter.simple();       // 简单文本格式
Formatter.pretty();       // 美化格式
Formatter.cli(true);      // 命令行格式（带颜色）

// 环境预设
Formatter.production();   // 生产环境格式
Formatter.development();  // 开发环境格式

// 自定义格式
Formatter.custom({
  timestamp: 'YYYY-MM-DD HH:mm:ss',
  colorize: true,
  custom: (info) => `[${info.level}] ${info.message}`,
});
```

### ConfigLoader 配置加载器

```typescript
import { ConfigLoader, loadConfig } from '@ai-partner-x/aiko-boot-starter-log';

// 获取默认配置
const defaultConfig = ConfigLoader.getDefault();

// 从环境变量加载
const envConfig = ConfigLoader.fromEnv();

// 从文件加载
const fileConfig = ConfigLoader.fromFile('./log.config.json');

// 自动加载（优先级: env > file > package.json > defaults）
const config = ConfigLoader.load({
  configFile: './log.config.json',
  env: true,
});

// 快捷函数
const config = loadConfig();
```

### 环境变量配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `LOG_LEVEL` | 日志级别 | `debug`, `info`, `warn` |
| `LOG_FORMAT` | 输出格式 | `json`, `cli`, `pretty` |
| `LOG_COLORIZE` | 启用颜色 | `true`, `false` |
| `LOG_TIMESTAMP` | 显示时间戳 | `true`, `false` |
| `LOG_FILE` | 日志文件路径 | `./logs/app.log` |
| `LOG_CONSOLE` | 控制台输出 | `true`, `false` |

### 传输配置

#### 控制台传输

```typescript
interface ConsoleTransportConfig {
  type: 'console';
  enabled?: boolean;
  level?: LogLevel;
  format?: 'json' | 'simple' | 'pretty' | 'cli';
  colorize?: boolean;
  timestamp?: boolean;
}
```

#### 文件传输

```typescript
interface FileTransportConfig {
  type: 'file';
  filename: string;
  enabled?: boolean;
  level?: LogLevel;
  format?: 'json' | 'simple' | 'pretty' | 'cli';
  maxSize?: string;  // e.g., '10m', '100k', '1g'
  maxFiles?: number;
  createDir?: boolean;
}
```

#### 流传输

```typescript
interface StreamTransportConfig {
  type: 'stream';
  stream: NodeJS.WritableStream;
  enabled?: boolean;
  level?: LogLevel;
  format?: 'json' | 'simple' | 'pretty' | 'cli';
}
```

### 子 Logger 和上下文

```typescript
const logger = getLogger('app');

// 创建子 logger
const childLogger = logger.child('module');
childLogger.info('来自子 logger 的消息');
// 输出: [app:module] ...

// 添加上下文
const contextLogger = logger.withContext({ requestId: 'req-123', userId: 456 });
contextLogger.info('带上下文的消息');
// 输出包含: { requestId: 'req-123', userId: 456, ... }
```

### 错误日志

```typescript
const logger = getLogger('app');

try {
  throw new Error('Something went wrong');
} catch (error) {
  // 自动记录错误堆栈
  logger.error('操作失败', error);

  // 带额外上下文
  logger.error('操作失败', error, { operation: 'database' });
}
```

## 配置文件示例

### log.config.json

```json
{
  "level": "info",
  "format": "json",
  "colorize": false,
  "timestamp": true,
  "defaultMeta": {
    "service": "my-service",
    "version": "1.0.0"
  },
  "transports": [
    {
      "type": "console",
      "level": "debug",
      "format": "cli",
      "colorize": true
    },
    {
      "type": "file",
      "filename": "./logs/app.log",
      "level": "info",
      "maxSize": "10m",
      "maxFiles": 7
    },
    {
      "type": "file",
      "filename": "./logs/error.log",
      "level": "error",
      "maxSize": "10m",
      "maxFiles": 30
    }
  ]
}
```

### package.json 配置

```json
{
  "name": "my-app",
  "log": {
    "level": "info",
    "format": "cli",
    "colorize": true
  }
}
```

## 完整示例

### 生产环境配置

```typescript
import { Logger, Formatter } from '@ai-partner-x/aiko-boot-starter-log';

const logger = new Logger({
  name: 'production-app',
  level: 'info',
  defaultMeta: {
    service: 'api-server',
    version: '1.0.0',
    env: 'production',
  },
  transports: [
    { type: 'console', level: 'info', format: 'json' },
    { type: 'file', filename: './logs/app.log', level: 'info', maxSize: '50m', maxFiles: 30 },
    { type: 'file', filename: './logs/error.log', level: 'error', maxSize: '50m', maxFiles: 30 },
  ],
});

logger.info('服务启动', { port: 3000 });
```

### 开发环境配置

```typescript
import { autoInit, getLogger } from '@ai-partner-x/aiko-boot-starter-log';

// 自动从环境变量加载配置
autoInit();

const logger = getLogger('dev-app');
logger.debug('开发调试信息', { feature: 'new-feature' });
```

## 依赖管理

### 运行时依赖
- `winston@^3.11.0` - 日志功能核心库

### 开发依赖
- `typescript@^5.3.0` - TypeScript 编译器
- `tsup@^8.0.0` - 构建工具
- `vitest@^2.0.0` - 测试框架
- `@types/node@^20.11.0` - Node.js 类型定义

### 对等依赖（可选）
- `@ai-partner-x/aiko-boot@workspace:*` - 与 Aiko Boot 框架集成

## 最佳实践

### 1. 日志级别选择
- **生产环境**: `info` 或 `warn`
- **开发环境**: `debug` 或 `verbose`
- **测试环境**: `silly`（最详细）

### 2. 输出格式
- **控制台输出**: 使用 `cli` 或 `pretty` 格式，启用颜色
- **文件输出**: 使用 `json` 格式，便于日志分析
- **生产环境**: 使用 `json` 格式，包含完整时间戳

### 3. 文件轮转
```typescript
// 合理的文件轮转配置
{
  type: 'file',
  filename: './logs/app.log',
  maxSize: '10m',    // 每个文件最大 10MB
  maxFiles: 7,       // 保留最近 7 天的日志
  level: 'info'
}
```

### 4. 错误处理
```typescript
// 正确方式：传递 Error 对象
try {
  // 业务逻辑
} catch (error) {
  logger.error('操作失败', error, { operation: 'database' });
}

// 避免：只传递字符串
logger.error('操作失败: ' + error.message); // ❌ 不推荐
```

### 5. 性能考虑
- 避免在热路径中创建复杂的日志消息
- 使用 `isDebugEnabled()` 等方法检查级别后再构建消息
- 生产环境中关闭不必要的详细日志

### 6. 安全考虑
- 不要在日志中记录敏感信息（密码、令牌、个人信息等）
- 使用环境变量控制日志级别
- 定期审查和清理日志文件

## 测试

运行所有测试：
```bash
npm test
```

运行特定测试：
```bash
npm test -- --run "Formatter"
```

生成测试覆盖率报告：
```bash
npm run test:coverage
```
# 日志级别判断逻辑验证

## LOG_LEVELS 映射
```typescript
LOG_LEVELS = {
  error: 0,   // 最高优先级
  warn: 1,    // 次高优先级
  info: 2,    // 中等优先级
  http: 3,    // 较低优先级
  verbose: 4, // 低优先级
  debug: 5,   // 更低优先级
  silly: 6    // 最低优先级
}
```

## 判断逻辑
`isLevelEnabled(level)` 使用以下逻辑：
```typescript
return LOG_LEVELS[level] <= LOG_LEVELS[this._level];
```

## 示例验证

### 当前级别：info (2)
- `isLevelEnabled('error')` = `0 <= 2` = `true` ✓
- `isLevelEnabled('warn')` = `1 <= 2` = `true` ✓
- `isLevelEnabled('info')` = `2 <= 2` = `true` ✓
- `isLevelEnabled('http')` = `3 <= 2` = `false` ✓
- `isLevelEnabled('debug')` = `5 <= 2` = `false` ✓

## 常见问题

### Q1: 为什么 winston 同时出现在 dependencies 和 devDependencies 中？
**A**: 这是一个错误的配置。`winston` 是运行时必需的依赖，应该只出现在 `dependencies` 中。开发工具（如测试框架）应该在 `devDependencies` 中。已修复此问题。

### Q2: 如何与 Aiko Boot 框架集成？
**A**: 本库通过可选的 peerDependency `@ai-partner-x/aiko-boot` 与框架集成。如果安装了该框架，可以使用 `fromAikoBoot()` 方法自动加载配置。

### Q3: 如何处理循环依赖？
**A**: 使用工厂模式（LoggerFactory）管理 logger 实例，避免直接导入。通过 facade 函数（`getLogger()`, `defaultLogger`）访问 logger。

### Q4: 为什么测试中直接调用 formatter.transform() 会失败？
**A**: `transform()` 是 winston 的内部 API，不应该直接调用。测试应该验证格式化器的创建和使用，而不是直接调用内部方法。

### Q5: 如何自定义日志格式？
**A**: 使用 `Formatter.custom()` 方法，或创建自定义的 winston 格式器。参考 `formatter.ts` 中的实现。

### Q6: 生产环境中应该使用什么日志级别？
**A**: 建议使用 `info` 级别，记录重要业务事件和错误。避免在生产环境中使用 `debug` 或 `silly` 级别，以免影响性能。

### Q7: 如何记录 Error 对象？
**A**: 使用 `logger.error(message, error, metadata)` 格式。Error 的 `name`、`message` 和 `stack` 会自动包含在日志中。

## 贡献指南

1. **代码规范**
   - 使用 TypeScript 编写类型安全的代码
   - 遵循项目中的 ESLint 规则
   - 添加适当的类型定义和注释

2. **测试要求**
   - 新功能必须包含单元测试
   - 修复 bug 时必须添加回归测试
   - 测试覆盖率不低于 80%

3. **依赖管理**
   - 运行时依赖放在 `dependencies` 中
   - 开发工具放在 `devDependencies` 中
   - 可选集成放在 `peerDependencies` 中

4. **提交规范**
   - 使用语义化提交消息
   - 提交前运行所有测试
   - 更新相关文档

## 许可证

MIT
