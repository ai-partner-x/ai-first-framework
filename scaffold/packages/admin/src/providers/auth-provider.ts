import type { AuthProviderConfig, AuthUser, LoginParams } from "@scaffold/core"
import { AUTH_ACCESS_TOKEN_KEY } from "@scaffold/core"
import { AuthApi } from "@scaffold/api/client"
import { LOGIN_URL } from "@/app.config"

/** Map backend userInfo to core AuthUser. Handles missing/optional fields safely. */
function toAuthUser(info: {
  id?: number | null
  username?: string | null
  realName?: string | null
  email?: string | null
  roles?: string[] | null
  permissions?: string[] | null
}): AuthUser {
  const account = info.username ?? ""
  return {
    ...(info.id != null && { id: String(info.id) }),
    account,
    ...(info.email != null && info.email !== "" && { email: info.email }),
    ...(info.realName != null && { realName: info.realName }),
    ...(info.roles != null && info.roles.length > 0 && { roles: info.roles }),
    ...(info.permissions != null && info.permissions.length > 0 && { permissions: info.permissions }),
  }
}

function getAuthErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim() !== "") return error.message
  if (typeof error === "string" && error.trim() !== "") return error
  return fallbackMessage
}

function logAuthError(context: string, error: unknown): void {
  // Centralized auth error logging for easier debugging.
  console.error(`[Auth] ${context} error:`, error)
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
          localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, result.accessToken)
        }
        return {
          success: true,
          user: toAuthUser(result.userInfo),
          redirectTo: "/",
        }
      } catch (err) {
        logAuthError("login", err)
        const message = getAuthErrorMessage(err, "Login failed")
        return {
          success: false,
          error: { name: "Login Error", message },
        }
      }
    },

    logout: async () => {
      localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY)
      return { success: true }
    },

    getIdentity: async (): Promise<AuthUser | null> => {
      const token = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY)
      if (!token) return null
      try {
        const result = await authApi.getCurrentUser(token, {}, "")
        return toAuthUser(result)
      } catch (err) {
        logAuthError("getIdentity", err)
        localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY)
        return null
      }
    },

    onError: async (error: Error & { statusCode?: number }) => {
      logAuthError("onError", error)
      const status = error.statusCode
      if (status === 401 || status === 403) {
        localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY)
        return { logout: true, redirectTo: LOGIN_URL }
      }
    },
  }
}
