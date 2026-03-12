import { useState } from "react"
import { useNavigate } from "react-router"
import { Building2, Eye, Pencil } from "lucide-react"
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

const vendorTypeConfig: Record<string, string> = {
  supplier: "供货商",
  service: "服务商",
  contractor: "承包商",
  oneTime: "一次性供应商",
}

const statusConfig = {
  active: { label: "合作中", color: "bg-emerald-500/10 text-emerald-700", dot: "bg-emerald-500" },
  inactive: { label: "暂停", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  blocked: { label: "黑名单", color: "bg-red-500/10 text-red-600", dot: "bg-red-500" },
}

interface Vendor {
  id: string
  vendorCode: string
  vendorName: string
  vendorType: string
  country: string
  city: string
  contactPerson: string
  phone: string
  email: string
  status: "active" | "inactive" | "blocked"
  createdAt: string
}

const mockVendors: Vendor[] = [
  { id: "1", vendorCode: "VD-001", vendorName: "联想集团", vendorType: "supplier", country: "中国", city: "北京", contactPerson: "王经理", phone: "010-12345678", email: "wang@lenovo.com", status: "active", createdAt: "2023-01-15" },
  { id: "2", vendorCode: "VD-002", vendorName: "戴尔科技", vendorType: "supplier", country: "中国", city: "上海", contactPerson: "李总", phone: "021-87654321", email: "li@dell.com", status: "active", createdAt: "2023-02-20" },
  { id: "3", vendorCode: "VD-003", vendorName: "华为技术", vendorType: "supplier", country: "中国", city: "深圳", contactPerson: "张工", phone: "0755-11112222", email: "zhang@huawei.com", status: "active", createdAt: "2023-03-10" },
  { id: "4", vendorCode: "VD-004", vendorName: "京东物流", vendorType: "service", country: "中国", city: "北京", contactPerson: "赵经理", phone: "010-33334444", email: "zhao@jd.com", status: "active", createdAt: "2023-04-05" },
  { id: "5", vendorCode: "VD-005", vendorName: "顺丰速运", vendorType: "service", country: "中国", city: "深圳", contactPerson: "孙总", phone: "0755-55556666", email: "sun@sf.com", status: "inactive", createdAt: "2023-05-12" },
  { id: "6", vendorCode: "VD-006", vendorName: "办公易", vendorType: "supplier", country: "中国", city: "广州", contactPerson: "周经理", phone: "020-77778888", email: "zhou@office.com", status: "blocked", createdAt: "2023-06-18" },
]

export function ListPage() {
  const navigate = useNavigate()
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    vendorType: "",
    city: "",
  })

  const columns: ListReportColumn<Vendor>[] = [
    {
      id: "vendorCode",
      header: "供应商编码",
      sortable: true,
      accessorKey: "vendorCode",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/master-data/vendors/${row.id}`)
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.vendorCode}
        </button>
      ),
    },
    {
      id: "vendorName",
      header: "供应商名称",
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.vendorName}</p>
          <p className="text-xs text-muted-foreground">
            {vendorTypeConfig[row.vendorType]}
          </p>
        </div>
      ),
    },
    {
      id: "location",
      header: "所在地",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.country} · {row.city}
        </span>
      ),
    },
    {
      id: "contact",
      header: "联系人",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.contactPerson}</p>
          <p className="text-xs text-muted-foreground">{row.phone}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "状态",
      align: "center",
      cell: (row) => {
        const status = statusConfig[row.status]
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
      id: "createdAt",
      header: "创建时间",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.createdAt}</span>
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
              navigate(`/master-data/vendors/${row.id}`)
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
              navigate(`/master-data/vendors/${row.id}/edit`)
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
      <ListReport<Vendor>
        header={{
          title: "供应商主数据",
          subtitle: "XK03 - 管理和维护供应商信息",
          tag: "Master Data",
          icon: <Building2 className="h-5 w-5" />,
        }}
        data={mockVendors}
        columns={columns}
        totalCount={mockVendors.length}
        primaryAction={{
          id: "create",
          label: "创建供应商",
          onClick: () => navigate("/master-data/vendors/create"),
        }}
        searchPlaceholder="搜索供应商编码、名称..."
        showFilter={showFilter}
        onFilterToggle={() => setShowFilter(!showFilter)}
        filterCount={Object.values(filters).filter(Boolean).length}
        onFilterClear={() =>
          setFilters({ status: "", vendorType: "", city: "" })
        }
        filterContent={
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">状态</Label>
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
                  <SelectItem value="active">合作中</SelectItem>
                  <SelectItem value="inactive">暂停</SelectItem>
                  <SelectItem value="blocked">黑名单</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">供应商类型</Label>
              <Select
                value={filters.vendorType || "__all__"}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    vendorType: v === "__all__" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="supplier">供货商</SelectItem>
                  <SelectItem value="service">服务商</SelectItem>
                  <SelectItem value="contractor">承包商</SelectItem>
                  <SelectItem value="oneTime">一次性供应商</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">所在城市</Label>
              <Select
                value={filters.city || "__all__"}
                onValueChange={(v) =>
                  setFilters({ ...filters, city: v === "__all__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="北京">北京</SelectItem>
                  <SelectItem value="上海">上海</SelectItem>
                  <SelectItem value="深圳">深圳</SelectItem>
                  <SelectItem value="广州">广州</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/master-data/vendors/${row.id}`)}
      />
    </div>
  )
}

export default ListPage
