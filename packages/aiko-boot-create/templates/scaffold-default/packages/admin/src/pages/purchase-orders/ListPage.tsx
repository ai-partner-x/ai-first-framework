import { useState } from "react"
import { useNavigate } from "react-router"
import { FileText, Eye, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { ListReport, type ListReportColumn } from "@/components/admin-ui/list-report"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statusConfig = {
  draft: { label: "草稿", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  confirmed: { label: "已确认", color: "bg-blue-500/10 text-blue-600", dot: "bg-blue-500" },
  sent: { label: "已发送", color: "bg-amber-500/10 text-amber-700", dot: "bg-amber-500" },
  received: { label: "已收货", color: "bg-emerald-500/10 text-emerald-700", dot: "bg-emerald-500" },
  invoiced: { label: "已开票", color: "bg-purple-500/10 text-purple-600", dot: "bg-purple-500" },
  completed: { label: "已完成", color: "bg-green-500/10 text-green-700", dot: "bg-green-600" },
  cancelled: { label: "已取消", color: "bg-red-500/10 text-red-600", dot: "bg-red-500" },
}

interface PurchaseOrder {
  id: string
  poNumber: string
  supplier: string
  supplierCode: string
  material: string
  quantity: number
  unit: string
  totalAmount: number
  status: string
  createdAt: string
  buyer: string
  prRef: string
}

const mockData: PurchaseOrder[] = [
  { id: "1", poNumber: "PO-2024-0089", supplier: "Apple 授权经销商", supplierCode: "VD-001", material: 'MacBook Pro 14" M3', quantity: 10, unit: "台", totalAmount: 189000, status: "sent", createdAt: "2024-01-20 10:30", buyer: "张三", prRef: "PR-2024-0156" },
  { id: "2", poNumber: "PO-2024-0088", supplier: "办公用品供应商", supplierCode: "VD-015", material: "A4复印纸 80g", quantity: 500, unit: "包", totalAmount: 12500, status: "received", createdAt: "2024-01-19 14:15", buyer: "李四", prRef: "PR-2024-0155" },
  { id: "3", poNumber: "PO-2024-0087", supplier: "家具制造商", supplierCode: "VD-023", material: "人体工学办公椅", quantity: 20, unit: "把", totalAmount: 56000, status: "confirmed", createdAt: "2024-01-18 09:20", buyer: "王五", prRef: "PR-2024-0154" },
  { id: "4", poNumber: "PO-2024-0086", supplier: "Dell 官方商城", supplierCode: "VD-008", material: 'Dell 27" 4K显示器', quantity: 15, unit: "台", totalAmount: 52500, status: "invoiced", createdAt: "2024-01-17 16:45", buyer: "赵六", prRef: "PR-2024-0153" },
  { id: "5", poNumber: "PO-2024-0085", supplier: "IT配件供应商", supplierCode: "VD-031", material: "无线键鼠套装", quantity: 30, unit: "套", totalAmount: 8970, status: "completed", createdAt: "2024-01-16 11:00", buyer: "钱七", prRef: "PR-2024-0152" },
  { id: "6", poNumber: "PO-2024-0084", supplier: "投影设备商", supplierCode: "VD-042", material: "投影仪", quantity: 2, unit: "台", totalAmount: 15800, status: "draft", createdAt: "2024-01-15 08:30", buyer: "孙八", prRef: "PR-2024-0151" },
]

export function ListPage() {
  const navigate = useNavigate()
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    buyer: "",
    dateFrom: "",
    dateTo: "",
  })

  const filterCount = Object.values(filters).filter((v) => v !== "").length
  const handleClearFilters = () =>
    setFilters({ status: "", buyer: "", dateFrom: "", dateTo: "" })
  const formatAmount = (amount: number) => `¥${amount.toLocaleString()}`

  const columns: ListReportColumn<PurchaseOrder>[] = [
    {
      id: "poNumber",
      header: "采购订单号",
      sortable: true,
      accessorKey: "poNumber",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/purchase-orders/${row.id}`)
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.poNumber}
        </button>
      ),
    },
    {
      id: "supplier",
      header: "供应商",
      sortable: false,
      cell: (row) => (
        <div>
          <p className="text-sm">{row.supplier}</p>
          <p className="text-xs text-muted-foreground">{row.supplierCode}</p>
        </div>
      ),
    },
    {
      id: "material",
      header: "物料信息",
      sortable: false,
      cell: (row) => (
        <div>
          <p className="text-sm">{row.material}</p>
          <p className="text-xs text-muted-foreground">参考: {row.prRef}</p>
        </div>
      ),
    },
    {
      id: "quantity",
      header: "数量",
      sortable: false,
      align: "right",
      cell: (row) => (
        <div>
          <span className="text-sm">{row.quantity}</span>
          <span className="text-xs text-muted-foreground ml-1">{row.unit}</span>
        </div>
      ),
    },
    {
      id: "totalAmount",
      header: "金额",
      sortable: false,
      align: "right",
      cell: (row) => (
        <span className="text-sm font-medium">{formatAmount(row.totalAmount)}</span>
      ),
    },
    {
      id: "status",
      header: "状态",
      sortable: false,
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
    { id: "buyer", header: "采购员", sortable: false, cell: (row) => row.buyer },
    {
      id: "createdAt",
      header: "创建时间",
      sortable: false,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.createdAt}</span>
      ),
    },
    {
      id: "actions",
      header: "操作",
      sortable: false,
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/purchase-orders/${row.id}`)
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
              navigate(`/purchase-orders/${row.id}/edit`)
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
      <ListReport<PurchaseOrder>
        header={{
          title: "采购订单管理",
          subtitle: "ME21N - 管理和跟踪所有采购订单",
          tag: "List Report",
          icon: <FileText className="h-5 w-5" />,
        }}
        data={mockData}
        columns={columns}
        totalCount={89}
        primaryAction={{
          id: "create",
          label: "创建",
          onClick: () => navigate("/purchase-orders/create"),
        }}
        selectionActions={[
          { id: "view", label: "查看", icon: <Eye className="h-4 w-4" />, onClick: () => { } },
          { id: "edit", label: "编辑", icon: <Pencil className="h-4 w-4" />, onClick: () => { } },
        ]}
        searchPlaceholder="搜索采购订单号、供应商、物料..."
        showFilter={showFilter}
        onFilterToggle={() => setShowFilter(!showFilter)}
        filterCount={filterCount}
        onFilterClear={handleClearFilters}
        filterContent={
          <div className="grid grid-cols-4 gap-4">
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
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="confirmed">已确认</SelectItem>
                  <SelectItem value="sent">已发送</SelectItem>
                  <SelectItem value="received">已收货</SelectItem>
                  <SelectItem value="invoiced">已开票</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">采购员</Label>
              <Select
                value={filters.buyer || "__all__"}
                onValueChange={(v) =>
                  setFilters({ ...filters, buyer: v === "__all__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="张三">张三</SelectItem>
                  <SelectItem value="李四">李四</SelectItem>
                  <SelectItem value="王五">王五</SelectItem>
                  <SelectItem value="赵六">赵六</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">开始日期</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">结束日期</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
              />
            </div>
          </div>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/purchase-orders/${row.id}`)}
      />
    </div>
  )
}

export default ListPage
