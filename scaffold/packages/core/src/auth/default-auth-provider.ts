import { promiseResultCache, promiseResultCacheClear } from "../utils/promise-result-cache"
import { AuthProviderConfig, AuthUser } from "./types"
import { authConfig } from "./auth-config"

const AUTH_STORAGE_KEY = "_kdid"
const IDENTITY_CACHE_KEY = "auth/identity"

const defaultAuthProvider: AuthProviderConfig = {
  // 表单登录，根据实现情况调整
  login: async ({ account }) => {
    const user: AuthUser = {
      account
    }
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      promiseResultCacheClear(IDENTITY_CACHE_KEY)
      return { success: true, user, redirectTo: "/" }
    } catch {
      return {
        success: false,
        error: { name: "Login Error", message: "Failed to save session" },
      }
    }
  },
  logout: async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return { success: true, redirectTo: authConfig.fallbackUrl! }
  },
  // prod: 获取当前登录用户，换成接口
  getIdentity: async () =>
    promiseResultCache(IDENTITY_CACHE_KEY, async () => {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      try {
        return JSON.parse(raw) as AuthUser
      } catch {
        return null
      }
    }),
}

export { IDENTITY_CACHE_KEY }
export default defaultAuthProvider
