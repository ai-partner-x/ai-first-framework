"use client"

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  AuthUser,
  LoginParams,
  AuthProviderResult,
} from "./types"
import { authConfig } from "./auth-config"

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  /** 未登录时用于重定向的地址（由 getIdentity 为 null 时设置） */
  redirectTo?: string
}

const AuthContext = createContext<{
  state: AuthState
  login: (params: LoginParams) => Promise<AuthProviderResult>
  logout: () => Promise<AuthProviderResult>
  getIdentity: () => Promise<AuthUser | null>
  /** 用 getIdentity 重新请求并更新身份信息 */
  syncFromIdentity: () => Promise<void>
} | null>(null)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const provider = authConfig.provider!

  const [identity, setIdentity] = useState<AuthUser | null>(null)
  const [identityLoading, setIdentityLoading] = useState(false)

  const loadIdentity = useCallback(async () => {
    setIdentityLoading(true)
    try {
      const user = await provider.getIdentity()
      setIdentity(user ?? null)
    } catch {
      setIdentity(null)
    } finally {
      setIdentityLoading(false)
    }
  }, [provider])

  useEffect(() => {
    void loadIdentity()
  }, [loadIdentity])

  const state: AuthState = useMemo(
    () => ({
      user: identity ?? null,
      isAuthenticated: !!identity,
      isLoading: identityLoading,
      redirectTo: identity ? undefined : authConfig.fallbackUrl,
    }),
    [identity, identityLoading]
  )

  const syncFromIdentity = useCallback(async () => {
    await loadIdentity()
  }, [loadIdentity])

  const login = useCallback(
    async (params: LoginParams) => {
      const result = await provider.login(params)
      if (result.success) {
        // 若后端已在 login 返回 user，则直接写入本地状态，避免额外一次 getIdentity 请求
        if (result.user) {
          setIdentity(result.user)
        } else {
          await loadIdentity()
        }
      }
      return result
    },
    [provider, loadIdentity]
  )

  const logout = useCallback(async () => {
    const result = await provider.logout()
    setIdentity(null)
    if (result.redirectTo) {
      window.location.href = result.redirectTo
    }
    return result
  }, [provider])

  const getIdentity = useCallback(async (): Promise<AuthUser | null> => {
    // 直接委托给 provider（默认实现内部已用 promiseCache 缓存）
    const user = await provider.getIdentity()
    return user ?? null
  }, [provider])

  const value = useMemo(
    () => ({
      state,
      login,
      logout,
      getIdentity,
      syncFromIdentity,
    }),
    [state, login, logout, getIdentity, syncFromIdentity]
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

/** Returns auth context or null when not inside AuthProvider (for optional auth check). */
export function useOptionalAuth() {
  return useContext(AuthContext)
}

export function useLogin() {
  const { login } = useAuth()
  return { mutate: login }
}

export function useLogout() {
  const { logout } = useAuth()
  return { mutate: logout }
}

export function useIsAuthenticated() {
  const { state, syncFromIdentity } = useAuth()
  return {
    data: {
      authenticated: state.isAuthenticated,
      redirectTo: state.redirectTo,
    },
    isLoading: state.isLoading,
    refetch: syncFromIdentity,
  }
}

export function useGetIdentity() {
  const { state } = useAuth()
  return { data: state.user }
}
