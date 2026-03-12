import { redirect } from "react-router"
import { authConfig } from "./auth-config"

export function createAuthClientMiddleware() {

  return async function authClientMiddleware(
    _args: {
      request: Request
      context: unknown
    },
    next: () => Promise<unknown>
  ): Promise<void> {
    const user = await authConfig.provider!.getIdentity()
    if (!user) {
      throw redirect(authConfig.fallbackUrl!)
    }
    await next()
  }
}

export const authClientMiddleware = createAuthClientMiddleware()
