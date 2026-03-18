# Aiko Boot 核心能力与插件开发指南

本文档介绍 Aiko Boot 框架的核心能力，以及如何开发一个符合规范的 Starter 插件。

## 目录

- [核心能力概览](#核心能力概览)
- [配置系统](#配置系统)
- [依赖注入](#依赖注入)
- [自动装配机制](#自动装配机制)
- [生命周期事件](#生命周期事件)
- [条件装配](#条件装配)
- [开发 Starter 插件](#开发-starter-插件)

---

## 核心能力概览

`@ai-partner-x/aiko-boot` 提供 Spring Boot 风格的 TypeScript 框架核心能力：

| 能力 | 说明 | 对应装饰器/API |
|------|------|----------------|
| **配置加载** | 多格式配置文件支持 | `ConfigLoader`, `@ConfigurationProperties` |
| **依赖注入** | IoC 容器 | `@Autowired`, `@Injectable`, `@Singleton` |
| **自动装配** | 约定优于配置 | `@AutoConfiguration`, `@Bean` |
| **条件装配** | 条件化加载组件 | `@ConditionalOnProperty`, `@ConditionalOnClass` |
| **生命周期** | 应用生命周期钩子 | `@OnApplicationReady`, `@OnApplicationShutdown` |
| **组件扫描** | 自动扫描注册组件 | `createApp({ scanDirs: [...] })` |

---

## 配置系统

### 配置加载顺序

```
优先级（低 → 高）：
1. app.config.ts      # TypeScript 配置（推荐）
2. app.config.json    # JSON 配置
3. app.config.yaml    # YAML 配置
4. app.config.{profile}.json  # Profile 特定配置
5. 环境变量 APP_*     # 环境变量覆盖
```

### 配置文件示例

```typescript
// app.config.ts （推荐）
export default {
  server: {
    port: 3001,
    shutdown: 'graceful',  // graceful | immediate
  },
  logging: {
    level: {
      root: 'info',  // debug | info | warn | error
    },
  },
  database: {
    type: 'sqlite',
    filename: './data/app.db',
  },
};
```

### ConfigLoader API

```typescript
import { ConfigLoader } from '@ai-partner-x/aiko-boot/boot';

// 获取单个配置值
const port = ConfigLoader.get<number>('server.port', 3000);

// 获取配置前缀下的所有配置
const dbConfig = ConfigLoader.getPrefix('database');
// => { type: 'sqlite', filename: './data/app.db' }

// 程序化设置配置（用于测试）
ConfigLoader.setConfig({ server: { port: 8080 } });
```

### @ConfigurationProperties

将配置绑定到类，自动注入配置值：

```typescript
import { ConfigurationProperties } from '@ai-partner-x/aiko-boot/boot';

@ConfigurationProperties('database')
export class DatabaseProperties {
  type?: 'postgres' | 'sqlite' | 'mysql';
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  filename?: string;  // SQLite
}

// 使用时自动从配置文件绑定值
@Service()
export class MyService {
  @Autowired()
  private dbProps!: DatabaseProperties;
  
  connect() {
    console.log(this.dbProps.host);  // 自动绑定 database.host
  }
}
```

### @Value 单值注入

```typescript
import { Value } from '@ai-partner-x/aiko-boot/boot';

@Service()
export class MyService {
  @Value('server.port', 3000)
  private port!: number;
}
```

---

## 依赖注入

### 核心装饰器

| 装饰器 | 用途 |
|--------|------|
| `@Injectable()` | 标记类可被注入 |
| `@Singleton()` | 单例模式 |
| `@Autowired()` | 自动注入依赖 |
| `@Service()` | 服务层组件（包含 Injectable + Singleton） |
| `@Component()` | 通用组件（包含 Injectable + Singleton） |

### 使用示例

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot';

@Service()
export class UserService {
  @Autowired()
  private userMapper!: UserMapper;

  @Autowired()
  private cacheService!: CacheService;
}
```

### Container API

```typescript
import { Container } from '@ai-partner-x/aiko-boot';

// 手动解析依赖
const service = Container.resolve(UserService);

// 检查是否已注册
const isRegistered = Container.isRegistered(UserService);

// 手动注册实例
Container.registerInstance(CacheService, new RedisCacheService());
```

---

## 自动装配机制

### 约定优于配置

Aiko Boot 采用 **约定优于配置** 的自动装配机制：

1. **包名约定**: `aiko-boot-starter-*`
2. **入口约定**: 从 `dist/index.js` 导出 `@AutoConfiguration` 标记的类
3. **自动发现**: `createApp()` 启动时自动扫描 `node_modules/@ai-partner-x/aiko-boot-starter-*`

### @AutoConfiguration

```typescript
import { 
  AutoConfiguration, 
  ConditionalOnProperty,
  OnApplicationReady,
} from '@ai-partner-x/aiko-boot/boot';

@AutoConfiguration({ order: 10 })  // order 越小越先加载
@ConditionalOnProperty('database.type')  // 条件：配置了 database.type 才加载
export class OrmAutoConfiguration {
  
  @OnApplicationReady({ order: -100 })  // 应用启动后执行
  async initializeDatabase(): Promise<void> {
    console.log('Initializing database...');
  }
}
```

### @Bean 方法级配置

```typescript
import { 
  AutoConfiguration, 
  Bean, 
  ConditionalOnMissingBean 
} from '@ai-partner-x/aiko-boot/boot';

@AutoConfiguration()
export class CacheAutoConfiguration {
  
  @Bean()
  @ConditionalOnMissingBean(CacheService)  // 用户未自定义时才创建
  createCacheService(): CacheService {
    return new InMemoryCacheService();
  }
}
```

### 加载顺序控制

```typescript
import { 
  AutoConfiguration, 
  AutoConfigureBefore, 
  AutoConfigureAfter 
} from '@ai-partner-x/aiko-boot/boot';

@AutoConfiguration({ order: 20 })
@AutoConfigureAfter('OrmAutoConfiguration')  // 在 ORM 之后加载
@AutoConfigureBefore('WebAutoConfiguration') // 在 Web 之前加载
export class MyAutoConfiguration {
  // ...
}
```

---

## 生命周期事件

### 事件顺序

```
createApp() 启动顺序：
1. 配置加载
2. ApplicationStarting     # 应用开始启动
3. 组件扫描 (mapper/ service/ controller/)
4. 自动配置处理
5. ApplicationStarted      # 组件加载完成
6. ApplicationReady        # 应用就绪（可开始处理请求）

关闭顺序：
1. SIGINT/SIGTERM 信号
2. ApplicationShutdown     # 优雅关闭
```

### 生命周期装饰器

```typescript
import { 
  OnApplicationStarting,
  OnApplicationStarted,
  OnApplicationReady,
  OnApplicationShutdown,
} from '@ai-partner-x/aiko-boot/boot';

@AutoConfiguration()
export class MyAutoConfiguration {
  
  @OnApplicationStarting()
  onStarting(): void {
    console.log('Application is starting...');
  }
  
  @OnApplicationReady({ order: -100 })  // order 越小越先执行
  async onReady(): Promise<void> {
    console.log('Application is ready!');
  }
  
  @OnApplicationShutdown({ order: 100 })  // order 越大越后执行（关闭时反向）
  async onShutdown(): Promise<void> {
    console.log('Gracefully shutting down...');
  }
}
```

---

## 条件装配

### 条件装饰器

| 装饰器 | 说明 | 示例 |
|--------|------|------|
| `@ConditionalOnProperty` | 配置存在/匹配时 | `@ConditionalOnProperty('cache.enabled', { havingValue: 'true' })` |
| `@ConditionalOnClass` | 类存在时 | `@ConditionalOnClass([Redis])` |
| `@ConditionalOnMissingClass` | 类不存在时 | `@ConditionalOnMissingClass([Legacy])` |
| `@ConditionalOnBean` | Bean 存在时 | `@ConditionalOnBean(DataSource)` |
| `@ConditionalOnMissingBean` | Bean 不存在时 | `@ConditionalOnMissingBean(CacheService)` |
| `@ConditionalOnExpression` | 表达式为真时 | `@ConditionalOnExpression(() => process.env.NODE_ENV === 'prod')` |

### 使用示例

```typescript
@AutoConfiguration()
@ConditionalOnProperty('redis.enabled', { havingValue: 'true' })
@ConditionalOnClass([Redis])
export class RedisAutoConfiguration {
  
  @Bean()
  @ConditionalOnMissingBean(CacheService)
  createRedisCache(): CacheService {
    return new RedisCacheService();
  }
}
```

---

## 开发 Starter 插件

以 `aiko-boot-starter-orm` 为例，介绍如何开发一个符合规范的 Starter 插件。

### 1. 项目结构

```
packages/aiko-boot-starter-myplugin/
├── src/
│   ├── auto-configuration.ts   # 自动配置类（必需）
│   ├── config-augment.ts       # 类型扩展（可选）
│   └── index.ts                # 入口导出
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### 2. package.json

```json
{
  "name": "@ai-partner-x/aiko-boot-starter-myplugin",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "@ai-partner-x/aiko-boot": "workspace:*"
  },
  "devDependencies": {
    "@ai-partner-x/aiko-boot": "workspace:*",
    "typescript": "^5.0.0",
    "tsup": "^8.0.0"
  }
}
```

### 3. 自动配置类

```typescript
// src/auto-configuration.ts
import 'reflect-metadata';
import {
  AutoConfiguration,
  ConfigurationProperties,
  ConditionalOnProperty,
  OnApplicationReady,
  OnApplicationShutdown,
  ConfigLoader,
} from '@ai-partner-x/aiko-boot/boot';
import { Component } from '@ai-partner-x/aiko-boot';

/**
 * 配置属性类 - 绑定 app.config.ts 中的 myplugin.* 配置
 */
@ConfigurationProperties('myplugin')
export class MyPluginProperties {
  enabled?: boolean;
  host?: string;
  port?: number;
  timeout?: number;
}

/**
 * 自动配置类
 */
@AutoConfiguration({ order: 50 })
@ConditionalOnProperty('myplugin.enabled', { havingValue: 'true' })
@Component()
export class MyPluginAutoConfiguration {
  private client: any = null;

  /**
   * 应用就绪时初始化
   */
  @OnApplicationReady({ order: 0 })
  async initialize(): Promise<void> {
    const host = ConfigLoader.get<string>('myplugin.host', 'localhost');
    const port = ConfigLoader.get<number>('myplugin.port', 6379);
    
    console.log(`🔌 [myplugin] Connecting to ${host}:${port}...`);
    // this.client = await createConnection({ host, port });
    console.log(`✅ [myplugin] Connected`);
  }

  /**
   * 应用关闭时清理
   */
  @OnApplicationShutdown({ order: 50 })
  async cleanup(): Promise<void> {
    if (this.client) {
      console.log('🔌 [myplugin] Disconnecting...');
      // await this.client.disconnect();
      console.log('✅ [myplugin] Disconnected');
    }
  }
}
```

### 4. 类型扩展（TypeScript 智能提示）

```typescript
// src/config-augment.ts
import type { MyPluginProperties } from './auto-configuration.js';

export type { MyPluginProperties };

/**
 * 扩展 AppConfig 接口，让 app.config.ts 有智能提示
 */
declare module '@ai-partner-x/aiko-boot' {
  interface AppConfig {
    /** MyPlugin 配置 */
    myplugin?: MyPluginProperties;
  }
}
```

### 5. 入口导出

```typescript
// src/index.ts
export * from './auto-configuration.js';
export * from './config-augment.js';

// 导出其他公共 API
export * from './client.js';
export * from './decorators.js';
```

### 6. 构建配置

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@ai-partner-x/aiko-boot'],
});
```

### 7. 使用插件

用户只需安装包并配置：

```bash
pnpm add @ai-partner-x/aiko-boot-starter-myplugin
```

```typescript
// app.config.ts
import type { AppConfig } from '@ai-partner-x/aiko-boot';

export default {
  myplugin: {
    enabled: true,
    host: 'localhost',
    port: 6379,
  },
} satisfies AppConfig;  // 有完整的类型提示
```

```typescript
// server.ts
import { createApp } from '@ai-partner-x/aiko-boot';
import '@ai-partner-x/aiko-boot-starter-myplugin';  // 导入即自动装配

const app = await createApp({ srcDir: __dirname });
app.run();

// 启动日志：
// 🔍 [aiko-boot] Scanning node_modules...
// 📦 [aiko-boot] Auto-configured: MyPluginAutoConfiguration (from aiko-boot-starter-myplugin)
// ✅ [aiko-boot] Processed: MyPluginAutoConfiguration
// 🔌 [myplugin] Connecting to localhost:6379...
// ✅ [myplugin] Connected
```

---

## 完整示例：aiko-boot-starter-orm

`aiko-boot-starter-orm` 是一个完整的 Starter 实现参考：

### 配置属性

```typescript
@ConfigurationProperties('database')
export class DatabaseProperties {
  type?: 'postgres' | 'sqlite' | 'mysql';
  filename?: string;  // SQLite
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}
```

### 自动配置

```typescript
@AutoConfiguration({ order: 10 })
@ConditionalOnProperty('database.type')
@Component()
export class OrmAutoConfiguration {
  
  @OnApplicationReady({ order: -100 })
  async initializeDatabase(): Promise<void> {
    const type = ConfigLoader.get<string>('database.type');
    console.log(`🗄️  [aiko-orm] Initializing ${type} database...`);
    // 初始化数据库连接
  }

  @OnApplicationShutdown({ order: 100 })
  async closeDatabase(): Promise<void> {
    console.log('🗄️  [aiko-orm] Closing database connection...');
    // 关闭连接
  }
}
```

### 用户配置

```typescript
// app.config.ts
export default {
  database: {
    type: 'sqlite',
    filename: './data/app.db',
  },
};
```

---

## 最佳实践

### 1. 命名规范
- 包名: `@ai-partner-x/aiko-boot-starter-{功能}`
- 配置前缀: 简短有意义，如 `database`, `redis`, `mq`
- 自动配置类: `{Feature}AutoConfiguration`

### 2. 条件装配
- 总是使用 `@ConditionalOnProperty` 让用户可控
- 使用 `@ConditionalOnMissingBean` 允许用户覆盖默认实现

### 3. 生命周期
- 初始化用 `@OnApplicationReady`，order 负数优先
- 清理用 `@OnApplicationShutdown`，order 正数延后

### 4. 类型扩展
- 提供 `config-augment.ts` 扩展 `AppConfig`
- 让用户的 `app.config.ts` 有完整智能提示

### 5. 日志输出
- 使用 emoji 前缀标识模块: `🗄️  [aiko-orm]`
- 关键操作输出日志，便于调试
