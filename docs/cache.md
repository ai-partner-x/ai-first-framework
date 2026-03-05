# AI-First Framework — @ai-first/cache 说明

> 本文档描述 `packages/cache/` 包的功能、API 与使用方式。

---

## 概述

**路径：** `packages/cache/`  
**包名：** `@ai-first/cache`  
**版本：** 0.1.0  
**描述：** Redis 缓存框架，提供 Spring Boot Cache 风格的装饰器与 Spring Data Redis 风格的 `RedisTemplate`，底层基于 [ioredis](https://github.com/redis/ioredis)。

### 设计理念

| 概念 | TypeScript（AI-First） | Java（Spring Boot） |
|------|----------------------|---------------------|
| 缓存组件标记（含 DI 注册） | `@RedisComponent()` | `@Service` / `@Repository` |
| 属性注入 | `@Autowired()` | `@Autowired` |
| 读通缓存 | `@Cacheable` | `@Cacheable` |
| 写通缓存 | `@CachePut` | `@CachePut` |
| 缓存失效 | `@CacheEvict` | `@CacheEvict` |
| Redis 操作模板 | `RedisTemplate<K, V>` | `RedisTemplate<K, V>` |
| 字符串操作模板 | `StringRedisTemplate` | `StringRedisTemplate` |

---

## 快速开始

```bash
pnpm add @ai-first/cache
```

### 方式一：@Service / @Component + @Cacheable（推荐）

使用通用 DI 装饰器作为类装饰器，方法上使用 `@Cacheable` 等缓存注解。  
**当方法带有 `@Cacheable`/`@CachePut`/`@CacheEvict` 时，类会被自动识别为缓存组件。**

```typescript
import 'reflect-metadata';
import { Cacheable, CachePut, CacheEvict, Autowired } from '@ai-first/cache';
import { Service } from '@ai-first/core';
import { Container } from '@ai-first/di';

@Service()
class UserRepository {
  findById(id: number): User { return db.findUser(id); }
}

// @Service 作为类装饰器，无需 @RedisComponent
// 方法带有 @Cacheable，类被自动识别为缓存组件（等同于 @RedisComponent）
@Service()
class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;  // DI 自动注入

  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User> {
    return this.userRepository.findById(id);
  }

  @CachePut({ key: 'user', ttl: 300 })
  async updateUser(id: number, user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}

// 通过 DI 容器解析（等同于 Java @Autowired）
const userService = Container.resolve(UserCacheService);
```

### 方式二：@RedisComponent（专用缓存组件装饰器）

语义上更明确，表达"这个类是 Redis 缓存组件"。与方式一完全等价。

```typescript
import 'reflect-metadata';
import { RedisComponent, Cacheable, Autowired } from '@ai-first/cache';
import { Container } from '@ai-first/di';

@RedisComponent()
class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;

  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User> {
    return this.userRepository.findById(id);
  }
}

const userService = Container.resolve(UserCacheService);
```

---

## 连接配置

### createRedisConnection

```typescript
import { createRedisConnection, closeRedisConnection } from '@ai-first/cache';

// 单机模式（默认）
const client = createRedisConnection({ host: '127.0.0.1', port: 6379 });

// 带密码
const client = createRedisConnection({ host: 'redis.example.com', port: 6379, password: 'secret' });

// Sentinel 模式（高可用）
const client = createRedisConnection({
  mode: 'sentinel',
  masterName: 'mymaster',
  sentinels: [{ host: '127.0.0.1', port: 26379 }],
});

// Cluster 模式（集群）
const client = createRedisConnection({
  mode: 'cluster',
  nodes: [{ host: '127.0.0.1', port: 7000 }, { host: '127.0.0.1', port: 7001 }],
});

// 关闭连接
await closeRedisConnection();
```

### 配置项（单机模式）

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `host` | `string` | `'127.0.0.1'` | Redis 主机 |
| `port` | `number` | `6379` | Redis 端口 |
| `password` | `string` | — | 认证密码 |
| `database` | `number` | `0` | 数据库索引 |
| `connectTimeout` | `number` | `10000` | 连接超时（ms） |
| `tls` | `boolean` | `false` | 启用 TLS |

---

## Cache 装饰器

### 两种类级装饰器（等价）

#### 方式一：@Service / @Component（推荐）

使用通用 DI 装饰器作为类装饰器。方法上有 `@Cacheable`/`@CachePut`/`@CacheEvict` 时，类**自动被识别为缓存组件**，无需显式添加 `@RedisComponent`。

```typescript
import { Service } from '@ai-first/core';          // 通用 DI 装饰器
import { Cacheable, CachePut, CacheEvict, Autowired } from '@ai-first/cache';

// @Service 作为类装饰器，等同于 Java:
// @Service
// public class UserCacheService { ... }
@Service({ name: 'UserCacheService' })
class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;

  // 有 @Cacheable → 类被自动识别为缓存组件
  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
```

#### 方式二：@RedisComponent（专用装饰器）

与方式一完全等价，语义上更明确地标记"这是 Redis 缓存组件"。

```typescript
import { RedisComponent, Cacheable, Autowired } from '@ai-first/cache';

@RedisComponent({ name: 'UserCacheService' })
class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;

  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
```

两种方式都支持：
- **自动注册到 DI 容器**（Injectable + Singleton），可被其他服务通过 `@Autowired` 注入
- **支持构造函数注入**（constructor injection）
- **支持 `@Autowired` 属性注入**（通过 DI 容器自动管理依赖）
- **未初始化 Redis 时自动降级**，缓存方法直接调用原始实现
- `getRedisComponentMetadata()` 返回有效元数据

```typescript
// 通过 DI 容器解析（两种方式均有效）
const svc = Container.resolve(UserCacheService);

// 在另一个 @Service 中注入（两种方式均有效）
@Service()
class UserService {
  @Autowired()
  private cacheService!: UserCacheService;
}

// 读取元数据（两种方式均返回有效数据）
const meta = getRedisComponentMetadata(UserCacheService);
// 方式一（@Service + @Cacheable）: { className: 'UserCacheService' }
// 方式二（@RedisComponent）:        { name: 'UserCacheService', className: 'UserCacheService' }
```

### @RedisComponent 选项

| 选项 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 组件名称（可选，用于日志/调试） |

**对应 Java：**
```java
@Service  // 等价于 @RedisComponent
public class UserCacheService {
    @Autowired
    private UserRepository userRepository;
}
```

### @Autowired（便捷再导出）

`@ai-first/cache` 已内置再导出 `@Autowired`，无需单独引入 `@ai-first/di`：

```typescript
import { RedisComponent, Autowired } from '@ai-first/cache';
// 等同于：import { Autowired } from '@ai-first/di';
```

### @Cacheable

缓存方法返回值。调用前先查缓存，命中则直接返回；未命中则执行方法并将结果写入缓存。  
**未初始化 Redis 时自动降级，直接调用原方法。**

```typescript
import { Cacheable } from '@ai-first/cache';

@Cacheable({ key: 'user', ttl: 300 })
async getUserById(id: number): Promise<User> {
  return db.findUser(id);  // Redis 命中时不会执行
}

// 自定义 key 生成器
@Cacheable({
  key: 'user',
  ttl: 300,
  keyGenerator: (id) => `profile:${id}`,
})
async getUserProfile(id: number): Promise<UserProfile> { ... }

// 条件缓存
@Cacheable({
  key: 'user',
  condition: (id) => (id as number) > 0,
})
async getUser(id: number): Promise<User | null> { ... }
```

| 选项 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 缓存 key 前缀，最终 key = `{key}::{参数}` |
| `ttl` | `number` | 过期时间（秒），不设置则永久缓存 |
| `keyGenerator` | `CacheKeyGenerator` | 自定义 key 生成函数，接收方法参数 |
| `condition` | `(...args) => boolean` | 缓存条件，返回 `false` 时跳过缓存 |

**对应 Java：**
```java
@Cacheable(value = "user", key = "#id")
public User getUserById(Long id) { ... }
```

### @CachePut

每次都执行方法，并将返回值写入缓存（不跳过方法执行）。用于写操作后同步更新缓存。

```typescript
import { CachePut } from '@ai-first/cache';

@CachePut({ key: 'user', ttl: 300, keyGenerator: (id) => String(id) })
async updateUser(id: number, user: User): Promise<User> {
  return db.updateUser(id, user);  // 始终执行，结果写入缓存
}
```

**对应 Java：**
```java
@CachePut(value = "user", key = "#id")
public User updateUser(Long id, User user) { ... }
```

### @CacheEvict

执行方法后删除指定缓存（也可配置为执行前删除）。

```typescript
import { CacheEvict } from '@ai-first/cache';

// 删除单个缓存 key
@CacheEvict({ key: 'user' })
async deleteUser(id: number): Promise<void> {
  await db.deleteUser(id);
}

// 清除所有以 'user::' 开头的缓存
@CacheEvict({ key: 'user', allEntries: true })
async clearAllUsers(): Promise<void> { ... }

// 在方法执行前清除缓存
@CacheEvict({ key: 'user', beforeInvocation: true })
async resetUser(id: number): Promise<void> { ... }
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `key` | `string` | — | 缓存 key 前缀 |
| `keyGenerator` | `CacheKeyGenerator` | — | 自定义 key 生成函数 |
| `allEntries` | `boolean` | `false` | 清除所有以 `key::` 开头的缓存 |
| `beforeInvocation` | `boolean` | `false` | 是否在方法执行前清除缓存 |

**对应 Java：**
```java
@CacheEvict(value = "user", key = "#id")
public void deleteUser(Long id) { ... }

@CacheEvict(value = "user", allEntries = true)
public void clearAll() { ... }
```

---

## RedisTemplate\<K, V\>

Spring Data Redis 风格的 Redis 操作模板，提供类型安全的 API。

```typescript
import { createRedisConnection, RedisTemplate, StringRedisTemplate } from '@ai-first/cache';

const client = createRedisConnection({ host: 'localhost', port: 6379 });

// 通用模板（JSON 序列化）
const redisTemplate = new RedisTemplate<string, unknown>({ client });

// 字符串专用模板（passthrough 序列化）
const stringTemplate = new StringRedisTemplate({ client });
```

### 全局 Key 操作

| 方法 | Spring 对应 | 说明 |
|------|-------------|------|
| `hasKey(key)` | `hasKey(K key)` | 判断 key 是否存在 |
| `delete(key)` | `delete(K key)` | 删除单个或多个 key |
| `expire(key, seconds)` | `expire(K key, Duration timeout)` | 设置过期时间 |
| `getExpire(key)` | `getExpire(K key)` | 获取剩余 TTL（秒） |
| `keys(pattern)` | `keys(K pattern)` | 按 pattern 查找 key |
| `rename(oldKey, newKey)` | `rename(K oldKey, K newKey)` | 重命名 key |
| `type(key)` | `type(K key)` | 获取 key 类型 |

### opsForValue() — String 操作

```typescript
const ops = redisTemplate.opsForValue();

await ops.set('name', '张三');
await ops.set('counter', 0, 60);            // 带 TTL（秒）
const val = await ops.get('name');           // '张三'
await ops.increment('counter');              // +1
await ops.decrement('counter');              // -1
await ops.multiSet(new Map([['k1', 'v1'], ['k2', 'v2']]));
const vals = await ops.multiGet(['k1', 'k2']);
const len = await ops.size('name');          // 字符串长度
```

### opsForHash() — Hash 操作

```typescript
const hashOps = redisTemplate.opsForHash<string, string>();

await hashOps.put('user:1', 'name', '张三');
await hashOps.putAll('user:1', new Map([['email', 'a@b.com'], ['age', '25']]));
const name = await hashOps.get('user:1', 'name');
const entries = await hashOps.entries('user:1');  // Map<string, string>
const keys = await hashOps.keys('user:1');
const size = await hashOps.size('user:1');
await hashOps.delete('user:1', 'age');
const exists = await hashOps.hasKey('user:1', 'name');
```

### opsForList() — List 操作

```typescript
const listOps = redisTemplate.opsForList();

await listOps.rightPush('queue', 'task1');
await listOps.leftPush('queue', 'task0');
const task = await listOps.leftPop('queue');
const items = await listOps.range('queue', 0, -1);
const size = await listOps.size('queue');
await listOps.set('queue', 0, 'updated');
```

### opsForSet() — Set 操作

```typescript
const setOps = redisTemplate.opsForSet();

await setOps.add('tags', 'redis', 'cache', 'nosql');
const members = await setOps.members('tags');   // Set<string>
const has = await setOps.isMember('tags', 'redis');
const size = await setOps.size('tags');
await setOps.remove('tags', 'nosql');
```

### opsForZSet() — 有序集合操作

```typescript
const zsetOps = redisTemplate.opsForZSet();

await zsetOps.add('leaderboard', 'player1', 100);
await zsetOps.incrementScore('leaderboard', 'player1', 50);
const score = await zsetOps.score('leaderboard', 'player1');
const top3 = await zsetOps.reverseRange('leaderboard', 0, 2);
const top3WithScores = await zsetOps.reverseRangeWithScores('leaderboard', 0, 2);
const rank = await zsetOps.reverseRank('leaderboard', 'player1');
const count = await zsetOps.count('leaderboard', 0, 200);
```

---

## 完整示例

```typescript
import 'reflect-metadata';
import {
  createRedisConnection, closeRedisConnection,
  RedisTemplate,
  RedisComponent, Cacheable, CachePut, CacheEvict, Autowired,
} from '@ai-first/cache';
import { Container } from '@ai-first/di';
import { Service } from '@ai-first/core';

interface User { id: number; name: string; email: string; }

// 数据层：用 @Service 注册到 DI 容器
@Service()
class UserRepository {
  private db = new Map<number, User>([
    [1, { id: 1, name: '张三', email: 'zhangsan@example.com' }],
  ]);
  findById(id: number): User | null { return this.db.get(id) ?? null; }
  save(user: User): User { this.db.set(user.id, user); return user; }
  remove(id: number): void { this.db.delete(id); }
}

// 缓存层：@RedisComponent = @Service + 缓存语义
@RedisComponent({ name: 'UserCacheService' })
class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;  // DI 自动注入

  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    console.log('[DB] 查询数据库');
    return this.userRepository.findById(id);
  }

  @CachePut({ key: 'user', ttl: 300, keyGenerator: (id) => String(id) })
  async updateUser(id: number, user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<void> {
    this.userRepository.remove(id);
  }
}

// 使用 DI 容器解析（UserRepository 自动注入）
const client = createRedisConnection({ host: 'localhost', port: 6379 });
const redisTemplate = new RedisTemplate<string, unknown>({ client });

const userService = Container.resolve(UserCacheService);
const user = await userService.getUserById(1);  // 第一次：查询 DB
await userService.getUserById(1);               // 第二次：命中缓存
await userService.deleteUser(1);                // 清除缓存

// 直接操作 Redis
const ops = redisTemplate.opsForValue();
await ops.set('config:timeout', 30, 3600);
const timeout = await ops.get('config:timeout');

await closeRedisConnection();
```

---

## 依赖

- `ioredis ^5.4.2`
- `reflect-metadata ^0.2.1`
- `@ai-first/di workspace:*`
