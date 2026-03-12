import { useState } from "react"
import { useNavigate } from "react-router"
import { Truck, Eye, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { ListReport, type ListReportColumn } from "@/components/admin-ui/list-report"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statusConfig = {
  planned: { label: "计划中", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  inbound: { label: "运输中", color: "bg-blue-500/10 text-blue-600", dot: "bg-blue-500" },
  arrived: { label: "已到达", color: "bg-amber-500/10 text-amber-700", dot: "bg-amber-500" },
  inspecting: { label: "检验中", color: "bg-purple-500/10 text-purple-600", dot: "bg-purple-500" },
  received: { label: "已入库", color: "bg-green-500/10 text-green-700", dot: "bg-green-600" },
  partial: { label: "部分收货", color: "bg-orange-500/10 text-orange-600", dot: "bg-orange-500" },
  rejected: { label: "已退回", color: "bg-red-500/10 text-red-600", dot: "bg-red-500" },
}

interface GoodsReceipt {
  id: string
  grNumber: string
  poRef: string
  supplier: string
  material: string
  orderedQty: number
  receivedQty: number
  unit: string
  status: string
  plant: string
  storageLocation: string
  receivedAt: string
  receiver: string
}

const mockData: GoodsReceipt[] = [
  { id: "1", grNumber: "GR-2024-0056", poRef: "PO-2024-0089", supplier: "Apple 授权经销商", material: 'MacBook Pro 14" M3', orderedQty: 10, receivedQty: 10, unit: "台", status: "received", plant: "1000", storageLocation: "WH01", receivedAt: "2024-01-25 14:30", receiver: "王五" },
  { id: "2", grNumber: "GR-2024-0055", poRef: "PO-2024-0088", supplier: "办公用品供应商", material: "A4复印纸 80g", orderedQty: 500, receivedQty: 500, unit: "包", status: "inspecting", plant: "1000", storageLocation: "WH02", receivedAt: "2024-01-24 10:00", receiver: "赵六" },
  { id: "3", grNumber: "GR-2024-0054", poRef: "PO-2024-0087", supplier: "家具制造商", material: "人体工学办公椅", orderedQty: 20, receivedQty: 15, unit: "把", status: "partial", plant: "1000", storageLocation: "WH01", receivedAt: "2024-01-23 16:20", receiver: "钱七" },
  { id: "4", grNumber: "GR-2024-0053", poRef: "PO-2024-0086", supplier: "Dell 官方商城", material: 'Dell 27" 4K显示器', orderedQty: 15, receivedQty: 0, unit: "台", status: "inbound", plant: "1000", storageLocation: "WH01", receivedAt: "-", receiver: "-" },
  { id: "5", grNumber: "GR-2024-0052", poRef: "PO-2024-0085", supplier: "IT配件供应商", material: "无线键鼠套装", orderedQty: 30, receivedQty: 30, unit: "套", status: "received", plant: "1000", storageLocation: "WH02", receivedAt: "2024-01-22 09:15", receiver: "孙八" },
  { id: "6", grNumber: "GR-2024-0051", poRef: "PO-2024-0084", supplier: "投影设备商", material: "投影仪", orderedQty: 2, receivedQty: 0, unit: "台", status: "planned", plant: "1000", storageLocation: "WH01", receivedAt: "-", receiver: "-" },
]

function ListPage() {
  const navigate = useNavigate()
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    plant: "",
    storageLocation: "",
  })

  const filterCount = Object.values(filters).filter((v) => v !== "").length
  const handleClearFilters = () =>
    setFilters({ status: "", plant: "", storageLocation: "" })

  const columns: ListReportColumn<GoodsReceipt>[] = [
    {
      id: "grNumber",
      header: "收货单号",
      sortable: true,
      accessorKey: "grNumber",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/goods-receipt/${row.id}`)
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.grNumber}
        </button>
      ),
    },
    {
      id: "poRef",
      header: "采购订单",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.poRef}</span>
      ),
    },
    {
      id: "supplier",
      header: "供应商",
      cell: (row) => (
        <span className="text-sm">{row.supplier}</span>
      ),
    },
    {
      id: "material",
      header: "物料",
      cell: (row) => (
        <span className="text-sm">{row.material}</span>
      ),
    },
    {
      id: "quantity",
      header: "数量 (订单/已收)",
      align: "right",
      cell: (row) => (
        <div>
          <span className="text-sm">{row.receivedQty}</span>
          <span className="mx-1 text-xs text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">{row.orderedQty}</span>
          <span className="ml-1 text-xs text-muted-foreground">{row.unit}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "状态",
      align: "center",
      cell: (row) => {
        const status = statusConfig[row.status as keyof typeof statusConfig]
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              status.color
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
        )
      },
    },
    {
      id: "location",
      header: "存储位置",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.plant}</p>
          <p className="text-xs text-muted-foreground">{row.storageLocation}</p>
        </div>
      ),
    },
    {
      id: "receivedAt",
      header: "收货时间",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.receivedAt}</span>
      ),
    },
    {
      id: "actions",
      header: "操作",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/goods-receipt/${row.id}`)
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
            title="查看"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/goods-receipt/${row.id}/edit`)
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
            title="编辑"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="">
      <ListReport<GoodsReceipt>
        header={{
          title: "收货管理",
          subtitle: "F1645 - 管理和跟踪所有采购订单的收货",
          tag: "List Report",
          icon: <Truck className="h-5 w-5" />,
        }}
        data={mockData}
        columns={columns}
        totalCount={56}
        primaryAction={{
          id: "create",
          label: "收货",
          onClick: () => navigate("/goods-receipt/create"),
        }}
        selectionActions={[
          { id: "view", label: "查看", icon: <Eye className="h-4 w-4" />, onClick: () => { } },
        ]}
        searchPlaceholder="搜索收货单号、采购订单、供应商..."
        showFilter={showFilter}
        onFilterToggle={() => setShowFilter(!showFilter)}
        filterCount={filterCount}
        onFilterClear={handleClearFilters}
        filterContent={
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">状态</Label>
              <Select
                value={filters.status || "__all__"}
                onValueChange={(v) =>
                  setFilters({ ...filters, status: v === "__all__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="planned">计划中</SelectItem>
                  <SelectItem value="inbound">运输中</SelectItem>
                  <SelectItem value="arrived">已到达</SelectItem>
                  <SelectItem value="inspecting">检验中</SelectItem>
                  <SelectItem value="received">已入库</SelectItem>
                  <SelectItem value="partial">部分收货</SelectItem>
                  <SelectItem value="rejected">已退回</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">工厂</Label>
              <Select
                value={filters.plant || "__all__"}
                onValueChange={(v) =>
                  setFilters({ ...filters, plant: v === "__all__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="1000">1000 - 总部</SelectItem>
                  <SelectItem value="2000">2000 - 华东分部</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">存储位置</Label>
              <Select
                value={filters.storageLocation || "__all__"}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    storageLocation: v === "__all__" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="WH01">WH01 - 主仓库</SelectItem>
                  <SelectItem value="WH02">WH02 - 备用仓库</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/goods-receipt/${row.id}`)}
      />
    </div>
  )
}

export default ListPage
