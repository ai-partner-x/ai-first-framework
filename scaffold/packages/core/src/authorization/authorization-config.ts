import defaultAuthorizationProvider from "./default-authorization-provider"
import type { AuthorizationConfig } from "./types"

export const authorizationConfig: AuthorizationConfig = {
  fallbackUrl: "/not-found",
  useMiddleware: true,
  provider: defaultAuthorizationProvider,
}

/** 初始化/覆盖 authorization 配置（与 auth 的 setAppAuthConfig 对齐） */
export const setAppAuthorizationConfig = (config: Partial<AuthorizationConfig>) => {
  Object.assign(authorizationConfig, config)
}
