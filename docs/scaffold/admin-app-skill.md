---
name: scaffold-admin-app
description: Help the agent work on the @scaffold/admin React admin app in the scaffold monorepo, including routing, layout, theme, CRUD patterns, and component usage standards based on shadcn/ui. Use when modifying admin pages, routes, layouts, themes, or adding new business modules under scaffold/packages/admin.
---

# Scaffold Admin App Skill

## 1. 适用范围（WHEN）

在以下场景，应主动使用本 Skill：

- 用户提到 **admin 管理端**、`@scaffold/admin` 或 `scaffold/packages/admin`
- 在 admin 中新增或修改：
  - 页面（`src/pages`）、业务模块路由（`src/routes/modules`）、布局（`src/layouts`）
  - CRUD 列表、主数据维护页、报表页
  - 主题 / 布局模式切换 / 设置页
- 在 admin 中对接或调整：
  - 认证登录流程（基于 `@scaffold/core`）
  - 路由守卫、权限控制（与 core Skill 联动）
- 在 admin 中新增或扩展 UI 组件，且需要遵守 **shadcn/ui 与 `components` 目录规范**

仅改动其他包（如 api、core）且不涉及 admin 时，可不启用本 Skill。

---

## 2. 工程定位与结构（WHAT）

- **包名**：`@scaffold/admin`
- **路径**：`scaffold/packages/admin`
- **入口**：
  - HTML：`index.html` → `src/index.tsx`
  - JS：`src/index.tsx`（完成 `appAuth.setup` 后渲染 `<App />`）
  - 根组件：`src/App.tsx`

**关键目录：**

- `src/pages/`：业务页面（首页、Dashboard、设置、采购/主数据/报表等）
- `src/routes/`：路由配置与菜单构造（`index.ts`、`menu.ts`、`modules/*.ts`）
- `src/layouts/`：`menu-layout.tsx`、`tile-layout.tsx`
- `src/providers/`：`auth-provider.ts`（对接后端登录）、`app-config.tsx`
- `src/components/`：
  - `ui/`：基于 **shadcn/ui** 的基础组件
  - `admin-ui/`：在 ui 之上的业务组件（ListReport、MasterDetail、ObjectPage、EditableTable、ShellBar 等）
- `src/theme/`：CSS 主题（default、blue、green、fiori、amber）
- `src/locales/`：`en.json`、`zh.json`

---

## 3. 运行与环境约定

### 3.1 启动与构建

- 从 scaffold 根目录：

  