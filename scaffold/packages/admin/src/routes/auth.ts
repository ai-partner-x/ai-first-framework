import { USE_GUARD } from "@/app.config"
import { authClientMiddleware, createAuthorizationClientMiddleware } from "@scaffold/core"

export const authorizationClientMiddleware = USE_GUARD ? createAuthorizationClientMiddleware() : (_args: unknown, next: () => Promise<unknown>) => { next() }

export const middleware = [authClientMiddleware, authorizationClientMiddleware]