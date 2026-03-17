import { useState } from "react"
import { useNavigate } from "react-router"
import { Factory, Eye, Pencil } from "lucide-react"
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

const plantTypeConfig: Record<string, { label: string; color: string }> = {
  plant: { label: "生产工厂", color: "bg-blue-500/10 text-blue-600" },
  warehouse: { label: "仓库", color: "bg-orange-500/10 text-orange-600" },
  dc: { label: "配送中心", color: "bg-purple-500/10 text-purple-600" },
}

const statusConfig = {
  active: { label: "运营中", color: "bg-emerald-500/10 text-emerald-700", dot: "bg-emerald-500" },
  inactive: { label: "停用", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
}

interface Plant {
  id: string
  plantCode: string
  plantName: string
  plantType: "plant" | "warehouse" | "dc"
  companyCode: string
  country: string
  city: string
  address: string
  contactPerson: string
  phone: string
  storageLocations: number
  status: "active" | "inactive"
  createdAt: string
}

const mockPlants: Plant[] = [
  { id: "1", plantCode: "1000", plantName: "北京总部工厂", plantType: "plant", companyCode: "CN01", country: "中国", city: "北京", address: "北京市海淀区中关村软件园", contactPerson: "张厂长", phone: "010-12345678", storageLocations: 5, status: "active", createdAt: "2020-01-01" },
  { id: "2", plantCode: "2000", plantName: "上海分厂", plantType: "plant", companyCode: "CN01", country: "中国", city: "上海", address: "上海市浦东新区张江高科技园区", contactPerson: "李厂长", phone: "021-87654321", storageLocations: 3, status: "active", createdAt: "2020-03-15" },
  { id: "3", plantCode: "WH01", plantName: "北京中央仓库", plantType: "warehouse", companyCode: "CN01", country: "中国", city: "北京", address: "北京市大兴区物流园区", contactPerson: "王主管", phone: "010-11112222", storageLocations: 8, status: "active", createdAt: "2020-06-01" },
  { id: "4", plantCode: "WH02", plantName: "华东仓库", plantType: "warehouse", companyCode: "CN01", country: "中国", city: "苏州", address: "苏州市工业园区物流港", contactPerson: "赵主管", phone: "0512-33334444", storageLocations: 6, status: "active", createdAt: "2021-01-10" },
  { id: "5", plantCode: "DC01", plantName: "华南配送中心", plantType: "dc", companyCode: "CN01", country: "中国", city: "深圳", address: "深圳市龙岗区物流基地", contactPerson: "孙经理", phone: "0755-55556666", storageLocations: 4, status: "active", createdAt: "2021-06-20" },
  { id: "6", plantCode: "3000", plantName: "成都分厂", plantType: "plant", companyCode: "CN01", country: "中国", city: "成都", address: "成都市高新区科技园", contactPerson: "周厂长", phone: "028-77778888", storageLocations: 2, status: "inactive", createdAt: "2022-02-28" },
]

export function ListPage() {
  const navigate = useNavigate()
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    plantType: "",
    city: "",
  })

  const columns: ListReportColumn<Plant>[] = [
    {
      id: "plantCode",
      header: "工厂/仓库编码",
      sortable: true,
      accessorKey: "plantCode",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/master-data/plants/${row.id}`)
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.plantCode}
        </button>
      ),
    },
    {
      id: "plantName",
      header: "名称",
      cell: (row) => {
        const typeConfig = plantTypeConfig[row.plantType]
        return (
          <div>
            <p className="text-sm font-medium">{row.plantName}</p>
            <span
              className={cn(
                "mt-0.5 inline-flex rounded px-1.5 py-0.5 text-xs font-medium",
                typeConfig.color
              )}
            >
              {typeConfig.label}
            </span>
          </div>
        )
      },
    },
    {
      id: "location",
      header: "位置",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.city}</p>
          <p className="max-w-[180px] truncate text-xs text-muted-foreground">
            {row.address}
          </p>
        </div>
      ),
    },
    {
      id: "contact",
      header: "负责人",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.contactPerson}</p>
          <p className="text-xs text-muted-foreground">{row.phone}</p>
        </div>
      ),
    },
    {
      id: "storageLocations",
      header: "存储位置",
      align: "center",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.storageLocations} 个
        </span>
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
      id: "actions",
      header: "操作",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/master-data/plants/${row.id}`)
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
              navigate(`/master-data/plants/${row.id}/edit`)
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
      <ListReport<Plant>
        header={{
          title: "工厂与仓库",
          subtitle: "OX10 - 管理和维护工厂、仓库、配送中心",
          tag: "Master Data",
          icon: <Factory className="h-5 w-5" />,
        }}
        data={mockPlants}
        columns={columns}
        totalCount={mockPlants.length}
        primaryAction={{
          id: "create",
          label: "创建工厂/仓库",
          onClick: () => navigate("/master-data/plants/create"),
        }}
        searchPlaceholder="搜索编码、名称..."
        showFilter={showFilter}
        onFilterToggle={() => setShowFilter(!showFilter)}
        filterCount={Object.values(filters).filter(Boolean).length}
        onFilterClear={() =>
          setFilters({ status: "", plantType: "", city: "" })
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
                  <SelectItem value="active">运营中</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">类型</Label>
              <Select
                value={filters.plantType || "__all__"}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    plantType: v === "__all__" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="plant">生产工厂</SelectItem>
                  <SelectItem value="warehouse">仓库</SelectItem>
                  <SelectItem value="dc">配送中心</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">城市</Label>
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
                  <SelectItem value="苏州">苏州</SelectItem>
                  <SelectItem value="成都">成都</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/master-data/plants/${row.id}`)}
      />
    </div>
  )
}

export default ListPage
