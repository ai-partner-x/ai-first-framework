import { redirect } from "react-router"
import { authorizationConfig } from "./authorization-config"
import { NormalizedPermissions, PermissionSet } from "./types"

export function normalizePermissions(input: PermissionSet | null | undefined): NormalizedPermissions {
  if (!input) return { set: new Set() }
  if (Array.isArray(input)) {
    // 忽略 "*"，必须显式配置每个权限 key
    const keys = input.filter((k) => k && k !== "*")
    return { set: new Set(keys) }
  }
  const keys = Object.keys(input).filter((k) => k && k !== "*" && input[k] === true)
  return { set: new Set(keys) }
}

export const createAuthorizationClientMiddleware = (key?: string) => {
  return async function authorizationClientMiddleware(
    _args: {
      request: Request
      context: unknown
    },
    next: () => Promise<unknown>
  ): Promise<void> {
    if (!authorizationConfig.useMiddleware || !authorizationConfig.provider) {
      await next()
      return
    }
    const { permissonPoints } = await authorizationConfig.provider.getPermissions()
    const p = normalizePermissions(permissonPoints)
    if (!key) {
      key = location.pathname
    }
    if (!p.set.has(key)) {
      throw redirect(authorizationConfig.fallbackUrl!)
    }
    await next()
  }
}
