/**
 * 采购订单（菜单：MM-采购 → 采购订单）
 * 使用 React.lazy 路由懒加载。
 */
import { createElement, lazy } from "react"
import { ShoppingCart } from "lucide-react"
import type { RouteConfig } from "../index"
import { withSuspense } from "../withSuspense"
import { middleware } from "../auth"

const PurchaseOrdersListPage = lazy(() => import("@/pages/purchase-orders/ListPage"))
const PurchaseOrdersViewPage = lazy(() => import("@/pages/purchase-orders/ViewPage"))

export const routes: RouteConfig[] = [
  {
    path: "purchase-orders",
    label: "采购订单",
    icon: createElement(ShoppingCart, { className: "size-[18px]" }),
    group: "business",
    groupName: "MM-采购",
    groupOrder: 11,
    order: 2,
    middleware,
    children: [
      { index: true, element: withSuspense(PurchaseOrdersListPage) },
      { path: ":id", element: withSuspense(PurchaseOrdersViewPage) },
    ],
  },
]
