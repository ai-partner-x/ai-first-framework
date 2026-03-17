"use client"

import { useState, useEffect, useMemo } from "react"
import { Link, useLocation, Outlet } from "react-router"
import { Home, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShellBar } from "@/components/admin-ui/layout/shell-bar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import { useMenuItems, type MenuItem } from "@/routes/menu"
import { useAuthorizationChecker } from "@scaffold/core"
import { USE_GUARD } from "@/app.config"

export interface MenuLayoutProps {
  onLayoutModeChange: (mode: "menu" | "tile") => void
}

const menuOptions = {
  mainItem: {
    id: "home",
    label: "首页",
    icon: <Home className="size-4 shrink-0" />,
    path: "/",
    group: "main",
  },
} as const

function AppSidebarContent() {
  const { menuItems } = useMenuItems(menuOptions)
  const can = USE_GUARD ? useAuthorizationChecker() : () => true
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const location = useLocation()

  const filteredMenuItems = useMemo(() => {
    const filterItem = (item: MenuItem): MenuItem | null => {
      if (item.useGuard === false) {
        return item
      }
      if (item.path && !can(item.path)) {
        return null
      }
      if (item.children?.length) {
        const nextChildren = item.children
          .map(filterItem)
          .filter(Boolean) as MenuItem[]
        if (nextChildren.length === 0 && !item.path) return null
        return { ...item, children: nextChildren }
      }
      return item
    }
    return menuItems
      .map(filterItem)
      .filter(Boolean) as MenuItem[]
  }, [menuItems, can])

  const isActive = (path?: string) => {
    if (!path) return false
    if (path === "/") return location.pathname === "/"
    return location.pathname === path || location.pathname.startsWith(path + "/")
  }

  const isParentActive = (item: MenuItem): boolean => {
    if (item.path && isActive(item.path)) return true
    if (item.children) return item.children.some((child: MenuItem) => isActive(child.path))
    return false
  }

  // 根据当前路由自动展开父级菜单
  useEffect(() => {
    const pathname = location.pathname
    const toExpand = filteredMenuItems
      .filter((item: MenuItem) => {
        if (!item.children?.length) return false
        if (item.path && (pathname === item.path || pathname.startsWith(item.path + "/"))) return true
        return item.children.some((c: MenuItem) => c.path && (pathname === c.path || pathname.startsWith(c.path + "/")))
      })
      .map((item: MenuItem) => item.id)
    if (toExpand.length === 0) return
    setExpandedItems((prev) => {
      const next = new Set([...prev, ...toExpand])
      return next.size === prev.length ? prev : [...next]
    })
  }, [location.pathname, filteredMenuItems])

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const active = isActive(item.path)
    const parentActive = isParentActive(item)

    if (item.path && !hasChildren) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
            <Link to={item.path}>
              {item.icon}
              <span className="truncate">{item.label}</span>
              {item.badge != null && (
                <span className="ml-auto rounded bg-sidebar-primary px-1.5 py-0.5 text-[10px] font-medium text-sidebar-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }

    return (
      <SidebarMenuItem key={item.id}>
        <Collapsible
          open={isExpanded}
          onOpenChange={(open) =>
            setExpandedItems((prev) =>
              open ? [...prev, item.id] : prev.filter((i) => i !== item.id)
            )
          }
          className="group/collapsible"
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton isActive={parentActive} tooltip={item.label}>
              {item.icon}
              <span className="truncate">{item.label}</span>
              <ChevronDown
                className={cn(
                  "ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children!.map((child: MenuItem) => (
                <SidebarMenuSubItem key={child.id}>
                  <SidebarMenuSubButton asChild isActive={isActive(child.path)}>
                    <Link to={child.path || "#"}>{child.label}</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    )
  }


  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>{filteredMenuItems.map((item: MenuItem) => renderMenuItem(item))}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}

function MenuLayoutContent({ onLayoutModeChange }: MenuLayoutProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="w-full min-h-screen bg-muted/30">
      <ShellBar
        layoutMode="menu"
        onLayoutModeChange={onLayoutModeChange}
        onMenuToggle={toggleSidebar}
      />
      <div className="flex">
        <Sidebar
          collapsible="icon"
          className="!top-14"
        >
          <SidebarHeader />
          <AppSidebarContent />
          <SidebarRail />
        </Sidebar>
        <main className="min-h-[calc(100vh-3.5rem)] overflow-x-hidden flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function MenuLayout(props: MenuLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <MenuLayoutContent {...props} />
    </SidebarProvider>
  )
}
