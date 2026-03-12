import { useMemo } from "react"
import type { RouteConfig } from "./index"
import { routes } from "./index"

export interface MenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  badge?: string | number
  useGuard?: boolean
  /** 菜单分区，从 route.group 读取，用于 menu-layout 分区展示与筛选 */
  group?: string
}

const DEFAULT_GROUP_ORDER = 999

/**
 * 从路由读取 group：优先 group，兼容旧字段 groupKey（如 master-data 映射为 business）
 */
function getMenuGroup(r: RouteConfig): string {
  const g = r.group
  return g ?? "other"
}

/** 遍历路由树填充 path → RouteConfig，path 为完整路径（如 "/goods-receipt/create"）。 */
function fillPathToRouteConfig(
  routeList: RouteConfig[],
  pathToRouteConfig: Map<string, RouteConfig>,
  prefix = ""
): void {
  for (const r of routeList) {
    const segment = r.path ?? ""
    const fullPath = segment ? (prefix ? `${prefix}/${segment}` : `/${segment}`) : prefix || "/"
    if (r.index) {
      pathToRouteConfig.set(prefix || "/", r)
    } else if (segment || fullPath === "/") {
      pathToRouteConfig.set(fullPath, r)
    }
    if (r.children?.length) {
      const nextPrefix = segment ? (prefix ? `${prefix}/${segment}` : `/${segment}`) : prefix
      fillPathToRouteConfig(r.children, pathToRouteConfig, nextPrefix)
    }
  }
}

export type RoutesToMenuResult = {
  menuItems: MenuItem[]
  pathToRouteConfig: Map<string, RouteConfig>
}

/**
 * 将路由配置转为菜单项，并生成 path→RouteConfig 映射（一次遍历出两个结果）。
 * - group 从 route.group 读取；分区顺序由 route.groupOrder 决定
 * - 同 groupName 的多个顶层路由合并为一个父菜单（如 MM-采购）
 * @param routes 聚合后的 RouteConfig[]
 * @param options.mainItem 首页项（path: "/", group: "main"）
 */
export function routesToMenu(
  routeList: RouteConfig[],
  options?: { mainItem?: MenuItem }
): RoutesToMenuResult {
  const pathToRouteConfig = new Map<string, RouteConfig>()
  fillPathToRouteConfig(routeList, pathToRouteConfig)

  const topLevel = routeList.filter((r) => r.path !== undefined && !r.index)
  const byGroupKey = new Map<string, RouteConfig[]>()
  for (const r of topLevel) {
    const menuGroup = getMenuGroup(r)
    const gn = r.groupName ?? r.path ?? ""
    const key = `${menuGroup}|${gn}`
    if (!byGroupKey.has(key)) byGroupKey.set(key, [])
    byGroupKey.get(key)!.push(r)
  }

  const menuItems: MenuItem[] = []
  if (options?.mainItem) menuItems.push(options.mainItem)

  /** 每个分区内：(itemOrder, menuItem)[]，分区内按 itemOrder 排序 */
  const groupToItems = new Map<string, { order: number; item: MenuItem }[]>()
  const groupOrderMin = new Map<string, number>()
  for (const [key, configs] of byGroupKey) {
    const [menuGroup, groupName] = key.split("|")
    const itemOrder = Math.min(
      ...configs.map((r) => r.groupOrder ?? DEFAULT_GROUP_ORDER)
    )
    if (!groupToItems.has(menuGroup)) {
      groupToItems.set(menuGroup, [])
      groupOrderMin.set(menuGroup, itemOrder)
    }
    groupOrderMin.set(
      menuGroup,
      Math.min(groupOrderMin.get(menuGroup)!, itemOrder)
    )

    if (configs.length > 1) {
      const sorted = [...configs].sort(
        (a, b) => (a.order ?? DEFAULT_GROUP_ORDER) - (b.order ?? DEFAULT_GROUP_ORDER)
      )
      const first = sorted[0]
      const parent: MenuItem = {
        id: slugify(groupName),
        label: groupName,
        icon: first.icon,
        group: menuGroup,
        children: sorted.map((r) => ({
          id: r.path!.replace(/\//g, "-"),
          label: r.label ?? r.path ?? "",
          path: "/" + r.path,
        })),
      }
      groupToItems.get(menuGroup)!.push({ order: itemOrder, item: parent })
    } else {
      const r = configs[0]
      if (r.children?.length) {
        const listChildren = r.children.filter(
          (c) => c.path && !c.path.includes(":")
        )
        const parent: MenuItem = {
          id: r.path ?? slugify(groupName),
          label: r.groupName ?? r.label ?? r.path ?? "",
          icon: r.icon,
          group: menuGroup,
          children: listChildren.map((c) => ({
            id: (c.path ?? "").replace(/\//g, "-"),
            label: c.label ?? c.path ?? "",
            path: "/" + (r.path ? r.path + "/" : "") + c.path,
          })),
        }
        groupToItems.get(menuGroup)!.push({ order: itemOrder, item: parent })
      } else {
        groupToItems.get(menuGroup)!.push({
          order: itemOrder,
          item: {
            id: (r.path ?? "").replace(/\//g, "-"),
            label: r.label ?? r.path ?? "",
            icon: r.icon,
            path: "/" + (r.path ?? ""),
            group: menuGroup,
          },
        })
      }
    }
  }

  const sortedGroupKeys = [...groupToItems.keys()].sort(
    (a, b) =>
      (groupOrderMin.get(a) ?? DEFAULT_GROUP_ORDER) -
      (groupOrderMin.get(b) ?? DEFAULT_GROUP_ORDER)
  )
  for (const g of sortedGroupKeys) {
    const entries = groupToItems.get(g) ?? []
    const items = entries
      .sort((a, b) => a.order - b.order)
      .map((e) => e.item)
    menuItems.push(...items)
  }

  return { menuItems, pathToRouteConfig }
}

export type UseMenuItemsOptions = { mainItem?: MenuItem }

/**
 * 根据当前路由配置生成菜单项与 path→RouteConfig 映射（声明式 hook）。
 * 若 options 含动态值（如 i18n），请用 useMemo 包住 options 以保持引用稳定。
 */
export function useMenuItems(options?: UseMenuItemsOptions): RoutesToMenuResult {
  return useMemo(() => routesToMenu(routes, options), [options])
}

function slugify(s: string): string {
  return s.replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]/g, "") || "item"
}
