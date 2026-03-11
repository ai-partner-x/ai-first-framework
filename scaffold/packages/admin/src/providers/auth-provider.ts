import { LOGIN_URL } from "@/app.config"
import {
  promiseResultCache,
  promiseResultCacheClear,
  AuthProviderConfig,
  AuthUser,
} from "@scaffold/core"
import { AuthApi } from '@scaffold/api/client'

const AUTH_STORAGE_KEY = "_kdid"
const IDENTITY_CACHE_KEY = "auth/identity"

const authApi = new AuthApi(import.meta.env.VITE_API_URL)

const appAuthProvider: AuthProviderConfig = {
  // 表单登录，根据实现情况调整
  login: async ({ account, password }) => {
    try {
      const result = await authApi.login({ username: account, password: password! })
      const user: AuthUser = {
        id: result.id.toString(),
        account: result.username,
        email: result.email,
      }

      // 持久化登录态，确保 middleware / getIdentity 能读到
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      // 清理 identity 缓存，避免 getIdentity 继续返回旧值（如之前缓存了 null）
      promiseResultCacheClear(IDENTITY_CACHE_KEY)
      return {
        success: true,
        user,
        redirectTo: "/",
      }
    } catch {
      return {
        success: false,
        error: { name: "Login Error", message: "Failed to save session" },
      }
    }
  },
  logout: async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    promiseResultCacheClear(IDENTITY_CACHE_KEY)
    return { success: true, redirectTo: LOGIN_URL }
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

export default appAuthProvider
