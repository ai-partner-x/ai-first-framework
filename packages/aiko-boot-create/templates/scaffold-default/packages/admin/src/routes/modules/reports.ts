/**
 * 报表分析（与菜单「报表分析」一致）
 * - 采购申请报表、采购订单报表
 * 使用 React.lazy 路由懒加载。
 */
import { createElement, lazy } from "react"
import { BarChart3 } from "lucide-react"
import type { RouteConfig } from "../index"
import { withSuspense } from "../withSuspense"

const PurchaseRequisitionReport = lazy(() => import("@/pages/reports/PurchaseRequisitionReport"))
const PurchaseOrderReport = lazy(() => import("@/pages/reports/PurchaseOrderReport"))

export const routes: RouteConfig[] = [
  {
    path: "reports/purchase-requisitions",
    label: "采购申请报表",
    icon: createElement(BarChart3, { className: "size-[18px]" }),
    group: "analytics",
    groupName: "报表分析",
    groupOrder: 20,
    element: withSuspense(PurchaseRequisitionReport),
  },
  {
    path: "reports/purchase-orders",
    label: "采购订单报表",
    icon: createElement(BarChart3, { className: "size-[18px]" }),
    group: "analytics",
    groupName: "报表分析",
    groupOrder: 20,
    element: withSuspense(PurchaseOrderReport),
  },
]
