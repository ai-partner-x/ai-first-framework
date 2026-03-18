# AI-First Framework — @ai-partner-x/aiko-boot-starter-cache 组件介绍

> 本文档描述 `packages/aiko-boot-starter-cache/` 包的功能、API 与使用方式，遵循 Aiko Boot API 开发规范。

**路径：** `packages/aiko-boot-starter-cache/`  
**包名：** `@ai-partner-x/aiko-boot-starter-cache`  
**版本：** 0.1.0

---

## 目录

- [项目结构](#项目结构)
- [功能概述](#功能概述)
- [快速开始](#快速开始)
- [缓存注解详细 API](#缓存注解详细-api)
- [Redis 连接配置](#redis-连接配置)
- [RedisTemplate\<K, V\>](#redistemplatek-v)
- [自定义缓存后端](#自定义缓存后端)
- [完整示例](#完整示例)
- [ESLint Java 兼容规则](#eslint-java-兼容规则)
- [代码审查清单](#代码审查清单)

---

## 项目结构

```
src/
├── spi/                # SPI 接口 - 缓存抽象层
│   ├── cache.ts        # Cache / CacheManager 接口定义
│   └── cache-config.ts # 缓存配置类型定义
├── decorators/         # 装饰器 - 声明式缓存注解
│   └── decorators.ts   # @Cacheable / @CachePut / @CacheEvict
├── cache-managers/     # 缓存管理器 - 后端实现
│   └── redis-cache-manager.ts  # Redis 后端实现
├── adapters/           # 适配器 - 底层驱动适配
│   └── ioredis-adapter.ts      # ioredis 适配器
├── operations/         # 操作接口 - Redis 数据结构操作
│   ├── value-operations.ts     # String 操作
│   ├── list-operations.ts      # List 操作
│   ├── hash-operations.ts      # Hash 操作
│   ├── set-operations.ts       # Set 操作
│   └── zset-operations.ts      # Sorted Set 操作
├── redis-template.ts   # Redis 模板 - RedisTemplate<K, V>
├── config.ts           # Redis 连接配置
├── redis.ts            # Redis 连接管理
├── enable-caching.ts   # 启动初始化
├── auto-configuration.ts  # 自动配置（CacheAutoConfiguration）
└── index.ts            # 主入口
```

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

**分层架构：**

```
业务代码 (@Cacheable / @CachePut / @CacheEvict)
    ↓ 通过 CacheManager 接口
后端实现 (RedisCacheManager / InMemoryCacheManager / ...)
    ↓ 通过具体技术
底层驱动 (ioredis / memjs / ...)
```

**SPI 扩展点：**

- `Cache` + `CacheManager` 两个接口定义稳定契约
- 新后端只需实现接口并调用 `setCacheManager()` 注册，业务代码零改动
- `CacheConfig` 辨别联合类型，以 `type` 字段作为辨别符（对应 `spring.cache.type`）

---

## 快速开始

---

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
| `isMembers(key, ...values)` | 判断多个成员是否在集合中，返回 Map（AI-First 扩展） | `smismember`（ioredis 对应） |
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

### Cache 组件中的 Java 兼容示例

```typescript
// ==================== Service 层 ====================

@Service()
export class UserService {
  @Autowired()
  private userRepository!: UserRepository;

  // ✅ 正确：标准方法语法
  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  // ❌ 错误：箭头函数方法
  // getUserById = async (id: number): Promise<User | null> => {
  //   return this.userRepository.findById(id);
  // }

  // ✅ 正确：显式属性访问
  @CachePut({ key: 'user', ttl: 300, keyGenerator: (id: number) => String(id) })
  async updateUser(id: number, user: User): Promise<User> {
    const existingUser = this.userRepository.findById(id);
    if (existingUser !== null) {
      existingUser.name = user.name;  // ✅ 显式访问
      existingUser.email = user.email;
      return this.userRepository.save(existingUser);
    }
    throw new Error('用户不存在');
  }

  // ❌ 错误：解构赋值
  // async updateUser(id: number, user: User): Promise<User> {
  //   const { name, email } = user;  // ❌ 解构
  //   ...
  // }
}

// ==================== 配置处理 ====================

// ✅ 正确：三元运算符
const page = params.page !== undefined ? params.page : 1;
const pageSize = params.pageSize !== undefined ? params.pageSize : 10;

// ❌ 错误：空值合并
// const page = params.page ?? 1;
// const pageSize = params.pageSize ?? 10;

// ==================== 条件判断 ====================

// ✅ 正确：显式 null 检查
async getCachedUser(id: number): Promise<User | null> {
  const cached = await this.cache.get(`user:${id}`);
  if (cached !== null) {
    return JSON.parse(cached);
  }
  return null;
}

// ❌ 错误：可选链
// async getCachedUser(id: number): Promise<User | null> {
//   const cached = await this.cache.get(`user:${id}`);
//   return cached ? JSON.parse(cached) : null;
// }

// ==================== 对象创建 ====================

// ✅ 正确：声明变量后返回
async createUser(user: User): Promise<User> {
  const saved = this.userRepository.save(user);
  const response: UserResponse = {
    success: true,
    data: saved,
  };
  return response;
}

// ❌ 错误：直接返回对象字面量
// async createUser(user: User): Promise<User> {
//   return {
//     success: true,
//     data: this.userRepository.save(user),
//   };
// }

// ==================== 类型定义 ====================

// ✅ 正确：定义独立接口
interface UserSearchResult {
  data: User[];
  total: number;
}

async searchUsers(params: SearchParams): Promise<UserSearchResult> {
  // ...
}

// ❌ 错误：内联对象类型
// async searchUsers(params: SearchParams): Promise<{ data: User[]; total: number }> {
//   // ...
// }

// ✅ 正确：基础类型 + 注释
interface CacheConfig {
  type: string;  // 'redis' | 'memcached' | 'memory'
  host: string;
  port: number;
}

// ❌ 错误：联合类型
// interface CacheConfig {
//   type: 'redis' | 'memcached' | 'memory';
//   host: string;
//   port: number;
// }
```

### 运行检查

```bash
# ESLint 检查（在包目录下执行）
cd packages/aiko-boot-starter-cache
pnpm lint
```

---

## 代码审查清单

### 缓存服务层

- [ ] 缓存服务类有 `@Service()` 或 `@Component()` 装饰器
- [ ] 依赖使用 `@Autowired()` 注入
- [ ] 缓存方法有 `@Cacheable` / `@CachePut` / `@CacheEvict` 装饰器
- [ ] 所有方法有显式返回类型
- [ ] `@Cacheable` / `@CachePut` 指定了 `key` 和 `ttl`（可选）
- [ ] `@CacheEvict` 正确配置 `allEntries` 和 `beforeInvocation`

### 缓存配置

- [ ] `app.config.ts` 中配置 `cache.enabled = true`（启用缓存）
- [ ] 配置完整的 Redis 连接参数（host, port, password 等）
- [ ] 或使用 `initializeCaching(config)` 手动初始化

### Redis 操作

- [ ] 使用 `RedisTemplate<K, V>` 或 `StringRedisTemplate` 操作 Redis
- [ ] Key 命名使用统一的命名空间格式（如 `user:profile:{id}`）
- [ ] 设置合理的 TTL（过期时间）
- [ ] 避免使用 `KEYS *` 等阻塞命令（使用 `SCAN` 替代）

### Java 兼容

- [ ] 无箭头函数方法（使用标准方法语法）
- [ ] 无解构赋值（显式属性访问）
- [ ] 无可选链 `?.`（使用显式 null 检查）
- [ ] 无空值合并 `??`（使用三元运算符）
- [ ] 无对象展开 `...`（逐个属性赋值）
- [ ] 无联合类型（使用基础类型 + 注释）
- [ ] 无内联对象类型（定义独立接口）
- [ ] 所有方法有显式返回类型

### 装饰器使用

- [ ] `@Cacheable` 用于读操作（先查缓存，未命中则执行方法）
- [ ] `@CachePut` 用于写操作（始终执行方法并更新缓存）
- [ ] `@CacheEvict` 用于删除操作（执行方法后清除缓存）
- [ ] `keyGenerator` 函数类型与方法参数一致
- [ ] `condition` 函数返回正确的布尔值

### 运行检查

```bash
# ESLint 检查（在包目录下执行）
cd packages/aiko-boot-starter-cache
pnpm lint
```

---

## 依赖

- `ioredis ^5.4.2`（由 `@ai-partner-x/aiko-boot-starter-cache/redis` 使用）
- `reflect-metadata ^0.2.1`
- `@ai-partner-x/aiko-boot workspace:*`
- `@ai-partner-x/eslint-plugin-aiko-boot`（Java 兼容检查）
