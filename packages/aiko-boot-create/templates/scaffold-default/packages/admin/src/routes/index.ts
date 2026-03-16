import { USE_GUARD } from "@/app.config"
import { createAuthClientMiddleware, createAuthorizationClientMiddleware } from "@scaffold/core"
import { ReactNode } from "react"
import { RouteObject } from "react-router"

type ModuleExport = {
  routes?: RouteConfig[]
}

/** 中间件函数类型（与 react-router 约定一致） */
type MiddlewareFn = (
  args: { request: Request; context: unknown },
  next: () => Promise<unknown>
) => Promise<unknown>

/**
 * 路由配置，支持树状结构：子路由定义在 children 中；与菜单对齐可配 icon / label / group。
 * - path 为相对父级路径；index 为 true 时 path 可省略
 * - 有 children 时，父级可不写 element，渲染时用 <Outlet /> 占位
 * - anonymous / useGuard 用于在 getModulesContext 中自动注入 middleware，无需在模块里配置
 * - group 从路由读取，用于菜单分区；groupOrder 指定该分区在菜单中的顺序（越小越靠前）
 */
export type RouteConfig = Omit<RouteObject, "children"> & {
  label?: string
  icon?: ReactNode
  /** 是否允许匿名（不注入认证中间件） */
  anonymous?: boolean
  /** 是否注入授权中间件 */
  useGuard?: boolean
  /** 菜单分区（如 business / analytics / system），与 menu-layout 的 MenuItem.group 对应 */
  group?: string
  /** 同 groupName 的多条路由会合并为一个父菜单（如 MM-采购） */
  groupName?: string
  /** 分区在菜单中的顺序，数值越小越靠前；同分区取该分区内最小 groupOrder */
  groupOrder?: number
  /** 同级菜单顺序（同一 groupName 下多项时），数值越小越靠前 */
  order?: number
  children?: RouteConfig[]
}

const modules = import.meta.glob<ModuleExport>("./modules/*.ts", { eager: true })

/** 按 RouteConfig 的 anonymous / useGuard 递归注入 middleware */
function applyMiddlewareToRoutes(routes: RouteConfig[], middlewares: MiddlewareFn[]): RouteConfig[] {
  return routes.map((route) => {
    const { children, anonymous, useGuard, ...rest } = route
    const middleware: MiddlewareFn[] = []

    const requiresAuth = anonymous !== true

    if (requiresAuth) {
      middleware.push(middlewares[0] as MiddlewareFn)
      if (useGuard !== false) {
        middleware.push(middlewares[1] as MiddlewareFn)
      }
    }
    const out: RouteConfig = { ...rest, anonymous, useGuard, middleware, children: undefined }
    if (children?.length) {
      out.children = applyMiddlewareToRoutes(children, middlewares)
    }
    return out
  })
}

let _routes: RouteConfig[] = []

export function getModulesContext(): {
  routes: RouteConfig[]
  middlewares: MiddlewareFn[]
} {
  const authClientMiddleware = createAuthClientMiddleware()
  const authorizationClientMiddleware = USE_GUARD ? createAuthorizationClientMiddleware() : (_args: unknown, next: () => Promise<unknown>) => next()
  if (_routes.length === 0) {
    const routes: RouteConfig[] = []
    for (const key of Object.keys(modules)) {
      const mod = modules[key] as ModuleExport
      if (mod?.routes?.length) routes.push(...mod.routes)
    }
    _routes = applyMiddlewareToRoutes(routes, [authClientMiddleware, authorizationClientMiddleware])
  }
  return {
    routes: _routes,
    middlewares: [authClientMiddleware, authorizationClientMiddleware]
  }
}
