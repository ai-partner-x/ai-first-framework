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
| 开启缓存功能（启动验证） | `initializeCaching(config)` / `app.config.ts` (`cache.*`) | `@EnableCaching` + `spring.cache.type=redis` |
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
- 框架 `app.config.ts` 中的 `cache.*` 配置类型写死为具体后端，无法扩展

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

3. **CacheConfig 联合类型**：以 `type` 字段作为辨别符（对应 `spring.cache.type`），为框架 `app.config.ts` 中的 `cache.*` 配置提供稳定、可扩展的配置类型：

   ```typescript
   // app.config.ts
   export default {
     cache: { enabled: true, type: 'redis', host: '127.0.0.1', port: 6379 },
   } satisfies AppConfig;
   // 未来：
   // cache: { enabled: true, type: 'memcached', host: '127.0.0.1', port: 11211 }
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
    enabled: true,
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
    enabled: true,
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

Redis Cluster（集群）：

```typescript
// app.config.ts
export default {
  cache: {
    enabled: true,
    type: 'redis',
    mode: 'cluster',
    nodes: [
      { host: '127.0.0.1', port: 7000 },
      { host: '127.0.0.1', port: 7001 },
      { host: '127.0.0.1', port: 7002 },
    ],
  },
} satisfies AppConfig;
```

#### CacheProperties 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | `boolean` | `false` | 是否启用缓存，设置为 `true` 时才会自动初始化缓存连接 |
| `strict` | `boolean` | `false` | 严格模式：当 `cache.enabled=true` 但配置不完整时，是否抛出错误（而非仅打印警告并跳过初始化） |
| `type` | `'redis'` | — | 缓存后端类型，目前支持 `'redis'` |
| `mode` | `'standalone' \| 'sentinel' \| 'cluster'` | `'standalone'` | Redis 连接模式 |
| `host` | `string` | `'127.0.0.1'` | Redis 主机（单机模式） |
| `port` | `number` | `6379` | Redis 端口（单机模式） |
| `password` | `string` | — | 连接密码 |
| `database` | `number` | `0` | 数据库索引 |
| `connectTimeout` | `number` | `10000` | 连接超时（毫秒） |
| `commandTimeout` | `number` | — | 命令超时（毫秒） |
| `tls` | `boolean` | `false` | 是否启用 TLS |
| `masterName` | `string` | — | Sentinel 主节点名称（Sentinel 模式） |
| `sentinels` | `Array<{host: string, port: number}>` | — | Sentinel 节点列表（Sentinel 模式） |
| `nodes` | `Array<{host: string, port: number}>` | — | 集群节点列表（Cluster 模式） |

> **提示**：`CacheAutoConfiguration` 通过 `@ConditionalOnProperty('cache.enabled', { havingValue: 'true' })` 受控，只有当 `cache.enabled` 显式配置为 `true` 时才会启用；当 `cache.enabled` 未设置或不为 `true`（包括为 `false`）时，会跳过 `CacheAutoConfiguration`，缓存装饰器自动降级，无需 Redis 即可本地开发。

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

未调用 `initializeCaching(config)` 或未通过 `app.config.* (cache.*)` + `CacheAutoConfiguration` 启用缓存时，`@Cacheable` / `@CachePut` / `@CacheEvict` 检测到 CacheManager 未注册，**自动降级为直接调用原方法**，不访问 Redis，适合开发/测试环境。

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

> **注意**：通过 `app.config.* (cache.*)` + `CacheAutoConfiguration` 或 `initializeCaching(config)` 初始化后，使用 `getRedisClient()` 获取全局客户端，无需手动调用 `createRedisConnection()`。

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

#### ValueOperations 完整方法列表

| 方法 | 说明 | 对应 Spring |
|------|------|-------------|
| `set(key, value)` | 设置值（不过期） | `set(K key, V value)` |
| `set(key, value, ttlSeconds)` | 设置值（带过期时间） | `set(K key, V value, long timeout, TimeUnit unit)` |
| `setIfAbsent(key, value)` | 若 key 不存在则设置值，返回是否设置成功 | `setIfAbsent(K key, V value)` |
| `setIfAbsent(key, value, ttlSeconds)` | 若 key 不存在则设置值（带过期时间） | `setIfAbsent(K key, V value, long timeout, TimeUnit unit)` |
| `setIfPresent(key, value)` | 若 key 存在则设置值，返回是否设置成功 | `setIfPresent(K key, V value)` |
| `multiSet(map)` | 批量设置值 | `multiSet(Map<? extends K, ? extends V> map)` |
| `multiSetIfAbsent(map)` | 当所有 key 均不存在时批量设置，返回是否全部设置成功 | `multiSetIfAbsent(Map<? extends K, ? extends V> map)` |
| `get(key)` | 获取值 | `get(Object key)` |
| `getAndSet(key, value)` | 设置新值并返回旧值 | `getAndSet(K key, V value)` |
| `getAndDelete(key)` | 获取并删除 key，返回旧值 | `getAndDelete(K key)` |
| `multiGet(keys)` | 批量获取值 | `multiGet(Collection<K> keys)` |
| `append(key, value)` | 追加字符串到末尾，返回追加后的字符串长度 | `append(K key, String value)` |
| `size(key)` | 获取字符串长度 | `size(K key)` |
| `increment(key)` | 自增 1，返回自增后的值 | `increment(K key)` |
| `increment(key, delta)` | 自增指定步长，返回自增后的值 | `increment(K key, long delta)` |
| `decrement(key)` | 自减 1，返回自减后的值 | `decrement(K key)` |
| `decrement(key, delta)` | 自减指定步长，返回自减后的值 | `decrement(K key, long delta)` |

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

#### HashOperations 完整方法列表

| 方法 | 说明 | 对应 Spring |
|------|------|-------------|
| `get(key, hashKey)` | 获取 Hash 中指定字段的值 | `get(H key, Object hashKey)` |
| `multiGet(key, hashKeys)` | 批量获取 Hash 中指定字段的值 | `multiGet(H key, Collection<HK> hashKeys)` |
| `entries(key)` | 获取 Hash 中所有字段和值 | `entries(H key)` |
| `keys(key)` | 获取 Hash 中所有字段名 | `keys(H key)` |
| `values(key)` | 获取 Hash 中所有值 | `values(H key)` |
| `put(key, hashKey, value)` | 设置 Hash 中指定字段的值 | `put(H key, HK hashKey, HV value)` |
| `putAll(key, map)` | 批量设置 Hash 中字段的值 | `putAll(H key, Map<? extends HK, ? extends HV> m)` |
| `putIfAbsent(key, hashKey, value)` | 若字段不存在则设置值，返回是否设置成功 | `putIfAbsent(H key, HK hashKey, HV value)` |
| `delete(key, ...hashKeys)` | 删除 Hash 中指定字段，返回删除的数量 | `delete(H key, Object... hashKeys)` |
| `hasKey(key, hashKey)` | 判断 Hash 中指定字段是否存在 | `hasKey(H key, Object hashKey)` |
| `size(key)` | 获取 Hash 字段数量 | `size(H key)` |
| `increment(key, hashKey, delta)` | Hash 字段数值自增，返回自增后的值 | `increment(H key, HK hashKey, long delta)` |
| `incrementFloat(key, hashKey, delta)` | Hash 字段数值自增（浮点），返回自增后的值 | `increment(H key, HK hashKey, double delta)` |

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

#### ListOperations 完整方法列表

| 方法 | 说明 | 对应 Spring |
|------|------|-------------|
| `leftPush(key, value)` | 从左侧插入，返回列表长度 | `leftPush(K key, V value)` |
| `leftPushAll(key, ...values)` | 从左侧批量插入，返回列表长度 | `leftPushAll(K key, V... values)` |
| `leftPushIfPresent(key, value)` | 若 key 存在则从左侧插入，返回列表长度 | `leftPushIfPresent(K key, V value)` |
| `rightPush(key, value)` | 从右侧插入，返回列表长度 | `rightPush(K key, V value)` |
| `rightPushAll(key, ...values)` | 从右侧批量插入，返回列表长度 | `rightPushAll(K key, V... values)` |
| `rightPushIfPresent(key, value)` | 若 key 存在则从右侧插入，返回列表长度 | `rightPushIfPresent(K key, V value)` |
| `leftPop(key)` | 从左侧弹出单个元素或 null | `leftPop(K key)` |
| `leftPop(key, count)` | 从左侧弹出多个元素 | `leftPop(K key, long count)` |
| `rightPop(key)` | 从右侧弹出单个元素或 null | `rightPop(K key)` |
| `rightPop(key, count)` | 从右侧弹出多个元素 | `rightPop(K key, long count)` |
| `rightPopAndLeftPush(sourceKey, destKey)` | 从一个列表右端弹出并推入另一个列表左端 | `rightPopAndLeftPush(K sourceKey, K destinationKey)` |
| `range(key, start, end)` | 获取范围内的元素（0 到 -1 表示全部） | `range(K key, long start, long end)` |
| `size(key)` | 获取列表长度 | `size(K key)` |
| `index(key, index)` | 获取指定索引的元素 | `index(K key, long index)` |
| `set(key, index, value)` | 设置指定索引的元素 | `set(K key, long index, V value)` |
| `remove(key, count, value)` | 删除列表中指定数量与值匹配的元素 | `remove(K key, long count, Object value)` |
| `trim(key, start, end)` | 裁剪列表，只保留 [start, end] 范围内的元素 | `trim(K key, long start, long end)` |

### opsForSet() — Set 操作

```typescript
const setOps = redisTemplate.opsForSet();

await setOps.add('tags', 'redis', 'aiko-boot-starter-cache', 'nosql');
const members = await setOps.members('tags');   // Set<string>
const has = await setOps.isMember('tags', 'redis');
const size = await setOps.size('tags');
await setOps.remove('tags', 'nosql');
```

#### SetOperations 完整方法列表

| 方法 | 说明 | 对应 Spring |
|------|------|-------------|
| `add(key, ...values)` | 向集合中添加一个或多个成员，返回成功添加的数量 | `add(K key, V... values)` |
| `remove(key, ...values)` | 从集合中移除一个或多个成员，返回成功移除的数量 | `remove(K key, Object... values)` |
| `pop(key)` | 随机弹出并移除单个成员 | `pop(K key)` |
| `pop(key, count)` | 随机弹出并移除多个成员 | `pop(K key, long count)` |
| `move(key, value, destKey)` | 将成员从一个集合移动到另一个集合，返回是否移动成功 | `move(K key, V value, K destKey)` |
| `members(key)` | 获取集合中所有成员 | `members(K key)` |
| `isMember(key, value)` | 判断单个成员是否在集合中 | `isMember(K key, Object o)` |
| `isMember(key, ...values)` | 判断多个成员是否在集合中，返回 Map | `isMember(K key, Object... objects)` |
| `size(key)` | 获取集合成员数量 | `size(K key)` |
| `randomMember(key)` | 随机获取一个成员（不移除） | `randomMember(K key)` |
| `randomMembers(key, count)` | 随机获取多个成员（可重复，不移除） | `randomMembers(K key, long count)` |
| `distinctRandomMembers(key, count)` | 随机获取多个不重复成员（不移除） | `distinctRandomMembers(K key, long count)` |
| `intersect(key, ...otherKeys)` | 求多个集合的交集 | `intersect(K key, K otherKey)` |
| `intersectAndStore(key, otherKey, destKey)` | 求交集并存储到目标 key，返回目标集合大小 | `intersectAndStore(K key, K otherKey, K destKey)` |
| `union(key, ...otherKeys)` | 求多个集合的并集 | `union(K key, K otherKey)` |
| `unionAndStore(key, otherKey, destKey)` | 求并集并存储到目标 key，返回目标集合大小 | `unionAndStore(K key, K otherKey, K destKey)` |
| `difference(key, ...otherKeys)` | 求第一个集合与其他集合的差集 | `difference(K key, K otherKey)` |
| `differenceAndStore(key, otherKey, destKey)` | 求差集并存储到目标 key，返回目标集合大小 | `differenceAndStore(K key, K otherKey, K destKey)` |

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

#### ZSetOperations 完整方法列表

| 方法 | 说明 | 对应 Spring |
|------|------|-------------|
| `add(key, value, score)` | 添加元素（带分数），返回是否新增 | `add(K key, V value, double score)` |
| `addAll(key, tuples)` | 批量添加元素，返回新增元素的数量 | `add(K key, Set<TypedTuple<V>> tuples)` |
| `remove(key, ...values)` | 移除一个或多个元素，返回移除的数量 | `remove(K key, Object... values)` |
| `removeRangeByScore(key, min, max)` | 移除分数在 [min, max] 范围内的元素 | `removeRangeByScore(K key, double min, double max)` |
| `removeRange(key, start, end)` | 移除排名在 [start, end] 范围内的元素 | `removeRange(K key, long start, long end)` |
| `range(key, start, end)` | 获取排名在 [start, end] 范围内的元素（升序） | `range(K key, long start, long end)` |
| `rangeWithScores(key, start, end)` | 获取排名在 [start, end] 范围内的元素及其分数（升序） | `rangeWithScores(K key, long start, long end)` |
| `rangeByScore(key, min, max)` | 获取分数在 [min, max] 范围内的元素（升序） | `rangeByScore(K key, double min, double max)` |
| `rangeByScoreWithScores(key, min, max)` | 获取分数在 [min, max] 范围内的元素及其分数（升序） | `rangeByScoreWithScores(K key, double min, double max)` |
| `reverseRange(key, start, end)` | 获取排名在 [start, end] 范围内的元素（降序） | `reverseRange(K key, long start, long end)` |
| `reverseRangeWithScores(key, start, end)` | 获取排名在 [start, end] 范围内的元素及其分数（降序） | `reverseRangeWithScores(K key, long start, long end)` |
| `reverseRangeByScore(key, min, max)` | 获取分数在 [min, max] 范围内的元素（降序） | `reverseRangeByScore(K key, double min, double max)` |
| `reverseRangeByScoreWithScores(key, min, max)` | 获取分数在 [min, max] 范围内的元素及其分数（降序） | `reverseRangeByScoreWithScores(K key, double min, double max)` |
| `score(key, value)` | 获取元素的分数，不存在返回 null | `score(K key, Object o)` |
| `rank(key, value)` | 获取元素的升序排名（0-based），不存在返回 null | `rank(K key, Object o)` |
| `reverseRank(key, value)` | 获取元素的降序排名（0-based），不存在返回 null | `reverseRank(K key, Object o)` |
| `count(key, min, max)` | 获取分数在 [min, max] 范围内的元素数量 | `count(K key, double min, double max)` |
| `size(key)` | 获取有序集合的成员数量 | `size(K key)` |
| `incrementScore(key, value, delta)` | 对指定元素的分数增加 delta，返回增加后的分数 | `incrementScore(K key, V value, double delta)` |
| `intersectAndStore(key, otherKey, destKey)` | 求多个有序集合的交集并存储，返回目标集合大小 | `intersectAndStore(K key, K otherKey, K destKey)` |
| `unionAndStore(key, otherKey, destKey)` | 求多个有序集合的并集并存储，返回目标集合大小 | `unionAndStore(K key, K otherKey, K destKey)` |

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
    enabled: true,
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
