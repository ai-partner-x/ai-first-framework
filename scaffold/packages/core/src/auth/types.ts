import { ReactNode } from "react"

export type AuthUser = {
  id?: string
  name?: string
  email: string
  avatar?: string | ReactNode
}

export type LoginParams = {
  email: string
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
