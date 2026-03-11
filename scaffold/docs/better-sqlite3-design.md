# 脚手架中 better-sqlite3 设计说明

本文档梳理 **scaffold** 与 **aiko-boot-create** 的职责，并确定在脚手架中 better-sqlite3 的定位与设计。

---

## 一、scaffold 与 aiko-boot-create 职责梳理

### 1. scaffold（模板目录）

- **位置**：`ai-frist-framework/scaffold/`
- **角色**：作为 **项目模板**，被 aiko-boot-create 复制到用户指定目录，生成新项目。
- **内容**：
  - **packages/api**：后端 API（aiko-boot + starter-orm），默认 SQLite（`./data/app.db`）
  - **packages/admin**、**packages/mobile**：前端应用
  - **packages/shared**、**packages/shared-auth**（可选）：公共常量与鉴权
- **数据库相关**：
  - `packages/api/app.config.ts`：配置 `database: { type: 'sqlite', filename: './data/app.db' }`
  - `packages/api/src/scripts/init-db.ts`：初始化数据库（建表、种子数据）
  - API 运行时通过 `@ai-partner-x/aiko-boot-starter-orm` 使用 **better-sqlite3** 连接同一文件

### 2. aiko-boot-create（CLI）

- **位置**：`ai-frist-framework/packages/aiko-boot-create/`
- **角色**：从 `scaffold` 复制模板到目标目录，并做 **scope 替换**、**依赖覆盖**、**可选功能** 等后处理。
- **主要能力**：
  - 交互/非交互：项目名、目标目录、是否带「基础系统」（登录、shared-auth、用户表等）
  - **withBaseSystem = true**：完整复制 scaffold，包含 auth 相关代码；init-db 建 `sys_user` 并插种子
  - **withBaseSystem = false（bare）**：不复制 shared-auth 及 auth 相关文件，并写入「无用户表」版的 `init-db.ts`（仍用 sql.js）
- **与 SQLite 的关系**：CLI 只负责复制/生成文件，不直接依赖 better-sqlite3；生成的 init-db 脚本统一使用 **sql.js**，避免在「生成阶段」依赖原生模块。

---

## 二、better-sqlite3 在脚手架中的双轨设计

当前设计是 **初始化** 与 **运行时** 分离，兼顾「开箱即跑」和「性能/能力」：

| 场景           | 技术选型        | 原因 |
|----------------|-----------------|------|
| **init-db 脚本** | **sql.js**（纯 JS） | 无需 node-gyp，任意环境执行 `pnpm init-db` 即可生成 `data/app.db`，不依赖 better-sqlite3 编译 |
| **API 运行时**   | **better-sqlite3**（原生） | 由 `aiko-boot-starter-orm` 在运行时 `import('better-sqlite3')`，连接同一 `./data/app.db`，性能与能力更好 |

因此：

- **scaffold** 的 `packages/api` 需要同时声明：
  - **dependencies**：`better-sqlite3`（运行时由 starter-orm 使用）
  - **devDependencies**：`sql.js`（仅 init-db 脚本使用）
- **init-db.ts** 只使用 sql.js，不引用 better-sqlite3；生成的文件与 API 运行时使用的 `./data/app.db` 路径、格式一致（SQLite 兼容）。

---

## 三、better-sqlite3 在脚手架中的具体设计

### 3.1 依赖与脚本（scaffold/packages/api）

- **package.json**：
  - `dependencies`：`better-sqlite3@^12.6.2`（与 aiko-boot-starter-orm 一致）
  - `devDependencies`：`sql.js`、`@types/better-sqlite3`
- **scripts**：
  - `init-db`：执行 `src/scripts/init-db.ts`（仅用 sql.js，不触发 better-sqlite3 编译）

### 3.2 配置与路径

- **app.config.ts**：`database: { type: 'sqlite', filename: './data/app.db' }`（相对 api 包根目录）
- **init-db.ts**：写入路径与配置一致（如 `packages/api/data/app.db`），保证首次 `pnpm init-db` 后，API 启动即可读同一库。

### 3.3 原生模块编译（rebuild:sqlite）

- **better-sqlite3** 为原生模块，在部分环境（如新 Node 版本、不同架构）下可能需重新编译。
- **建议**：在 **scaffold 根目录** `package.json` 中增加脚本，使「生成后的项目」在根目录即可执行，无需依赖框架仓库根目录：
  - 脚本示例：`"rebuild:sqlite": "cd node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3 && npm run build-release"`
  - 版本号需与 `packages/api` 的 `better-sqlite3` 一致。若 pnpm 安装后路径带 hash（如 `better-sqlite3@12.6.2_xxx`），请按实际 `.pnpm` 目录名调整路径后再执行。
- **文档**：在 scaffold 的 README 中说明：首次或换环境后若 API 报 better-sqlite3 bindings 相关错误，可在**项目根**执行 `pnpm run rebuild:sqlite`（或按文档在 api 包内执行相应命令）。

### 3.4 aiko-boot-create 的配合

- **withBaseSystem**：复制完整 scaffold，包含 api 的 better-sqlite3 依赖与 init-db（sql.js + sys_user）；生成后提示 `pnpm init-db` 与可选的 `pnpm run rebuild:sqlite`。
- **bare**：仍复制 api 包（含 better-sqlite3 依赖、app.config 的 sqlite、init-db 脚本），但 init-db 为「无用户表」版；若后续用户不用 SQLite，可自行改配置与依赖。
- CLI 生成的项目**根** package.json 来自 scaffold 根，因此若在 scaffold 根增加 `rebuild:sqlite`，生成项目即可自带该脚本。

---

## 四、设计小结

| 项目       | 内容 |
|------------|------|
| **init-db** | 仅用 **sql.js**，不依赖 better-sqlite3 编译；withBaseSystem 时建 sys_user + 种子，bare 时不建用户表。 |
| **API 运行时** | 使用 **better-sqlite3**（通过 starter-orm 动态 import），连接 `./data/app.db`。 |
| **依赖**   | api 包：better-sqlite3（dependencies），sql.js（devDependencies）。 |
| **rebuild** | scaffold 根 package.json 提供 `rebuild:sqlite`，生成项目在根目录即可重编 better-sqlite3。 |
| **文档**   | README 中说明 init-db 与 rebuild:sqlite 的适用场景与执行顺序。 |

这样既保证「克隆即用、init-db 无障碍」，又保证运行时使用 better-sqlite3 的性能与能力，并在需要时通过统一脚本解决原生模块编译问题。

---

## 五、与 pnpm overrides 的配合（类似 test-mobile）

- **pnpm.overrides**：不由模板写死，由 **aiko-boot-create** 在生成项目时根据「目标目录 → 框架根目录」的相对路径动态写入，效果与 test-mobile 中手写的 `file:../ai-frist-framework/packages/...` 一致。
- **pnpm.onlyBuiltDependencies**：在 scaffold 根 `package.json` 中配置 `["better-sqlite3"]`，仅编译该原生依赖，加快 install。
- **postinstall**：在 scaffold 中配置 `pnpm rebuild better-sqlite3`，生成项目在 `pnpm install` 后自动重编 better-sqlite3，避免首次运行 API 时报 bindings 错误。
