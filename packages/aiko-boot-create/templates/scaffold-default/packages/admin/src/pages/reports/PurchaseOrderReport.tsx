import { useState } from "react"
import { cn } from "@/lib/utils"
import { ShoppingCart, Filter, RefreshCw, Download, TrendingUp, TrendingDown } from "lucide-react"
import { ListReport, type ListReportColumn } from "@/components/admin-ui/list-report"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const kpiData = {
  totalCount: 89,
  totalCountChange: 15.2,
  totalAmount: 4580000,
  totalAmountChange: 22.5,
  deliveredCount: 65,
  deliveryRate: 73.0,
  avgLeadTime: 5.8,
  avgLeadTimeChange: -8.5,
}

const detailList = [
  { id: "1", poNumber: "PO-2024-0089", vendor: "联想集团", amount: 189000, itemCount: 10, status: "delivered", deliveryDate: "2024-01-20", createdAt: "2024-01-10" },
  { id: "2", poNumber: "PO-2024-0088", vendor: "戴尔科技", amount: 258000, itemCount: 5, status: "shipped", deliveryDate: "2024-01-25", createdAt: "2024-01-09" },
  { id: "3", poNumber: "PO-2024-0087", vendor: "惠普中国", amount: 68000, itemCount: 20, status: "confirmed", deliveryDate: "2024-01-28", createdAt: "2024-01-08" },
  { id: "4", poNumber: "PO-2024-0086", vendor: "华为终端", amount: 125000, itemCount: 8, status: "delivered", deliveryDate: "2024-01-18", createdAt: "2024-01-05" },
  { id: "5", poNumber: "PO-2024-0085", vendor: "小米科技", amount: 42000, itemCount: 15, status: "cancelled", deliveryDate: "-", createdAt: "2024-01-03" },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-muted text-muted-foreground" },
  pending: { label: "待确认", color: "bg-amber-500/10 text-amber-700" },
  confirmed: { label: "已确认", color: "bg-blue-500/10 text-blue-600" },
  shipped: { label: "已发货", color: "bg-cyan-500/10 text-cyan-700" },
  delivered: { label: "已交货", color: "bg-emerald-500/10 text-emerald-700" },
  cancelled: { label: "已取消", color: "bg-red-500/10 text-red-600" },
}

type DetailRow = (typeof detailList)[number]

export function PurchaseOrderReport() {
  const [timeRange, setTimeRange] = useState("month")
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    vendor: "",
    category: "",
    amountRange: "",
  })

  const formatAmount = (amount: number) =>
    amount >= 10000 ? `¥${(amount / 10000).toFixed(1)}万` : `¥${amount.toLocaleString()}`

  const filterCount = Object.values(filters).filter((v) => v !== "").length
  const handleClearFilters = () =>
    setFilters({ status: "", vendor: "", category: "", amountRange: "" })

  const columns: ListReportColumn<DetailRow>[] = [
    {
      id: "poNumber",
      header: "订单编号",
      sortable: true,
      accessorKey: "poNumber",
      cell: (row) => (
        <span className="text-sm font-medium text-primary">{row.poNumber}</span>
      ),
    },
    {
      id: "vendor",
      header: "供应商",
      cell: (row) => (
        <span className="text-sm">{row.vendor}</span>
      ),
    },
    {
      id: "amount",
      header: "金额",
      align: "right",
      cell: (row) => (
        <span className="text-sm font-medium">¥{row.amount.toLocaleString()}</span>
      ),
    },
    {
      id: "itemCount",
      header: "行项目",
      align: "center",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.itemCount}</span>
      ),
    },
    {
      id: "status",
      header: "状态",
      align: "center",
      cell: (row) => {
        const status = statusConfig[row.status] ?? { label: row.status, color: "bg-muted text-muted-foreground" }
        return (
          <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", status.color)}>
            {status.label}
          </span>
        )
      },
    },
    {
      id: "deliveryDate",
      header: "交货日期",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.deliveryDate}</span>
      ),
    },
    {
      id: "createdAt",
      header: "创建日期",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.createdAt}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="bg-primary p-6 text-white relative overflow-hidden">
          <div className="absolute right-8 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/10" />
          <div className="relative z-10 flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-xl font-semibold">采购订单分析报表</h1>
              <p className="text-sm text-white/70">Analytical List Page - 采购订单执行与供应商分析</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="quarter">本季度</SelectItem>
                <SelectItem value="year">本年度</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showFilter ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilter(!showFilter)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              筛选
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              导出
            </Button>
          </div>
        </div>

        {showFilter && (
          <div className="border-b bg-muted/30 px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">状态</Label>
                <Select
                  value={filters.status || "__all__"}
                  onValueChange={(v) => setFilters({ ...filters, status: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全部</SelectItem>
                    <SelectItem value="confirmed">已确认</SelectItem>
                    <SelectItem value="shipped">已发货</SelectItem>
                    <SelectItem value="delivered">已交货</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">供应商</Label>
                <Select
                  value={filters.vendor || "__all__"}
                  onValueChange={(v) => setFilters({ ...filters, vendor: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全部</SelectItem>
                    <SelectItem value="lenovo">联想集团</SelectItem>
                    <SelectItem value="dell">戴尔科技</SelectItem>
                    <SelectItem value="hp">惠普中国</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">物料类别</Label>
                <Select
                  value={filters.category || "__all__"}
                  onValueChange={(v) => setFilters({ ...filters, category: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全部</SelectItem>
                    <SelectItem value="it">IT设备</SelectItem>
                    <SelectItem value="office">办公用品</SelectItem>
                    <SelectItem value="material">原材料</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">金额范围</Label>
                <Select
                  value={filters.amountRange || "__all__"}
                  onValueChange={(v) => setFilters({ ...filters, amountRange: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全部</SelectItem>
                    <SelectItem value="0-50000">5万以下</SelectItem>
                    <SelectItem value="50000-100000">5-10万</SelectItem>
                    <SelectItem value="100000+">10万以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="mb-2 text-sm text-muted-foreground">订单总数</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold">{kpiData.totalCount}</p>
            <div className={cn("flex items-center gap-1 text-sm font-medium", kpiData.totalCountChange >= 0 ? "text-emerald-600" : "text-red-600")}>
              {kpiData.totalCountChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(kpiData.totalCountChange)}%</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">较上期</p>
        </Card>
        <Card className="p-5">
          <p className="mb-2 text-sm text-muted-foreground">采购总金额</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-teal-600">{formatAmount(kpiData.totalAmount)}</p>
            <div className={cn("flex items-center gap-1 text-sm font-medium", kpiData.totalAmountChange >= 0 ? "text-emerald-600" : "text-red-600")}>
              {kpiData.totalAmountChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(kpiData.totalAmountChange)}%</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">较上期</p>
        </Card>
        <Card className="p-5">
          <p className="mb-2 text-sm text-muted-foreground">交货完成率</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-emerald-600">
              {kpiData.deliveryRate}
              <span className="text-lg font-normal text-muted-foreground">%</span>
            </p>
            <span className="text-sm text-muted-foreground">{kpiData.deliveredCount}/{kpiData.totalCount}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${kpiData.deliveryRate}%` }} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="mb-2 text-sm text-muted-foreground">平均交货周期</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold">
              {kpiData.avgLeadTime}
              <span className="text-lg font-normal text-muted-foreground">天</span>
            </p>
            <div className={cn("flex items-center gap-1 text-sm font-medium", kpiData.avgLeadTimeChange >= 0 ? "text-red-600" : "text-emerald-600")}>
              {kpiData.avgLeadTimeChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(kpiData.avgLeadTimeChange)}%</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">较上期</p>
        </Card>
      </div>

      {/* 明细列表 */}
      <ListReport<DetailRow>
        header={{
          title: "采购订单明细",
          subtitle: "共 " + detailList.length + " 条",
          icon: <ShoppingCart className="h-5 w-5" />,
        }}
        data={detailList}
        columns={columns}
        totalCount={detailList.length}
        getRowId={(row) => row.id}
      />
    </div>
  )
}

export default PurchaseOrderReport
