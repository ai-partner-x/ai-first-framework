/**
 * 采购申请（菜单：MM-采购 → 采购申请）
 * 使用 React.lazy 路由懒加载。
 */
import { createElement, lazy } from "react"
import { ShoppingCart } from "lucide-react"
import type { RouteConfig } from "../index"
import { withSuspense } from "../withSuspense"
import { middleware } from "../auth"

const PurchaseRequisitionsListPage = lazy(() =>
  import("@/pages/purchase-requisitions").then((m) => ({ default: m.ListPage })),
)
const PurchaseRequisitionsCreatePage = lazy(() =>
  import("@/pages/purchase-requisitions").then((m) => ({ default: m.CreatePage })),
)
const PurchaseRequisitionsEditPage = lazy(() =>
  import("@/pages/purchase-requisitions").then((m) => ({ default: m.EditPage })),
)
const PurchaseRequisitionsViewPage = lazy(() =>
  import("@/pages/purchase-requisitions").then((m) => ({ default: m.ViewPage })),
)

export const routes: RouteConfig[] = [
  {
    path: "purchase-requisitions",
    label: "采购申请",
    icon: createElement(ShoppingCart, { className: "size-[18px]" }),
    group: "business",
    groupName: "MM-采购",
    groupOrder: 10,
    order: 1,
    middleware,
    children: [
      { index: true, element: withSuspense(PurchaseRequisitionsListPage) },
      { path: "create", element: withSuspense(PurchaseRequisitionsCreatePage) },
      { path: ":id/edit", element: withSuspense(PurchaseRequisitionsEditPage) },
      { path: ":id", element: withSuspense(PurchaseRequisitionsViewPage) },
    ],
  },
]