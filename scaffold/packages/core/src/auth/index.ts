export {
  AuthProvider,
  useAuth,
  useOptionalAuth,
  useLogin,
  useLogout,
  useIsAuthenticated,
  useGetIdentity,
} from "./auth-provider"
export {
  authClientMiddleware
} from "./auth-client-middleware"
export {
  setAppAuthConfig,
} from "./auth-config"

export type {
  AuthUser,
  LoginParams,
  AuthProviderConfig,
  AuthProviderResult,
  AuthConfig
} from "./types"
