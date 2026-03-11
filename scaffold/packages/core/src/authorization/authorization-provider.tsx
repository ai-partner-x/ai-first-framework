"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useOptionalAuth } from "../auth"
import { authorizationConfig } from "./authorization-config"
import type { AuthorizationState, PermissionSet } from "./types"
import { normalizePermissions } from "./authorization-client-middleware"


const AuthorizationContext = createContext<{
  state: AuthorizationState
} | null>(null)

export function AuthorizationProvider({
  children,
}: {
  children: ReactNode
}) {
  const auth = useOptionalAuth()
  const isAuthenticated = auth?.state.isAuthenticated ?? false

  const provider = authorizationConfig.provider!

  const [data, setData] = useState<PermissionSet | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(
    async () => {
      if (!isAuthenticated) {
        setData(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const { permissonPoints } = await provider.getPermissions()
        setData(permissonPoints)
      } catch {
        setData(null)
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, provider]
  )

  // Login/logout/provider-change => refresh permissions
  useEffect(() => {
    if (!isAuthenticated) {
      setData(null)
      setIsLoading(false)
      return
    }
    void load()
  }, [isAuthenticated, provider, load])

  const state: AuthorizationState = useMemo(
    () => ({
      permissions: normalizePermissions(data),
      isLoading,
    }),
    [data, isLoading]
  )

  const value = useMemo(
    () => ({
      state,
    }),
    [state]
  )

  return (
    <AuthorizationContext.Provider value={value}>
      {isAuthenticated && state.isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <span className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : (
        children
      )}
    </AuthorizationContext.Provider>
  )
}

export function useAuthorizationContext() {
  const ctx = useContext(AuthorizationContext)
  if (!ctx) throw new Error("useAuthorizationContext must be used within AuthorizationProvider")
  return ctx
}

/** Single-key authz check (returns boolean). */
export function useAuthorization(key: string): boolean {
  const { state } = useAuthorizationContext()
  if (state.isLoading) return false
  return state.permissions.set.has(key)
}

/** Bulk/imperative checker for loops and filters. */
export function useAuthorizationChecker() {
  const { state } = useAuthorizationContext()
  return useCallback(
    (key: string) => {
      if (state.isLoading) return false
      return state.permissions.set.has(key)
    },
    [state.isLoading, state.permissions.set]
  )
}
