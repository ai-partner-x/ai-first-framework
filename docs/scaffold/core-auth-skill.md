---
name: scaffold-core-auth
description: Help the agent use @scaffold/core for shared authentication and authorization across admin/mobile apps in the scaffold monorepo. Use when configuring appAuth, auth providers, authorization providers, route middlewares, or when adding guarded pages based on the scaffold core design.
---

# Scaffold Core Auth Skill

## 简介

本 Skill 指导代理在 scaffold monorepo 中正确使用 `@scaffold/core`，包括：

- 如何在前端应用（admin / mobile）中初始化和使用 **认证（Auth）** 能力
- 如何配置和使用 **授权（Authorization）** 能力
- 何时使用哪个 Provider / Middleware 组件
- 如何在保持当前架构前提下扩展能力而不“绕过” core

`@scaffold/core` 的实际路径为 `scaffold/packages/core`，在应用中通过包名 `@scaffold/core` 使用。

---

## 1. 何时使用本 Skill

在以下场景应主动应用本 Skill：

- 修改或新增 **登录逻辑**（例如登录表单、登录按钮行为）
- 配置或替换 **AuthProvider**（如从本地演示切换为对接后端 API）
- 给页面或路由增加/调整 **登录校验** 或 **权限校验**
- 在 admin / mobile 中集成共享的 **AuthorizationProvider** 与权限 Hook
- 遇到与 `appAuth`、`AUTH_ACCESS_TOKEN_KEY`、`AuthorizationProvider`、`createAuthClientMiddleware` 等相关的问题

如仅是普通 UI 开发且不涉及鉴权/授权，则无需启用本 Skill。

---

## 2. 核心概念速览

### 2.1 包结构与入口

- 包名：`@scaffold/core`
- 路径：`scaffold/packages/core`
- 入口：`src/index.ts`
- 类型：仅作为库使用，本身**不提供 dev/start 脚本**

### 2.2 Auth（认证）

- **单例服务：** `appAuth`
- **关键类型：**
  - `AuthUser`
  - `LoginParams`
  - `AuthProviderConfig`
  - `AuthProviderResult`
- **关键常量：**
  - `AUTH_ACCESS_TOKEN_KEY`（默认 `_access_token`）

### 2.3 Authorization（授权）

- **React Provider：** `AuthorizationProvider`
- **Hooks：**
  - `useAuthorization(key)`
  - `useAuthorizationChecker()`
  - `useAuthorizationContext()`
- **配置入口：**
  - `setAppAuthorizationConfig`
- **路由中间件工厂：**
  - `createAuthorizationClientMiddleware(permissionKey?)`

### 2.4 Utils

- `promiseResultCache`, `promiseResultCacheClear`, `promiseResultCacheClearAll`：用于缓存异步结果（如权限数据）。

---

## 3. 在应用中初始化 Auth

### 3.1 统一原则

当代理需要在某个前端应用（如 `@scaffold/admin` 或 mobile）中启用认证时，**必须走 `appAuth.setup(provider)` 这一初始化流程**，而不是自行管理 token 或用户信息。

### 3.2 典型初始化流程（以 admin 为例）

1. 在应用入口（如 `src/index.tsx`）中：

   - 导入 core：

     