"use client"

import { Link, useNavigate } from "react-router"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  List,
  PanelLeft,
  Bell,
  HelpCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ArrowLeft,
  Search,
} from "lucide-react"
import { appAuth, type AuthUser } from "@scaffold/core"
import { useEffect, useState } from "react"
import { LOGIN_URL } from "@/app.config"

export interface ShellBarProps {
  title?: string
  logo?: React.ReactNode
  userName?: string
  notificationCount?: number
  layoutMode: "menu" | "tile"
  onLayoutModeChange: (mode: "menu" | "tile") => void
  onMenuToggle?: () => void
  onLogout?: () => void
  showBackButton?: boolean
  onBack?: () => void
}

function useAuthIdentity() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadIdentity = async () => {
      try {
        const identity = await appAuth.getIdentity()
        if (!cancelled) setUser(identity ?? null)
      } catch {
        if (!cancelled) setUser(null)
      }
    }

    void loadIdentity()

    return () => {
      cancelled = true
    }
  }, [])

  return user
}

export function ShellBar({
  title = "AI-First",
  logo,
  notificationCount = 3,
  layoutMode,
  onLayoutModeChange,
  onMenuToggle,
  showBackButton = false,
  onBack,
}: ShellBarProps) {
  const navigate = useNavigate()
  const user = useAuthIdentity()
  const handleLogout = async () => {
    const result = await appAuth.logout()
    if (result?.success) navigate(LOGIN_URL, { replace: true })
  }

  return (
    <header className="flex h-14 bg-white dark:bg-background items-center justify-between border-b border-border bg-background px-4 shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {layoutMode === "menu" && onMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={onMenuToggle}
            title="切换侧边栏"
          >
            <PanelLeft className="size-4" />
          </Button>
        )}
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={onBack}
            title="返回门户"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <Link to="/" className="flex items-center gap-3 group">
          {logo || (
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-lg">
              A
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold leading-tight">
              {title}
            </span>
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
              Enterprise Platform
            </span>
          </div>
        </Link>
      </div>

      <div className="mx-8 hidden flex-1 max-w-md md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索应用、功能..."
            className="h-10 pl-11"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="mr-2 flex items-center rounded-xl bg-muted p-1">
          <Button
            variant={layoutMode === "tile" ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "size-8 rounded-lg",
              layoutMode === "tile" && "bg-background text-primary shadow-sm"
            )}
            onClick={() => onLayoutModeChange("tile")}
            title="磁贴视图"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={layoutMode === "menu" ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "size-8 rounded-lg",
              layoutMode === "menu" && "bg-background text-primary shadow-sm"
            )}
            onClick={() => onLayoutModeChange("menu")}
            title="菜单视图"
          >
            <List className="size-4" />
          </Button>
        </div>

        <div className="mx-2 h-6 w-px bg-border" />

        {notificationCount > 0 && (
          <Button variant="ghost" size="icon" className="relative size-9 rounded-lg" title="通知">
            <Bell className="size-4" />
            <span className="absolute text-white -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 rounded-xl pl-2 pr-3 py-1.5"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="size-4" />
              </div>
              <span className="hidden text-sm font-medium sm:block">
                {user?.account}
              </span>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2">
            <div className="border-border bg-muted/50 mb-2 rounded-xl px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="size-10" />
                </div>
                <div>
                  <p className="font-semibold">{user?.account}</p>
                  {user?.email ? (
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  ) : null}
                </div>
              </div>
            </div>
            <DropdownMenuItem>
              <User className="size-4" />
              个人资料
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" />
              账户设置
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="size-4" />
              帮助中心
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

ShellBar.displayName = "ShellBar"
