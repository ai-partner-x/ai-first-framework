import { useState } from "react"
import { useNavigate } from "react-router"
import { Package, Eye, Pencil } from "lucide-react"
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

const materialTypeConfig: Record<string, string> = {
  ROH: "原材料",
  HALB: "半成品",
  FERT: "成品",
  HIBE: "辅助材料",
  NLAG: "非库存物料",
}

const statusConfig = {
  active: { label: "启用", color: "bg-emerald-500/10 text-emerald-700", dot: "bg-emerald-500" },
  inactive: { label: "停用", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  blocked: { label: "冻结", color: "bg-red-500/10 text-red-600", dot: "bg-red-500" },
}

interface Material {
  id: string
  materialCode: string
  materialName: string
  materialType: string
  materialGroup: string
  baseUnit: string
  description: string
  status: "active" | "inactive" | "blocked"
  createdAt: string
  updatedAt: string
}

const mockMaterials: Material[] = [
  { id: "1", materialCode: "IT-001", materialName: 'MacBook Pro 14" M3', materialType: "FERT", materialGroup: "IT设备", baseUnit: "台", description: "Apple MacBook Pro 14英寸 M3芯片", status: "active", createdAt: "2024-01-01", updatedAt: "2024-01-15" },
  { id: "2", materialCode: "IT-002", materialName: "Dell XPS 15", materialType: "FERT", materialGroup: "IT设备", baseUnit: "台", description: "Dell XPS 15英寸笔记本", status: "active", createdAt: "2024-01-02", updatedAt: "2024-01-16" },
  { id: "3", materialCode: "OF-001", materialName: "A4打印纸", materialType: "HIBE", materialGroup: "办公用品", baseUnit: "包", description: "70g A4打印纸 500张/包", status: "active", createdAt: "2024-01-03", updatedAt: "2024-01-17" },
  { id: "4", materialCode: "OF-002", materialName: "中性笔", materialType: "HIBE", materialGroup: "办公用品", baseUnit: "支", description: "0.5mm黑色中性笔", status: "active", createdAt: "2024-01-04", updatedAt: "2024-01-18" },
  { id: "5", materialCode: "IT-003", materialName: "显示器支架", materialType: "NLAG", materialGroup: "IT配件", baseUnit: "个", description: "铝合金显示器支架", status: "inactive", createdAt: "2024-01-05", updatedAt: "2024-01-19" },
  { id: "6", materialCode: "ROH-001", materialName: "铝合金板材", materialType: "ROH", materialGroup: "原材料", baseUnit: "KG", description: "6061铝合金板材", status: "active", createdAt: "2024-01-06", updatedAt: "2024-01-20" },
  { id: "7", materialCode: "HALB-001", materialName: "主板组件", materialType: "HALB", materialGroup: "半成品", baseUnit: "块", description: "电脑主板半成品组件", status: "blocked", createdAt: "2024-01-07", updatedAt: "2024-01-21" },
]

export function ListPage() {
  const navigate = useNavigate()
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    materialType: "",
    materialGroup: "",
  })

  const columns: ListReportColumn<Material>[] = [
    {
      id: "materialCode",
      header: "物料编码",
      sortable: true,
      accessorKey: "materialCode",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/master-data/materials/${row.id}`)
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.materialCode}
        </button>
      ),
    },
    {
      id: "materialName",
      header: "物料名称",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.materialName}</p>
          <p className="max-w-[200px] truncate text-xs text-muted-foreground">
            {row.description}
          </p>
        </div>
      ),
    },
    {
      id: "materialType",
      header: "物料类型",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {materialTypeConfig[row.materialType] || row.materialType}
        </span>
      ),
    },
    { id: "materialGroup", header: "物料组", cell: (row) => row.materialGroup },
    {
      id: "baseUnit",
      header: "基本单位",
      align: "center",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.baseUnit}</span>
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
      id: "updatedAt",
      header: "更新时间",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.updatedAt}</span>
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
              navigate(`/master-data/materials/${row.id}`)
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
              navigate(`/master-data/materials/${row.id}/edit`)
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
      <ListReport<Material>
        header={{
          title: "物料主数据",
          subtitle: "MM03 - 管理和维护物料基础信息",
          tag: "Master Data",
          icon: <Package className="h-5 w-5" />,
        }}
        data={mockMaterials}
        columns={columns}
        totalCount={mockMaterials.length}
        primaryAction={{
          id: "create",
          label: "创建物料",
          onClick: () => navigate("/master-data/materials/create"),
        }}
        searchPlaceholder="搜索物料编码、名称..."
        showFilter={showFilter}
        onFilterToggle={() => setShowFilter(!showFilter)}
        filterCount={Object.values(filters).filter(Boolean).length}
        onFilterClear={() =>
          setFilters({ status: "", materialType: "", materialGroup: "" })
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
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                  <SelectItem value="blocked">冻结</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">物料类型</Label>
              <Select
                value={filters.materialType || "__all__"}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    materialType: v === "__all__" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="ROH">原材料</SelectItem>
                  <SelectItem value="HALB">半成品</SelectItem>
                  <SelectItem value="FERT">成品</SelectItem>
                  <SelectItem value="HIBE">辅助材料</SelectItem>
                  <SelectItem value="NLAG">非库存物料</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">物料组</Label>
              <Select
                value={filters.materialGroup || "__all__"}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    materialGroup: v === "__all__" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  <SelectItem value="IT设备">IT设备</SelectItem>
                  <SelectItem value="办公用品">办公用品</SelectItem>
                  <SelectItem value="IT配件">IT配件</SelectItem>
                  <SelectItem value="原材料">原材料</SelectItem>
                  <SelectItem value="半成品">半成品</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/master-data/materials/${row.id}`)}
      />
    </div>
  )
}

export default ListPage
