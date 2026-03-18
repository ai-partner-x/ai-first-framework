# `aiko-boot-create` 命令行工具

`@ai-partner-x/aiko-boot-create` 是 Aiko Boot 的脚手架 CLI，用来 **初始化一个新的 monorepo**，并在已有脚手架中 **增量添加 app/api/feature**。

## 安装与运行

> 推荐用 `pnpm dlx` 或 `npx` 运行，避免全局安装污染。

```bash
# 方式 1：临时执行（推荐）
pnpm dlx @ai-partner-x/aiko-boot-create@latest --help

# 方式 2：npx
npx @ai-partner-x/aiko-boot-create@latest --help

# 方式 3：安装后使用 bin（包内定义的 bin 名为 aiko-boot-create）
pnpm add -D @ai-partner-x/aiko-boot-create
pnpm aiko-boot-create --help

# 或者（安装到全局）
pnpm add -g @ai-partner-x/aiko-boot-create
aiko-boot-create --help
```

## 命令总览

- **`init`**：初始化新的脚手架 monorepo（可选生成 api/admin/mobile）
- **`add-app`**：在现有脚手架中新增前端应用（admin / mobile）
- **`add-api`**：在现有脚手架中新增后端服务（api）
- **`add-feature`**：给某个服务端增加特性（redis / file / mq / log）
- **`list`**：查看当前脚手架配置（apps / apis / features）

> 脚手架根目录通过 `.aiko-boot.json` 识别；多数“增量命令”要求在脚手架根目录执行，或用 `--root` 显式指定。

## 生成的项目结构

`init` 生成的工程是一个 pnpm monorepo：

```
my-app/
  package.json
  pnpm-workspace.yaml
  .aiko-boot.json
  packages/
    api/            # 可选：后端服务（Aiko Boot）
    admin/          # 可选：管理端
    mobile/         # 可选：移动端
    core/           # 可选：共享 core（前端鉴权等）
```

### `.aiko-boot.json`（脚手架配置）

CLI 用该文件记录脚手架状态，`list/add-feature` 等命令会读取/更新它：

- **`scope`**：生成包名的 scope（如 `@my-app/*`）
- **`apps`**：前端应用列表（`name/type/path`）
- **`apis`**：后端服务列表（`name/db/path/features[]`）

## `init`：初始化脚手架

**语法：**

```bash
aiko-boot-create init [targetDir] [options]
```

**常用选项：**

- **`-n, --name <name>`**：项目名 / scope（例：`my-app`）
- **`--empty`**：仅创建空 monorepo（根 + `packages/` + `.aiko-boot.json`），不生成 app/api 代码
- **`--with-api`**：初始化时生成 `packages/api`
- **`--with-admin`**：初始化时生成 `packages/admin`
- **`--with-mobile`**：初始化时生成 `packages/mobile`
- **`--template-dir <dir>`**：模板目录（默认使用包内置模板 `templates/scaffold-default`）
- **`--dry-run`**：仅打印计划，不写入文件

**示例：**

```bash
# 创建完整脚手架（api/admin/mobile）
aiko-boot-create init my-app --with-api --with-admin --with-mobile

# 只创建骨架（后续用 add-* 增量添加）
aiko-boot-create init my-app --empty

# 预览将要执行的操作
aiko-boot-create init my-app --with-api --with-admin --with-mobile --dry-run
```

## `add-app`：新增前端应用（admin/mobile）

**语法：**

```bash
aiko-boot-create add-app [name] [options]
```

**选项：**

- **`-t, --type <type>`**：`admin` | `mobile`
- **`--root <dir>`**：脚手架根目录（默认 `process.cwd()`）
- **`--template-dir <dir>`**：模板根目录（开发阶段通常指向仓库内的模板根）
- **`--dry-run`**：仅预览，不写入文件

**示例：**

```bash
# 在脚手架根目录下添加 admin 应用
aiko-boot-create add-app admin -t admin --root . --template-dir scaffold

# 添加 mobile-v2
aiko-boot-create add-app mobile-v2 -t mobile --root . --template-dir scaffold
```

## `add-api`：新增后端服务

**语法：**

```bash
aiko-boot-create add-api [name] [options]
```

**选项：**

- **`--db <db>`**：数据库类型（当前默认 `sqlite`，预留扩展）
- **`--root <dir>`**：脚手架根目录
- **`--template-dir <dir>`**：模板根目录
- **`--dry-run`**：仅预览

**示例：**

```bash
aiko-boot-create add-api user-api --db sqlite --root . --template-dir scaffold
```

## `add-feature`：为服务端增加特性

**语法：**

```bash
aiko-boot-create add-feature --service <service> --feature <feature> [options]
```

**选项：**

- **`--service <service>`**（必填）：目标服务端名称（如 `api` / `user-api`）
- **`--feature <feature>`**（必填）：`redis` | `file` | `mq` | `log`
- **`--root <dir>`**：脚手架根目录
- **`--dry-run`**：仅预览

### 特性与模板映射

| feature | 作用 | 主要修改点（概览） | 模板来源 |
|---|---|---|---|
| `file` | 文件上传/本地存储基础能力 | 增加 `storage` 配置、上传 controller、multer & 静态文件 | `templates/feature-file/api` |
| `redis` | 缓存能力（Redis） | 增加 `cache` 配置、cache DTO/service/controller、依赖 ioredis | `templates/feature-redis/api` |
| `mq` | 消息队列能力 | 增加 `mq` 配置、mq DTO/service/controller | `templates/feature-mq/api` |
| `log` | 日志能力与请求日志 | 增加 `logging` 配置、server.ts 注入请求日志/错误处理、复制日志服务与文档 | `templates/feature-log/api` |

**示例：**

```bash
aiko-boot-create add-feature --service api --feature redis
aiko-boot-create add-feature --service api --feature file
aiko-boot-create add-feature --service user-api --feature mq --dry-run
```

## `list`：查看脚手架配置

**语法：**

```bash
aiko-boot-create list [options]
```

**选项：**

- **`--root <dir>`**：脚手架根目录

**示例：**

```bash
aiko-boot-create list
aiko-boot-create list --root ./my-app
```

## 常见问题

### Q：为什么提示“未找到 .aiko-boot.json”？

你不在脚手架根目录执行命令。解决方式：

- 在 `init` 生成的根目录执行；或
- 给命令加上 `--root <dir>` 指向包含 `.aiko-boot.json` 的目录。

### Q：`init --template-dir` 的默认值是什么？

默认使用 **包内置模板**：`templates/scaffold-default`（发布到 npm 后也可直接使用，无需依赖仓库根目录的 `./scaffold`）。

