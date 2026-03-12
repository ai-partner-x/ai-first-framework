# API 文档

本文档提供了 @ai-partner-x/aiko-boot-codegen 的详细 API 参考。

## 目录

- [核心 API](#核心-api)
- [类型定义](#类型定义)
- [插件 API](#插件-api)
- [缓存 API](#缓存-api)
- [CLI API](#cli-api)

## 核心 API

### transpile

将 TypeScript 源代码转换为 Java 代码。

**签名：**

```typescript
function transpile(
  sourceCode: string,
  options: TranspilerOptions
): Map<string, string>
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `sourceCode` | `string` | 是 | TypeScript 源代码 |
| `options` | `TranspilerOptions` | 是 | 转换选项 |

**返回值：**

返回一个 `Map<string, string>`，其中键是 Java 文件名，值是生成的 Java 代码。

**示例：**

```typescript
import { transpile } from '@ai-partner-x/aiko-boot-codegen';

const sourceCode = `
  @Entity
  class User {
    @TableId
    id: number;
    name: string;
  }
`;

const result = transpile(sourceCode, {
  packageName: 'com.example.entity',
});

console.log(result.get('User.java'));
```

### parseSourceFile

解析 TypeScript 源文件并提取类信息。

**签名：**

```typescript
function parseSourceFile(
  sourceCode: string,
  fileName?: string
): ParsedClass[]
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `sourceCode` | `string` | 是 | TypeScript 源代码 |
| `fileName` | `string` | 否 | 文件名（默认为 'source.ts'） |

**返回值：**

返回一个 `ParsedClass[]` 数组，包含解析的类信息。

**示例：**

```typescript
import { parseSourceFile } from '@ai-partner-x/aiko-boot-codegen';

const sourceCode = `
  @Entity
  class User {
    id: number;
  }
`;

const classes = parseSourceFile(sourceCode);
console.log(classes[0].name); // 'User'
console.log(classes[0].decorators); // [{ name: 'Entity', args: {} }]
```

### parseSourceFileFull

解析 TypeScript 源文件并返回完整信息（包括导入、注释、接口等）。

**签名：**

```typescript
function parseSourceFileFull(
  sourceCode: string,
  fileName?: string
): ParsedSourceFile
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `sourceCode` | `string` | 是 | TypeScript 源代码 |
| `fileName` | `string` | 否 | 文件名（默认为 'source.ts'） |

**返回值：**

返回一个 `ParsedSourceFile` 对象，包含完整的解析信息。

**示例：**

```typescript
import { parseSourceFileFull } from '@ai-partner-x/aiko-boot-codegen';

const sourceCode = `
  import { Entity } from '@ai-partner-x/aiko-boot-starter-orm';

  @Entity
  class User {
    id: number;
  }
`;

const result = parseSourceFileFull(sourceCode);
console.log(result.imports); // 导入信息
console.log(result.classes); // 类信息
console.log(result.interfaces); // 接口信息
console.log(result.comments); // 注释信息
```

### generateJavaClass

生成 Java 类代码。

**签名：**

```typescript
function generateJavaClass(
  parsedClass: ParsedClass,
  options: GeneratorOptions
): string
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `parsedClass` | `ParsedClass` | 是 | 解析的类信息 |
| `options` | `GeneratorOptions` | 是 | 生成器选项 |

**返回值：**

返回生成的 Java 代码字符串。

**示例：**

```typescript
import { generateJavaClass } from '@ai-partner-x/aiko-boot-codegen';

const parsedClass = {
  name: 'User',
  decorators: [{ name: 'Entity', args: {} }],
  fields: [
    { name: 'id', type: 'number', decorators: [{ name: 'TableId', args: {} }] },
    { name: 'name', type: 'string', decorators: [] },
  ],
  methods: [],
};

const javaCode = generateJavaClass(parsedClass, {
  packageName: 'com.example.entity',
  useLombok: false,
  javaVersion: '17',
  springBootVersion: '3.2.0',
});

console.log(javaCode);
```

### generateApiClient

生成前端 API 客户端代码。

**签名：**

```typescript
function generateApiClient(options?: CodegenOptions): void
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `options` | `CodegenOptions` | 否 | 代码生成选项 |

**CodegenOptions：**

| 属性 | 类型 | 默认值 | 说明 |
|--------|--------|----------|------|
| `srcDir` | `string` | `'./src'` | 源目录 |
| `outDir` | `string` | `'./dist/client'` | 输出目录 |
| `silent` | `boolean` | `false` | 是否静默模式 |

**示例：**

```typescript
import { generateApiClient } from '@ai-partner-x/aiko-boot-codegen';

generateApiClient({
  srcDir: './src',
  outDir: './dist/client',
  silent: false,
});
```

## 类型定义

### TranspilerOptions

转换器选项。

```typescript
interface TranspilerOptions {
  /** Java 包名 */
  packageName: string;
  
  /** 是否使用 Lombok */
  useLombok?: boolean;
  
  /** Java 版本 */
  javaVersion?: '11' | '17' | '21';
  
  /** Spring Boot 版本 */
  springBootVersion?: string;
  
  /** 插件注册表 */
  pluginRegistry?: PluginRegistry;
  
  /** 源文件路径（用于插件上下文） */
  sourceFile?: string;
  
  /** 当前文件中的所有解析类（用于插件上下文） */
  allClasses?: ParsedClass[];
}
```

### GeneratorOptions

生成器选项（扩展自 TranspilerOptions）。

```typescript
interface GeneratorOptions extends TranspilerOptions {
  /** 输出目录 */
  outDir?: string;
}
```

### ParsedClass

解析的类信息。

```typescript
interface ParsedClass {
  /** 类名 */
  name: string;
  
  /** 装饰器 */
  decorators: ParsedDecorator[];
  
  /** 字段 */
  fields: ParsedField[];
  
  /** 方法 */
  methods: ParsedMethod[];
  
  /** 构造函数 */
  constructor?: ParsedConstructor;
  
  /** 注释 */
  comment?: ParsedComment;
}
```

### ParsedDecorator

解析的装饰器信息。

```typescript
interface ParsedDecorator {
  /** 装饰器名称 */
  name: string;
  
  /** 装饰器参数 */
  args: Record<string, any>;
}
```

### ParsedField

解析的字段信息。

```typescript
interface ParsedField {
  /** 字段名 */
  name: string;
  
  /** 字段类型 */
  type: string;
  
  /** 装饰器 */
  decorators: ParsedDecorator[];
  
  /** 是否可选 */
  optional?: boolean;
  
  /** 注释 */
  comment?: ParsedComment;
}
```

### ParsedMethod

解析的方法信息。

```typescript
interface ParsedMethod {
  /** 方法名 */
  name: string;
  
  /** 返回类型 */
  returnType: string;
  
  /** 参数 */
  parameters: ParsedParameter[];
  
  /** 装饰器 */
  decorators: ParsedDecorator[];
  
  /** 是否异步 */
  isAsync?: boolean;
  
  /** 方法体 */
  body?: ParsedStatement[];
  
  /** 注释 */
  comment?: ParsedComment;
}
```

### ParsedParameter

解析的参数信息。

```typescript
interface ParsedParameter {
  /** 参数名 */
  name: string;
  
  /** 参数类型 */
  type: string;
  
  /** 装饰器 */
  decorators: ParsedDecorator[];
}
```

### ParsedSourceFile

解析的源文件信息。

```typescript
interface ParsedSourceFile {
  /** 文件路径 */
  filePath: string;
  
  /** 导入 */
  imports: ParsedImport[];
  
  /** 类 */
  classes: ParsedClass[];
  
  /** 接口 */
  interfaces: ParsedInterface[];
  
  /** 注释 */
  comments: ParsedComment[];
}
```

### ParsedImport

解析的导入信息。

```typescript
interface ParsedImport {
  /** 模块路径 */
  modulePath: string;
  
  /** 命名导入 */
  namedImports: string[];
  
  /** 默认导入 */
  defaultImport?: string;
  
  /** 命名空间导入 */
  namespaceImport?: string;
  
  /** 是否仅类型导入 */
  isTypeOnly?: boolean;
}
```

### ParsedInterface

解析的接口信息。

```typescript
interface ParsedInterface {
  /** 接口名 */
  name: string;
  
  /** 属性 */
  properties: ParsedInterfaceProperty[];
  
  /** 装饰器 */
  decorators: ParsedDecorator[];
  
  /** 注释 */
  comment?: ParsedComment;
  
  /** 是否导出 */
  isExported?: boolean;
}
```

### ParsedInterfaceProperty

解析的接口属性信息。

```typescript
interface ParsedInterfaceProperty {
  /** 属性名 */
  name: string;
  
  /** 属性类型 */
  type: string;
  
  /** 是否可选 */
  optional?: boolean;
  
  /** 注释 */
  comment?: string;
}
```

### ParsedComment

解析的注释信息。

```typescript
interface ParsedComment {
  /** 注释类型 */
  type: 'jsdoc' | 'block' | 'line';
  
  /** 注释文本 */
  text: string;
  
  /** JSDoc 标签 */
  tags?: { tag: string; text: string }[];
}
```

## 插件 API

### TranspilePlugin

插件接口。

```typescript
interface TranspilePlugin {
  /** 插件名称 */
  name: string;
  
  /** 插件优先级（数字越大执行越早） */
  priority?: number;
  
  /** 转换装饰器 */
  transformDecorator?: (decorator: ParsedDecorator, context: TransformContext) => ParsedDecorator;
  
  /** 转换类型 */
  transformType?: (tsType: string, context: TransformContext) => string;
  
  /** 转换方法 */
  transformMethod?: (method: ParsedMethod, context: TransformContext) => ParsedMethod;
  
  /** 转换类 */
  transformClass?: (cls: ParsedClass, context: TransformContext) => ParsedClass;
  
  /** 后处理 */
  postProcess?: (javaCode: string, context: TransformContext) => string;
  
  /** 生成额外代码 */
  generateAdditional?: (cls: ParsedClass, context: TransformContext) => string | null;
}
```

### TransformContext

转换上下文。

```typescript
interface TransformContext {
  /** 源文件路径 */
  sourceFile: string;
  
  /** 当前类名 */
  className: string;
  
  /** 类类型 */
  classType: 'entity' | 'repository' | 'service' | 'controller' | 'dto' | 'redis' | 'mq' | 'security' | 'admin' | 'unknown';
  
  /** 转换器选项 */
  options: TranspilerOptions;
  
  /** 当前文件中的所有解析类 */
  allClasses: ParsedClass[];
}
```

### PluginRegistry

插件注册表。

```typescript
class PluginRegistry {
  /** 注册插件 */
  register(plugin: TranspilePlugin): void;
  
  /** 注册多个插件 */
  registerAll(plugins: TranspilePlugin[]): void;
  
  /** 获取所有插件 */
  getPlugins(): TranspilePlugin[];
  
  /** 应用装饰器转换 */
  applyDecoratorTransform(decorator: ParsedDecorator, context: TransformContext): ParsedDecorator;
  
  /** 应用类型转换 */
  applyTypeTransform(tsType: string, context: TransformContext): string;
  
  /** 应用方法转换 */
  applyMethodTransform(method: ParsedMethod, context: TransformContext): ParsedMethod;
  
  /** 应用类转换 */
  applyClassTransform(cls: ParsedClass, context: TransformContext): ParsedClass;
  
  /** 应用后处理 */
  applyPostProcess(javaCode: string, context: TransformContext): string;
}
```

## 缓存 API

### calculateHash

计算文件内容的 SHA-256 哈希值。

**签名：**

```typescript
function calculateHash(content: string): string
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `content` | `string` | 是 | 文件内容 |

**返回值：**

返回 SHA-256 哈希字符串。

### loadCache

从磁盘加载缓存。

**签名：**

```typescript
function loadCache(): CacheData
```

**返回值：**

返回缓存数据对象。

### saveCache

保存缓存到磁盘。

**签名：**

```typescript
function saveCache(cache: CacheData): void
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `cache` | `CacheData` | 是 | 缓存数据 |

### hasFileChanged

检查文件自上次生成后是否已更改。

**签名：**

```typescript
function hasFileChanged(filePath: string, content: string): boolean
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `filePath` | `string` | 是 | 文件路径 |
| `content` | `string` | 是 | 文件内容 |

**返回值：**

如果文件已更改返回 `true`，否则返回 `false`。

### updateCacheEntry

更新文件的缓存条目。

**签名：**

```typescript
function updateCacheEntry(filePath: string, content: string): void
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `filePath` | `string` | 是 | 文件路径 |
| `content` | `string` | 是 | 文件内容 |

### removeCacheEntry

删除文件的缓存条目。

**签名：**

```typescript
function removeCacheEntry(filePath: string): void
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `filePath` | `string` | 是 | 文件路径 |

### clearCache

清除所有缓存条目。

**签名：**

```typescript
function clearCache(): void
```

### getCacheStats

获取缓存统计信息。

**签名：**

```typescript
function getCacheStats(): { total: number; stale: number }
```

**返回值：**

返回包含缓存统计信息的对象。

### cleanupStaleCache

清理过期的缓存条目。

**签名：**

```typescript
function cleanupStaleCache(): void
```

## CLI API

### transpileCommand

转换命令处理器。

**签名：**

```typescript
async function transpileCommand(source: string, options: TranspileOptions): Promise<void>
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|--------|--------|------|
| `source` | `string` | 是 | 源目录或文件 |
| `options` | `TranspileOptions` | 是 | 转换选项 |

**示例：**

```typescript
import { transpileCommand } from '@ai-partner-x/aiko-boot-codegen/cli';

await transpileCommand('./src', {
  out: './gen',
  package: 'com.example',
  lombok: false,
  javaVersion: '17',
  springBoot: '3.2.0',
  dryRun: false,
  verbose: true,
  incremental: true,
});
```

## 常量

### TYPE_MAPPING

TypeScript 到 Java 类型映射。

```typescript
const TYPE_MAPPING: Record<string, string> = {
  'number': 'Integer',
  'string': 'String',
  'boolean': 'Boolean',
  'Date': 'LocalDateTime',
  'any': 'Object',
  'void': 'void',
  'null': 'null',
  'undefined': 'null',
};
```

### ID_TYPE_MAPPING

ID 类型映射。

```typescript
const ID_TYPE_MAPPING: Record<string, string> = {
  default: 'Long',
  redis: 'String',
  age: 'Integer',
};
```

### DECORATOR_MAPPING

TypeScript 装饰器到 Java 注解映射。

```typescript
const DECORATOR_MAPPING: Record<string, string> = {
  'Entity': '@TableName',
  'Repository': '@Repository',
  'Service': '@Service',
  'RestController': '@RestController',
  // ... 更多映射
};
```

### IMPORT_MAPPING

TypeScript 模块到 Java 导入映射。

```typescript
const IMPORT_MAPPING: Record<string, string[]> = {
  '@ai-partner-x/aiko-boot': [
    'org.springframework.stereotype.Service',
    'org.springframework.web.bind.annotation.RestController',
    // ... 更多导入
  ],
  // ... 更多模块映射
};
```

## 错误处理

代码生成器提供完善的错误处理：

### 错误类型

- `parse` - 语法解析错误
- `type` - 类型错误
- `other` - 其他错误

### 错误报告

错误信息会输出到 `codegen-errors.json`：

```json
[
  {
    "file": "path/to/file.ts",
    "error": "Error message",
    "type": "parse"
  }
]
```

## 示例

### 完整示例

```typescript
import { transpile } from '@ai-partner-x/aiko-boot-codegen';

const sourceCode = `
  import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';
  import { Service, Autowired, Transactional } from '@ai-partner-x/aiko-boot';

  @Entity
  class User {
    @TableId
    id: number;

    @TableField('user_name')
    name: string;

    @TableField('user_email')
    email: string;

    createdAt: Date;
  }

  @Service
  class UserService {
    @Autowired
    private userRepository: UserRepository;

    @Transactional
    getUser(id: number): User {
      return this.userRepository.selectById(id);
    }
  }
`;

const result = transpile(sourceCode, {
  packageName: 'com.example',
});

console.log(result.get('User.java'));
console.log(result.get('UserService.java'));
```

## 更多信息

- [README](./README.md) - 使用文档
- [PLUGIN_DEVELOPMENT.md](./PLUGIN_DEVELOPMENT.md) - 插件开发指南
- GitHub: https://github.com/ai-partner-x/ai-first-framework
