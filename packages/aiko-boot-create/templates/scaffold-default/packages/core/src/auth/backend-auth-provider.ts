import type { AuthProviderConfig, AuthUser, LoginParams } from "./types"
import { AUTH_ACCESS_TOKEN_KEY } from "./auth-constants"

export type BackendAuthProviderOptions = {
  /** 未授权时跳转的登录地址（通常是 "/login"） */
  loginUrl?: string
}

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string }

async function readJson<T>(res: Response): Promise<T> {
  return await res.json() as T
}

async function readTextSafe(res: Response): Promise<string> {
  return await res.text().catch(() => "")
}

/**
 * Parse backend response:
 * - supports plain data (T)
 * - supports envelope: { success, data, error }
 */
function unwrapEnvelope<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "success" in payload) {
    const env = payload as ApiEnvelope<T>
    if (!env.success) throw new Error(env.error || "Request failed")
    return env.data as T
  }
  return payload as T
}

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

/**
 * Backend auth provider for both admin & mobile.
 * - login: calls backend /auth/login
 * - getIdentity: calls backend /auth/current-user with stored access token
 * - logout: clears token
 * - onError: clears token on 401/403 and redirects to login
 */
export function createBackendAuthProvider(
  apiBaseUrl: string,
  options: BackendAuthProviderOptions = {}
): AuthProviderConfig {
  const loginUrl = options.loginUrl ?? "/login"

  return {
    login: async (params: LoginParams) => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: params.account,
            password: params.password ?? "",
          }),
        })
        if (!res.ok) {
          const text = await readTextSafe(res)
          throw new Error(text || `Login failed (${res.status})`)
        }
        const raw = await readJson<ApiEnvelope<{ accessToken?: string; refreshToken?: string; userInfo?: any }> | { accessToken?: string; refreshToken?: string; userInfo?: any }>(res)
        const result = unwrapEnvelope(raw)
        if (result?.accessToken) {
          localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, result.accessToken)
        }
        return {
          success: true,
          user: toAuthUser(result?.userInfo ?? {}),
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
        const res = await fetch(`${apiBaseUrl}/api/auth/current`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const text = await readTextSafe(res)
          throw new Error(text || `Get identity failed (${res.status})`)
        }
        const raw = await readJson<ApiEnvelope<any> | any>(res)
        const userInfo = unwrapEnvelope(raw)
        return toAuthUser(userInfo ?? {})
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
        return { logout: true, redirectTo: loginUrl }
      }
    },
  }
}

