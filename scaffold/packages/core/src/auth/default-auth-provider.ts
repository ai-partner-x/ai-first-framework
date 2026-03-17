import { AuthProviderConfig, AuthUser } from "./types"

/** Demo/local provider only: stores serialized user blob. Backend providers use AUTH_ACCESS_TOKEN_KEY in auth-constants.ts. */
const AUTH_STORAGE_KEY = "_kdid"

const defaultAuthProvider: AuthProviderConfig = {
  // 表单登录，根据实现情况调整
  login: async ({ account }) => {
    const user: AuthUser = {
      account
    }
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
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
    return { success: true }
  },
  // prod: 获取当前登录用户，换成接口
  getIdentity: async () => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  }
}

export default defaultAuthProvider
