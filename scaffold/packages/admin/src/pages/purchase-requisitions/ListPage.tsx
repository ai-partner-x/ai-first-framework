import { useState } from "react"
import { useNavigate } from "react-router"
import { ShoppingCart, Eye, Pencil } from "lucide-react"
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
  pending: { label: "待审批", color: "bg-amber-500/10 text-amber-700", dot: "bg-amber-500" },
  approved: { label: "已批准", color: "bg-emerald-500/10 text-emerald-700", dot: "bg-emerald-500" },
  rejected: { label: "已拒绝", color: "bg-red-500/10 text-red-600", dot: "bg-red-500" },
  processing: { label: "处理中", color: "bg-primary/10 text-primary", dot: "bg-primary" },
}

interface PurchaseRequisition {
  id: string
  prNumber: string
  material: string
  materialCode: string
  quantity: number
  unit: string
  totalAmount: number
  status: string
  createdAt: string
  requester: string
  department: string
}

const mockData: PurchaseRequisition[] = [
  {
    id: "1",
    prNumber: "PR-2024-0156",
    material: 'MacBook Pro 14" M3',
    materialCode: "IT-001",
    quantity: 10,
    unit: "台",
    totalAmount: 189000,
    status: "pending",
    createdAt: "2024-01-15 14:30",
    requester: "张三",
    department: "研发部",
  },
  {
    id: "2",
    prNumber: "PR-2024-0155",
    material: "A4复印纸 80g",
    materialCode: "OF-023",
    quantity: 500,
    unit: "包",
    totalAmount: 12500,
    status: "approved",
    createdAt: "2024-01-14 09:15",
    requester: "李四",
    department: "行政部",
  },
  {
    id: "3",
    prNumber: "PR-2024-0154",
    material: "人体工学办公椅",
    materialCode: "FN-008",
    quantity: 20,
    unit: "把",
    totalAmount: 56000,
    status: "draft",
    createdAt: "2024-01-13 16:45",
    requester: "王五",
    department: "人力资源",
  },
  {
    id: "4",
    prNumber: "PR-2024-0153",
    material: 'Dell 27" 4K显示器',
    materialCode: "IT-015",
    quantity: 15,
    unit: "台",
    totalAmount: 52500,
    status: "rejected",
    createdAt: "2024-01-12 11:20",
    requester: "赵六",
    department: "设计部",
  },
  {
    id: "5",
    prNumber: "PR-2024-0152",
    material: "无线键鼠套装",
    materialCode: "IT-032",
    quantity: 30,
    unit: "套",
    totalAmount: 8970,
    status: "pending",
    createdAt: "2024-01-11 08:00",
    requester: "钱七",
    department: "运营部",
  },
]

export function ListPage() {
  const navigate = useNavigate()
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    requester: "",
    department: "",
  })

  const filterCount = Object.values(filters).filter((v) => v !== "").length
  const handleClearFilters = () => setFilters({ status: "", requester: "", department: "" })
  const formatAmount = (amount: number) => `¥${amount.toLocaleString()}`

  const columns: ListReportColumn<PurchaseRequisition>[] = [
    {
      id: "prNumber",
      header: "采购申请号",
      sortable: true,
      accessorKey: "prNumber",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/purchase-requisitions/${row.id}`)
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.prNumber}
        </button>
      ),
    },
    {
      id: "material",
      header: "物料信息",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.material}</p>
          <p className="text-xs text-muted-foreground">{row.materialCode}</p>
        </div>
      ),
    },
    {
      id: "quantity",
      header: "数量",
      align: "right",
      cell: (row) => (
        <div>
          <span className="text-sm">{row.quantity}</span>
          <span className="ml-1 text-xs text-muted-foreground">{row.unit}</span>
        </div>
      ),
    },
    {
      id: "totalAmount",
      header: "金额",
      align: "right",
      cell: (row) => (
        <span className="text-sm font-medium">{formatAmount(row.totalAmount)}</span>
      ),
    },
    {
      id: "status",
      header: "状态",
      align: "center",
      cell: (row) => {
        const status = statusConfig[row.status as keyof typeof statusConfig]
        return (
          <div className="flex justify-center">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                status?.color ?? "bg-muted text-muted-foreground"
              )}
            >
              <span className={cn("size-1.5 rounded-full", status?.dot ?? "bg-muted-foreground")} />
              {status?.label ?? row.status}
            </span>
          </div>
        )
      },
    },
    {
      id: "requester",
      header: "申请人",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.requester}</p>
          <p className="text-xs text-muted-foreground">{row.department}</p>
        </div>
      ),
    },
    {
      id: "createdAt",
      header: "创建时间",
      cell: (row) => <span className="text-sm text-muted-foreground">{row.createdAt}</span>,
    },
    {
      id: "actions",
      header: "操作",
      align: "center",
      cell: (row) => (
        <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/purchase-requisitions/${row.id}`)}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title="查看"
          >
            <Eye className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/purchase-requisitions/${row.id}/edit`)}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title="编辑"
          >
            <Pencil className="size-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="h-full">
      <ListReport<PurchaseRequisition>
        header={{
          title: "采购申请管理",
          subtitle: "F1643 - 管理和跟踪所有采购申请单据",
          tag: "List Report",
          icon: <ShoppingCart className="size-7" />,
        }}
        data={mockData}
        columns={columns}
        totalCount={156}
        primaryAction={{
          id: "create",
          label: "创建",
          onClick: () => navigate("/purchase-requisitions/create"),
        }}
        selectionActions={[
          { id: "view", label: "查看", icon: <Eye className="size-4" />, onClick: () => { } },
          { id: "edit", label: "编辑", icon: <Pencil className="size-4" />, onClick: () => { } },
        ]}
        searchPlaceholder="搜索采购申请号、物料、申请人..."
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
                onValueChange={(v) => setFilters({ ...filters, status: v === "__all__" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="pending">待审批</SelectItem>
                  <SelectItem value="approved">已批准</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                  <SelectItem value="processing">处理中</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">申请人</Label>
              <Input
                placeholder="输入申请人"
                value={filters.requester}
                onChange={(e) => setFilters({ ...filters, requester: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">部门</Label>
              <Select
                value={filters.department || "__all__"}
                onValueChange={(v) => setFilters({ ...filters, department: v === "__all__" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="全部部门" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部部门</SelectItem>
                  <SelectItem value="研发部">研发部</SelectItem>
                  <SelectItem value="行政部">行政部</SelectItem>
                  <SelectItem value="人力资源">人力资源</SelectItem>
                  <SelectItem value="设计部">设计部</SelectItem>
                  <SelectItem value="运营部">运营部</SelectItem>
                  <SelectItem value="市场部">市场部</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        getRowId={(row) => row.id}
      />
    </div>
  )
}
