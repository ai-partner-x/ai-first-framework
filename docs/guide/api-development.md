# Aiko Boot API 开发规范

本文档定义 Aiko Boot 框架中 API 开发的完整规范，包含组件开发、代码规范和 Java 转译要求。

> **重要**：本规范基于 `@ai-partner-x/eslint-plugin-aiko-boot` 的 `java-compat` 配置，确保 TypeScript 代码可转译为 Java Spring Boot。

## 目录

- [项目结构](#项目结构)
- [Entity 实体层](#entity-实体层)
- [Mapper 数据访问层](#mapper-数据访问层)
- [Service 服务层](#service-服务层)
- [Controller 控制器层](#controller-控制器层)
- [DTO 数据传输对象](#dto-数据传输对象)
- [ESLint Java 兼容规则](#eslint-java-兼容规则)
- [代码审查清单](#代码审查清单)
- [高级特性](#高级特性)
  - [文件上传](#文件上传)
  - [参数装饰器](#参数装饰器)
  - [JSON 序列化格式化](#json-序列化格式化)
  - [异步支持](#异步支持)

---

## 项目结构

```
src/
├── entity/           # 实体类 - 映射数据库表
│   └── user.entity.ts
├── mapper/           # 数据访问层 - 继承 BaseMapper
│   └── user.mapper.ts
├── service/          # 服务层 - 业务逻辑
│   └── user.service.ts
├── controller/       # 控制器层 - REST API
│   └── user.controller.ts
├── dto/              # 数据传输对象 - 请求/响应模型
│   └── user.dto.ts
└── server.ts         # 启动入口
```

### 文件命名规范

| 组件类型 | 文件命名 | 示例 |
|----------|----------|------|
| Entity | `{name}.entity.ts` | `user.entity.ts` |
| Mapper | `{name}.mapper.ts` | `user.mapper.ts` |
| Service | `{name}.service.ts` | `user.service.ts` |
| Controller | `{name}.controller.ts` | `user.controller.ts` |
| DTO | `{name}.dto.ts` | `user.dto.ts` |

---

## Entity 实体层

实体类映射数据库表结构，使用装饰器定义表名和字段映射。

### 完整示例

```typescript
// src/entity/user.entity.ts
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
  age?: number;

  @TableField({ column: 'created_at' })
  createdAt?: Date;

  @TableField({ column: 'updated_at' })
  updatedAt?: Date;
}
```

### 装饰器说明

| 装饰器 | 用途 | 参数 |
|--------|------|------|
| `@Entity` | 标记实体类 | `tableName`: 数据库表名 |
| `@TableId` | 标记主键 | `type`: AUTO/INPUT/ASSIGN_ID |
| `@TableField` | 标记字段 | `column`: 数据库列名（可选） |

### 字段类型映射

| TypeScript | Java | SQL |
|------------|------|-----|
| `number` (id) | `Long` | `BIGINT` |
| `number` | `Integer` | `INT` |
| `string` | `String` | `VARCHAR` |
| `boolean` | `Boolean` | `BOOLEAN` |
| `Date` | `LocalDateTime` | `TIMESTAMP` |

---

## Mapper 数据访问层

Mapper 继承 `BaseMapper<T>`，自动获得 MyBatis-Plus 风格的 CRUD 方法。

### 完整示例

```typescript
// src/mapper/user.mapper.ts
import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity.js';

@Mapper(User)
export class UserMapper extends BaseMapper<User> {
  // 自定义查询方法
  async selectByUsername(username: string): Promise<User | null> {
    const users = await this.selectList({ username });
    return users.length > 0 ? users[0] : null;
  }

  async selectByEmail(email: string): Promise<User | null> {
    const users = await this.selectList({ email });
    return users.length > 0 ? users[0] : null;
  }
}
```

### BaseMapper 内置方法

| 方法 | 说明 | 返回类型 |
|------|------|----------|
| `selectById(id)` | 根据 ID 查询 | `T \| null` |
| `selectList(wrapper?)` | 条件查询列表 | `T[]` |
| `selectListByWrapper(wrapper)` | QueryWrapper 查询 | `T[]` |
| `selectCountByWrapper(wrapper)` | QueryWrapper 统计 | `number` |
| `insert(entity)` | 插入 | `number` |
| `updateById(entity)` | 根据 ID 更新 | `number` |
| `updateWithWrapper(wrapper)` | UpdateWrapper 更新 | `number` |
| `deleteById(id)` | 根据 ID 删除 | `number` |
| `deleteByWrapper(wrapper)` | QueryWrapper 删除 | `number` |

---

## Service 服务层

Service 层处理业务逻辑，使用 `@Autowired` 注入依赖，`@Transactional` 管理事务。

### 完整示例

```typescript
// src/service/user.service.ts
import 'reflect-metadata';
import { Service, Transactional, Autowired } from '@ai-partner-x/aiko-boot';
import { QueryWrapper, UpdateWrapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity.js';
import { UserMapper } from '../mapper/user.mapper.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';

/**
 * 用户搜索参数
 */
export interface UserSearchParams {
  username?: string;
  email?: string;
  minAge?: number;
  maxAge?: number;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: string;
}

/**
 * 用户搜索结果
 */
export interface UserSearchResult {
  data: User[];
  total: number;
}

@Service()
export class UserService {
  @Autowired()
  private userMapper!: UserMapper;

  // ==================== 基础 CRUD ====================

  async getUserById(id: number): Promise<User | null> {
    return this.userMapper.selectById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userMapper.selectList();
  }

  @Transactional()
  async createUser(dto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existingWrapper = new QueryWrapper<User>().eq('username', dto.username);
    const existingList = await this.userMapper.selectListByWrapper(existingWrapper);
    if (existingList.length > 0) {
      throw new Error('用户名已存在');
    }

    const user: User = {
      id: 0,
      username: dto.username,
      email: dto.email,
      age: dto.age,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.userMapper.insert(user);
    
    const newUserWrapper = new QueryWrapper<User>().eq('username', dto.username);
    const newUserList = await this.userMapper.selectListByWrapper(newUserWrapper);
    return newUserList[0];
  }

  @Transactional()
  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userMapper.selectById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (dto.username !== undefined) user.username = dto.username;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.age !== undefined) user.age = dto.age;
    user.updatedAt = new Date();

    await this.userMapper.updateById(user);
    return (await this.userMapper.selectById(id))!;
  }

  @Transactional()
  async deleteUser(id: number): Promise<boolean> {
    const user = await this.userMapper.selectById(id);
    if (!user) {
      throw new Error('用户不存在');
    }
    const affected = await this.userMapper.deleteById(id);
    return affected > 0;
  }

  // ==================== QueryWrapper 高级查询 ====================

  /**
   * 使用 QueryWrapper 进行高级搜索
   */
  async searchUsers(params: UserSearchParams): Promise<UserSearchResult> {
    const username = params.username;
    const email = params.email;
    const minAge = params.minAge;
    const maxAge = params.maxAge;
    const page = params.page !== undefined ? params.page : 1;
    const pageSize = params.pageSize !== undefined ? params.pageSize : 10;
    const orderBy = params.orderBy !== undefined ? params.orderBy : 'id';
    const orderDir = params.orderDir !== undefined ? params.orderDir : 'desc';

    const wrapper = new QueryWrapper<User>();

    // 模糊搜索
    if (username) {
      wrapper.like('username', username);
    }
    if (email) {
      wrapper.like('email', email);
    }

    // 范围查询
    if (minAge !== undefined && maxAge !== undefined) {
      wrapper.between('age', minAge, maxAge);
    } else if (minAge !== undefined) {
      wrapper.ge('age', minAge);
    } else if (maxAge !== undefined) {
      wrapper.le('age', maxAge);
    }

    // 排序
    if (orderDir === 'asc') {
      wrapper.orderByAsc(orderBy as keyof User);
    } else {
      wrapper.orderByDesc(orderBy as keyof User);
    }

    // 分页
    wrapper.page(page, pageSize);

    const data = await this.userMapper.selectListByWrapper(wrapper);
    
    // 统计总数
    const countWrapper = new QueryWrapper<User>();
    if (username) countWrapper.like('username', username);
    if (email) countWrapper.like('email', email);
    if (minAge !== undefined && maxAge !== undefined) {
      countWrapper.between('age', minAge, maxAge);
    } else if (minAge !== undefined) {
      countWrapper.ge('age', minAge);
    } else if (maxAge !== undefined) {
      countWrapper.le('age', maxAge);
    }
    const total = await this.userMapper.selectCountByWrapper(countWrapper);

    const result: UserSearchResult = { data, total };
    return result;
  }

  /**
   * 使用 OR 条件查询
   */
  async searchByKeyword(keyword: string): Promise<User[]> {
    const wrapper = new QueryWrapper<User>()
      .or(w => w.like('username', keyword).like('email', keyword))
      .orderByDesc('id');
    
    return this.userMapper.selectListByWrapper(wrapper);
  }

  // ==================== UpdateWrapper 批量操作 ====================

  /**
   * 使用 UpdateWrapper 批量更新
   */
  @Transactional()
  async batchUpdateAge(usernameKeyword: string, newAge: number): Promise<number> {
    const wrapper = new UpdateWrapper<User>()
      .set('age', newAge)
      .set('updatedAt', new Date().toISOString())
      .like('username', usernameKeyword);
    
    return this.userMapper.updateWithWrapper(wrapper);
  }

  /**
   * 使用 QueryWrapper 批量删除
   */
  @Transactional()
  async batchDeleteByAgeRange(minAge: number, maxAge: number): Promise<number> {
    const wrapper = new QueryWrapper<User>()
      .between('age', minAge, maxAge);
    
    return this.userMapper.deleteByWrapper(wrapper);
  }
}
```

### QueryWrapper 方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `eq(field, value)` | 等于 | `wrapper.eq('status', 1)` |
| `ne(field, value)` | 不等于 | `wrapper.ne('status', 0)` |
| `gt(field, value)` | 大于 | `wrapper.gt('age', 18)` |
| `ge(field, value)` | 大于等于 | `wrapper.ge('age', 18)` |
| `lt(field, value)` | 小于 | `wrapper.lt('age', 60)` |
| `le(field, value)` | 小于等于 | `wrapper.le('age', 60)` |
| `like(field, value)` | 模糊匹配 | `wrapper.like('name', 'test')` |
| `between(field, min, max)` | 范围 | `wrapper.between('age', 18, 60)` |
| `isNull(field)` | 为空 | `wrapper.isNull('email')` |
| `isNotNull(field)` | 不为空 | `wrapper.isNotNull('email')` |
| `orderByAsc(field)` | 升序 | `wrapper.orderByAsc('id')` |
| `orderByDesc(field)` | 降序 | `wrapper.orderByDesc('createdAt')` |
| `page(page, size)` | 分页 | `wrapper.page(1, 10)` |
| `or(callback)` | OR 条件 | `wrapper.or(w => w.eq(...))` |

---

## Controller 控制器层

Controller 层暴露 REST API 端点，使用 Spring Boot 风格的装饰器。

### 完整示例

```typescript
// src/controller/user.controller.ts
import 'reflect-metadata';
import {
  RestController,
  GetMapping,
  PostMapping,
  PutMapping,
  DeleteMapping,
  PathVariable,
  RequestBody,
  RequestParam,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { User } from '../entity/user.entity.js';
import { UserService, UserSearchParams } from '../service/user.service.js';
import { 
  CreateUserDto, 
  UpdateUserDto,
  BatchUpdateAgeDto,
  BatchDeleteDto,
  SuccessResponse,
  UpdateResponse,
  DeleteResponse,
  UserSearchResultDto,
} from '../dto/user.dto.js';

@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  // ==================== 基础 CRUD ====================

  /**
   * 获取所有用户
   * GET /api/users
   */
  @GetMapping()
  async list(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  /**
   * 根据 ID 获取用户
   * GET /api/users/:id
   */
  @GetMapping('/:id')
  async getById(@PathVariable('id') id: string): Promise<User | null> {
    return this.userService.getUserById(Number(id));
  }

  /**
   * 创建用户
   * POST /api/users
   */
  @PostMapping()
  async create(@RequestBody() dto: CreateUserDto): Promise<User> {
    return this.userService.createUser(dto);
  }

  /**
   * 更新用户
   * PUT /api/users/:id
   */
  @PutMapping('/:id')
  async update(
    @PathVariable('id') id: string,
    @RequestBody() dto: UpdateUserDto
  ): Promise<User> {
    return this.userService.updateUser(Number(id), dto);
  }

  /**
   * 删除用户
   * DELETE /api/users/:id
   */
  @DeleteMapping('/:id')
  async delete(@PathVariable('id') id: string): Promise<SuccessResponse> {
    const result = await this.userService.deleteUser(Number(id));
    const response: SuccessResponse = { success: result };
    return response;
  }

  // ==================== 高级查询 ====================

  /**
   * 高级搜索
   * GET /api/users/search?username=test&minAge=20&maxAge=30&page=1&pageSize=10
   */
  @GetMapping('/search')
  async search(
    @RequestParam('username') username?: string,
    @RequestParam('email') email?: string,
    @RequestParam('minAge') minAge?: string,
    @RequestParam('maxAge') maxAge?: string,
    @RequestParam('page') page?: string,
    @RequestParam('pageSize') pageSize?: string,
    @RequestParam('orderBy') orderBy?: string,
    @RequestParam('orderDir') orderDir?: string,
  ): Promise<UserSearchResultDto> {
    const params: UserSearchParams = {
      username,
      email,
      minAge: minAge ? Number(minAge) : undefined,
      maxAge: maxAge ? Number(maxAge) : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      orderBy: orderBy as UserSearchParams['orderBy'],
      orderDir: orderDir as UserSearchParams['orderDir'],
    };
    
    const result = await this.userService.searchUsers(params);
    const response: UserSearchResultDto = {
      data: result.data,
      total: result.total,
      page: params.page!,
      pageSize: params.pageSize!,
    };
    return response;
  }

  /**
   * 关键字搜索
   * GET /api/users/keyword/:keyword
   */
  @GetMapping('/keyword/:keyword')
  async searchByKeyword(@PathVariable('keyword') keyword: string): Promise<User[]> {
    return this.userService.searchByKeyword(keyword);
  }

  // ==================== 批量操作 ====================

  /**
   * 批量更新年龄
   * PUT /api/users/batch/age
   * Body: { "username": "test", "age": 30 }
   */
  @PutMapping('/batch/age')
  async batchUpdateAge(
    @RequestBody() body: BatchUpdateAgeDto,
  ): Promise<UpdateResponse> {
    const updated = await this.userService.batchUpdateAge(body.username, body.age);
    const response: UpdateResponse = { success: true, updated };
    return response;
  }

  /**
   * 批量删除
   * DELETE /api/users/batch
   * Body: { "minAge": 18, "maxAge": 25 }
   */
  @DeleteMapping('/batch')
  async batchDelete(
    @RequestBody() body: BatchDeleteDto,
  ): Promise<DeleteResponse> {
    const deleted = await this.userService.batchDeleteByAgeRange(body.minAge, body.maxAge);
    const response: DeleteResponse = { success: true, deleted };
    return response;
  }
}
```

### 路由装饰器

| 装饰器 | HTTP 方法 | 示例 |
|--------|-----------|------|
| `@GetMapping` | GET | `@GetMapping('/:id')` |
| `@PostMapping` | POST | `@PostMapping()` |
| `@PutMapping` | PUT | `@PutMapping('/:id')` |
| `@DeleteMapping` | DELETE | `@DeleteMapping('/:id')` |

### 参数绑定装饰器

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@PathVariable` | 路径参数 | `@PathVariable('id') id: string` |
| `@RequestParam` | 查询参数 | `@RequestParam('page') page?: string` |
| `@RequestBody` | 请求体 | `@RequestBody() dto: CreateUserDto` |

---

## DTO 数据传输对象

DTO 用于定义请求和响应的数据结构，支持验证装饰器。

### 完整示例

```typescript
// src/dto/user.dto.ts
import { 
  IsNotEmpty, 
  IsEmail, 
  IsOptional, 
  Length, 
  Min, 
  Max, 
  IsInt 
} from '@ai-partner-x/aiko-boot-starter-validation';
import { User } from '../entity/user.entity.js';

// ==================== 请求 DTO ====================

/**
 * 创建用户请求
 */
export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(2, 50, { message: '用户名长度必须在 2-50 之间' })
  username!: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @IsOptional()
  @IsInt({ message: '年龄必须是整数' })
  @Min(0, { message: '年龄不能小于 0' })
  @Max(150, { message: '年龄不能大于 150' })
  age?: number;
}

/**
 * 更新用户请求
 */
export class UpdateUserDto {
  @IsOptional()
  @Length(2, 50)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;
}

/**
 * 批量更新年龄请求
 */
export class BatchUpdateAgeDto {
  @IsNotEmpty({ message: '用户名关键字不能为空' })
  username!: string;

  @IsNotEmpty({ message: '年龄不能为空' })
  @IsInt({ message: '年龄必须是整数' })
  @Min(0, { message: '年龄不能小于 0' })
  @Max(150, { message: '年龄不能大于 150' })
  age!: number;
}

/**
 * 批量删除请求
 */
export class BatchDeleteDto {
  @IsNotEmpty({ message: '最小年龄不能为空' })
  @IsInt({ message: '年龄必须是整数' })
  @Min(0, { message: '年龄不能小于 0' })
  minAge!: number;

  @IsNotEmpty({ message: '最大年龄不能为空' })
  @IsInt({ message: '年龄必须是整数' })
  @Max(150, { message: '年龄不能大于 150' })
  maxAge!: number;
}

// ==================== 响应 DTO ====================

/**
 * 操作成功响应
 */
export class SuccessResponse {
  success!: boolean;
}

/**
 * 更新操作响应
 */
export class UpdateResponse {
  success!: boolean;
  updated!: number;
}

/**
 * 删除操作响应
 */
export class DeleteResponse {
  success!: boolean;
  deleted!: number;
}

/**
 * 用户搜索结果
 */
export class UserSearchResultDto {
  data!: User[];
  total!: number;
  page!: number;
  pageSize!: number;
}
```

### 验证装饰器

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@IsNotEmpty` | 非空 | `@IsNotEmpty({ message: '不能为空' })` |
| `@IsOptional` | 可选 | `@IsOptional()` |
| `@IsEmail` | 邮箱格式 | `@IsEmail({}, { message: '格式错误' })` |
| `@Length` | 字符串长度 | `@Length(2, 50)` |
| `@IsInt` | 整数 | `@IsInt()` |
| `@Min` | 最小值 | `@Min(0)` |
| `@Max` | 最大值 | `@Max(150)` |

---

## ESLint Java 兼容规则

为确保代码可转译为 Java，必须遵守以下 ESLint 规则。

### 配置

```bash
pnpm add -D @ai-partner-x/eslint-plugin-aiko-boot @typescript-eslint/parser
```

```json
{
  "extends": ["plugin:@ai-partner-x/aiko-boot/java-compat"]
}
```

### 规则列表

| 规则 | 说明 | 正确写法 | 错误写法 |
|------|------|----------|----------|
| `no-arrow-methods` | 禁止箭头函数方法 | `async getUser(): Promise<User>` | `getUser = async () => {}` |
| `no-destructuring-in-methods` | 禁止解构赋值 | `const name = dto.name;` | `const { name } = dto;` |
| `no-optional-chaining-in-methods` | 禁止可选链 | `if (user !== null) { return user.name; }` | `return user?.name;` |
| `no-nullish-coalescing` | 禁止空值合并 | `page !== undefined ? page : 1` | `page ?? 1` |
| `no-object-spread` | 禁止对象展开 | 逐个属性赋值 | `{ ...dto, id }` |
| `no-union-types` | 禁止联合类型 | `orderBy: string;` | `orderBy: 'asc' \| 'desc';` |
| `no-inline-object-types` | 禁止内联对象类型 | 定义独立接口 | `Promise<{ data: User[] }>` |
| `explicit-return-type` | 强制显式返回类型 | `async get(): Promise<User>` | `async get()` |
| `static-route-paths` | 强制静态路由 | `@GetMapping('/users')` | `@GetMapping(BASE_PATH)` |
| `require-rest-controller` | 要求控制器装饰器 | `@RestController({ path: '/api' })` | 缺少装饰器 |

### 常见错误修复

```typescript
// ❌ 解构赋值
const { username, email } = dto;
// ✅ 显式属性访问
const username = dto.username;
const email = dto.email;

// ❌ 空值合并
const page = params.page ?? 1;
// ✅ 三元运算符
const page = params.page !== undefined ? params.page : 1;

// ❌ 可选链
return user?.username;
// ✅ 显式 null 检查
if (user !== null) {
  return user.username;
}
return null;

// ❌ 直接返回对象字面量
return { success: true };
// ✅ 声明变量后返回
const response: SuccessResponse = { success: true };
return response;

// ❌ 联合类型
orderBy: 'asc' | 'desc';
// ✅ 基础类型 + 注释
orderBy: string;  // 'asc' | 'desc'
```

---

## 代码审查清单

### Entity
- [ ] 有 `@Entity` 装饰器，指定 `tableName`
- [ ] 主键有 `@TableId` 装饰器
- [ ] 所有字段有类型声明
- [ ] 字段使用 `!` 断言或 `?` 可选

### Mapper
- [ ] 有 `@Mapper(EntityClass)` 装饰器
- [ ] 继承 `BaseMapper<T>`

### Service
- [ ] 有 `@Service()` 装饰器
- [ ] 依赖使用 `@Autowired()` 注入
- [ ] 写操作有 `@Transactional()` 装饰器
- [ ] 所有方法有显式返回类型

### Controller
- [ ] 有 `@RestController({ path: '/xxx' })` 装饰器
- [ ] 路由路径为静态字符串
- [ ] 参数使用正确的绑定装饰器
- [ ] 响应对象使用变量声明后返回

### DTO
- [ ] 请求 DTO 有验证装饰器
- [ ] 响应 DTO 有明确的类型定义
- [ ] 无联合类型和内联对象类型

### Java 兼容
- [ ] 无箭头函数方法
- [ ] 无解构赋值
- [ ] 无可选链 `?.`
- [ ] 无空值合并 `??`
- [ ] 无对象展开 `...`

### 运行检查

```bash
# ESLint 检查
pnpm lint

# 生成 Java 代码
pnpm java

# 验证 Java 编译
cd gen && mvn compile
```

---

## 高级特性

> 本文档覆盖四项新增能力：**文件上传**（`MultipartFile` + `@RequestPart`）、**请求绑定参数装饰器**（`@ModelAttribute` + `@RequestAttribute`）、**异步与响应式支持**（`@Async`）以及 **JSON 序列化格式化**（`@JsonFormat`）。
>
> 这些能力均已集成到新一代 **Aiko Boot** 框架（`@ai-partner-x/aiko-boot-starter-web` + `@ai-partner-x/aiko-boot`），支持 Spring Boot 风格的自动配置（AutoConfiguration）和配置化能力（`@ConfigurationProperties`）。
>
> 完整示例代码见 [`app/examples/api-extend/`](https://github.com/ai-partner-x/aiko-boot/tree/main/app/examples/api-extend)。

---

## 一、文件上传 — `MultipartFile` + `@RequestPart`

### 功能概述

提供与 Spring Boot `@RequestPart` + `org.springframework.web.multipart.MultipartFile` 完全对齐的文件上传 API：

- 在 `@RestController` 方法的参数上标注 `@RequestPart(fieldName)`，框架**自动注入** multer `memoryStorage` 中间件，无需手动配置。
- 框架将 multer 原始文件对象包装为 `MultipartFile` 接口，暴露与 Java 完全一致的方法签名。
- 支持单文件、指定自定义字段名、以及同一方法内多文件字段并存。
- 文件大小限制通过 `spring.servlet.multipart.*` 配置统一管理，遵循 Spring Boot 规范。

| TypeScript | Java Spring 对应 |
|---|---|
| `@RequestPart(name?)` | `@RequestPart` |
| `MultipartFile` 接口 | `org.springframework.web.multipart.MultipartFile` |
| `MultipartProperties` | `spring.servlet.multipart.*` 配置 |

### 开发思路

1. **元数据驱动**：`@RequestPart` 通过 `reflect-metadata` 在方法的参数维度写入字段名（使用字符串 key `'aiko-boot:requestPart'`，确保跨 ESM 模块共享）；路由注册阶段读取元数据，若存在则自动挂载 multer 中间件。
2. **零配置**：开发者无需在 Express 层手动 `app.use(multer(...))` 或在路由上添加中间件，只需在参数上加装饰器。
3. **AutoConfiguration 集成**：`WebAutoConfiguration` 在启动时读取 `spring.servlet.multipart.*` 配置，将文件大小限制传递给 `createExpressRouter`，再由 multer 的 `limits` 选项统一控制。
4. **Spring 接口对齐**：包装对象严格对标 `MultipartFile` 接口，使 AI 能基于 Spring Boot 知识生成代码，同时支持未来的 TypeScript → Java 转译。

### 技术实现

#### `MultipartFile` 接口（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export interface MultipartFile {
  /** 返回表单字段名（multipart part name） */
  getName(): string;
  /** 返回客户端文件系统中的原始文件名 */
  getOriginalFilename(): string;
  /** 返回文件 Content-Type，未设置时返回 null */
  getContentType(): string | null;
  /** 返回文件字节数 */
  getSize(): number;
  /** 以 Buffer 返回文件内容 */
  getBytes(): Buffer;
  /** 文件是否为空（size === 0） */
  isEmpty(): boolean;
  /** 将文件写入目标路径 */
  transferTo(dest: string): Promise<void>;
}
```

#### `@RequestPart` 参数装饰器（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export function RequestPart(name?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const requestParts = Reflect.getMetadata('aiko-boot:requestPart', target, propertyKey) || {};
    requestParts[parameterIndex] = { name: name || 'file' };
    Reflect.defineMetadata('aiko-boot:requestPart', requestParts, target, propertyKey);
  };
}
```

#### `MultipartProperties` 配置类（`packages/aiko-boot-starter-web/src/auto-configuration.ts`）

```typescript
@ConfigurationProperties('spring.servlet.multipart')
export class MultipartProperties {
  enabled?: boolean = true;
  maxFileSize?: string = '1MB';     // spring.servlet.multipart.max-file-size
}
```

`WebAutoConfiguration` 启动时读取该配置并将单文件大小限制传递给 multer。注意：`server.maxHttpPostSize` 仅控制 JSON body-parser（`express.json({ limit })`）的大小限制，**对 multipart/form-data 请求不起作用**。如需限制整体 multipart 请求大小，请使用 multer/busboy limits 或专用中间件：

```typescript
// packages/aiko-boot-starter-web/src/auto-configuration.ts (WebAutoConfiguration)

// JSON body-parser 大小限制：来自 server.maxHttpPostSize（默认 10mb）
const maxHttpPostSizeStr = ConfigLoader.get<string>('server.maxHttpPostSize', '10mb');

// multipart 单文件大小限制：来自 spring.servlet.multipart.maxFileSize
const multipartMaxFileSizeStr =
  ConfigLoader.get<string>('spring.servlet.multipart.maxFileSize', '1MB');
const multipartOptions = multipartEnabled
  ? { maxFileSize: parseSizeToBytes(multipartMaxFileSizeStr) }  // "1MB" → 1048576
  : undefined;  // undefined 表示禁用；使用 @RequestPart 的路由会在注册时 throw

app.use(express.json({ limit: resolvedBodyLimit }));
app.use(createExpressRouter(validControllers, {
  prefix: contextPath,
  verbose,
  multipart: multipartOptions,   // undefined = 禁用上传（含 @RequestPart 的路由将在注册时抛出错误）
}));
```

#### 路由注册时的自动 multer 挂载（`packages/aiko-boot-starter-web/src/express-router.ts`）

```typescript
const uploadMiddleware = (Object.keys(partParams).length > 0 && multipart !== undefined)
  ? multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: multipart?.maxFileSize,    // from spring.servlet.multipart.max-file-size
      },
    }).fields(
      Object.values(partParams).map(p => ({ name: p.name, maxCount: 1 }))
    )
  : null;
```

### 快速开始

#### 1. 配置文件（`app.config.ts`）

```typescript
export default {
  server: {
    port: 3003,
    servlet: { contextPath: '/api' },
  },
  spring: {
    servlet: {
      multipart: {
        enabled: true,
        maxFileSize: '5MB',       // 单个文件上限（spring.servlet.multipart.max-file-size）
      },
    },
  },
};
```

#### 2. 控制器

```typescript
import {
  RestController, PostMapping,
  RequestPart, type MultipartFile,
} from '@ai-partner-x/aiko-boot-starter-web';

@RestController({ path: '/upload' })
export class UploadController {
  /** 单文件上传 */
  @PostMapping('/single')
  async uploadSingle(
    @RequestPart('file') file: MultipartFile,
  ): Promise<object> {
    if (file.isEmpty()) throw new Error('No file uploaded');
    return {
      filename: file.getOriginalFilename(),
      type:     file.getContentType(),
      size:     file.getSize(),
    };
  }

  /** 多字段文件上传 */
  @PostMapping('/multi')
  async uploadMulti(
    @RequestPart('document')  document:  MultipartFile,
    @RequestPart('thumbnail') thumbnail: MultipartFile,
  ): Promise<object> {
    // Use path.basename() to strip any path separators from the client-supplied
    // filename and prevent path-traversal attacks.
    const docName  = path.basename(document.getOriginalFilename()  ?? 'document');
    const thumbName = path.basename(thumbnail.getOriginalFilename() ?? 'thumbnail');
    await document.transferTo(`/tmp/uploads/${docName}`);
    await thumbnail.transferTo(`/tmp/uploads/${thumbName}`);
    return { saved: [docName, thumbName] };
  }
}
```

**curl 测试：**

```bash
# 单文件
curl -X POST http://localhost:3003/api/upload/single -F "file=@photo.png"

# 多文件
curl -X POST http://localhost:3003/api/upload/multi \
  -F "document=@doc.pdf" -F "thumbnail=@thumb.png"
```

---

## 二、参数装饰器 — `@ModelAttribute` + `@RequestAttribute`

### 功能概述

两个补充参数装饰器，覆盖 Spring MVC 中除 `@RequestParam` / `@RequestBody` / `@PathVariable` 之外的常见场景：

| TypeScript 装饰器 | Java Spring 对应 | 使用场景 |
|---|---|---|
| `@ModelAttribute(name?)` | `@ModelAttribute` | 将 URL query string 与 form body 合并注入为一个对象 DTO，适合多可选参数的搜索接口和 HTML 表单提交 |
| `@RequestAttribute(name)` | `@RequestAttribute` | 读取 Express 中间件写入 `req` 对象的自定义属性（如认证信息 `req.currentUser`、租户 ID `req.tenantId`） |

### 开发思路

#### `@ModelAttribute`

- Spring MVC 中 `@ModelAttribute` 将整个模型（query + body）绑定为一个对象，避免为每个可选字段逐一写 `@RequestParam`。
- 框架实现：在路由处理器内将 `req.query` 与 `req.body` 做浅合并（`{ ...req.query, ...req.body }`），将结果注入到标注了 `@ModelAttribute` 的参数。
- 元数据 key 使用字符串 `'aiko-boot:modelAttribute'`，确保跨 ESM 模块一致性。

#### `@RequestAttribute`

- Spring MVC 的 `HandlerInterceptor.preHandle` 可向 `request` 对象写入属性，控制器通过 `@RequestAttribute` 读取。
- Express 中间件同样可以向 `req` 对象写入属性。`@RequestAttribute(name)` 直接从 `req[name]` 读取并注入参数，不需要控制器感知中间件实现。
- 元数据 key 使用字符串 `'aiko-boot:requestAttribute'`。

### 技术实现

#### `@ModelAttribute` 装饰器（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export function ModelAttribute(name?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const modelAttrs = Reflect.getMetadata('aiko-boot:modelAttribute', target, propertyKey) || {};
    modelAttrs[parameterIndex] = { name: name || '' };
    Reflect.defineMetadata('aiko-boot:modelAttribute', modelAttrs, target, propertyKey);
  };
}
```

路由处理器内注入逻辑：

```typescript
for (const idx of Object.keys(modelAttrs)) {
  const queryObj = req.query || {};
  const bodyObj  = (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body))
    ? req.body : {};
  args[Number(idx)] = { ...queryObj, ...bodyObj };   // query 优先级低于 body
}
```

#### `@RequestAttribute` 装饰器（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export function RequestAttribute(name: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const reqAttrs = Reflect.getMetadata('aiko-boot:requestAttribute', target, propertyKey) || {};
    reqAttrs[parameterIndex] = { name };
    Reflect.defineMetadata('aiko-boot:requestAttribute', reqAttrs, target, propertyKey);
  };
}
```

路由处理器内注入逻辑：

```typescript
for (const [idx, attr] of Object.entries(requestAttrs)) {
  const { name } = attr as { name: string };
  args[Number(idx)] = req[name];   // 直接读取 Express req 对象上的属性
}
```

### 快速开始

#### `@ModelAttribute` — 搜索接口 / 表单绑定

```typescript
import {
  RestController, GetMapping, PostMapping,
  ModelAttribute,
} from '@ai-partner-x/aiko-boot-starter-web';

interface SearchDto  { keyword?: string; page?: string; category?: string }
interface RegisterDto { username?: string; email?: string }

@RestController({ path: '/form' })
export class FormController {
  /** GET /api/form/search?keyword=alice&page=1&category=admin */
  @GetMapping('/search')
  search(@ModelAttribute() query: SearchDto): object {
    return { keyword: query.keyword, page: Number(query.page ?? 1) };
  }

  /** POST /api/form/register  (Content-Type: application/x-www-form-urlencoded) */
  @PostMapping('/register')
  register(@ModelAttribute('user') dto: RegisterDto): object {
    return { username: dto.username, email: dto.email };
  }
}
```

```bash
# URL 查询参数 → @ModelAttribute
curl "http://localhost:3003/api/form/search?keyword=alice&page=2"

# form-urlencoded body → @ModelAttribute
curl -X POST http://localhost:3003/api/form/register \
  -d "username=alice&email=alice@example.com"
```

#### `@RequestAttribute` — 读取中间件注入属性

```typescript
// 外层 Express 应用注册认证中间件（在 createApp 之前）
app.use((req, _res, next) => {
  (req as any).currentUser = { id: 1, name: 'Alice', role: 'admin' };
  (req as any).tenantId    = 'tenant-42';
  next();
});

// 控制器直接声明依赖，无需感知中间件实现
import {
  RestController, GetMapping,
  RequestAttribute,
} from '@ai-partner-x/aiko-boot-starter-web';

@RestController({ path: '/form' })
export class FormController {
  @GetMapping('/profile')
  profile(
    @RequestAttribute('currentUser') user: { id: number; name: string; role: string },
  ): object {
    return { user };
  }

  /** 同一方法可使用多个 @RequestAttribute */
  @GetMapping('/tenant-info')
  tenantInfo(
    @RequestAttribute('tenantId')    tenantId: string,
    @RequestAttribute('currentUser') user: object,
  ): object {
    return { tenantId, user };
  }
}
```

```bash
curl http://localhost:3003/api/form/profile
curl http://localhost:3003/api/form/tenant-info
```

---

## 三、JSON 序列化格式化 — `@JsonFormat`

### 功能概述

`@JsonFormat` 是 `@ai-partner-x/aiko-boot-starter-web` 提供的**属性装饰器**，对应 Spring Boot / Jackson 的 `@JsonFormat` 注解。最常见的场景是将 DTO 中的 `Date` 字段以人类可读的字符串格式（而非默认 ISO-8601）输出到 JSON 响应中。

- 在 DTO 类的 `Date` 类型属性上标注 `@JsonFormat`，控制器返回该对象时框架**自动格式化**，无需手动调用任何转换函数。
- 支持 Java `SimpleDateFormat` 风格的 `pattern`（`yyyy-MM-dd HH:mm:ss` 等）。
- 支持 IANA 时区（`Asia/Shanghai`、`UTC`、`America/New_York` 等）。
- 支持 `shape: 'NUMBER'` 将日期序列化为 Unix 毫秒时间戳。
- 格式化逻辑由 `applyJsonFormat()` 递归遍历整个对象图；数组、嵌套对象均可正确处理。

| TypeScript | Java Spring 对应 |
|---|---|
| `@JsonFormat({ pattern, timezone, shape })` | `@com.fasterxml.jackson.annotation.JsonFormat` |
| `formatDate(date, pattern, timezone?)` | Jackson 内部 `_format.format(date)` |
| `applyJsonFormat(value)` | Jackson `ObjectMapper` 序列化管道 |

### 开发思路

1. **元数据驱动**：`@JsonFormat` 通过 `reflect-metadata` 将格式配置写入类原型（key `'aiko-boot:jsonFormat'`），以属性名为键存储。路由层在序列化响应时读取元数据，按配置格式化对应字段。
2. **自动应用**：`createExpressRouter` 中的响应处理器在 `res.json()` 之前自动调用 `applyJsonFormat(result)`，控制器代码无需任何修改即可享受格式化能力。
3. **无侵入**：未标注 `@JsonFormat` 的 `Date` 字段保持默认行为（`JSON.stringify` 输出 ISO-8601 字符串）；非 `Date` 字段不受影响。
4. **性能友好**：格式化 token 键表 `SORTED_DATE_TOKEN_KEYS` 在模块加载时一次性按长度降序排好，`formatDate()` 每次调用仅构建一个 `tokenValues` Map，不再重新排序。

### 技术实现

#### `JsonFormatOptions` 类型（`@ai-partner-x/aiko-boot-starter-web`）

```typescript
export interface JsonFormatOptions {
  /**
   * Java SimpleDateFormat 风格的日期格式字符串。
   * 支持 token：yyyy yy MM M dd d HH H mm m ss s SSS S
   * @example 'yyyy-MM-dd HH:mm:ss'
   */
  pattern?: string;
  /**
   * IANA 时区标识符，省略时使用进程本地时区。
   * @example 'Asia/Shanghai'  'UTC'  'America/New_York'
   */
  timezone?: string;
  /**
   * 序列化形态：'STRING'（默认，使用 pattern 格式化）或 'NUMBER'（Unix 毫秒时间戳）
   */
  shape?: 'STRING' | 'NUMBER';
}
```

#### `@JsonFormat` 装饰器（`packages/aiko-boot-starter-web/src/decorators.ts`）

```typescript
export function JsonFormat(options: JsonFormatOptions = {}) {
  return function (target: object, propertyKey: string) {
    const formats = Reflect.getMetadata('aiko-boot:jsonFormat', target) || {};
    formats[propertyKey] = options;
    Reflect.defineMetadata('aiko-boot:jsonFormat', formats, target);
  };
}
```

#### `formatDate` 工具函数（`packages/aiko-boot-starter-web/src/decorators.ts`）

```typescript
// 支持 token（从长到短处理，避免 'MM' 被误识别为 'M'+'M'）：
// yyyy  4 位年  yy   2 位年
// MM    2 位月  M    不补零月
// dd    2 位日  d    不补零日
// HH    2 位时  H    不补零时
// mm    2 位分  m    不补零分
// ss    2 位秒  s    不补零秒
// SSS   3 位毫秒  S   不补零毫秒

formatDate(new Date('2024-03-09T08:05:06.007Z'), 'yyyy/MM/dd HH:mm:ss.SSS', 'Asia/Shanghai')
// → '2024/03/09 16:05:06.007'  (UTC+8)
```

#### `applyJsonFormat` 递归序列化（`packages/aiko-boot-starter-web/src/decorators.ts`）

```typescript
// 自动在路由响应中调用，无需手动使用
export function applyJsonFormat(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(item => applyJsonFormat(item));
  if (value instanceof Date) return value;          // 无注解时原样保留
  if (typeof value === 'object' && value !== null) {
    const proto   = Object.getPrototypeOf(value);
    const formats = proto !== Object.prototype
      ? Reflect.getMetadata('aiko-boot:jsonFormat', proto) || {}
      : {};
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      const val = (value as any)[key];
      const fmt = formats[key];
      if (fmt && val instanceof Date) {
        result[key] = fmt.shape === 'NUMBER'
          ? val.getTime()
          : (fmt.pattern ? formatDate(val, fmt.pattern, fmt.timezone) : val.toISOString());
      } else {
        result[key] = applyJsonFormat(val);         // 递归嵌套对象
      }
    }
    return result;
  }
  return value;
}
```

#### 路由层自动应用（`packages/aiko-boot-starter-web/src/express-router.ts`）

```typescript
// 控制器方法执行完成后，在 res.json() 之前自动格式化
const result = await controllerMethod.apply(instance, args);
res.json({ success: true, data: applyJsonFormat(result) });
```

### 快速开始

#### 1. 在 DTO 中标注 `@JsonFormat`

```typescript
import { JsonFormat } from '@ai-partner-x/aiko-boot-starter-web';

export class UserDto {
  id!: number;
  name!: string;

  /** 格式化为上海时区字符串 */
  @JsonFormat({ pattern: 'yyyy-MM-dd HH:mm:ss', timezone: 'Asia/Shanghai' })
  createTime?: Date;

  /** 仅日期，不含时间 */
  @JsonFormat({ pattern: 'yyyy-MM-dd' })
  birthday?: Date;

  /** Unix 毫秒时间戳（数字类型） */
  @JsonFormat({ shape: 'NUMBER' })
  updatedAt?: Date;
}
```

#### 2. 控制器返回 DTO — 无需额外代码

```typescript
import {
  RestController, GetMapping, PathVariable,
} from '@ai-partner-x/aiko-boot-starter-web';

@RestController({ path: '/users' })
export class UserController {
  @GetMapping('/:id')
  getUser(@PathVariable('id') id: string): UserDto {
    const dto = new UserDto();
    dto.id         = Number(id);
    dto.name       = 'Alice';
    dto.createTime = new Date('2024-01-15T00:30:00Z');
    dto.birthday   = new Date('1995-06-20T00:00:00Z');
    dto.updatedAt  = new Date('2024-03-09T08:00:00Z');
    return dto;
  }
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Alice",
    "createTime": "2024-01-15 08:30:00",
    "birthday":   "1995-06-20",
    "updatedAt":  1709971200000
  }
}
```

#### 3. `curl` 测试

```bash
curl http://localhost:3003/api/users/1
```

#### 支持的 `pattern` token 速查

| Token | 含义 | 示例（2024-03-09 08:05:06.007） |
|---|---|---|
| `yyyy` | 4 位年 | `2024` |
| `yy` | 2 位年 | `24` |
| `MM` | 2 位月（补零） | `03` |
| `M` | 月（不补零） | `3` |
| `dd` | 2 位日（补零） | `09` |
| `d` | 日（不补零） | `9` |
| `HH` | 2 位 24 制小时（补零） | `08` |
| `H` | 小时（不补零） | `8` |
| `mm` | 2 位分钟（补零） | `05` |
| `m` | 分钟（不补零） | `5` |
| `ss` | 2 位秒（补零） | `06` |
| `s` | 秒（不补零） | `6` |
| `SSS` | 3 位毫秒（补零） | `007` |
| `S` | 毫秒（不补零） | `7` |

---

## 四、异步与响应式支持 — `@Async`

### 功能概述

`@Async` 来自 `@ai-partner-x/aiko-boot`，对应 Spring Boot 的 `@Async`（fire-and-forget 语义）：

- 被装饰方法立即返回一个已 resolve 的 `Promise<void>`（fire-and-forget），HTTP 响应几乎在 0ms 内返回。
- 被装饰方法的真实逻辑通过 `setImmediate` 在下一个事件循环 tick 中执行，与调用方的执行路径完全解耦。
- 支持通过 `onError` 选项自定义后台异常处理器，后台异常不会影响调用方，也不会造成未处理的 Promise 拒绝。
