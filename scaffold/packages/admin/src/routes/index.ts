import { ReactNode } from "react"
import { RouteObject } from "react-router"

type ModuleExport = {
  routes?: RouteConfig[]
}

/**
 * 路由配置，支持树状结构：子路由定义在 children 中；与菜单对齐可配 icon / label / group。
 * - path 为相对父级路径；index 为 true 时 path 可省略
 * - 有 children 时，父级可不写 element，渲染时用 <Outlet /> 占位
 * - group 从路由读取，用于菜单分区；groupOrder 指定该分区在菜单中的顺序（越小越靠前）
 */
export type RouteConfig = Omit<RouteObject, "children"> & {
  label?: string
  icon?: ReactNode
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


function getModulesContext(): RouteConfig[] {
  const routes: RouteConfig[] = []
  for (const key of Object.keys(modules)) {
    const mod = modules[key] as ModuleExport
    if (mod?.routes?.length) routes.push(...mod.routes)
  }
  return routes
}

export const routes = getModulesContext()
