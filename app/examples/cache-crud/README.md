# cache-crud

> 展示 `@ai-partner-x/aiko-boot-starter-cache` 在应用层的真实用法，包含两种运行模式：
> - **`pnpm start`** — 独立脚本演示缓存装饰器行为
> - **`pnpm server`** — REST API 服务器（Spring Boot 风格，SQLite 持久化 + 可选 Redis 缓存）

## 功能特性

- ✅ `@Service` + `@Cacheable` — 缓存服务类（与 Java Spring Boot 写法完全一致）
- ✅ `@Cacheable` — 读通缓存（查询）
- ✅ `@CachePut` — 写通缓存（更新）
- ✅ `@CacheEvict` — 缓存失效（创建/删除）
- ✅ `RedisTemplate` — 直接 Redis 操作（String / Hash / ZSet）
- ✅ 无 Redis 时自动降级（装饰器直接调用原方法）
- ✅ SQLite 持久化（`@ai-partner-x/aiko-boot-starter-orm` + Kysely，可切换 PostgreSQL / MySQL）
- ✅ REST API 服务器（`createApp` 自动扫描 controller / service / mapper）

## 目录结构

```
src/
├── controller/
│   └── user.controller.ts       # REST 控制器（GET/POST/PUT/DELETE /api/users）
├── entity/
│   ├── user.entity.ts           # 用户实体（@Entity + @TableId + @TableField）
│   └── user.repository.ts       # 用户 Mapper（@Mapper + BaseMapper，SQLite）
├── service/
│   └── user.cache.service.ts    # 用户缓存服务（带缓存装饰器）
├── scripts/
│   └── init-db.ts               # SQLite 数据库初始化脚本
├── index.ts                     # 独立演示脚本（pnpm start）
└── server.ts                    # REST API 服务器入口（pnpm server）
data/
└── cache_example.db             # SQLite 数据库文件（由 pnpm init-db 生成）
```

## 快速启动

### 一、初始化数据库（首次运行必须）

```bash
cd app/examples/cache-crud
pnpm install
pnpm init-db
```

---

### 二、模式 A — 独立演示脚本（`pnpm start`）

展示 Spring Boot 风格自动配置的完整启动流程：`createApp()` 自动触发 `OrmAutoConfiguration` 和 `CacheAutoConfiguration`，再依次演示 `@Cacheable / @CachePut / @CacheEvict` 并打印日志。

**macOS / Linux（bash / zsh）**

```bash
# 模式一：无 Redis — 装饰器自动降级，直接调用原方法
pnpm start

# 模式二：有 Redis，无密码
REDIS_HOST=127.0.0.1 REDIS_PORT=6379 pnpm start

# 模式三：有 Redis，带密码认证
REDIS_HOST=127.0.0.1 REDIS_PORT=6379 REDIS_PASSWORD=yourpassword pnpm start
```

**Windows（PowerShell）**

```powershell
# 模式一：无 Redis — 装饰器自动降级，直接调用原方法
pnpm start

# 模式二：有 Redis，无密码（显式清空 REDIS_PASSWORD，防止前一次运行的密码残留）
$env:REDIS_HOST="127.0.0.1"; $env:REDIS_PORT="6379"; $env:REDIS_PASSWORD=""; pnpm start

# 模式三：有 Redis，带密码认证
$env:REDIS_HOST="127.0.0.1"; $env:REDIS_PORT="6379"; $env:REDIS_PASSWORD="yourpassword"; pnpm start
```

> **提示**：PowerShell 不支持 `KEY=value command` 语法，需要用 `$env:KEY="value"` 单独设置环境变量，再以 `;` 分隔执行命令。`$env:` 赋值在当前会话中持久存在，切换模式时务必显式清空不再需要的变量（如 `$env:REDIS_PASSWORD=""`），否则上一次运行的值仍会生效。

**Windows（CMD）**

```cmd
:: 模式一：无 Redis — 装饰器自动降级，直接调用原方法
pnpm start

:: 模式二：有 Redis，无密码（显式清空 REDIS_PASSWORD，防止前一次运行的密码残留）
set REDIS_HOST=127.0.0.1 & set REDIS_PORT=6379 & set REDIS_PASSWORD= & pnpm start

:: 模式三：有 Redis，带密码认证
set REDIS_HOST=127.0.0.1 & set REDIS_PORT=6379 & set REDIS_PASSWORD=yourpassword & pnpm start
```

> **提示**：CMD 中 `set` 赋值在当前会话中持久存在，切换模式时务必用 `set REDIS_PASSWORD=`（等号后留空）显式清空，否则上一次运行的密码仍会生效。

---

### 三、模式 B — REST API 服务器（`pnpm server`）

启动 Express API 服务器，提供完整 CRUD 接口，底层使用 SQLite 持久化，可选 Redis 缓存。

**macOS / Linux（bash / zsh）**

```bash
# 无 Redis（缓存装饰器自动降级）
pnpm server

# 有 Redis，无密码
REDIS_HOST=127.0.0.1 REDIS_PORT=6379 pnpm server

# 有 Redis，带密码
REDIS_HOST=127.0.0.1 REDIS_PORT=6379 REDIS_PASSWORD=yourpassword pnpm server
```

**Windows（PowerShell）**

```powershell
# 无 Redis（缓存装饰器自动降级）
pnpm server

# 有 Redis，无密码（显式清空 REDIS_PASSWORD）
$env:REDIS_HOST="127.0.0.1"; $env:REDIS_PORT="6379"; $env:REDIS_PASSWORD=""; pnpm server

# 有 Redis，带密码
$env:REDIS_HOST="127.0.0.1"; $env:REDIS_PORT="6379"; $env:REDIS_PASSWORD="yourpassword"; pnpm server
```

**Windows（CMD）**

```cmd
:: 无 Redis（缓存装饰器自动降级）
pnpm server

:: 有 Redis，无密码（显式清空 REDIS_PASSWORD）
set REDIS_HOST=127.0.0.1 & set REDIS_PORT=6379 & set REDIS_PASSWORD= & pnpm server

:: 有 Redis，带密码
set REDIS_HOST=127.0.0.1 & set REDIS_PORT=6379 & set REDIS_PASSWORD=yourpassword & pnpm server
```

服务启动后访问：

```
GET    http://localhost:3002/api/users
GET    http://localhost:3002/api/users/:id
POST   http://localhost:3002/api/users
PUT    http://localhost:3002/api/users/:id
DELETE http://localhost:3002/api/users/:id
```

---

| 环境变量 | 说明 | 默认值 |
|---|---|---|
| `REDIS_HOST` | Redis 服务器地址；设置后 `cache.enabled` 自动为 `true`，触发 `CacheAutoConfiguration` | _(未设置)_ |
| `REDIS_PORT` | Redis 服务器端口 | `6379` |
| `REDIS_PASSWORD` | Redis 连接密码，不设置或为空则不认证 | _(未设置)_ |
| `PORT` | API 服务器监听端口（仅 `pnpm server`） | `3002` |

> **激活机制**：`app.config.ts` 中 `cache.enabled = Boolean(REDIS_HOST)` 控制是否启用缓存。
> `CacheAutoConfiguration` 使用 `@ConditionalOnProperty('cache.enabled', { havingValue: 'true' })` 作为激活条件：
> - `REDIS_HOST` 已设置 → `cache.enabled = true` → 条件满足 → 自动初始化 Redis 连接
> - `REDIS_HOST` 未设置 → `cache.enabled = false` → 条件不满足 → 缓存装饰器自动降级，直接调用原方法

## 对应 Java Spring Boot

| TypeScript（AI-First）| Java（Spring Boot）|
|---|---|
| `@Entity({ tableName })` | `@Entity` + `@Table(name = ...)` |
| `@TableId({ type: 'AUTO' })` | `@Id` + `@GeneratedValue` |
| `@TableField()` | `@Column` |
| `@Mapper(User)` + `BaseMapper<User>` | `@Repository` + `JpaRepository<User, Long>` |
| `@Service()` | `@Service` |
| `@Cacheable({ key, ttl })` | `@Cacheable(value, key)` |
| `@CachePut({ key, ttl })` | `@CachePut(value, key)` |
| `@CacheEvict({ key })` | `@CacheEvict(value, key)` |
| `RedisTemplate<K, V>` | `RedisTemplate<K, V>` |
| `createApp({ srcDir, database, cache })` | `SpringApplication.run(...)` |

## 核心代码

```typescript
import { Service } from '@ai-partner-x/aiko-boot';
import { Cacheable, CachePut, CacheEvict, Autowired } from '@ai-partner-x/aiko-boot-starter-cache';
import { User } from '../entity/user.entity.js';
import { UserRepository } from '../entity/user.repository.js';

@Service()
export class UserCacheService {
  @Autowired()
  private userRepository!: UserRepository;  // SQLite via @Mapper + BaseMapper

  @Cacheable({ key: 'user', ttl: 300 })
  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.selectById(id);  // Redis 命中时不会执行
  }

  @CachePut({ key: 'user', ttl: 300, keyGenerator: (id) => String(id) })
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const existing = await this.userRepository.selectById(id);
    if (!existing) throw new Error(`用户 ${id} 不存在`);
    return this.userRepository.updateById({ ...existing, ...data });  // 始终执行，结果写入缓存
  }

  @CacheEvict({ key: 'user' })
  async deleteUser(id: number): Promise<boolean> {
    return this.userRepository.deleteById(id);  // 执行后清除缓存
  }
}
```
