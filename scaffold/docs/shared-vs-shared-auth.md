# shared 与 shared-auth 边界及 CLI 可选装配

## 1. 职责边界

| 包 | 职责 | 内容 |
|----|------|------|
| **@scaffold/shared** | 与运行环境、UI、鉴权均无关的公共常量与工具 | `DEFAULT_API_BASE_URL`、`API_BASE_URL_KEY`、`AUTH_STORAGE_KEY`（仅 key 名，无鉴权逻辑） |
| **@scaffold/shared-auth** | 鉴权相关的前端逻辑（不含具体表单 UI） | `AuthProvider`、`useAuth`、`AuthProviderWrapper`、类型与持久化 |

- **shared**：始终存在，CLI 生成「不需要系统功能」时仅去掉与 auth 相关的导出（如 `AUTH_STORAGE_KEY`），其余不变。
- **shared-auth**：仅在选择「需要系统功能（登录）」时生成；admin/mobile 仅在此时依赖该包。

## 2. 是否将 shared-auth 合并到 shared？

**结论：不合并，保持 shared-auth 独立包。**

原因：

1. **CLI 可选装配**  
   - 选「不需要系统功能」时，**不生成**整个 `packages/shared-auth` 目录即可。  
   - admin/mobile 的 `package.json` 中不声明 `@scaffold/shared-auth`，不引用 `AuthProviderWrapper`、`LoginForm`、`useAuth`。  
   - 若合并进 shared，则需要在同一包内维护「带 auth / 不带 auth」两套模板或条件导出，CLI 与包内结构都更复杂。

2. **依赖与体积**  
   - shared 仅含常量，无 React、无 API 客户端，可被任意端（含非前端）引用。  
   - shared-auth 依赖 `react`、`@scaffold/api`、`@scaffold/shared`。合并后 shared 会带上这些依赖，不利于「仅要常量」的场景。

3. **边界清晰**  
   - 「要登录」→ 依赖 shared + shared-auth；「不要登录」→ 只依赖 shared。  
   - 包级开关，便于文档、CLI 模板和后续扩展（如多套 auth 实现）。

因此：**CLI 对 auth 可选装配时，应通过「是否生成 shared-auth 包」来控制，不将 shared-auth 合并到 shared。**

## 3. 已从 admin/mobile 提取到 shared-auth 的内容

仅 **AuthProviderWrapper** 放在 shared-auth，admin 与 mobile 在根节点引用即可；**LoginForm 不共享**，各端在各自包内维护（admin 与 mobile 可使用不同 UI/交互）。

| 内容 | 说明 |
|------|------|
| **AuthProviderWrapper** | 根节点 Provider，内部读取 `VITE_API_URL` 或 `DEFAULT_API_BASE_URL`，传入 `AuthProvider`。 |

- admin：`main.tsx` 使用 `AuthProviderWrapper`，`App.tsx` 使用本地的 `LoginForm`（如 `src/components/LoginForm.tsx`）。  
- mobile：`main.tsx` 使用 `AuthProviderWrapper`，`LoginPage` 使用本地的 `LoginForm`（如 `src/components/LoginForm.tsx`）。

## 4. 无需放入 shared 的 app 专属内容

- **路由路径常量**（如 mobile 的 `ROUTES.LOGIN`、`ROUTES.HOME`）：各应用路由不同，保留在各自 `routes/routes.ts` 即可。  
- **页面与布局**：各端 UI 与路由结构不同，保留在各自 `pages/`、`components/`。  
- **lib/utils、types**：仅当出现多端完全一致的实现再考虑提到 shared；当前可保留在各端。

## 5. CLI 行为小结

- **需要系统功能（登录）**：生成 `shared-auth`；shared 导出含 `AUTH_STORAGE_KEY`；admin/mobile 依赖 shared-auth，使用 `AuthProviderWrapper`、`LoginForm`、`useAuth`。  
- **不需要系统功能**：不生成 `shared-auth`；shared 使用不包含 `AUTH_STORAGE_KEY` 的模板；admin/mobile 不依赖 shared-auth，不包含登录相关文件与引用。
