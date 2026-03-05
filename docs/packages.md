# AI-First Framework — Packages 说明

> 本文档描述 `packages/` 目录下所有 NPM 包的功能、API 与依赖关系。

---

## 包总览

| 包名 | 版本 | 描述 |
|------|------|------|
| `@ai-first/di` | 0.1.0 | 依赖注入容器（基于 TSyringe） |
| `@ai-first/core` | 0.1.0 | 业务领域层装饰器（Service、Transactional） |
| `@ai-first/orm` | 0.1.0 | ORM 框架（MyBatis-Plus 风格） |
| `@ai-first/cache` | 0.1.0 | 缓存框架（Spring Cache + RedisTemplate 风格，基于 ioredis） |
| `@ai-first/validation` | 0.1.0 | 数据校验（基于 class-validator） |
| `@ai-first/nextjs` | 0.1.0 | Web 层装饰器（Spring Boot 风格，适配 Next.js） |
| `@ai-first/codegen` | 0.1.0 | TypeScript → Java 代码生成器 |
| `@ai-first/eslint-plugin` | 0.1.0 | ESLint 规则插件（确保 Java 兼容性） |
| `@ai-first/types` | — | 共享类型定义（规划中） |

---

## @ai-first/di

**路径：** `packages/di/`  
**描述：** 基于 [TSyringe](https://github.com/microsoft/tsyringe) 的依赖注入容器，提供 React 集成和服务端支持。

### 导出入口

| 入口 | 路径 | 说明 |
|------|------|------|
| `@ai-first/di` | `dist/index.js` | 完整版，含 React 集成 |
| `@ai-first/di/server` | `dist/server.js` | 服务端专用（无 React 依赖） |

### 核心 API

#### 装饰器

| 装饰器 | 说明 |
|--------|------|
| `@Injectable()` | 标记类为可注入 |
| `@Singleton()` | 单例模式 |
| `@Scoped()` | 请求作用域 |
| `@Inject(token)` | 按 token 注入 |
| `@AutoRegister(options)` | 自动注册，支持 `lifecycle: 'singleton' \| 'scoped' \| 'transient'` |

#### React 集成

| API | 说明 |
|-----|------|
| `<DIProvider>` | React Context Provider，提供 DI 容器 |
| `useContainer()` | 获取当前容器实例 |
| `useInjection(token)` | 注入指定 token 的实例 |
| `useOptionalInjection(token)` | 可选注入，未找到返回 undefined |

#### 容器

```typescript
import { Container } from '@ai-first/di';

const container = Container.getInstance();
const service = container.resolve(UserService);
```

### 依赖

- `tsyringe ^4.8.0`
- `reflect-metadata ^0.2.1`
- `react >=18.0.0`（可选）

---

## @ai-first/core

**路径：** `packages/core/`  
**描述：** 业务领域层（DDD）装饰器，提供 `@Service`、`@Transactional` 等。

### 核心 API

#### @Service

```typescript
import { Service } from '@ai-first/core';

@Service({ name: 'userService' })
export class UserService {
  constructor(private userMapper: UserMapper) {}
  // 自动注册到 DI 容器，构造函数参数自动注入
}
```

| 选项 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 服务名称（可选） |

#### @Transactional

```typescript
import { Transactional } from '@ai-first/core';

@Service()
export class UserService {
  @Transactional()
  async createUser(dto: CreateUserDto): Promise<User> {
    // 自动捕获异常并输出事务日志
  }
}
```

### 依赖

- `@ai-first/di workspace:*`
- `reflect-metadata ^0.2.1`

---

## @ai-first/orm

**路径：** `packages/orm/`  
**描述：** ORM 框架，提供 MyBatis-Plus 风格的装饰器和 `BaseMapper<T>`，支持 InMemory 与 PostgreSQL 适配器。

### 装饰器

#### @Entity / @TableName

```typescript
import { Entity } from '@ai-first/orm';

@Entity({ tableName: 't_user' })
export class User {
  // ...
}
```

| 选项 | 类型 | 说明 |
|------|------|------|
| `table` | `string` | 表名 |
| `tableName` | `string` | 表名（别名） |
| `schema` | `string` | Schema 名 |
| `description` | `string` | 描述 |

#### @TableId

```typescript
@TableId({ type: 'AUTO' })
id!: number;
```

| 选项 | 类型 | 说明 |
|------|------|------|
| `type` | `'AUTO' \| 'INPUT' \| 'ASSIGN_ID' \| 'ASSIGN_UUID'` | 主键生成策略 |
| `column` | `string` | 列名 |

#### @TableField / @Column

```typescript
@TableField({ column: 'user_name' })
username!: string;
```

| 选项 | 类型 | 说明 |
|------|------|------|
| `column` | `string` | 列名 |
| `exist` | `boolean` | 是否存在于数据库 |
| `fill` | `'INSERT' \| 'UPDATE' \| 'INSERT_UPDATE'` | 填充策略 |

#### @Mapper

```typescript
import { Mapper, BaseMapper } from '@ai-first/orm';

@Mapper({ entity: User })
export class UserMapper extends BaseMapper<User> {}
```

### BaseMapper\<T\> 方法

| 方法 | MyBatis-Plus 对应 | 说明 |
|------|-------------------|------|
| `selectById(id)` | `selectById` | 按 ID 查询 |
| `selectBatchIds(ids)` | `selectBatchIds` | 批量 ID 查询 |
| `selectOne(condition)` | `selectOne` | 按条件查询单条 |
| `selectList(condition?, orderBy?)` | `selectList` | 按条件查询列表 |
| `selectPage(page, condition?, orderBy?)` | `selectPage` | 分页查询 |
| `selectCount(condition?)` | `selectCount` | 查询总数 |
| `insert(entity)` | `insert` | 插入 |
| `insertBatch(entities)` | — | 批量插入 |
| `updateById(entity)` | `updateById` | 按 ID 更新 |
| `update(data, condition)` | `update` | 按条件更新 |
| `deleteById(id)` | `deleteById` | 按 ID 删除 |
| `deleteBatchIds(ids)` | `deleteBatchIds` | 批量 ID 删除 |
| `delete(condition)` | `delete` | 按条件删除 |

### 适配器

#### InMemoryAdapter（内存，开发/测试用）

```typescript
import { InMemoryAdapter } from '@ai-first/orm';

@Mapper({ entity: User })
export class UserMapper extends BaseMapper<User> {
  constructor() {
    super();
    this.setAdapter(new InMemoryAdapter<User>());
  }
}
```

#### PostgresAdapter（生产环境）

```typescript
import { PostgresAdapter } from '@ai-first/orm';

const adapter = new PostgresAdapter<User>({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'postgres',
  password: 'secret',
}, { tableName: 't_user' });
```

### 依赖

- `reflect-metadata ^0.2.1`
- `@ai-first/core workspace:*`
- `@ai-first/di workspace:*`
- `pg >=8.0.0`（可选）

---

## @ai-first/cache

**路径：** `packages/cache/`  
**描述：** 缓存框架，提供 Spring Boot Cache 风格装饰器（`@Cacheable`、`@CachePut`、`@CacheEvict`）与 Spring Data Redis 风格的 `RedisTemplate<K, V>`，底层基于 ioredis。`@RedisComponent` 已集成 DI 容器，等同于 `@Service` + 缓存语义。

### 装饰器

#### @RedisComponent（含 DI 集成）

`@RedisComponent` 自动注册到 DI 容器（Injectable + Singleton），支持 `@Autowired` 属性注入，行为与 `@Service` / `@Component` 完全一致。

```typescript
import { RedisComponent, Autowired, Cacheable, CachePut, CacheEvict } from '@ai-first/cache';
import { Container } from '@ai-first/di';

@RedisComponent({ name: 'UserCacheService' })
export class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;  // DI 自动注入

  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User> { return this.userRepository.findById(id); }

  @CachePut({ key: 'user', ttl: 300, keyGenerator: (id) => String(id) })
  async updateUser(id: number, user: User): Promise<User> { return this.userRepository.save(user); }

  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<void> { await this.userRepository.remove(id); }

  // 清除所有以 'user::' 开头的缓存
  @CacheEvict({ key: 'user', allEntries: true })
  async clearAll(): Promise<void> { ... }
}

// 通过 DI 容器解析（@Autowired 依赖自动注入）
const svc = Container.resolve(UserCacheService);
```

### RedisTemplate\<K, V\>

```typescript
import { createRedisConnection, RedisTemplate, StringRedisTemplate } from '@ai-first/cache';

const client = createRedisConnection({ host: 'localhost', port: 6379 });
const redisTemplate = new RedisTemplate<string, unknown>({ client });
const stringTemplate = new StringRedisTemplate({ client });

// String 操作
const ops = redisTemplate.opsForValue();
await ops.set('key', { name: '张三' }, 300);
const val = await ops.get('key');

// Hash 操作
const hashOps = redisTemplate.opsForHash<string, string>();
await hashOps.put('user:1', 'name', '张三');

// List / Set / ZSet
redisTemplate.opsForList();
redisTemplate.opsForSet();
redisTemplate.opsForZSet();
```

> 详细 API 见 [docs/cache.md](./cache.md)

### 依赖

- `ioredis ^5.4.2`
- `reflect-metadata ^0.2.1`
- `@ai-first/di workspace:*`

---

## @ai-first/validation

**路径：** `packages/validation/`  
**描述：** 数据校验包，基于 `class-validator` 和 `class-transformer`，提供 DTO 校验与 react-hook-form 集成，并内置 TypeScript → Java 映射。

### 校验装饰器（部分常用）

| 装饰器 | Java 对应 | 说明 |
|--------|-----------|------|
| `@IsNotEmpty()` | `@NotBlank` | 非空 |
| `@IsDefined()` | `@NotNull` | 非 null |
| `@IsEmail()` | `@Email` | 邮箱格式 |
| `@Length(min, max)` | `@Size` | 长度范围 |
| `@Min(n)` | `@Min` | 最小值 |
| `@Max(n)` | `@Max` | 最大值 |
| `@IsInt()` | — | 整数 |
| `@IsOptional()` | — | 可选 |
| `@ValidateNested()` | `@Valid` | 嵌套对象校验 |
| `@Matches(regex)` | `@Pattern` | 正则匹配 |

### 工具函数

#### validateDto

```typescript
import { validateDto } from '@ai-first/validation';

const result = await validateDto(CreateUserDto, requestBody);
if (!result.success) {
  // result.errors: FieldError[]
}
```

#### createResolver（react-hook-form）

```typescript
import { createResolver } from '@ai-first/validation';
import { useForm } from 'react-hook-form';

const { register, handleSubmit } = useForm({
  resolver: createResolver(CreateUserDto),
});
```

### 依赖

- `class-validator ^0.14.1`
- `class-transformer ^0.5.1`
- `reflect-metadata ^0.2.1`
- `react-hook-form >=7.0.0`（可选）

---

## @ai-first/nextjs

**路径：** `packages/nextjs/`  
**描述：** Next.js Web 层适配器，提供 Spring Boot 风格的 REST API 装饰器，并自动生成 Next.js 路由文件。

### 导出入口

| 入口 | 说明 |
|------|------|
| `@ai-first/nextjs` | 完整版，含 reflect-metadata |
| `@ai-first/nextjs/client-lite` | Lite 版 API 客户端，SSR 安全，无 reflect-metadata |

### 控制器装饰器

| 装饰器 | Spring Boot 对应 | 说明 |
|--------|------------------|------|
| `@RestController({ path })` | `@RestController + @RequestMapping` | 标记 REST 控制器 |
| `@GetMapping(path?)` | `@GetMapping` | GET 路由 |
| `@PostMapping(path?)` | `@PostMapping` | POST 路由 |
| `@PutMapping(path?)` | `@PutMapping` | PUT 路由 |
| `@DeleteMapping(path?)` | `@DeleteMapping` | DELETE 路由 |
| `@PatchMapping(path?)` | `@PatchMapping` | PATCH 路由 |
| `@RequestMapping(options)` | `@RequestMapping` | 通用路由映射 |

### 参数装饰器

| 装饰器 | Spring Boot 对应 | 说明 |
|--------|------------------|------|
| `@PathVariable(name?)` | `@PathVariable` | 路径变量 |
| `@RequestParam(name?, required?)` | `@RequestParam` | 查询参数 |
| `@QueryParam(name?)` | — | `@RequestParam` 的别名 |
| `@RequestBody()` | `@RequestBody` | 请求体 |

### 使用示例

```typescript
import {
  RestController, GetMapping, PostMapping, PutMapping, DeleteMapping,
  PathVariable, RequestBody,
} from '@ai-first/nextjs';

@RestController({ path: '/users' })
export class UserController {
  constructor(private userService: UserService) {}

  @GetMapping()
  async list() { return this.userService.getAllUsers(); }

  @GetMapping('/:id')
  async getById(@PathVariable('id') id: string) {
    return this.userService.getUserById(Number(id));
  }

  @PostMapping()
  async create(@RequestBody() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @PutMapping('/:id')
  async update(@PathVariable('id') id: string, @RequestBody() dto: UpdateUserDto) {
    return this.userService.updateUser(Number(id), dto);
  }

  @DeleteMapping('/:id')
  async delete(@PathVariable('id') id: string) {
    return this.userService.deleteUser(Number(id));
  }
}
```

### 路由工具

```typescript
import { createApiRouter } from '@ai-first/nextjs';

// app/api/[...path]/route.ts（由 postinstall 自动生成）
export const { GET, POST, PUT, DELETE, PATCH } = createApiRouter([UserController]);
```

### API 客户端（Feign 风格）

```typescript
import { ApiContract, createApiClient } from '@ai-first/nextjs';

@ApiContract({ baseUrl: '/api' })
class UserApi {
  @GetMapping('/users')
  async list(): Promise<User[]> { return [] as any; }
}

const userApi = createApiClient(UserApi);
const users = await userApi.list();
```

### postinstall 自动生成

安装 `@ai-first/nextjs` 后自动扫描并生成路由：

```
pnpm install → scripts/postinstall.cjs → 生成 app/api/[...path]/route.ts
```

### 依赖

- `reflect-metadata ^0.2.1`
- `@ai-first/core workspace:*`
- `@ai-first/di workspace:*`
- `next ^14.0.0 || ^15.0.0 || ^16.0.0`（peerDependency）

---

## @ai-first/codegen

**路径：** `packages/codegen/`  
**描述：** TypeScript → Java 代码生成器，将 AI-First 装饰器代码转译为 Spring Boot + MyBatis-Plus Java 代码。

### CLI 使用

```bash
npx ai-first-codegen --input src/api --output out/java --package com.example
```

### 类型映射

| TypeScript | Java |
|-----------|------|
| `number` | `Long` |
| `string` | `String` |
| `boolean` | `Boolean` |
| `Date` | `LocalDateTime` |
| `any` | `Object` |
| `void` | `void` |

### 装饰器映射

| TypeScript 装饰器 | Java 注解 |
|------------------|-----------|
| `@Entity` | `@TableName` (MyBatis-Plus) |
| `@Service` | `@Service` |
| `@RestController` | `@RestController` |
| `@GetMapping` | `@GetMapping` |
| `@PostMapping` | `@PostMapping` |
| `@PutMapping` | `@PutMapping` |
| `@DeleteMapping` | `@DeleteMapping` |
| `@PathVariable` | `@PathVariable` |
| `@RequestBody` | `@RequestBody` |
| `@Transactional` | `@Transactional` |

### TranspilerOptions

| 选项 | 类型 | 说明 |
|------|------|------|
| `outDir` | `string` | Java 文件输出目录 |
| `packageName` | `string` | Java 包名（如 `com.example.app`） |
| `javaVersion` | `'11' \| '17' \| '21'` | Java 版本 |
| `springBootVersion` | `string` | Spring Boot 版本 |
| `useLombok` | `boolean` | 是否生成 Lombok 注解 |

---

## @ai-first/eslint-plugin

**路径：** `packages/eslint-plugin/`  
**描述：** ESLint 插件，强制代码符合 Java 转译兼容规范。

### 安装与配置

```json
// .eslintrc.json
{
  "plugins": ["@ai-first"],
  "extends": ["plugin:@ai-first/recommended"]
}
```

### 规则列表

| 规则 | 级别（recommended） | 说明 |
|------|---------------------|------|
| `@ai-first/no-arrow-methods` | `error` | 禁止类方法使用箭头函数（Java 不支持） |
| `@ai-first/no-destructuring-in-methods` | `error` | 禁止方法参数中使用解构（Java 不支持） |
| `@ai-first/no-object-spread` | `warn` | 警告使用 Object spread（Java 无直接对应） |
| `@ai-first/static-route-paths` | `error` | 路由路径必须为静态字符串 |
| `@ai-first/require-rest-controller` | `error` | Controller 类必须使用 `@RestController` |

### 配置预设

| 预设 | 说明 |
|------|------|
| `recommended` | 推荐配置，部分规则为 warn |
| `strict` | 严格配置，所有规则为 error |

---

## 包依赖关系

```
@ai-first/di
    ↑
@ai-first/core  ←────────────────────────────────────┐
    ↑                                                  │
@ai-first/orm     @ai-first/cache           @ai-first/nextjs
    ↑                                                  ↑
@ai-first/validation                                   │
                                                       │
                                         应用代码 (user-crud / admin / cache-example)
```

---

## 构建命令

```bash
# 构建所有包
pnpm -r build

# 监听模式开发
pnpm -r dev

# 类型检查
pnpm -r type-check
```
