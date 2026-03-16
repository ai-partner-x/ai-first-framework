## @ai-partner-x/aiko-boot-create

CLI 用来创建和扩展 aiko-boot 脚手架工程（monorepo：`api` / `admin` / `mobile` / `core`）。

### 基本用法

```bash
# 在当前目录下新建一个完整脚手架（带 api/admin/mobile）
aiko-boot-create init my-app --with-api --with-admin --with-mobile

# 使用 pnpm script（假设 package.json 里配置了）
pnpm aiko-boot-create init my-app --with-api --with-admin --with-mobile
```

> 说明：发布到 npm 后，推荐全局或在项目中安装 `@ai-partner-x/aiko-boot-create`，然后直接运行 `aiko-boot-create ...`。

---

### 子命令一览

- `init`：初始化新的脚手架 monorepo
- `add-app`：在现有脚手架中新增前端应用（`admin` / `mobile`）
- `add-api`：在现有脚手架中新增后端服务（`api`）
- `add-feature`：为指定后端服务增加特性组件（`redis` / `file` / `mq`）
- `list`：查看当前脚手架配置（apps / apis / features）

下面分别说明各命令的参数。

---

### `init` – 初始化脚手架

**语法：**

```bash
aiko-boot-create init [targetDir] [options]
```

**参数：**

- `[targetDir]`（可选）  
  目标目录，例如 `test7`。不传时会在交互里询问。

**选项：**

- `-n, --name <name>`：项目名 / scope，例如 `my-app`。  
  - 不传时，会优先从 `targetDir` 推断（取目录名），否则通过交互询问。
- `--empty`：仅创建空的 monorepo 结构（根 + `packages/`），不生成 `api/admin/mobile` 代码。
- `--with-admin`：初始化时一起生成 admin 应用（`packages/admin`）。
- `--with-mobile`：初始化时一起生成 mobile 应用（`packages/mobile`）。
- `--with-api`：初始化时一起生成 api 服务端（`packages/api`）。
- `--template-dir <dir>`：模板目录。  
  - 不传时默认使用包内置模板：`templates/scaffold-default`。
- `--dry-run`：只打印将要执行的操作，不写入任何文件。

**示例：**

```bash
# 当前目录下创建 test7 脚手架，并包含 api/admin/mobile
aiko-boot-create init test7 --with-api --with-admin --with-mobile

# 只建空骨架
aiko-boot-create init my-base --empty
```

---

### `add-app` – 新增前端应用（admin / mobile）

**语法：**

```bash
aiko-boot-create add-app [name] [options]
```

**参数：**

- `[name]`（可选）  
  新应用名称，例如 `admin`、`mobile-v2`。不传时会在交互中询问。

**选项：**

- `-t, --type <type>`：应用类型，`admin` | `mobile`。不传时会交互询问。
- `--root <dir>`：脚手架根目录（包含 `.aiko-boot.json` 的目录），默认 `process.cwd()`。
- `--template-dir <dir>`：模板根目录（开发时通常为 `scaffold`）。  
  - 当前实现需要显式指定，否则会报错。
- `--dry-run`：仅打印要执行的操作，不写入文件。

**行为要点：**

- 从 `templateDir/packages/<type>` 拷贝模板到 `rootDir/packages/<name>`。
- 根据项目 `scope` 把包名改为 `@<scope>/<name>`，并替换模板中的 `@scaffold/*` 为 `@<scope>/*`。
- 如果 `packages/core` 不存在，会从模板复制一份 core 包并重命名为 `@<scope>/core`。

**示例：**

```bash
# 在现有脚手架根目录新增 admin 应用
aiko-boot-create add-app admin -t admin --root . --template-dir scaffold

# 新增 mobile-v2 应用
aiko-boot-create add-app mobile-v2 -t mobile --template-dir scaffold
```

---

### `add-api` – 新增后端服务

**语法：**

```bash
aiko-boot-create add-api [name] [options]
```

**参数：**

- `[name]`（可选）  
  服务端名称，例如 `api`、`user-api`。不传时会交互询问。

**选项：**

- `--db <db>`：数据库类型，当前默认 `sqlite`（预留支持其他类型）。
- `--root <dir>`：脚手架根目录，默认 `process.cwd()`。
- `--template-dir <dir>`：模板根目录，用于找到 `packages/api` 模板。
- `--dry-run`：仅打印操作计划，不写文件。

**示例：**

```bash
# 为当前脚手架增加一个 user-api 服务
aiko-boot-create add-api user-api --db sqlite --template-dir scaffold
```

---

### `add-feature` – 为服务端增加特性组件

**语法：**

```bash
aiko-boot-create add-feature --service <service> --feature <feature> [options]
```

**选项：**

- `--service <service>`（必填）：目标服务端名称，例如 `api`、`user-api`。
- `--feature <feature>`（必填）：特性类型，目前支持：`redis` | `file` | `mq`。
- `--root <dir>`：脚手架根目录，默认 `process.cwd()`。
- `--dry-run`：仅预览，不写文件。

**示例：**

```bash
# 给 api 增加 redis 支持
aiko-boot-create add-feature --service api --feature redis

# 给 user-api 增加 mq 支持（dry-run）
aiko-boot-create add-feature --service user-api --feature mq --dry-run
```

---

### `list` – 查看当前脚手架配置

**语法：**

```bash
aiko-boot-create list [options]
```

**选项：**

- `--root <dir>`：脚手架根目录，默认 `process.cwd()`。

**行为：**

- 从指定根目录读取 `.aiko-boot.json`，打印：
  - `scope`
  - `apps`：`name [type] -> path`
  - `apis`：`name [db=xxx] features=[...] -> path`

**示例：**

```bash
aiko-boot-create list
aiko-boot-create list --root ./test7
```
