/**
 * 系统设置（与菜单「系统设置」一致）
 */
import { createElement } from "react"
import { Settings } from "lucide-react"
import type { RouteConfig } from "../index"
import { SettingsPage } from "@/pages/settings-page"

export const routes: RouteConfig[] = [
  {
    path: "settings",
    label: "系统设置",
    icon: createElement(Settings, { className: "size-[18px]" }),
    group: "system",
    groupName: "系统设置",
    groupOrder: 30,
    element: createElement(SettingsPage),
  },
]
