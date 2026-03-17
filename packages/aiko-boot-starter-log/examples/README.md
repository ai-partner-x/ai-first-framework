# aiko-boot-starter-log 自动配置使用指南

## 概述

`aiko-boot-starter-log` 现在支持基于 Spring Boot 风格的自动配置，可以通过 `app-config.json` 配置文件轻松管理日志行为。

## 核心特性

1. **自动配置**：基于 `@AutoConfiguration` 注解的自动发现和加载
2. **配置属性**：基于 `@ConfigurationProperties('logging')` 的配置绑定
3. **条件装配**：支持 `@ConditionalOnProperty` 等条件注解
4. **生命周期**：支持 `@OnApplicationReady` 等生命周期事件
5. **Bean 管理**：通过 `@Bean` 注解提供日志记录器工厂

## 快速开始

### 1. 安装依赖

```bash
npm install @ai-partner-x/aiko-boot-starter-log
npm install @ai-partner-x/aiko-boot  # 如果需要自动配置功能
```

### 2. 基本使用（无自动配置）

```typescript
import { getLogger } from '@ai-partner-x/aiko-boot-starter-log';

const logger = getLogger('MyApp');
logger.info('Hello World!');
```

### 3. 使用自动配置

#### 3.1 创建 `app-config.json` 文件

```json
{
  "logging": {
    "level": "debug",
    "format": "text",
    "colorize": true,
    "timestamp": true,
    "consoleEnabled": true,
    "fileEnabled": true,
    "filePath": "./logs/app.log",
    "fileMaxSize": "10m",
    "fileMaxFiles": 5
  }
}
```

#### 3.2 配置说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `level` | string | `"info"` | 日志级别：`debug`, `info`, `warn`, `error` |
| `format` | string | `"text"` | 日志格式：`json`, `text` |
| `colorize` | boolean | `true` | 是否启用颜色输出 |
| `timestamp` | boolean | `true` | 是否包含时间戳 |
| `consoleEnabled` | boolean | `true` | 是否启用控制台输出 |
| `fileEnabled` | boolean | `false` | 是否启用文件输出 |
| `filePath` | string | `"./logs/app.log"` | 文件输出路径 |
| `fileMaxSize` | string | `"10m"` | 文件最大大小（支持：b, kb, mb, gb） |
| `fileMaxFiles` | number | `5` | 文件最大数量 |

#### 3.3 集成到 aiko-boot 应用

```typescript
import { createApp } from '@ai-partner-x/aiko-boot/boot';
import { logAutoConfigure } from '@ai-partner-x/aiko-boot-starter-log';

// 创建应用
const app = createApp({
  enableAutoConfiguration: true,
});

// 注册日志自动配置
app.configure(logAutoConfigure);
// 或者直接注册配置类
// app.registerAutoConfiguration(LogAutoConfiguration);

// 或者直接注册配置类
import { LogAutoConfiguration } from '@ai-partner-x/aiko-boot-starter-log';
app.registerAutoConfiguration(LogAutoConfiguration);

// 启动应用
await app.start();
```

#### 3.4 手动加载配置

```typescript
import { initFromAikoBoot, getLogger } from '@ai-partner-x/aiko-boot-starter-log';

// 从 aiko-boot 配置系统初始化
initFromAikoBoot();

// 获取日志记录器
const logger = getLogger('MyApp');
logger.info('配置已从 app-config.json 加载');
```

## 高级用法

### 1. 条件配置

```typescript
import { AutoConfiguration, ConditionalOnProperty } from '@ai-partner-x/aiko-boot/boot';

@AutoConfiguration({ order: 100 })
@ConditionalOnProperty('logging.enabled', { havingValue: 'true', matchIfMissing: true })
export class LogAutoConfiguration {
  // 配置类实现
}
```

### 2. 自定义传输器

通过配置文件可以启用/禁用不同的传输器：

```json
{
  "logging": {
    "consoleEnabled": true,
    "fileEnabled": true,
    "filePath": "./logs/app.log"
  }
}
```

### 3. 程序化配置

```typescript
import { initFromConfig } from '@ai-partner-x/aiko-boot-starter-log';

initFromConfig({
  level: 'debug',
  format: 'json',
  transports: [
    { type: 'console', level: 'info' },
    { type: 'file', filename: './logs/debug.log', level: 'debug' }
  ]
});
```

## 示例

查看 `auto-config-example.ts` 文件获取完整示例。

## 注意事项

1. **依赖要求**：自动配置功能需要 `@ai-partner-x/aiko-boot` 作为 peer dependency
2. **配置优先级**：程序化配置 > 配置文件配置 > 默认配置
3. **文件大小**：文件大小支持单位：`b`, `kb`, `mb`, `gb`（不区分大小写）
4. **向后兼容**：原有的 API 完全兼容，可以平滑升级

## 故障排除

### 1. 配置未生效
- 检查 `app-config.json` 文件路径是否正确
- 确认 `ConfigLoader.isLoaded()` 返回 `true`
- 检查日志级别是否正确设置

### 2. 文件写入失败
- 检查文件路径权限
- 确认目录是否存在
- 检查磁盘空间

### 3. 颜色输出不工作
- 确保 `colorize: true`
- 检查终端是否支持颜色
- 在生产环境中建议禁用颜色输出