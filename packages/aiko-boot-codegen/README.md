# @ai-partner-x/aiko-boot-codegen

TypeScript 到 Java 代码生成器，专为 Aiko Boot 框架设计。

## 功能特性

- ✅ **完整的代码生成**：支持实体类、仓库接口、服务类、控制器类、DTO 类等
- ✅ **多组件支持**：支持 Redis、消息队列、安全认证、应用框架等组件
- ✅ **插件系统**：可扩展的插件架构，支持自定义转换逻辑
- ✅ **增量生成**：基于文件哈希的增量生成，仅重新生成变更的文件
- ✅ **类型映射**：自动将 TypeScript 类型映射到 Java 类型
- ✅ **装饰器转换**：自动将 TypeScript 装饰器转换为 Java 注解
- ✅ **错误处理**：完善的错误分类和报告机制
- ✅ **单元测试**：完整的测试覆盖，确保代码质量

## 安装

```bash
npm install @ai-partner-x/aiko-boot-codegen
```

## 快速开始

### 1. 创建 TypeScript 实体类

```typescript
import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';

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
```

### 2. 创建 TypeScript 仓库接口

```typescript
import { Repository } from '@ai-partner-x/aiko-boot-starter-orm';

@Repository
interface UserRepository {
  findById(id: number): User;
  findAll(): User[];
  save(user: User): void;
  deleteById(id: number): void;
}
```

### 3. 创建 TypeScript 服务类

```typescript
import { Service, Autowired, Transactional } from '@ai-partner-x/aiko-boot';

@Service
class UserService {
  @Autowired
  private userRepository: UserRepository;

  @Transactional
  getUser(id: number): User {
    return this.userRepository.selectById(id);
  }

  @Transactional
  createUser(user: User): void {
    this.userRepository.insert(user);
  }

  getAllUsers(): User[] {
    return this.userRepository.selectList(null);
  }
}
```

### 4. 创建 TypeScript 控制器类

```typescript
import { RestController, Autowired, GetMapping, PostMapping, PathVariable, RequestBody } from '@ai-partner-x/aiko-boot';

@RestController
class UserController {
  @Autowired
  private userService: UserService;

  @GetMapping('/users/{id}')
  getUser(@PathVariable('id') id: number): User {
    return this.userService.getUser(id);
  }

  @GetMapping('/users')
  getUsers(): User[] {
    return this.userService.getAllUsers();
  }

  @PostMapping('/users')
  createUser(@RequestBody user: User): void {
    this.userService.createUser(user);
  }
}
```

### 5. 运行代码生成器

```bash
# 生成所有文件
aiko-codegen transpile ./src --out ./gen --package com.example

# 使用增量生成（仅重新生成变更的文件）
aiko-codegen transpile ./src --out ./gen --package com.example --incremental

# 查看详细信息
aiko-codegen transpile ./src --out ./gen --package com.example --verbose
```

## 命令行选项

### transpile 命令

```bash
aiko-codegen transpile <source> [options]
```

**参数：**

- `<source>` - 源目录或文件（必填）

**选项：**

| 选项 | 简写 | 默认值 | 说明 |
|------|--------|----------|------|
| `--out` | `-o` | `./gen` | 输出目录 |
| `--package` | `-p` | `com.example` | Java 包名 |
| `--lombok` | | `false` | 生成 Lombok 注解 |
| `--java-version` | | `17` | 目标 Java 版本 (11, 17, 21) |
| `--spring-boot` | | `3.2.0` | Spring Boot 版本 |
| `--dry-run` | | `false` | 显示将要生成的文件而不写入 |
| `--verbose` | `-v` | `false` | 详细输出 |
| `--incremental` | | `false` | 启用增量生成（仅重新生成变更的文件） |

### validate 命令

```bash
aiko-codegen validate <source> [options]
```

**参数：**

- `<source>` - 源目录或文件（必填）

**选项：**

| 选项 | 简写 | 默认值 | 说明 |
|------|--------|----------|------|
| `--verbose` | `-v` | `false` | 详细输出 |

## 支持的组件

### ORM 组件

支持 MyBatis-Plus 注解：

- `@Entity` / `@TableName` - 实体类
- `@TableId` - 主键字段
- `@TableField` - 数据库字段
- `@Repository` / `@Mapper` - 仓库接口

### Redis 组件

支持 Spring Data Redis 注解：

- `@RedisHash` - Redis 实体
- `@RedisKey` / `@Id` - Redis 键
- `@RedisValue` / `@Indexed` - Redis 值
- `@RedisRepository` / `@RedisRepo` - Redis 仓库

### 消息队列组件

支持 Spring Cloud Stream 注解：

- `@EnableBinding` - 启用绑定
- `@StreamListener` / `@MqListener` - 监听器
- `@Output` / `@MqSender` - 发送器

### 安全认证组件

支持 Spring Security 注解：

- `@EnableGlobalMethodSecurity` - 启用全局方法安全
- `@PreAuthorize` - 预授权
- `@PostAuthorize` - 后授权
- `@Secured` - 安全
- `@RolesAllowed` - 角色允许
- `@AuthenticationPrincipal` - 认证主体

### 应用框架组件

支持管理框架注解：

- `@AdminModule` - 管理模块
- `@AdminMenu` - 管理菜单
- `@AdminRoute` - 管理路由
- `@AdminPermission` - 管理权限

## 类型映射

代码生成器自动将 TypeScript 类型映射到 Java 类型：

| TypeScript | Java |
|-----------|-------|
| `number` | `Integer` |
| `string` | `String` |
| `boolean` | `Boolean` |
| `Date` | `LocalDateTime` |
| `any` | `Object` |
| `void` | `void` |
| `null` | `null` |
| `undefined` | `null` |

### ID 类型映射

代码生成器支持不同场景下的 ID 类型：

- **默认**：`Long`（数据库主键）
- **Redis**：`String`（Redis 实体 ID）
- **年龄**：`Integer`（年龄等字段）

## 插件系统

### 内置插件

代码生成器包含以下内置插件：

- `mapperPlugin` - Mapper 转换
- `entityPlugin` - 实体转换
- `validationPlugin` - 验证注解转换
- `datePlugin` - 日期类型转换
- `servicePlugin` - 服务转换
- `controllerPlugin` - 控制器转换
- `queryWrapperPlugin` - QueryWrapper 转换

### 自定义插件

你可以创建自定义插件来扩展代码生成器的功能：

```typescript
import type { TranspilePlugin } from '@ai-partner-x/aiko-boot-codegen';

const customPlugin: TranspilePlugin = {
  name: 'custom-plugin',
  priority: 100,
  transformDecorator: (decorator, context) => {
    // 自定义装饰器转换逻辑
    return decorator;
  },
  transformType: (type, context) => {
    // 自定义类型转换逻辑
    return type;
  },
  transformMethod: (method, context) => {
    // 自定义方法转换逻辑
    return method;
  },
  transformClass: (cls, context) => {
    // 自定义类转换逻辑
    return cls;
  },
  postProcess: (javaCode, context) => {
    // 后处理生成的 Java 代码
    return javaCode;
  },
};
```

详细文档请参考 [PLUGIN_DEVELOPMENT.md](./PLUGIN_DEVELOPMENT.md)。

## 增量生成

代码生成器支持增量生成，基于文件哈希缓存：

### 工作原理

1. 计算源文件的 SHA-256 哈希值
2. 与缓存中的哈希值比较
3. 仅重新生成变更的文件
4. 自动清理 7 天以上的过期缓存

### 使用方法

```bash
# 启用增量生成
aiko-codegen transpile ./src --out ./gen --package com.example --incremental
```

### 缓存文件

缓存文件存储在 `.codegen-cache.json`，包含：

```json
{
  "path/to/file.ts": {
    "hash": "abc123...",
    "timestamp": 1234567890
  }
}
```

## 错误处理

代码生成器提供完善的错误处理：

### 错误分类

- **parse** - 语法解析错误
- **type** - 类型错误
- **other** - 其他错误

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

## 测试

运行测试：

```bash
npm test
```

测试覆盖：

- 解析器单元测试
- 插件系统测试
- 代码生成集成测试
- 类型映射测试

## API 文档

详细的 API 文档请参考 [API.md](./API.md)。

## 示例项目

查看 [examples](./examples) 目录获取完整的示例项目：

- [user-crud](./examples/user-crud) - 用户 CRUD 示例
- [redis-cache](./examples/redis-cache) - Redis 缓存示例
- [mq-demo](./examples/mq-demo) - 消息队列示例
- [security-demo](./examples/security-demo) - 安全认证示例

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

## 许可证

MIT

## 联系方式

- GitHub: https://github.com/ai-partner-x/ai-first-framework
- Issues: https://github.com/ai-partner-x/ai-first-framework/issues
