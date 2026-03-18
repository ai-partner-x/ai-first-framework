import { LOGIN_URL, USE_GUARD } from "@/app.config"
import { createAuthClientMiddleware, createAuthorizationClientMiddleware } from "@scaffold/core"
import { redirect } from "react-router"

export const authorizationClientMiddleware = USE_GUARD ? createAuthorizationClientMiddleware() : (_args: unknown, next: () => Promise<unknown>) => { next() }

export const middleware = [createAuthClientMiddleware(() => {
  redirect(LOGIN_URL)
}), authorizationClientMiddleware]