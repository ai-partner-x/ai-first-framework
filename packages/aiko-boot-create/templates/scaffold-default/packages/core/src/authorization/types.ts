export type PermissionKey = string

export type PermissionSet = PermissionKey[] | Record<PermissionKey, boolean>

export type PermissionResult = {
  permissionPoints: PermissionSet
  menuTree: PermissionMenuItem[]
}

export type PermissionMenuItem = {
  id: string
  label: string
  icon?: string,
  path?: string
  children?: PermissionMenuItem[]
}

export type AuthorizationProviderConfig = {
  /** Fetch current user's permissions */
  getPermissions: () => Promise<PermissionResult>
  onError?: (
    error: Error & { statusCode?: number }
  ) => Promise<{ logout?: boolean; redirectTo?: string } | void>
}

export type AuthorizationConfig = {
  /** 无权限时重定向地址（middleware 使用） */
  fallbackUrl?: string
  /** 是否启用授权 middleware */
  useMiddleware?: boolean
  provider?: AuthorizationProviderConfig
}


export type NormalizedPermissions = {
  set: Set<string>
}

export type AuthorizationState = {
  permissions: NormalizedPermissions
  isLoading: boolean
}
