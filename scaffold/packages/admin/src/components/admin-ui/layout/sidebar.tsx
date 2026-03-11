"use client"

import React from "react"
import { Link, useLocation } from "react-router"
import {
  SidebarRail as ShadcnSidebarRail,
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarHeader as ShadcnSidebarHeader,
  useSidebar as useShadcnSidebar,
  SidebarTrigger as ShadcnSidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppConfig } from "@/providers/app-config"
import { useTranslation } from "react-i18next"

export type SidebarMenuItem = {
  key: string
  labelKey: string
  route: string
  icon?: React.ReactNode
}

const defaultMenuItems: SidebarMenuItem[] = [
  {
    key: "dashboard",
    labelKey: "sidebar.menu.dashboard",
    route: "/",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
]

export function Sidebar() {
  const { open } = useShadcnSidebar()
  const location = useLocation()
  const pathname = location.pathname
  const { t } = useTranslation()

  return (
    <ShadcnSidebar collapsible="icon" className={cn("border-none")}>
      <ShadcnSidebarRail />
      <SidebarHeader />
      <ShadcnSidebarContent
        className={cn(
          "transition-discrete",
          "duration-200",
          "flex",
          "flex-col",
          "gap-2",
          "pt-2",
          "pb-2",
          "border-r",
          "border-border",
          {
            "px-3": open,
            "px-1": !open,
          }
        )}
      >
        {defaultMenuItems.map((item) => (
          <SidebarItemLink
            key={item.key}
            item={item}
            label={t(item.labelKey)}
            isSelected={pathname === item.route || (item.route === "/" && pathname === "/")}
          />
        ))}
      </ShadcnSidebarContent>
    </ShadcnSidebar>
  )
}

type SidebarItemLinkProps = {
  item: SidebarMenuItem
  label: string
  isSelected: boolean
}

function SidebarItemLink({ item, label, isSelected }: SidebarItemLinkProps) {
  const icon = item.icon ?? <LayoutDashboard className="h-4 w-4" />

  return (
    <Button
      asChild
      variant="ghost"
      size="lg"
      className={cn(
        "flex w-full items-center justify-start gap-2 py-2 !px-3 text-sm",
        {
          "bg-sidebar-primary": isSelected,
          "hover:!bg-sidebar-primary/90": isSelected,
          "text-sidebar-primary-foreground": isSelected,
          "hover:text-sidebar-primary-foreground": isSelected,
        }
      )}
    >
      <Link to={item.route} className={cn("flex w-full items-center gap-2")}>
        <div
          className={cn("w-4", {
            "text-muted-foreground": !isSelected,
            "text-sidebar-primary-foreground": isSelected,
          })}
        >
          {icon}
        </div>
        <span
          className={cn(
            "tracking-[-0.00875rem]",
            "flex-1",
            "text-left",
            "line-clamp-1",
            "truncate",
            {
              "font-normal": !isSelected,
              "font-semibold": isSelected,
              "text-sidebar-primary-foreground": isSelected,
              "text-foreground": !isSelected,
            }
          )}
        >
          {label}
        </span>
      </Link>
    </Button>
  )
}

function SidebarHeader() {
  const { title } = useAppConfig()
  const { open, isMobile } = useShadcnSidebar()

  return (
    <ShadcnSidebarHeader
      className={cn(
        "p-0",
        "h-16",
        "border-b",
        "border-border",
        "flex-row",
        "items-center",
        "justify-between",
        "overflow-hidden"
      )}
    >
      <div
        className={cn(
          "whitespace-nowrap",
          "flex",
          "flex-row",
          "h-full",
          "items-center",
          "justify-start",
          "gap-2",
          "transition-discrete",
          "duration-200",
          {
            "pl-3": !open,
            "pl-5": open,
          }
        )}
      >
        <div>{title.icon}</div>
        <h2
          className={cn(
            "text-sm",
            "font-bold",
            "transition-opacity",
            "duration-200",
            {
              "opacity-0": !open,
              "opacity-100": open,
            }
          )}
        >
          {title.text}
        </h2>
      </div>

      <ShadcnSidebarTrigger
        className={cn("text-muted-foreground", "mr-1.5", {
          "opacity-0": !open,
          "opacity-100": open || isMobile,
          "pointer-events-auto": open || isMobile,
          "pointer-events-none": !open && !isMobile,
        })}
      />
    </ShadcnSidebarHeader>
  )
}

Sidebar.displayName = "Sidebar"
