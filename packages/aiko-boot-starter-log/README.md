# @ai-partner-x/aiko-boot-starter-log

基于 Winston 的简化日志组件，提供简洁易用的 API。

## 目录结构

```
packages/aiko-boot-starter-log/
├── src/
│   ├── config.ts                   # 配置加载器
│   ├── core/
│   │   ├── facade.ts               # 外观层 API（快捷函数）
│   │   └── logger.ts               # 核心日志类实现
│   ├── decorators/
│   │   ├── log.decorator.ts        # @Log 方法装饰器
│   │   └── slf4j.decorator.ts      # @Slf4j 类装饰器
│   ├── formatter.ts                # 格式化器
│   ├── index.ts                    # 入口文件
│   ├── loggerFactory.ts            # 日志工厂
│   ├── metadata/
│   │   └── metadata.ts             # 元数据管理
│   ├── types.ts                    # 类型定义
│   └── utils/
│       └── decorator-utils.ts      # 装饰器工具函数
├── __tests__/
│   ├── auto-configuration.test.ts  # 自动配置测试
│   ├── decorators.test.ts          # 装饰器集成测试
│   ├── facade.test.ts              # 外观层 API 测试
│   ├── formatter.test.ts           # 格式化器测试
│   ├── integration.test.ts         # 集成测试
│   ├── log-decorator.test.ts       # @Log 装饰器单元测试
│   ├── logger.test.ts              # 核心 Logger 测试
│   ├── loggerFactory.test.ts       # Logger 工厂测试
│   ├── slf4j-decorator.test.ts     # @Slf4j 装饰器单元测试
│   ├── types.test.ts               # 类型定义测试
│   └── setup.ts                    # 测试环境设置
├── examples/
│   ├── basic-usage.ts              # 基础使用示例
│   └── decorator-usage.ts          # 装饰器使用示例
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

### 装饰器支持依赖

要使用装饰器功能，需要安装 `reflect-metadata`：

```bash
pnpm add reflect-metadata
# 或
npm install reflect-metadata
```

并在应用入口处导入：

```typescript
import 'reflect-metadata';
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

## 装饰器支持 (v0.3.0+)

从 v0.3.0 版本开始，组件提供了类似 Lombok 的装饰器支持，可以更简洁地使用日志功能。

### 启用装饰器支持

在应用入口处导入 `reflect-metadata`：

```typescript
import 'reflect-metadata';
```

### @Slf4j 类装饰器

自动为类注入日志记录器：

```typescript
import { Slf4j } from '@ai-partner-x/aiko-boot-starter-log';

@Slf4j()
class UserService {
  getUser(id: string) {
    this.logger.info(`Getting user ${id}`);
    return { id, name: 'John Doe' };
  }
}

// 使用自定义配置
@Slf4j({ 
  name: 'OrderService',
  level: 'debug',
  factoryOptions: { level: 'debug' }
})
class OrderService {
  processOrder(orderId: string) {
    this.logger.debug(`Processing order ${orderId}`);
    return { orderId, status: 'processed' };
  }
}
```

### @Log 方法装饰器

自动记录方法调用，支持同步和异步方法：

```typescript
import { Log, LogInfo, LogDebug, LogError } from '@ai-partner-x/aiko-boot-starter-log';

@Slf4j()
class ProductService {
  
  @Log()
  async getProduct(id: string) {
    // 自动记录方法调用
    return { id, name: 'Product ' + id };
  }
  
  @LogInfo('Searching products')
  searchProducts(query: string) {
    return [{ id: '1', name: query }];
  }
  
  @LogDebug()
  debugMethod() {
    this.logger.debug('Debug information');
    return 'debug';
  }
  
  @LogError('Product creation failed')
  createProduct(data: any) {
    if (!data.name) {
      throw new Error('Product name is required');
    }
    return { id: 'new', ...data };
  }
  
  @Log({
    level: 'info',
    message: 'Processing order',
    logArgs: true,
    logResult: true,
    logDuration: true
  })
  processOrder(orderId: string, items: any[]) {
    return { orderId, status: 'processed' };
  }
}
```

### 装饰器选项

#### @Slf4j 选项
```typescript
interface Slf4jOptions {
  name?: string;                    // 日志记录器名称（默认使用类名）
  level?: string;                   // 日志级别
  enabled?: boolean;                // 是否启用装饰器
  factoryOptions?: Partial<LoggerFactoryOptions>; // 自定义日志工厂选项
}
```

#### @Log 选项
```typescript
interface LogOptions {
  level?: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
  message?: string;                 // 自定义日志消息模板
  logArgs?: boolean;                // 是否记录方法参数（默认：true）
  logResult?: boolean;              // 是否记录返回值（默认：true）
  logDuration?: boolean;            // 是否记录执行时间（默认：true）
  logError?: boolean;               // 是否记录错误（默认：true）
  argsSerializer?: (args: any[]) => any;    // 参数序列化函数
  resultSerializer?: (result: any) => any;  // 结果序列化函数
  errorSerializer?: (error: Error) => any;  // 错误序列化函数
  loggerName?: string;              // 自定义日志记录器名称（覆盖类级别的记录器）
}
```

### 便捷装饰器

- `@LogInfo(message?)` - 记录 info 级别日志
- `@LogDebug(message?)` - 记录 debug 级别日志  
- `@LogError(message?)` - 记录 error 级别日志

### 元数据管理工具

```typescript
import { LoggerMetadata, enableDecoratorSupport } from '@ai-partner-x/aiko-boot-starter-log';

// 启用装饰器支持
enableDecoratorSupport();

// 检查类是否已应用 @Slf4j 装饰器
const isDecorated = LoggerMetadata.hasLogger(MyClass);

// 获取类的日志记录器
const logger = LoggerMetadata.getLogger(MyClass);

// 手动注入日志记录器
LoggerMetadata.setLogger(MyClass, loggerInstance);
```

### 向后兼容性

装饰器功能完全向后兼容，可以与传统的 API 混合使用：

```typescript
import { getLogger } from '@ai-partner-x/aiko-boot-starter-log';
import { Slf4j } from '@ai-partner-x/aiko-boot-starter-log';

// 传统方式
class TraditionalService {
  private logger = getLogger('TraditionalService');
  
  doSomething() {
    this.logger.info('传统方式');
  }
}

// 装饰器方式
@Slf4j({ name: 'ModernService' })
class ModernService {
  doSomething() {
    this.logger.info('装饰器方式');
  }
}

// 两者可以共存
```

### 测试装饰器代码

项目提供了完整的装饰器单元测试，可以作为编写测试的参考：

```typescript
// 测试 @Log 装饰器
import { describe, it, expect, vi } from 'vitest';
import { Log, Slf4j } from '@ai-partner-x/aiko-boot-starter-log';
import { LoggerMetadata } from '@ai-partner-x/aiko-boot-starter-log';
import { enableDecoratorSupport } from '@ai-partner-x/aiko-boot-starter-log';

enableDecoratorSupport();

describe('@Log 装饰器测试', () => {
  beforeEach(() => {
    // 模拟 logger
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    vi.spyOn(LoggerMetadata, 'getLogger').mockReturnValue(mockLogger as any);
  });

  it('应该记录方法调用', () => {
    @Slf4j({ name: 'TestClass' })
    class TestClass {
      @Log()
      testMethod(param: string) {
        return `Hello ${param}`;
      }
    }

    const instance = new TestClass();
    const result = instance.testMethod('World');
    
    expect(result).toBe('Hello World');
    // 验证日志被调用
  });
});
```

### 装饰器测试覆盖率

项目的装饰器测试覆盖了以下关键场景：

| 测试场景 | 覆盖文件 | 测试用例数 |
|---------|---------|-----------|
| @Log 装饰器基础功能 | `log-decorator.test.ts` | 20 |
| @Slf4j 装饰器基础功能 | `slf4j-decorator.test.ts` | 15 |
| 装饰器集成测试 | `decorators.test.ts` | 15+ |
| 装饰器工具函数 | `decorators.test.ts` | 5+ |

所有装饰器相关代码的测试覆盖率超过 85%，确保代码质量和稳定性。

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

### 运行测试

运行所有测试：
```bash
npm test
```

运行特定测试文件：
```bash
npm test -- log-decorator.test.ts
```

运行特定测试套件：
```bash
npm test -- --run "装饰器功能测试"
```

生成测试覆盖率报告：
```bash
npm run test:coverage
```

### 测试结构

项目包含全面的单元测试，覆盖所有核心功能：

```
__tests__/
├── auto-configuration.test.ts    # 自动配置测试
├── decorators.test.ts            # 装饰器集成测试
├── facade.test.ts               # 外观层 API 测试
├── formatter.test.ts            # 格式化器测试
├── integration.test.ts          # 集成测试
├── log-decorator.test.ts        # @Log 装饰器单元测试（新增）
├── logger.test.ts               # 核心 Logger 测试
├── loggerFactory.test.ts        # Logger 工厂测试
├── slf4j-decorator.test.ts      # @Slf4j 装饰器单元测试（新增）
├── types.test.ts               # 类型定义测试
└── setup.ts                    # 测试环境设置
```

### 装饰器单元测试

#### @Log 装饰器测试 (`log-decorator.test.ts`)

包含 20 个测试用例，覆盖以下功能：

1. **基础功能测试**
   - 同步方法装饰
   - 异步方法装饰
   - 方法参数记录
   - 返回值记录
   - 执行时间记录

2. **错误处理测试**
   - 同步方法错误记录
   - 异步方法错误记录
   - 错误日志禁用

3. **自定义选项测试**
   - 自定义日志级别
   - 自定义消息模板
   - 自定义序列化器
   - 自定义 logger 名称

4. **便捷装饰器测试**
   - `@LogSimple` 装饰器
   - `@LogInfo` 装饰器
   - `@LogDebug` 装饰器
   - `@LogError` 装饰器

5. **边界情况测试**
   - 没有 logger 的情况
   - undefined 和 null 参数
   - 函数参数处理
   - 循环引用对象处理

#### @Slf4j 装饰器测试 (`slf4j-decorator.test.ts`)

包含 23 个测试用例，覆盖以下功能：

1. **基础功能测试**
   - 装饰器正确应用
   - logger 属性注入
   - 默认 logger 名称
   - 自定义 logger 名称

2. **选项配置测试**
   - 装饰器禁用
   - 自定义日志级别
   - factoryOptions 配置

3. **便捷装饰器测试**
   - `@Slf4jSimple` 装饰器

4. **工具函数测试**
   - `isSlf4jDecorated` 函数

5. **边界情况测试**
   - 匿名类处理
   - 没有名称的匿名类
   - 匿名类作为函数返回值
   - 匿名类继承场景
   - 匿名类与箭头函数结合
   - 匿名类多次装饰
   - 匿名类禁用装饰器
   - 继承场景
   - 多次应用装饰器

6. **集成测试**
   - 与 `@Log` 装饰器协同工作
   - 多个类使用不同 logger

### 测试示例

```typescript
// log-decorator.test.ts 示例
describe('@Log 装饰器单元测试', () => {
  it('应该正确应用 @Log 装饰器到同步方法', () => {
    @Slf4j({ name: 'TestClass' })
    class TestClass {
      @Log()
      syncMethod(param: string) {
        return `Hello ${param}`;
      }
    }

    const instance = new TestClass();
    const result = instance.syncMethod('World');
    expect(result).toBe('Hello World');
  });
});

// slf4j-decorator.test.ts 示例
describe('@Slf4j 装饰器单元测试', () => {
  it('应该正确应用 @Slf4j 装饰器', () => {
    @Slf4j({ name: 'TestService' })
    class TestService {
      testMethod() {
        return 'test';
      }
    }

    expect(LoggerMetadata.hasLogger(TestService)).toBe(true);
    expect(LoggerMetadata.getName(TestService)).toBe('TestService');
  });
});
```

### 匿名类边界情况测试

`@Slf4j` 装饰器支持多种匿名类使用场景，测试覆盖了以下边界情况：

#### 1. 基本匿名类测试
```typescript
it('应该处理匿名类', () => {
  const AnonymousClass = class {
    test() {
      return 'test';
    }
  };
  
  // 应用装饰器
  const DecoratedClass = Slf4j({ name: 'AnonymousLogger' })(AnonymousClass);
  
  expect(LoggerMetadata.hasLogger(DecoratedClass)).toBe(true);
  expect(LoggerMetadata.getName(DecoratedClass)).toBe('AnonymousLogger');
});
```

#### 2. 没有名称的匿名类
```typescript
it('应该处理没有名称的匿名类', () => {
  // 完全匿名的类表达式
  const AnonymousClass = class {};
  
  // 应用装饰器，不提供名称
  const DecoratedClass = Slf4j()(AnonymousClass);
  
  expect(LoggerMetadata.hasLogger(DecoratedClass)).toBe(true);
  // 匿名类的 name 属性通常是空字符串或 'class'
  expect(LoggerMetadata.getName(DecoratedClass)).toBe('');
});
```

#### 3. 匿名类作为函数返回值
```typescript
it('应该处理匿名类作为函数返回值', () => {
  function createClass() {
    return class {
      method() {
        return 'method';
      }
    };
  }
  
  const AnonymousClass = createClass();
  const DecoratedClass = Slf4j({ name: 'FunctionReturnClass' })(AnonymousClass);
  
  expect(LoggerMetadata.hasLogger(DecoratedClass)).toBe(true);
  expect(LoggerMetadata.getName(DecoratedClass)).toBe('FunctionReturnClass');
});
```

#### 4. 匿名类继承场景
```typescript
it('应该处理匿名类继承场景', () => {
  // 匿名父类
  const ParentClass = class {
    parentMethod() {
      return 'parent';
    }
  };
  
  // 应用装饰器到父类
  const DecoratedParent = Slf4j({ name: 'ParentLogger' })(ParentClass);
  
  // 匿名子类继承匿名父类
  const ChildClass = class extends DecoratedParent {
    childMethod() {
      return 'child';
    }
  };
  
  // 应用装饰器到子类
  const DecoratedChild = Slf4j({ name: 'ChildLogger' })(ChildClass);
  
  const parent = new DecoratedParent();
  const child = new DecoratedChild();
  
  expect(parent.logger?.name).toBe('ParentLogger');
  expect(child.logger?.name).toBe('ChildLogger');
});
```

#### 5. 匿名类与箭头函数结合
```typescript
it('应该处理匿名类与箭头函数结合', () => {
  // 使用箭头函数创建匿名类
  const createAnonymousClass = (name: string) => {
    const cls = class {
      constructor(public value: string) {}
      
      getValue() {
        return this.value;
      }
    };
    
    // 动态应用装饰器
    return Slf4j({ name })(cls);
  };
  
  const DecoratedClassA = createAnonymousClass('ClassA');
  const DecoratedClassB = createAnonymousClass('ClassB');
  
  const instanceA = new DecoratedClassA('valueA');
  const instanceB = new DecoratedClassB('valueB');
  
  expect(instanceA.logger?.name).toBe('ClassA');
  expect(instanceB.logger?.name).toBe('ClassB');
});
```

#### 6. 匿名类多次装饰
```typescript
it('应该处理匿名类多次装饰的情况', () => {
  const AnonymousClass = class {
    test() {
      return 'test';
    }
  };
  
  // 多次应用装饰器
  const DecoratedOnce = Slf4j({ name: 'FirstLogger' })(AnonymousClass);
  const DecoratedTwice = Slf4j({ name: 'SecondLogger' })(DecoratedOnce);
  
  expect(LoggerMetadata.getName(DecoratedTwice)).toBe('SecondLogger');
});
```

#### 7. 匿名类禁用装饰器
```typescript
it('应该处理匿名类禁用装饰器的情况', () => {
  const AnonymousClass = class {
    test() {
      return 'test';
    }
  };
  
  // 应用禁用状态的装饰器
  const DecoratedClass = Slf4j({ enabled: false, name: 'DisabledLogger' })(AnonymousClass);
  
  expect(LoggerMetadata.hasLogger(DecoratedClass)).toBe(false);
});
```

### 测试配置

测试使用以下配置：

- **测试框架**: Vitest v2.1.9
- **模拟库**: Vitest 内置模拟功能
- **断言库**: Vitest 内置 expect
- **覆盖率工具**: @vitest/coverage-v8

### 测试最佳实践

1. **隔离测试环境**
   - 每个测试用例使用独立的模拟
   - 测试前后清理状态
   - 避免测试间相互影响

2. **模拟外部依赖**
   - 使用 `vi.spyOn()` 模拟函数调用
   - 使用 `vi.fn()` 创建模拟函数
   - 模拟 `LoggerMetadata` 和 `getLogger`

3. **装饰器支持**
   - 测试文件开头调用 `enableDecoratorSupport()`
   - 使用 `reflect-metadata` 支持装饰器语法
   - 在 `beforeEach` 中定义装饰类

4. **异步测试**
   - 使用 `async/await` 处理异步方法
   - 使用 `expect().rejects.toThrow()` 测试异步错误
   - 合理设置超时时间

5. **边界条件测试**
   - 测试 null/undefined 参数
   - 测试错误处理
   - 测试性能边界情况
   - 测试匿名类处理
   - 测试继承和组合场景
   - 测试装饰器多次应用
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

### Q8: 如何为装饰器编写单元测试？
**A**: 参考项目中的 `log-decorator.test.ts` 和 `slf4j-decorator.test.ts` 文件。关键步骤包括：
1. 导入 `enableDecoratorSupport()` 并调用
2. 使用 `vi.spyOn()` 模拟 `LoggerMetadata.getLogger()`
3. 在 `beforeEach` 中定义装饰类
4. 测试装饰器的各种配置选项

### Q9: 装饰器测试中如何模拟 logger？
**A**: 创建 mock logger 对象，包含所有日志级别方法：
```typescript
const mockLogger = {
  name: 'TestLogger',
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  // ... 其他级别
  isInfoEnabled: () => true,
};
```

### Q10: 测试异步方法装饰器时需要注意什么？
**A**: 使用 `async/await` 处理异步调用，并测试错误处理：
```typescript
it('应该记录异步方法抛出的错误', async () => {
  @Slf4j({ name: 'TestClass' })
  class TestClass {
    @Log({ logError: true })
    async asyncErrorMethod() {
      throw new Error('Async error');
    }
  }

  const instance = new TestClass();
  await expect(instance.asyncErrorMethod()).rejects.toThrow('Async error');
  expect(mockLogger.error).toHaveBeenCalled();
});
```

## 贡献指南

### 1. 代码规范
- 使用 TypeScript 编写类型安全的代码
- 遵循项目中的 ESLint 规则
- 添加适当的类型定义和注释
- 装饰器代码必须包含完整的类型定义

### 2. 测试要求
- 新功能必须包含单元测试
- 修复 bug 时必须添加回归测试
- 测试覆盖率不低于 80%
- 装饰器测试必须覆盖所有配置选项

#### 装饰器测试规范
- 使用 Vitest 作为测试框架
- 模拟 `LoggerMetadata` 和 `getLogger`
- 测试同步和异步方法
- 测试错误处理场景
- 测试边界条件（null/undefined 参数等）
- 测试匿名类处理
- 测试继承和组合场景
- 测试装饰器多次应用

#### 测试文件命名
- 装饰器测试文件：`[feature-name]-decorator.test.ts`
- 集成测试文件：`[feature-name].test.ts`
- 工具函数测试：`[util-name].test.ts`

### 3. 依赖管理
- 运行时依赖放在 `dependencies` 中
- 开发工具放在 `devDependencies` 中
- 可选集成放在 `peerDependencies` 中
- 装饰器功能依赖 `reflect-metadata`

### 4. 提交规范
- 使用语义化提交消息
- 提交前运行所有测试
- 更新相关文档
- 装饰器变更必须更新示例和测试

### 5. 装饰器开发指南
#### 添加新装饰器
1. 在 `src/decorators/` 目录创建新文件
2. 定义装饰器接口和实现
3. 添加类型定义到 `src/types.ts`
4. 创建单元测试文件
5. 更新 `src/index.ts` 导出
6. 添加使用示例

#### 装饰器测试模板
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewDecorator } from '../src/decorators/new.decorator';
import { enableDecoratorSupport } from '../src/utils/decorator-utils';

enableDecoratorSupport();

describe('@NewDecorator 测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该正确应用装饰器', () => {
    // 测试实现
  });

  it('应该支持配置选项', () => {
    // 测试各种配置
  });

  it('应该处理边界情况', () => {
    // 测试错误处理等
  });
});
```

### 6. 文档要求
- 新功能必须更新 README.md
- 装饰器必须提供完整的使用示例
- API 文档必须包含类型定义
- 测试文档说明如何运行和编写测试

## 许可证

MIT
