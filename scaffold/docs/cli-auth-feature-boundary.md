# CLI 生成：系统功能（登录）边界说明

当 CLI 提供参数「是否需要系统功能」且用户选择 **否** 时，生成的脚手架应**不包含登录/鉴权**相关代码。本文档列出所有与「系统功能（登录）」强相关的包与文件，供 CLI 在生成时按需包含或排除。

## 结论：当前结构可支撑

- **包级**：`shared-auth` 为独立包，选择「不需要系统功能」时可不生成该包，并在 mobile/admin 的 `package.json` 中不声明对 `@scaffold/shared-auth` 的依赖。
- **文件级**：api / shared / mobile / admin 内与登录相关的文件边界清晰，CLI 可按下表生成「带登录」与「不带登录」两套模板。

---

## 1. 包级：是否包含整个包

| 包 | 是否需要系统功能 = 是 | 是否需要系统功能 = 否 |
|----|------------------------|------------------------|
| `packages/api` | ✅ 生成 | ✅ 生成（但见下文「api 内文件」） |
| `packages/shared` | ✅ 生成 | ✅ 生成（可用「无 AUTH」模板） |
| `packages/shared-auth` | ✅ 生成 | ❌ **不生成**（整包省略） |
| `packages/admin` | ✅ 生成 | ✅ 生成（用「无登录」模板） |
| `packages/mobile` | ✅ 生成 | ✅ 生成（用「无登录」模板） |

根目录 `package.json` 的 `pnpm -r --filter "@scaffold/*"` 会拉取所有 `packages/*`；若不生成 `shared-auth`，workspace 中即无该包，无需改根配置。

---

## 2. API 包内：与登录强相关的文件

以下文件仅在「需要系统功能」时生成；选「否」时**不生成**这些文件。

| 文件 | 说明 |
|------|------|
| `packages/api/src/controller/auth.controller.ts` | 登录接口 |
| `packages/api/src/service/auth.service.ts` | 登录逻辑 |
| `packages/api/src/dto/auth.dto.ts` | LoginDto / LoginResultDto |
| `packages/api/src/entity/user.entity.ts` | 用户表实体 |
| `packages/api/src/mapper/user.mapper.ts` | 用户 Mapper |

**init-db**：`packages/api/src/scripts/init-db.ts` 当前包含建 `sys_user` 表与初始用户种子。选「不需要系统功能」时有两种方式：

- **A**：生成另一版 `init-db.ts`，不建 `sys_user`、不插用户数据（仅保留其他表/逻辑（若有））；
- **B**：仍生成同一脚本，但通过环境变量或参数控制是否执行「用户表+种子」段落（CLI 生成时把该段落做成条件分支）。

codegen 会根据现有 controller/dto 生成 `dist/client`；去掉 auth controller 与 auth dto 后，生成的 client 中不再包含 `AuthApi` 与 auth 类型，与「无登录」一致。

---

## 3. Shared 包内：与登录相关的导出

| 文件 | 需要系统功能 = 是 | 需要系统功能 = 否 |
|------|--------------------|--------------------|
| `packages/shared/src/constants.ts` | 包含 `AUTH_STORAGE_KEY` | 不导出 `AUTH_STORAGE_KEY`（仅保留 `DEFAULT_API_BASE_URL`、`API_BASE_URL_KEY`） |
| `packages/shared/src/index.ts` | 导出 `AUTH_STORAGE_KEY` | 不导出 `AUTH_STORAGE_KEY` |

即 CLI 可维护两套模板：`constants.ts` + `index.ts`（带 AUTH / 不带 AUTH）。

---

## 4. Mobile 包内：与登录相关的文件与依赖

**说明**：`AuthProviderWrapper` 在 `@scaffold/shared-auth`，mobile 从该包引用；`LoginForm` 为各端本地组件，不共享。

| 项目 | 需要系统功能 = 是 | 需要系统功能 = 否 |
|------|--------------------|--------------------|
| `package.json` 的 `dependencies` | 包含 `@scaffold/shared-auth` | **不包含** `@scaffold/shared-auth` |
| `src/main.tsx` | 使用 `AuthProviderWrapper`（来自 shared-auth）包裹 `App` | 直接渲染 `<App />`，不引用 Auth |
| `src/components/LoginForm.tsx` | 生成（本地表单，使用 `useAuth`） | **不生成** |
| `src/pages/LoginPage.tsx`、路由中的登录/鉴权 | 使用本地 `LoginForm`、`useAuth` | **不生成** 登录页与鉴权路由 |
| `src/routes/ProtectedRoute.tsx` 等 | 生成 | **不生成** |

---

## 5. Admin 包内：与登录相关的文件与依赖

**说明**：`AuthProviderWrapper` 在 `@scaffold/shared-auth`，admin 从该包引用；`LoginForm` 为 admin 本地组件，不共享。

| 项目 | 需要系统功能 = 是 | 需要系统功能 = 否 |
|------|--------------------|--------------------|
| `package.json` 的 `dependencies` | 包含 `@scaffold/shared-auth` | **不包含** `@scaffold/shared-auth` |
| `src/main.tsx` | 使用 `AuthProviderWrapper`（来自 shared-auth）包裹 `App` | 直接渲染 `<App />`，不引用 Auth |
| `src/components/LoginForm.tsx` | 生成（本地表单，使用 `useAuth`） | **不生成** |
| `src/App.tsx` | 使用本地 `LoginForm`、`useAuth`，根据 `user` 显示登录/已登录布局 | 简单占位（如「Scaffold Admin」） |

---

## 6. CLI 实现建议

1. **两套模板**：为「需要系统功能」与「不需要系统功能」各维护一组模板（或模板片段），按参数选择复制/渲染的集合。
2. **包列表**：选「否」时，不创建 `packages/shared-auth` 目录；mobile/admin 的 `package.json` 模板中不包含 `@scaffold/shared-auth`。
3. **API**：选「否」时，不生成上述 5 个 auth/user 相关文件；`init-db` 使用「无用户表/无种子」版本或带条件分支的版本。
4. **Shared**：选「否」时，使用不包含 `AUTH_STORAGE_KEY` 的 `constants.ts` 与 `index.ts` 模板。
5. **Root scripts**：根目录的 `init-db` 脚本可保留；选「否」时若 init-db 不再建用户表，对「无登录」项目仍可执行（仅做其他初始化或空实现）。

---

## 7. 为何不将 shared-auth 合并进 shared

为支持 CLI「是否需要系统功能」的可选装配，**应保持 shared-auth 为独立包，不合并到 shared**。理由见 [shared-vs-shared-auth.md](./shared-vs-shared-auth.md)。简要结论：选「否」时不生成整个 `shared-auth` 包即可，admin/mobile 不依赖它；若合并进 shared，则需在同一包内维护两套模板或条件导出，不利于 CLI 与依赖边界。

---

## 8. 可选：API 内聚 auth 模块便于 CLI 裁剪

当前 api 的 auth 相关文件分散在 `controller/`、`service/`、`dto/`、`entity/`、`mapper/`。若希望 CLI 用「删目录」代替「删多文件」，可后续将 auth 收口到子目录，例如：

- `packages/api/src/auth/` 或 `packages/api/src/modules/auth/`
  - 下含：`auth.controller.ts`、`auth.service.ts`、`auth.dto.ts`，以及（若允许）`user.entity.ts`、`user.mapper.ts` 的占位或引用

这样 CLI 在「不需要系统功能」时只需排除整个 `auth` 目录（及对应的 init-db 用户部分），逻辑更简单。当前扁平结构也完全可支撑，仅需按上表列出文件列表做排除即可。
