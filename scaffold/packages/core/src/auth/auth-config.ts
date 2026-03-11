import defaultAuthProvider from "./default-auth-provider"
import { AuthConfig } from "./types"

export const authConfig: AuthConfig = {
  fallbackUrl: "/login",
  useMiddleware: true,
  provider: defaultAuthProvider,
}

// 初始化 authConfig
export const setAppAuthConfig = (config: AuthConfig) => {
  // 合并 config 和 authConfig
  Object.assign(authConfig, config)
}
