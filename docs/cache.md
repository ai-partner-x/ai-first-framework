# AI-First Framework — @ai-partner-x/aiko-boot-starter-cache 说明

> 本文档描述 `packages/aiko-boot-starter-cache/` 包的功能、API 与使用方式。

**路径：** `packages/aiko-boot-starter-cache/`  
**包名：** `@ai-partner-x/aiko-boot-starter-cache`  
**版本：** 0.1.0

---

## 功能概述

`@ai-partner-x/aiko-boot-starter-cache` 将 Spring Boot 缓存体系完整移植到 TypeScript 生态，提供两个独立的入口点：

| 入口 | 对标 Spring | 职责 |
|------|-------------|------|
| `@ai-partner-x/aiko-boot-starter-cache` | `spring-context`（Spring Cache 抽象） | 声明式缓存注解、CacheManager SPI、启动初始化 |
| `@ai-partner-x/aiko-boot-starter-cache/redis` | `spring-data-redis`（Spring Data Redis） | Redis 连接管理、RedisTemplate、数据结构操作 |

**核心能力：**

| 概念 | TypeScript（AI-First） | Java（Spring Boot） |
|------|----------------------|---------------------|
| 开启缓存功能（启动验证） | `initializeCaching(config)` / `createApp({ cache })` | `@EnableCaching` + `spring.cache.type=redis` |
| 缓存组件标记 | `@Service()` / `@Component()` | `@Service` / `@Repository` |
| 属性注入 | `@Autowired()` | `@Autowired` |
| 读通缓存 | `@Cacheable` | `@Cacheable` |
| 写通缓存 | `@CachePut` | `@CachePut` |
| 缓存失效 | `@CacheEvict` | `@CacheEvict` |
| Redis 操作模板 | `RedisTemplate<K, V>` | `RedisTemplate<K, V>` |
| 字符串操作模板 | `StringRedisTemplate` | `StringRedisTemplate` |
| 后端配置 | `CacheConfig`（`type: 'redis' \| ...`） | `spring.cache.type` |
| 自定义后端 | `Cache` / `CacheManager` SPI | `CacheManager` Bean |

---

## 开发思路

### 问题与动机

传统做法将缓存实现（如 `ioredis`）直接硬编码在业务代码或启动配置中，导致：

- 切换缓存后端（如从 Redis 切到 Memcached）需要修改所有业务代码
- 测试时无法轻易替换为内存实现
- 框架 API（如 `createApp({ cache })`）的 `cache` 选项类型写死为具体后端，无法扩展

### 设计思路

1. **分层解耦**：将「缓存语义」与「缓存实现」分离，对应 Spring 的 Cache 抽象层设计

   ```
   业务代码 (@Cacheable / @CachePut / @CacheEvict)
       ↓ 通过 CacheManager 接口
   后端实现 (RedisCacheManager / InMemoryCacheManager / ...)
       ↓ 通过具体技术
   底层驱动 (ioredis / memjs / ...)
   ```

2. **SPI 扩展点**：`Cache` + `CacheManager` 两个接口定义稳定契约，新后端只需实现接口并调用 `setCacheManager()` 注册，业务代码零改动

3. **CacheConfig 联合类型**：以 `type` 字段作为辨别符（对应 `spring.cache.type`），为框架 API 的 `cache` 选项提供稳定、可扩展的配置类型：

   ```typescript
   createApp({ cache: { type: 'redis', host: '127.0.0.1', port: 6379 } })
   // 未来：
   createApp({ cache: { type: 'memcached', host: '127.0.0.1', port: 11211 } })
   ```

4. **双入口分层**：`@ai-partner-x/aiko-boot-starter-cache` 只依赖缓存抽象（无 ioredis 直接依赖），`@ai-partner-x/aiko-boot-starter-cache/redis` 提供 Redis 专属 API，用户按需引入

---

## 技术实现

### 入口 1：`@ai-partner-x/aiko-boot-starter-cache`（缓存抽象层）

#### CacheManager SPI（`src/spi/cache.ts`）

定义两个扩展接口，对应 `org.springframework.cache.Cache` 和 `CacheManager`：

```typescript
interface Cache {
  getName(): string;
  get(entryKey: string): Promise<string | null>;
  put(entryKey: string, value: string, ttlSeconds?: number): Promise<void>;
  evict(entryKey: string): Promise<void>;
  clear(): Promise<void>;        // 使用 SCAN 游标, 非阻塞
}

interface CacheManager {
  getCache(name: string): Cache; // 懒加载，按需创建命名空间
}
```

#### 全局注册表（`src/cache-manager-registry.ts`）

维护单例 `CacheManager`，装饰器通过 `getCacheManager()` 获取，与后端完全解耦：

```typescript
import { setCacheManager, getCacheManager, clearCacheManager } from '@ai-partner-x/aiko-boot-starter-cache';

setCacheManager(new RedisCacheManager(client));   // 注册（通常由 initializeCaching 自动完成）
getCacheManager();                                 // 装饰器内部调用
clearCacheManager();                               // 测试/应用关闭时清理
```

#### 缓存注解（`src/decorators.ts`）

三个方法装饰器，对应 Spring Cache 的同名注解：

| 装饰器 | 对标 Spring | 行为 |
|--------|-------------|------|
| `@Cacheable(options)` | `@Cacheable` | 先查缓存，命中则返回；未命中则执行方法并写入缓存 |
| `@CachePut(options)` | `@CachePut` | 每次执行方法，并将结果写入/更新缓存 |
| `@CacheEvict(options)` | `@CacheEvict` | 执行方法后删除缓存（`allEntries: true` 清空整个命名空间） |

**优雅降级**：`getCacheManager()` 返回 `null`（未注册任何后端）时，装饰器透传原方法，不抛出异常。

#### 通用缓存配置（`src/spi/cache-config.ts`）

`CacheConfig` 辨别联合类型，`type` 字段对标 `spring.cache.type`：

```typescript
export type RedisCacheConfig = { type: 'redis' } & RedisConfig;
export type CacheConfig = RedisCacheConfig;
// 未来可扩展：
// | { type: 'simple' }
// | { type: 'memcached'; host: string; port: number }
```

新增后端只需：① 追加联合类型成员，② 在 `initializeCaching()` 的 `switch` 中添加一个 `case`，业务代码和注解**零改动**。

#### 启动初始化（`src/enable-caching.ts`）

`initializeCaching(config: CacheConfig)` 根据 `config.type` 分发到对应后端的初始化逻辑：

```
config.type === 'redis'
  → 创建短生命周期客户端发送 PING（5 秒超时，连接失败立即报错）
  → PING 成功后创建持久客户端
  → setCacheManager(new RedisCacheManager(client))
```

连接失败抛出 `CacheInitializationError`，阻止应用启动（对应 Spring 的 `BeanCreationException`）。

---

### 入口 2：`@ai-partner-x/aiko-boot-starter-cache/redis`（Spring Data Redis 层）

#### Redis 连接配置（`src/config.ts`）

支持三种拓扑，通过 `mode` 字段区分：

| mode | 类型 | 说明 |
|------|------|------|
| `undefined` / `'standalone'` | `RedisStandaloneConfig` | 单机模式（默认） |
| `'sentinel'` | `RedisSentinelConfig` | 哨兵高可用模式 |
| `'cluster'` | `RedisClusterConfig` | 集群水平扩展模式 |

#### RedisTemplate（`src/redis-template.ts`）

Spring `RedisTemplate<K, V>` 风格的操作模板，基于 `IORedisAdapter` 封装 ioredis：

```typescript
class RedisTemplate<K = string, V = unknown> {
  opsForValue(): ValueOperations<K, V>                   // String 类型操作
  opsForList(): ListOperations<K, V>                     // List 类型操作
  opsForHash<HK, HV>(): HashOperations<K, HK, HV>       // Hash 类型操作
  opsForSet(): SetOperations<K, V>                       // Set 类型操作
  opsForZSet(): ZSetOperations<K, V>                     // Sorted Set 类型操作
  delete(keys: K | K[]): Promise<number>                 // 删除 key
}

class StringRedisTemplate extends RedisTemplate<string, string> {}  // 字符串专用
```

#### RedisCacheManager（`src/cache-managers/redis-cache-manager.ts`）

实现 `CacheManager` / `Cache` SPI 接口的 Redis 后端：

- 物理 key 格式：`{namespace}::{entryKey}`（entryKey 为空时退化为 `{namespace}`）
- `clear()` 使用游标 `SCAN` 批量删除，避免 `KEYS *` 阻塞 Redis

---

## 快速开始

### 安装

```bash
pnpm add @ai-partner-x/aiko-boot-starter-cache
```

### 方式一：`app.config.ts` 自动配置（推荐）

在 `app.config.ts` 中声明 `cache.*` 配置，`CacheAutoConfiguration` 在应用启动时自动完成连接验证和 CacheManager 注册：

```typescript
// app.config.ts
import type { AppConfig } from '@ai-partner-x/aiko-boot';

export default {
  cache: {
    type: 'redis',
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
} satisfies AppConfig;

// src/server.ts
import { createApp } from '@ai-partner-x/aiko-boot';

const app = await createApp({ srcDir: import.meta.dirname });
app.run();
```

Redis Sentinel（高可用）：

```typescript
// app.config.ts
export default {
  cache: {
    type: 'redis',
    mode: 'sentinel',
    masterName: 'mymaster',
    sentinels: [
      { host: '127.0.0.1', port: 26379 },
      { host: '127.0.0.1', port: 26380 },
    ],
  },
} satisfies AppConfig;
```

> **提示**：`cache.*` 属性缺失时，`@ConditionalOnProperty('cache.type')` 会跳过 `CacheAutoConfiguration`，缓存装饰器自动降级，无需 Redis 即可本地开发。

### 方式二：手动初始化

```typescript
import 'reflect-metadata';
import { initializeCaching, CacheInitializationError } from '@ai-partner-x/aiko-boot-starter-cache';

try {
  await initializeCaching({
    type: 'redis',
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
  });
  console.log('缓存连接就绪');
} catch (e) {
  if (e instanceof CacheInitializationError) {
    console.error('启动失败：', e.message);
    process.exit(1);  // 连接失败时终止应用
  }
  throw e;
}
```

### 声明式缓存注解

在 `@Service` / `@Component` 类的方法上使用缓存注解（需先完成缓存初始化）：

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Cacheable, CachePut, CacheEvict } from '@ai-partner-x/aiko-boot-starter-cache';

@Service()
export class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;  // DI 自动注入

  // 读通缓存：命中则直接返回，不访问数据库
  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.selectById(id);
  }

  // 写通缓存：执行方法并将结果更新到缓存
  @CachePut({ key: 'user', ttl: 300, keyGenerator: (id: unknown) => String(id) })
  async updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User> {
    const existing = await this.userRepository.selectById(id);
    if (!existing) throw new Error(`用户 ${id} 不存在`);
    const updated: User = { ...existing, ...data };
    await this.userRepository.updateById(updated);
    return updated;
  }

  // 删除缓存：执行方法后清除对应条目
  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<boolean> {
    const affected = await this.userRepository.deleteById(id);
    return affected > 0;
  }

  // 清空整个命名空间
  @CacheEvict({ key: 'user', allEntries: true })
  async clearAllUsers(): Promise<void> {}
}
```

### 不使用 `initializeCaching` 时的行为（自动降级）

未调用 `initializeCaching` / `createApp({ cache })` 时，`@Cacheable` / `@CachePut` / `@CacheEvict` 检测到 CacheManager 未注册，**自动降级为直接调用原方法**，不访问 Redis，适合开发/测试环境。

---

## 缓存注解详细 API

### @Cacheable

缓存方法返回值。调用前先查缓存，命中则直接返回；未命中则执行方法并将结果写入缓存。

```typescript
import { Cacheable } from '@ai-partner-x/aiko-boot-starter-cache';

// 基础用法
@Cacheable({ key: 'user', ttl: 300 })
async getUserById(id: number): Promise<User> {
  return db.findUser(id);  // Redis 命中时不会执行
}

// 自定义 key 生成器（参数类型与方法参数一致）
@Cacheable({
  key: 'user',
  ttl: 300,
  keyGenerator: (id: number) => `profile:${id}`,
})
async getUserProfile(id: number): Promise<UserProfile> { ... }

// 条件缓存
@Cacheable({
  key: 'user',
  condition: (id: number) => id > 0,
})
async getUser(id: number): Promise<User | null> { ... }
```

| 选项 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 缓存命名空间, 物理 key = `{key}::{参数}` |
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
import { CachePut } from '@ai-partner-x/aiko-boot-starter-cache';

@CachePut({ key: 'user', ttl: 300, keyGenerator: (id: number) => String(id) })
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
import { CacheEvict } from '@ai-partner-x/aiko-boot-starter-cache';

// 删除单个缓存条目
@CacheEvict({ key: 'user' })
async deleteUser(id: number): Promise<void> {
  await db.deleteUser(id);
}

// 清除命名空间下全部缓存
@CacheEvict({ key: 'user', allEntries: true })
async clearAllUsers(): Promise<void> { ... }

// 在方法执行前清除缓存
@CacheEvict({ key: 'user', beforeInvocation: true })
async resetUser(id: number): Promise<void> { ... }
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `key` | `string` | — | 缓存命名空间 |
| `keyGenerator` | `CacheKeyGenerator` | — | 自定义 key 生成函数 |
| `allEntries` | `boolean` | `false` | `true` 时清空整个命名空间 (`key::*`) |
| `beforeInvocation` | `boolean` | `false` | `true` 时在方法执行前清除缓存 |

**对应 Java：**
```java
@CacheEvict(value = "user", key = "#id")
public void deleteUser(Long id) { ... }

@CacheEvict(value = "user", allEntries = true)
public void clearAll() { ... }
```

### @Autowired（便捷再导出）

`@ai-partner-x/aiko-boot-starter-cache` 内置再导出 `@Autowired`（来自 `@ai-partner-x/aiko-boot`），无需单独引入：

```typescript
import { Cacheable, Autowired } from '@ai-partner-x/aiko-boot-starter-cache';
// 等同于：import { Autowired } from '@ai-partner-x/aiko-boot';
```

---

## Redis 连接配置

`@ai-partner-x/aiko-boot-starter-cache/redis` 提供 Redis 连接管理 API：

```typescript
import {
  createRedisConnection,
  getRedisClient,
  closeRedisConnection,
} from '@ai-partner-x/aiko-boot-starter-cache/redis';

// 单机模式（默认）
const client = createRedisConnection({ host: '127.0.0.1', port: 6379 });

// 带密码（生产环境建议通过环境变量传入）
const client = createRedisConnection({ host: 'redis.example.com', port: 6379, password: process.env.REDIS_PASSWORD });

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

// 获取已初始化的全局客户端
const client = getRedisClient();

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

> **注意**：通过 `createApp({ cache })` 或 `initializeCaching(config)` 初始化后，使用 `getRedisClient()` 获取全局客户端，无需手动调用 `createRedisConnection()`。

---

## RedisTemplate\<K, V\>

`@ai-partner-x/aiko-boot-starter-cache/redis` 提供 Spring Data Redis 风格的 Redis 操作模板，类型安全。

```typescript
import { getRedisClient, RedisTemplate, StringRedisTemplate } from '@ai-partner-x/aiko-boot-starter-cache/redis';

// 通过 createApp / initializeCaching 初始化后获取客户端
const client = getRedisClient();

// 通用模板（支持 JSON 序列化）
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

await setOps.add('tags', 'redis', 'aiko-boot-starter-cache', 'nosql');
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

## 自定义缓存后端（SPI 扩展）

实现 `Cache` + `CacheManager` 接口，可接入任意缓存后端（Memcached、内存缓存、测试 Mock 等）：

```typescript
import { Cache, CacheManager, setCacheManager } from '@ai-partner-x/aiko-boot-starter-cache';

class MapCache implements Cache {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  constructor(public readonly name: string) {}

  getName() { return this.name; }

  async get(entryKey: string): Promise<string | null> {
    const entry = this.store.get(entryKey);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(entryKey);
      return null;
    }
    return entry.value;
  }

  async put(entryKey: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(entryKey, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async evict(entryKey: string): Promise<void> { this.store.delete(entryKey); }
  async clear(): Promise<void> { this.store.clear(); }
}

class MapCacheManager implements CacheManager {
  private caches = new Map<string, MapCache>();
  getCache(name: string): Cache {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MapCache(name));
    }
    return this.caches.get(name)!;
  }
}

// 测试环境：使用内存缓存替代 Redis
setCacheManager(new MapCacheManager());
```

---

## 完整示例

```typescript
import 'reflect-metadata';
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Cacheable, CachePut, CacheEvict } from '@ai-partner-x/aiko-boot-starter-cache';
import { getRedisClient, RedisTemplate } from '@ai-partner-x/aiko-boot-starter-cache/redis';

interface User { id: number; name: string; email: string; }

// 数据层
@Service()
class UserRepository {
  private db = new Map<number, User>([
    [1, { id: 1, name: '张三', email: 'zhangsan@example.com' }],
  ]);
  findById(id: number): User | null { return this.db.get(id) ?? null; }
  save(user: User): User { this.db.set(user.id, user); return user; }
  remove(id: number): void { this.db.delete(id); }
}

// 缓存服务层
@Service()
class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;

  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    console.log('[DB] 查询数据库');
    return this.userRepository.findById(id);
  }

  @CachePut({ key: 'user', ttl: 300, keyGenerator: (id: unknown) => String(id) })
  async updateUser(id: number, user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<void> {
    this.userRepository.remove(id);
  }
}
```

```typescript
// app.config.ts — 启动应用（CacheAutoConfiguration 自动初始化 Redis 连接 + CacheManager）
import type { AppConfig } from '@ai-partner-x/aiko-boot';

export default {
  cache: {
    type: 'redis',
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
} satisfies AppConfig;
```

```typescript
// src/server.ts
import { createApp } from '@ai-partner-x/aiko-boot';

const app = await createApp({ srcDir: import.meta.dirname });

// 直接操作 Redis（通过 RedisTemplate，在 CacheAutoConfiguration 初始化后可用）
const client = getRedisClient();
const redisTemplate = new RedisTemplate<string, unknown>({ client });
const ops = redisTemplate.opsForValue();
await ops.set('config:timeout', 30, 3600);
const timeout = await ops.get('config:timeout');

app.run();
```

---

## API 参考

### `@ai-partner-x/aiko-boot-starter-cache` 导出

| 导出 | 类型 | 说明 |
|------|------|------|
| `Cacheable(options)` | 方法装饰器 | 读通缓存 |
| `CachePut(options)` | 方法装饰器 | 写通缓存 |
| `CacheEvict(options)` | 方法装饰器 | 删除缓存 |
| `Autowired` | 属性装饰器 | DI 属性注入（re-export from `@ai-partner-x/aiko-boot`） |
| `initializeCaching(config)` | `async function` | 根据 `config.type` 初始化缓存后端 |
| `CacheInitializationError` | 类 | 初始化失败异常 |
| `CacheAutoConfiguration` | 类 | Spring Boot 风格自动配置（读取 `cache.*` 属性，自动初始化/关闭连接） |
| `CacheProperties` | 类 | `@ConfigurationProperties('cache')` 绑定类，覆盖 standalone/sentinel/cluster 全部属性 |
| `CacheConfig` | 类型 | 通用缓存配置联合类型（`type: 'redis' \| ...`） |
| `RedisCacheConfig` | 类型 | Redis 后端配置（`{ type: 'redis' } & RedisConfig`） |
| `Cache` | 接口 | 缓存命名空间操作 SPI |
| `CacheManager` | 接口 | 缓存管理器 SPI |
| `setCacheManager(manager)` | 函数 | 注册 CacheManager |
| `getCacheManager()` | 函数 | 获取当前 CacheManager（未注册时返回 `null`） |
| `isCacheManagerInitialized()` | 函数 | 判断是否已注册 CacheManager |
| `clearCacheManager()` | 函数 | 清除当前 CacheManager（测试/关闭时使用） |
| `CacheableOptions` | 类型 | `@Cacheable` / `@CachePut` 选项 |
| `CacheEvictOptions` | 类型 | `@CacheEvict` 选项 |
| `CacheKeyGenerator` | 类型 | key 生成函数类型 |

### `@ai-partner-x/aiko-boot-starter-cache/redis` 导出

| 导出 | 类型 | 说明 |
|------|------|------|
| `RedisConfig` | 类型 | Redis 连接配置（standalone / sentinel / cluster） |
| `RedisStandaloneConfig` | 类型 | 单机配置 |
| `RedisSentinelConfig` | 类型 | 哨兵配置 |
| `RedisClusterConfig` | 类型 | 集群配置 |
| `createRedisConnection(config)` | 函数 | 创建并保存全局 Redis 连接 |
| `getRedisClient()` | 函数 | 获取全局 Redis 客户端 |
| `getRedisConfig()` | 函数 | 获取当前 Redis 配置 |
| `closeRedisConnection()` | `async function` | 关闭 Redis 连接 |
| `isRedisInitialized()` | 函数 | 判断 Redis 是否已初始化 |
| `RedisTemplate<K, V>` | 类 | 通用 Redis 操作模板 |
| `StringRedisTemplate` | 类 | 字符串专用模板 |
| `RedisCacheManager` | 类 | CacheManager SPI 的 Redis 实现 |
| `IORedisAdapter` | 类 | 底层 ioredis 适配器 |
| `ValueOperations` | 接口 | String 操作 |
| `ListOperations` | 接口 | List 操作 |
| `HashOperations` | 接口 | Hash 操作 |
| `SetOperations` | 接口 | Set 操作 |
| `ZSetOperations` | 接口 | Sorted Set 操作 |

---

## 依赖

- `ioredis ^5.4.2`（由 `@ai-partner-x/aiko-boot-starter-cache/redis` 使用）
- `reflect-metadata ^0.2.1`
- `@ai-partner-x/aiko-boot workspace:*`
