/**
 * 收货管理（菜单：MM-采购 → 收货管理）
 * 方式一：路由组件使用 React.lazy 动态导入，实现按路由代码分割。
 */
import { createElement, lazy } from "react"
import { ShoppingCart } from "lucide-react"
import type { RouteConfig } from "../index"
import { withSuspense } from "../withSuspense"

const GoodsReceiptListPage = lazy(() => import("@/pages/goods-receipt/ListPage"))
const GoodsReceiptCreatePage = lazy(() => import("@/pages/goods-receipt/CreatePage"))
const GoodsReceiptEditPage = lazy(() => import("@/pages/goods-receipt/EditPage"))
const GoodsReceiptViewPage = lazy(() => import("@/pages/goods-receipt/ViewPage"))

export const routes: RouteConfig[] = [
  {
    path: "goods-receipt",
    label: "收货管理",
    icon: createElement(ShoppingCart, { className: "size-[18px]" }),
    group: "business",
    groupName: "MM-采购",
    groupOrder: 10,
    order: 3,
    children: [
      { index: true, element: withSuspense(GoodsReceiptListPage) },
      { path: "create", element: withSuspense(GoodsReceiptCreatePage) },
      { path: ":id/edit", element: withSuspense(GoodsReceiptEditPage) },
      { path: ":id", element: withSuspense(GoodsReceiptViewPage) },
    ],
  },
]
