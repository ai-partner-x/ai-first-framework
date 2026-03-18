# @ai-partner-x/aiko-boot-codegen 使用说明书

## 文档信息

| 名称 | 内容 |
| ---- | ---- |
| 创建人 | Claude AI Assistant |
| 创建时间 | 2026-03-18 |
| 版本 | 1.0 |
| 状态 | 初稿 |

## 目录
- [@ai-partner-x/aiko-boot-codegen 使用说明书](#ai-partner-xaiko-boot-codegen-使用说明书)
  - [文档信息](#文档信息)
  - [目录](#目录)
  - [一、需求概述](#一需求概述)
    - [1.1 背景](#11-背景)
    - [1.2 目标](#12-目标)
  - [二、技术选型](#二技术选型)
    - [2.1 核心技术栈](#21-核心技术栈)
    - [2.2 技术选型理由](#22-技术选型理由)
  - [三、架构设计](#三架构设计)
    - [3.1 总体架构](#31-总体架构)
    - [3.2 目录结构](#32-目录结构)
    - [3.3 核心模块设计](#33-核心模块设计)
  - [四、核心功能实现](#四核心功能实现)
    - [4.1 代码生成核心](#41-代码生成核心)
    - [4.2 增量更新优化](#42-增量更新优化)
    - [4.3 错误处理机制](#43-错误处理机制)
    - [4.4 CLI 命令行工具](#44-cli-命令行工具)
  - [五、使用说明](#五使用说明)
    - [5.1 安装依赖](#51-安装依赖)
    - [5.2 配置脚本](#52-配置脚本)
    - [5.3 运行命令](#53-运行命令)
    - [5.4 配置选项](#54-配置选项)
  - [六、示例](#六示例)
    - [6.1 基本使用示例](#61-基本使用示例)
    - [6.2 自定义配置示例](#62-自定义配置示例)
    - [6.3 Watch 模式示例](#63-watch-模式示例)
  - [七、常见问题](#七常见问题)
    - [7.1 依赖安装问题](#71-依赖安装问题)
    - [7.2 代码生成失败问题](#72-代码生成失败问题)
    - [7.3 增量更新问题](#73-增量更新问题)
  - [八、附录](#八附录)
    - [8.1 主要依赖版本](#81-主要依赖版本)
    - [8.2 参考资源](#82-参考资源)

## 一、需求概述

### 1.1 背景

在现代前端开发中，API 客户端代码的编写是一个重复性的工作，需要根据后端 API 接口规范手动编写大量的 HTTP 请求代码。这不仅效率低下，而且容易出错，特别是当 API 接口发生变化时，需要手动更新所有相关的客户端代码。

为了解决这个问题，我们开发了 `@ai-partner-x/aiko-boot-codegen` 组件，它可以自动从 TypeScript 代码中解析 API 接口定义，并生成对应的前端 API 客户端代码，大大提高了开发效率和代码质量。

### 1.2 目标

1. 自动从 TypeScript 代码中解析 API 接口定义
2. 生成符合前端开发规范的 API 客户端代码
3. 支持增量更新，只更新发生变化的文件
4. 提供命令行工具，方便集成到构建流程中
5. 支持 watch 模式，实时监测文件变化并自动重新生成
6. 提供友好的错误提示，便于定位和解决问题

## 二、技术选型

### 2.1 核心技术栈

| 类别 | 技术/框架 | 版本 | 说明 |
|------|-----------|------|------|
| 基础语言 | TypeScript | 5.3.x | 提供类型安全和更好的开发体验 |
| 代码解析 | TypeScript Compiler API | 5.3.x | 用于解析 TypeScript 代码，提取接口定义 |
| 构建工具 | tsup | 8.x | 用于构建和打包组件 |
| 运行环境 | Node.js | 18.x+ | 用于运行代码生成工具 |
| 包管理 | pnpm | 8.x | 用于管理依赖 |

### 2.2 技术选型理由

1. **TypeScript**：
   - 提供类型安全，减少运行时错误
   - 更好的代码可读性和可维护性
   - 与 TypeScript 项目无缝集成

2. **TypeScript Compiler API**：
   - 官方提供的 API，用于解析 TypeScript 代码
   - 支持最新的 TypeScript 语法和特性
   - 提供完整的 AST（抽象语法树）解析能力

3. **tsup**：
   - 基于 esbuild，构建速度快
   - 支持 TypeScript 编译和打包
   - 配置简单，易于使用

4. **Node.js**：
   - 广泛使用的 JavaScript 运行环境
   - 支持文件系统操作和命令行工具开发
   - 生态系统丰富，易于集成其他工具

5. **pnpm**：
   - 快速的包管理器，节省磁盘空间
   - 支持 workspace 功能，便于管理 monorepo 项目
   - 与 npm 兼容，易于迁移

## 三、架构设计

### 3.1 总体架构

```
@ai-partner-x/aiko-boot-codegen
├── 源代码解析层
│   └── TypeScript 编译器 API
├── 代码生成层
│   ├── 控制器解析器
│   ├── 实体解析器
│   ├── DTO 解析器
│   └── 客户端代码生成器
├── 工具层
│   ├── 文件系统操作
│   ├── 增量更新逻辑
│   └── 错误处理
└── 命令行接口
    ├── 主命令
    ├── watch 模式
    └── force 模式
```

### 3.2 目录结构

```
packages/aiko-boot-codegen/
├── src/
│   ├── client-generator.ts     # 客户端代码生成器
│   ├── parser.ts               # TypeScript 代码解析器
│   └── index.ts                # 入口文件
├── package.json                # 包配置
├── tsconfig.json               # TypeScript 配置
└── README.md                   # 包说明文档
```

### 3.3 核心模块设计

1. **TypeScript 代码解析器**：
   - 解析 TypeScript 源代码，提取类、接口、装饰器等信息
   - 支持解析控制器、实体和 DTO 定义
   - 提取 HTTP 方法、路径、参数等信息

2. **客户端代码生成器**：
   - 生成符合前端开发规范的 API 客户端代码
   - 支持生成实体和 DTO 类型定义
   - 生成包含 fetch 实现的 API 客户端类

3. **增量更新模块**：
   - 检查源文件是否比目标文件新
   - 只更新发生变化的文件
   - 避免不必要的文件写入和 HMR 触发

4. **命令行工具**：
   - 提供主命令用于生成代码
   - 支持 watch 模式，实时监测文件变化
   - 支持 force 模式，强制重新生成所有文件

## 四、核心功能实现

### 4.1 代码生成核心

代码生成的核心流程包括：

1. **解析 TypeScript 源代码**：
   - 使用 TypeScript Compiler API 解析源代码
   - 提取控制器、实体和 DTO 定义
   - 分析装饰器信息，如 `@RestController`、`@GetMapping` 等

2. **生成 API 客户端代码**：
   - 为每个控制器生成对应的 API 客户端类
   - 生成实体和 DTO 类型定义
   - 实现 HTTP 请求方法，包括 GET、POST、PUT、DELETE 等

3. **生成索引文件**：
   - 生成 `index.ts` 文件，导出所有 API 客户端、实体和 DTO
   - 方便前端代码导入和使用

### 4.2 增量更新优化

增量更新的实现：

1. **检查文件修改时间**：
   - 比较源文件和目标文件的修改时间
   - 只处理源文件比目标文件新的文件

2. **内容比对**：
   - 比较生成的代码和现有代码的内容
   - 只有当内容发生变化时才写入文件
   - 避免触发不必要的 HMR

3. **统计信息输出**：
   - 输出生成、跳过和未变化的文件数量
   - 提供详细的统计信息，便于了解代码生成情况

### 4.3 错误处理机制

错误处理的实现：

1. **命令行错误捕获**：
   - 捕获代码生成过程中的错误
   - 提供友好的错误提示，包括错误信息和可能的解决方案
   - 支持错误堆栈输出，便于定位问题

2. **文件系统错误处理**：
   - 处理文件不存在、权限不足等错误
   - 提供详细的错误信息，便于用户解决问题

3. **TypeScript 解析错误处理**：
   - 处理 TypeScript 语法错误和类型错误
   - 提供详细的错误信息，包括错误位置和原因

### 4.4 CLI 命令行工具

命令行工具的实现：

1. **主命令**：
   - 执行代码生成
   - 支持配置选项，如源目录、输出目录等

2. **Watch 模式**：
   - 实时监测文件变化
   - 当文件发生变化时自动重新生成代码
   - 支持防抖，避免频繁重新生成

3. **Force 模式**：
   - 强制重新生成所有文件
   - 忽略增量更新检查

## 五、使用说明

### 5.1 安装依赖

在项目中安装 `@ai-partner-x/aiko-boot-codegen` 依赖：

```bash
# 使用 pnpm
pnpm add @ai-partner-x/aiko-boot-codegen

# 使用 npm
npm install @ai-partner-x/aiko-boot-codegen

# 使用 yarn
yarn add @ai-partner-x/aiko-boot-codegen
```

### 5.2 配置脚本

在 `package.json` 文件中添加代码生成脚本：

```json
{
  "scripts": {
    "codegen": "node scripts/codegen.cjs",
    "codegen:watch": "node scripts/codegen.cjs --watch",
    "build": "pnpm codegen && tsup"
  }
}
```

创建 `scripts/codegen.cjs` 脚本文件：

```javascript
#!/usr/bin/env node
const { generateApiClient, watchApiClient } = require('@ai-partner-x/aiko-boot-codegen');

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');
const isForce = process.argv.includes('--force') || process.argv.includes('-f');

function handleError(error) {
  console.error('\n❌ 代码生成失败:', error.message);
  console.error('\n请检查以下问题：');
  console.error('1. 源文件路径是否正确');
  console.error('2. TypeScript 代码是否有语法错误');
  console.error('3. 依赖是否正确安装');
  console.error('\n详细错误信息:', error.stack);
  process.exit(1);
}

if (isWatch) {
  try {
    watchApiClient();
  } catch (error) {
    handleError(error);
  }
} else {
  try {
    generateApiClient({ force: isForce });
  } catch (error) {
    handleError(error);
  }
}
```

### 5.3 运行命令

#### 生成 API 客户端代码

```bash
pnpm codegen
```

#### 生成 API 客户端代码（强制重新生成）

```bash
pnpm codegen --force
```

#### 启动 watch 模式

```bash
pnpm codegen:watch
```

### 5.4 配置选项

`generateApiClient` 函数支持以下配置选项：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| srcDir | string | './src' | 源代码目录 |
| outDir | string | './dist/client' | 输出目录 |
| silent | boolean | false | 是否静默模式，不输出日志 |
| force | boolean | false | 是否强制重新生成所有文件 |

## 六、示例

### 6.1 基本使用示例

#### 1. 定义控制器

```typescript
// src/controller/auth.controller.ts
import { RestController, PostMapping, RequestBody } from '@ai-partner-x/aiko-boot';
import { LoginDto, LoginResultDto } from '../dto/auth.dto';

@RestController({ path: '/auth' })
export class AuthController {
  @PostMapping('/login')
  async login(@RequestBody() dto: LoginDto): Promise<LoginResultDto> {
    // 实现登录逻辑
    return { token: 'xxx', user: { id: 1, username: 'admin' } };
  }
}
```

#### 2. 定义 DTO

```typescript
// src/dto/auth.dto.ts
export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResultDto {
  token: string;
  user: {
    id: number;
    username: string;
  };
}
```

#### 3. 生成 API 客户端代码

运行以下命令生成 API 客户端代码：

```bash
pnpm codegen
```

#### 4. 使用 API 客户端

```typescript
// src/app.ts
import { AuthApi } from './dist/client';

const authApi = new AuthApi('http://localhost:3000');

async function login() {
  try {
    const result = await authApi.login({ username: 'admin', password: '123456' });
    console.log('登录成功:', result);
  } catch (error) {
    console.error('登录失败:', error);
  }
}

login();
```

### 6.2 自定义配置示例

```javascript
// scripts/codegen.cjs
#!/usr/bin/env node
const { generateApiClient, watchApiClient } = require('@ai-partner-x/aiko-boot-codegen');

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

const options = {
  srcDir: './src',
  outDir: './src/api/client',
  silent: false
};

if (isWatch) {
  watchApiClient(options);
} else {
  generateApiClient(options);
}
```

### 6.3 Watch 模式示例

启动 watch 模式：

```bash
pnpm codegen:watch
```

现在，当你修改 `src/controller`、`src/entity` 或 `src/dto` 目录下的文件时，代码生成器会自动重新生成 API 客户端代码。

## 七、常见问题

### 7.1 依赖安装问题

**问题**：安装依赖时出现 `@ai-partner-x/aiko-boot-codegen` 找不到的错误。

**解决方案**：
- 确保 `@ai-partner-x/aiko-boot-codegen` 包已经发布到 npm registry
- 或者使用 workspace 协议：`"@ai-partner-x/aiko-boot-codegen": "workspace:*"`
- 或者使用 file 协议：`"@ai-partner-x/aiko-boot-codegen": "file:../../../packages/aiko-boot-codegen"`

### 7.2 代码生成失败问题

**问题**：代码生成失败，提示 TypeScript 语法错误。

**解决方案**：
- 检查 TypeScript 代码是否有语法错误
- 确保 TypeScript 版本与 `@ai-partner-x/aiko-boot-codegen` 兼容
- 检查装饰器是否正确使用

### 7.3 增量更新问题

**问题**：修改了源文件，但代码没有重新生成。

**解决方案**：
- 检查源文件是否在 `srcDir` 目录下
- 检查源文件的修改时间是否正确
- 使用 `--force` 参数强制重新生成所有文件

## 八、附录

### 8.1 主要依赖版本

```json
{
  "dependencies": {
    "typescript": "^5.3.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "@types/node": "^20.11.0"
  }
}
```

### 8.2 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [TypeScript Compiler API 文档](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [Node.js 官方文档](https://nodejs.org/)
- [pnpm 官方文档](https://pnpm.io/)
- [tsup 官方文档](https://tsup.egoist.dev/)