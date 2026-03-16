import { appAuth } from "./auth-service"

export function createAuthClientMiddleware(callback?: () => void) {
  if (!callback) {
    callback = () => {
      location.assign('/login')
    }
  }
  return async function authClientMiddleware(
    _args: {
      request: Request
      context: unknown
    },
    next: () => Promise<unknown>
  ): Promise<void> {
    const user = await appAuth.getIdentity()
    if (!user) {
      throw callback()
    }
    await next()
  }
}