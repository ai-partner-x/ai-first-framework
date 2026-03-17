# Auth 公共模块设计（mobile / admin 共用）

> **当前实现**：鉴权由 **@scaffold/core** 提供（`appAuth`、`defaultAuthProvider`、`createAuthClientMiddleware`）。admin 与 mobile 通过 `appAuth.setup(provider)` 初始化，登录/登出/ getIdentity 由 provider 抽象，可接本地 localStorage 或后端 API。下文部分为历史/扩展说明。

## 目标

为 scaffold 中 **mobile** 与 **admin** 提供统一的登录、鉴权与用户状态管理，避免两端重复实现。

## 职责划分

| 层级 | 包 | 职责 |
|------|-----|------|
| 后端 API | `@scaffold/api` | 登录接口、DTO、后续 JWT/鉴权中间件 |
| 前端常量/键 | `@scaffold/shared` | API 基地址、本地存储 key 等与 UI 无关的常量 |
| 前端鉴权状态与调用 | `@scaffold/core` | appAuth、AuthProviderConfig、登录/登出/getIdentity、路由中间件 |

- **类型与 API 客户端**：继续由 `@scaffold/api` 的 codegen 产出（`LoginDto`、`LoginResultDto`、`AuthApi`），mobile 与 admin 若接后端可依赖 `@scaffold/api` 复用。
- **API 基地址**：由 `@scaffold/shared` 提供默认值与环境变量 key 约定；各端用各自 env 覆盖。
- **鉴权状态与调用**：由 `@scaffold/core` 提供 `appAuth`、`AuthProviderConfig`（如 `defaultAuthProvider`），实现登录、登出与 getIdentity；可替换为自定义 provider 对接真实 API。

## 数据流

```
[LoginForm (mobile/admin)]
        ↓ appAuth.login({ account, password })
[AuthService + AuthProviderConfig]
        ↓ provider.login() → 可接 AuthApi 或本地 defaultAuthProvider
[defaultAuthProvider] 写入 localStorage（键 _kdid）；或 [自定义 provider] 调后端
[appAuth.getIdentity()] 可供全应用使用；路由用 createAuthClientMiddleware 保护
```

## 接口约定

### 1. `@scaffold/shared`

- `DEFAULT_API_BASE_URL`：默认 API 基地址（已有）
- `API_BASE_URL_KEY`：环境变量 key 约定（已有）
- **新增** `AUTH_STORAGE_KEY`：本地存储用户信息的 key（如 `scaffold_auth`），供 @scaffold/core 的 defaultAuthProvider 与各端一致使用

### 2. `@scaffold/core`（鉴权）

- **AuthProvider**  
  - Props：`apiBaseUrl: string`（由各端根据 env 或 shared 常量传入）、`children`  
  - 内部创建 `AuthApi(apiBaseUrl)`，提供 Context
- **useAuth()**  
  - 返回：`{ user, login, logout, isLoading, error, setError }`  
  - `user`: `LoginResultDto | null`（与 API 一致）  
  - `login(username, password)`: 调用 API，成功则写 state + localStorage，失败设 `error`  
  - `logout()`: 清 state 与 localStorage  
  - 初始化时从 localStorage 恢复 `user`（可选：后续可加 token 校验）
- **持久化**  
  - 存储内容：`{ user: LoginResultDto }`（后续可加 `token`）  
  - 使用 `shared.AUTH_STORAGE_KEY`

### 3. API 侧（现状与扩展）

- 当前：`POST /api/auth/login`，返回 `LoginResultDto`（id, username, email）
- 后续若接入 JWT：在 `LoginResultDto` 中增加 `token`，前端在 provider 或请求封装中存 token，请求时通过 header 携带（可由各端请求封装统一加 header）

## 各端使用方式

- **mobile**  
  - 根布局用 `AuthProvider` 包裹，`apiBaseUrl` 取 `process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL`  
  - 登录页使用 `useAuth().login` 与 `error`；其余页通过 `useAuth().user` 判断是否已登录，未登录可重定向到登录页  
- **admin**  
  - 同上，用 `AuthProvider` 包裹；`apiBaseUrl` 取 `import.meta.env.VITE_API_URL ?? DEFAULT_API_BASE_URL`  
  - 登录页与路由鉴权逻辑与 mobile 一致，仅 UI 与路由实现不同

## JWT / OAuth2 支持

鉴权层（@scaffold/core + 自定义 provider）可**兼容**常见 JWT 与 OAuth2 用法，后端可按需升级。

### 当前能力（无 token）

- 登录接口仅返回用户信息（id, username, email）时，前端只持久化 `user`，不携带 `Authorization` 请求头。
- 适用于：仅会话态、或后端用 Cookie/Session 的场景。

### JWT 常用方式

- **后端**：登录接口返回 `LoginResultDto` 并增加可选字段，例如：
  - `accessToken?: string`
  - `refreshToken?: string`
  - `expiresIn?: number`（秒）
- **前端**：自定义 AuthProviderConfig 可持久化 `user` + `accessToken`（及可选的 refreshToken、过期时间）；请求封装在每次请求中加上 `Authorization: Bearer <accessToken>`。
- 后续可扩展：在过期前用 refreshToken 换新 accessToken（需后端提供 refresh 接口）。

### OAuth2 常用方式（SPA）

- **Authorization Code + PKCE**：由后端或独立网关完成与 IdP 的 code 交换，前端只请求「用 code 换 token」的接口；该接口返回的形态与 JWT 一致（access_token、refresh_token、expires_in）。前端收到后交给鉴权 provider 的存储与请求头逻辑，即可复用现有设计。
- **Resource Owner Password**：用户名密码发到后端，后端再向 IdP 换 token 并返回给前端，同样可视为「登录接口返回 user + accessToken」，与 JWT 用法一致。

### 存储与接口约定

- **持久化结构**（localStorage）：`{ user, accessToken?, refreshToken?, expiresAt? }`。无 token 时仅存 `user`，与现有行为兼容。
- **useAuth()** 暴露 **getAuthHeaders()**：有 `accessToken` 时返回 `{ Authorization: 'Bearer <accessToken>' }`，否则返回 `{}`。各端在 fetch/axios 拦截器中注入即可。

## 可选扩展

- **useAuthRequired(loginPath)**：在需要登录的页面调用，未登录则跳转 `loginPath`
- **刷新 token**：根据 `expiresAt` 或 401 触发 refresh 接口，用 `refreshToken` 换新 `accessToken` 后更新存储并重试请求
- **静默登录**：从 localStorage 恢复后可选调用后端校验接口，失败则清空本地并视为未登录
