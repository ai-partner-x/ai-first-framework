import { ReactNode } from "react"

export type AuthUser = {
  id?: string
  /** 登录账号/用户名（替代原 name 字段） */
  account: string
  /** 可选：邮箱 */
  email?: string
  avatar?: string | ReactNode
  /** 允许携带额外的用户数据（例如 roles、dept、tenant 等） */
  [key: string]: unknown
}

export type LoginParams = {
  account: string
  password?: string
}

export type AuthProviderResult = {
  success: boolean
  redirectTo?: string
  user?: AuthUser
  error?: { name: string; message: string }
}

export type AuthProviderConfig = {
  login: (params: LoginParams) => Promise<AuthProviderResult>
  logout: () => Promise<AuthProviderResult>
  getIdentity: () => Promise<AuthUser | null>
  onError?: (
    error: Error & { statusCode?: number }
  ) => Promise<{ logout?: boolean; redirectTo?: string } | void>
}


export type AuthConfig = {
  fallbackUrl?: string
  useMiddleware?: boolean
  provider?: AuthProviderConfig
}
