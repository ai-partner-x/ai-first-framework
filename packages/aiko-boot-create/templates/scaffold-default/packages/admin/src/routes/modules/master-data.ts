/**
 * 主数据（与菜单「主数据」一致）
 * - 物料、供应商、工厂/仓库、币种、计量单位、采购组织、成本中心
 */
import { createElement, lazy } from "react"
import type { RouteConfig } from "../index"
import { Database } from "lucide-react"
import { withSuspense } from "../withSuspense"

const MaterialsListPage = lazy(() => import("@/pages/master-data/materials/ListPage"))
const MaterialsViewPage = lazy(() => import("@/pages/master-data/materials/ViewPage"))
const VendorsListPage = lazy(() => import("@/pages/master-data/vendors/ListPage"))
const VendorsViewPage = lazy(() => import("@/pages/master-data/vendors/ViewPage"))
const PlantsListPage = lazy(() => import("@/pages/master-data/plants/ListPage"))
const PlantsViewPage = lazy(() => import("@/pages/master-data/plants/ViewPage"))
const CurrenciesPage = lazy(() => import("@/pages/master-data/currencies"))
const UnitsOfMeasurePage = lazy(() => import("@/pages/master-data/units-of-measure"))
const PurchaseOrganizationsPage = lazy(() => import("@/pages/master-data/purchase-organizations"))
const CostCentersPage = lazy(() => import("@/pages/master-data/cost-centers"))

export const routes: RouteConfig[] = [
  {
    path: "master-data",
    group: "business",
    groupName: "主数据",
    groupOrder: 10,
    icon: createElement(Database, { className: "size-[18px]" }),
    children: [
      { path: "materials", label: "物料主数据", element: withSuspense(MaterialsListPage) },
      { path: "materials/:id", element: withSuspense(MaterialsViewPage) },
      { path: "vendors", label: "供应商", element: withSuspense(VendorsListPage) },
      { path: "vendors/:id", element: withSuspense(VendorsViewPage) },
      { path: "plants", label: "工厂/仓库", element: withSuspense(PlantsListPage) },
      { path: "plants/:id", element: withSuspense(PlantsViewPage) },
      { path: "currencies", label: "币种", element: withSuspense(CurrenciesPage) },
      { path: "units-of-measure", label: "计量单位", element: withSuspense(UnitsOfMeasurePage) },
      { path: "purchase-organizations", label: "采购组织", element: withSuspense(PurchaseOrganizationsPage) },
      { path: "cost-centers", label: "成本中心", element: withSuspense(CostCentersPage) },
    ],
  },
]
