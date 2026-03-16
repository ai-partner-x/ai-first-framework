import type { AuthProviderConfig, AuthUser, LoginParams } from "@scaffold/core"
import { AuthApi } from "@scaffold/api/client"

const ACCESS_TOKEN_KEY = "_access_token"

/** Map backend userInfo to core AuthUser. */
function toAuthUser(info: {
  id: number
  username: string
  realName?: string
  email?: string
  roles?: string[]
  permissions?: string[]
}): AuthUser {
  return {
    id: String(info.id),
    account: info.username,
    email: info.email,
    realName: info.realName,
    roles: info.roles,
    permissions: info.permissions,
  }
}

export function createBackendAuthProvider(apiBaseUrl: string): AuthProviderConfig {
  const authApi = new AuthApi(apiBaseUrl)

  return {
    login: async (params: LoginParams) => {
      try {
        const result = await authApi.login({
          username: params.account,
          password: params.password ?? "",
        })
        if (result.accessToken) {
          localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken)
        }
        return {
          success: true,
          user: toAuthUser(result.userInfo),
          redirectTo: "/",
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed"
        return {
          success: false,
          error: { name: "Login Error", message },
        }
      }
    },

    logout: async () => {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      return { success: true }
    },

    getIdentity: async (): Promise<AuthUser | null> => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) return null
      const result = await authApi.getCurrentUser(token, {}, '')
      return toAuthUser(result)
    },
  }
}
