# Aiko Boot

**AI 可理解的全栈开发框架**

基于 TypeScript，采用 **Spring Boot 风格架构** + **MyBatis-Plus 风格 ORM API**，让 AI 能够理解、生成、优化您的全栈应用代码，并支持一键转译为 Java Spring Boot + MyBatis-Plus 项目。

## 🎯 核心理念

- **AI Native**: 使用 AI 最熟悉的语言 (TypeScript)
- **Spring Boot Style**: 熟悉的 Spring Boot 架构风格
- **MyBatis-Plus API**: 强大的条件构造器和通用 Mapper
- **Type Safe**: TypeScript + 装饰器保证代码质量
- **Java Compatible**: TypeScript 代码可转译为 Java Spring Boot + MyBatis-Plus

## 📦 工程结构

```
aiko-boot/
├── packages/
│   ├── aiko-boot/                      # 核心启动包 (DI + 自动配置)
│   ├── aiko-boot-starter-web/          # Web Starter (HTTP 装饰器)
│   ├── aiko-boot-starter-orm/          # ORM Starter (MyBatis-Plus API)
│   ├── aiko-boot-starter-validation/   # Validation Starter
│   ├── aiko-boot-starter-log/          # Logging Starter
│   ├── aiko-boot-codegen/              # TypeScript → Java 转译器
│   └── eslint-plugin-aiko-boot/        # ESLint Java 兼容规则
├── app/
│   ├── examples/                       # 示例项目
│   │   ├── user-crud/                  # 用户 CRUD 完整示例
│   │   └── admin/                      # 后台管理示例
│   └── framework/                      # 前端组件库
│       ├── admin-component/            # Admin UI 组件
│       ├── api-component/              # API 工具组件
│       └── mall-component/             # 商城组件
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Java 17+ (用于运行转译后的 Java 项目)

### 安装依赖

```bash
pnpm install
```

### 构建所有包

```bash
pnpm build
```

## 📖 文档站点（VitePress）

本仓库的文档源文件在 `docs/`，使用 VitePress 构建与预览：

```bash
# 本地开发（热更新）
pnpm docs:dev

# 构建静态站点（输出到 docs/.vitepress/dist）
pnpm docs:build

# 预览构建产物
pnpm docs:preview
```

### 运行示例项目

```bash
# 运行 TypeScript API 服务
cd app/examples/user-crud/packages/api
pnpm dev

# 生成 Java 代码
pnpm java

# 编译并运行 Java 项目
cd gen && mvn spring-boot:run
```

## 📚 核心包

### @ai-partner-x/aiko-boot

核心启动包，提供依赖注入和自动配置：

| 功能 | 说明 |
|------|------|
| `@Service` | 服务层装饰器 |
| `@Autowired` | 自动注入 |
| `@Configuration` | 配置类 |
| `@Bean` | Bean 定义 |
| `createApp()` | 应用启动入口 |

### @ai-partner-x/aiko-boot-starter-web

Web Starter，提供 HTTP 路由装饰器：

| 装饰器 | 说明 |
|--------|------|
| `@RestController` | REST 控制器 |
| `@GetMapping` | GET 请求映射 |
| `@PostMapping` | POST 请求映射 |
| `@PutMapping` | PUT 请求映射 |
| `@DeleteMapping` | DELETE 请求映射 |
| `@PathVariable` | 路径参数 |
| `@RequestParam` | 查询参数 |
| `@RequestBody` | 请求体 |

### @ai-partner-x/aiko-boot-starter-orm

MyBatis-Plus 风格 ORM，底层使用 Kysely：

| 功能 | 说明 |
|------|------|
| `@Entity` / `@TableName` | 实体表映射 |
| `@TableId` | 主键定义 |
| `@TableField` | 字段映射 |
| `@Mapper` | Mapper 装饰器 |
| `BaseMapper<T>` | 通用 CRUD |
| `QueryWrapper<T>` | 条件构造器 |
| `UpdateWrapper<T>` | 更新构造器 |

**支持数据库**: PostgreSQL、SQLite、MySQL

### @ai-partner-x/aiko-boot-starter-log

统一日志 Starter，基于 `winston` 风格的多级别、多传输配置，支持：

- `getLogger(name)` / `autoInit()` 一键初始化
- `logging` 配置块（默认元数据、console/file transports）
- HTTP 请求日志中间件与装饰器集成（详见文档 `aiko-boot-starter-log`）

### @ai-partner-x/aiko-boot-codegen

TypeScript → Java 转译器：

```bash
# 转译 TypeScript 代码到 Java
npx aiko-codegen transpile src -p com.example.app

# 输出到指定目录
npx aiko-codegen transpile src -o ./gen -p com.example.app
```

### @ai-partner-x/eslint-plugin-aiko-boot

ESLint 插件，确保 TypeScript 代码可转译为 Java：

```bash
# 安装
pnpm add -D @ai-partner-x/eslint-plugin-aiko-boot

# 使用 java-compat 配置
# .eslintrc.json
{
  "extends": ["plugin:@ai-partner-x/aiko-boot/java-compat"]
}
```

**主要规则**:
- `no-arrow-methods` - 禁止箭头函数作为类方法
- `no-destructuring-in-methods` - 禁止方法中使用解构
- `no-optional-chaining-in-methods` - 禁止可选链
- `no-nullish-coalescing` - 禁止空值合并
- `no-union-types` - 禁止联合类型

## 🎓 示例代码

### Entity 实体

```typescript
import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'sys_user' })
export class User {
  @TableId({ type: 'AUTO' })
  id!: number;

  @TableField({ column: 'user_name' })
  username!: string;

  @TableField()
  email!: string;

  @TableField()
  age!: number;
}
```

### Mapper 数据访问层

```typescript
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity';

@Mapper(User)
export class UserMapper extends BaseMapper<User> {}
```

### Service 服务层

```typescript
import { Service, Autowired, Transactional } from '@ai-partner-x/aiko-boot';
import { QueryWrapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { UserMapper } from '../mapper/user.mapper';
import { User } from '../entity/user.entity';

@Service()
export class UserService {
  @Autowired()
  private userMapper!: UserMapper;

  async findByUsername(username: string): Promise<User | null> {
    const wrapper = new QueryWrapper<User>()
      .eq('username', username);
    return this.userMapper.selectOne(wrapper);
  }

  async findActiveUsers(): Promise<User[]> {
    const wrapper = new QueryWrapper<User>()
      .gt('age', 18)
      .isNotNull('email')
      .orderByDesc('createdAt');
    return this.userMapper.selectList(wrapper);
  }

  @Transactional()
  async createUser(dto: CreateUserDto): Promise<User> {
    const user = new User();
    user.username = dto.username;
    user.email = dto.email;
    user.age = dto.age;
    await this.userMapper.insert(user);
    return user;
  }
}
```

### Controller 控制器

```typescript
import { RestController, GetMapping, PostMapping, PathVariable, RequestBody } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';

@RestController({ path: '/api/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  @GetMapping('/:id')
  async getById(@PathVariable('id') id: string): Promise<User | null> {
    return this.userService.getUserById(Number(id));
  }

  @PostMapping()
  async create(@RequestBody() dto: CreateUserDto): Promise<User> {
    return this.userService.createUser(dto);
  }
}
```

## 🔄 TypeScript → Java 转译

### 转译命令

```bash
cd app/examples/user-crud/packages/api

# 生成 Java 代码到 ./gen 目录
pnpm java

# 编译 Java 项目
cd gen && mvn compile

# 运行 Java 项目
mvn spring-boot:run
```

### 转译示例

**TypeScript 输入**:

```typescript
@Entity({ tableName: 'sys_user' })
export class User {
  @TableId({ type: 'AUTO' })
  id!: number;

  @TableField({ column: 'user_name' })
  username!: string;
}
```

**Java 输出**:

```java
@Data
@TableName("sys_user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_name")
    private String username;
}
```

## 🛣️ 开发路线图

### 已完成 ✅

- [x] @ai-partner-x/aiko-boot - 核心启动包 (DI + 自动配置)
- [x] @ai-partner-x/aiko-boot-starter-web - Web Starter
- [x] @ai-partner-x/aiko-boot-starter-orm - MyBatis-Plus 风格 ORM
- [x] @ai-partner-x/aiko-boot-starter-validation - 数据验证
- [x] @ai-partner-x/aiko-boot-codegen - TypeScript → Java 转译器
- [x] @ai-partner-x/eslint-plugin-aiko-boot - ESLint Java 兼容规则
- [x] user-crud 完整示例项目

### 进行中 🚧

- [ ] 更多数据库适配器 (MySQL)
- [ ] 完整的 API 文档
- [ ] 更多示例项目
- [ ] CLI 工具优化

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 License

MIT

---

**Build with TypeScript, Run Anywhere** 🚀
