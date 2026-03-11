"use client"

import { useState, useMemo } from "react"
import { useNavigate, Outlet, useLocation } from "react-router"
import {
  Home,
  ShoppingCart,
  FileText,
  Package,
  Truck,
  Database,
  Settings,
  BarChart3,
  Star,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ShellBar } from "@/components/admin-ui/layout/shell-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface AppTile {
  id: string
  title: string
  subtitle?: string
  description?: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  path: string
  category: string
  badge?: { label: string; type: "new" | "attention" }
}

const appTiles: AppTile[] = [
  {
    id: "pr-create",
    title: "创建采购申请",
    subtitle: "发起新的采购需求",
    description: "创建标准采购申请，支持物料和服务采购",
    icon: <FileText className="size-6" />,
    iconBg: "hsl(var(--primary))",
    iconColor: "hsl(var(--primary-foreground))",
    path: "/purchase-requisition-/create",
    category: "MM-采购",
    // badge: { label: "新", type: "new" },
  },
  {
    id: "pr-list",
    title: "管理采购申请",
    subtitle: "F1643 - 采购申请管理",
    description: "查看、编辑和管理所有采购申请",
    icon: <ShoppingCart className="size-6" />,
    iconBg: "hsl(var(--primary))",
    iconColor: "hsl(var(--primary-foreground))",
    path: "/purchase-requisitions",
    category: "MM-采购",
    // badge: { label: "核心", type: "attention" },
  },
  {
    id: "po-list",
    title: "采购订单",
    subtitle: "ME21N - 采购订单管理",
    description: "查看和管理采购订单",
    icon: <Package className="size-6" />,
    iconBg: "hsl(var(--chart-2))",
    iconColor: "hsl(var(--primary-foreground))",
    path: "/purchase-orders",
    category: "MM-采购",
  },
  {
    id: "gr-list",
    title: "收货管理",
    subtitle: "MIGO - 货物移动",
    description: "处理货物接收和库存移动",
    icon: <Truck className="size-6" />,
    iconBg: "hsl(var(--chart-3))",
    iconColor: "hsl(var(--primary-foreground))",
    path: "/goods-receipt",
    category: "MM-采购",
  },
  {
    id: "materials",
    title: "物料主数据",
    subtitle: "F2018 - 物料管理",
    description: "管理物料基本信息",
    icon: <Database className="size-6" />,
    iconBg: "hsl(var(--chart-4))",
    iconColor: "hsl(var(--primary-foreground))",
    path: "/master-data/materials",
    category: "主数据",
  },
  {
    id: "vendors",
    title: "供应商管理",
    subtitle: "F0002 - 供应商",
    description: "管理供应商信息",
    icon: <Database className="size-6" />,
    iconBg: "hsl(var(--chart-5))",
    iconColor: "hsl(var(--primary-foreground))",
    path: "/master-data/vendors",
    category: "主数据",
  },
  {
    id: "reports",
    title: "报表分析",
    subtitle: "数据分析和报表",
    description: "查看各类业务报表",
    icon: <BarChart3 className="size-6" />,
    iconBg: "hsl(var(--chart-1))",
    iconColor: "hsl(var(--primary-foreground))",
    path: "/reports/purchase-requisitions",
    category: "报表分析",
  },
  {
    id: "settings",
    title: "系统设置",
    subtitle: "配置和管理",
    description: "系统配置和用户管理",
    icon: <Settings className="size-6" />,
    iconBg: "hsl(var(--muted))",
    iconColor: "hsl(var(--muted-foreground))",
    path: "/settings",
    category: "系统管理",
  },
]

const categoryConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  "MM-采购": {
    icon: <ShoppingCart className="size-5" />,
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary) / 0.15)",
  },
  主数据: {
    icon: <Database className="size-5" />,
    color: "hsl(var(--chart-5))",
    bg: "hsl(var(--chart-5) / 0.15)",
  },
  报表分析: {
    icon: <BarChart3 className="size-5" />,
    color: "hsl(var(--chart-1))",
    bg: "hsl(var(--chart-1) / 0.15)",
  },
  系统管理: {
    icon: <Settings className="size-5" />,
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--muted))",
  },
}

export interface TileLayoutProps {
  onLayoutModeChange: (mode: "menu" | "tile") => void
}

export function TileLayout({ onLayoutModeChange }: TileLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [favorites, setFavorites] = useState<string[]>(["pr-create", "pr-list"])
  const [searchQuery,] = useState("")
  const [activeTab, setActiveTab] = useState<"favorites" | "recent" | "all">("all")

  const isHome = location.pathname === "/"

  const tilesByCategory = useMemo(() => {
    const filtered = searchQuery
      ? appTiles.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : appTiles
    const categories = new Map<string, AppTile[]>()
    filtered.forEach((tile) => {
      const cat = tile.category
      if (!categories.has(cat)) categories.set(cat, [])
      categories.get(cat)!.push(tile)
    })
    return Array.from(categories.entries())
  }, [searchQuery])

  const favoriteApps = appTiles.filter((t) => favorites.includes(t.id))

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const renderTile = (tile: AppTile) => (
    <Card
      key={tile.id}
      className="relative flex cursor-pointer flex-col rounded-xl p-4 transition-shadow hover:shadow-md"
      onClick={() => navigate(tile.path)}
    >
      <div
        className="absolute right-0 top-0 size-20 rounded-tr-xl opacity-60"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${tile.iconBg} 50%)`,
        }}
      />
      {tile.badge && (
        <span
          className={cn(
            "absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium",
            tile.badge.type === "new"
              ? "bg-primary text-primary-foreground"
              : "bg-amber-500 text-white"
          )}
        >
          {tile.badge.label}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-8"
        onClick={(e: React.MouseEvent) => toggleFavorite(e, tile.id)}
      >
        <Star
          className="size-4"
          fill={favorites.includes(tile.id) ? "currentColor" : "none"}
        />
      </Button>
      <div
        className="mb-4 flex size-12 items-center justify-center rounded-lg"
        style={{ backgroundColor: tile.iconBg, color: tile.iconColor }}
      >
        {tile.icon}
      </div>
      <h3 className="mb-1 pr-6 text-sm font-semibold">{tile.title}</h3>
      <p className="mb-2 text-xs text-muted-foreground">{tile.subtitle}</p>
      {tile.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground/80">
          {tile.description}
        </p>
      )}
    </Card>
  )

  if (!isHome) {
    return (
      <div className="min-h-screen bg-background">
        <ShellBar
          layoutMode="tile"
          onLayoutModeChange={onLayoutModeChange}
          showBackButton
          onBack={() => navigate("/")}
        />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ShellBar layoutMode="tile" onLayoutModeChange={onLayoutModeChange} />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground">
          <div className="absolute right-12 top-1/2 size-48 -translate-y-1/2 rounded-full bg-white/10" />
          <div className="relative z-10">
            <h1 className="mb-2 text-2xl font-semibold">欢迎使用 AI-First 门户</h1>
            <p className="mb-4 text-base text-primary-foreground/85">
              企业级应用统一入口 - 现代化、智能化、标准化
            </p>
            <div className="flex gap-3">
              <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm backdrop-blur">
                {favoriteApps.length} 个收藏
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm backdrop-blur">
                {appTiles.length} 个应用
              </span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
          <TabsList className="w-full justify-start rounded-xl border-b bg-transparent p-0">
            <TabsTrigger value="favorites" className="gap-2 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Star className="size-4" />
              收藏夹
              <span className="rounded bg-amber-500 px-1.5 py-0.5 text-xs text-white">
                {favoriteApps.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Clock className="size-4" />
              最近使用
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Home className="size-4" />
              所有应用
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "favorites" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteApps.length > 0 ? (
              favoriteApps.map((tile) => renderTile(tile))
            ) : (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                <Star className="mx-auto mb-4 size-12 text-muted-foreground/50" />
                <p>您还没有收藏任何应用</p>
                <p className="mt-1 text-sm">点击磁贴上的星标图标添加收藏</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "recent" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {appTiles.slice(0, 6).map((tile) => renderTile(tile))}
          </div>
        )}

        {activeTab === "all" && (
          <div className="space-y-8">
            {tilesByCategory.map(([category, tiles]) => {
              const config = categoryConfig[category]
              return (
                <div key={category}>
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex size-10 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: config?.bg ?? "hsl(var(--muted))",
                        color: config?.color ?? "hsl(var(--muted-foreground))",
                      }}
                    >
                      {config?.icon ?? <Home className="size-5" />}
                    </div>
                    <div>
                      <h2 className="font-semibold">{category}</h2>
                      <p className="text-sm text-muted-foreground">{tiles.length} 个应用</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tiles.map((tile) => renderTile(tile))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
