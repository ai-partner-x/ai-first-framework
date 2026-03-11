"use client"

import * as React from "react"
import {
  Download,
  Filter,
  HelpCircle,
  LayoutList,
  Plus,
  RefreshCw,
  Search,
  Settings,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/admin-ui/data-table"
import type { DataTableColumn } from "@/components/admin-ui/data-table"

export interface ListReportHeaderConfig {
  title: string
  subtitle?: string
  tag?: string
  icon?: React.ReactNode
}

export interface ListReportToolbarAction {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}

/** 列定义：cell 接收行数据，返回单元格内容 */
export interface ListReportColumn<T> {
  id: string
  header: string
  align?: "left" | "center" | "right"
  cell: (row: T) => React.ReactNode
  /** 是否可排序，默认 true */
  sortable?: boolean
  /** 排序依据的字段，不传则用 id 从 row 上取值 */
  accessorKey?: keyof T
}

export interface ListReportProps<T> {
  header: ListReportHeaderConfig
  data: T[]
  columns: ListReportColumn<T>[]
  totalCount?: number
  loading?: boolean
  primaryAction?: ListReportToolbarAction
  selectionActions?: ListReportToolbarAction[]
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  showFilter?: boolean
  onFilterToggle?: () => void
  filterContent?: React.ReactNode
  filterCount?: number
  onFilterClear?: () => void
  onRefresh?: () => void
  onExport?: () => void
  onRowClick?: (row: T) => void
  onSelectionChange?: (rows: T[]) => void
  pageSize?: number
  pageIndex?: number
  onPaginationChange?: (page: number, pageSize: number) => void
  getRowId?: (row: T) => string
  className?: string
}

export function ListReport<T extends object>({
  header,
  data,
  columns,
  totalCount,
  loading = false,
  primaryAction,
  selectionActions = [],
  searchPlaceholder = "搜索...",
  onSearch,
  showFilter = false,
  onFilterToggle,
  filterContent,
  filterCount = 0,
  onFilterClear,
  onRefresh,
  onExport,
  onRowClick,
  onSelectionChange,
  pageSize = 10,
  pageIndex = 0,
  onPaginationChange,
  getRowId,
  className,
}: ListReportProps<T>) {
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const getId = (row: T) => (getRowId ? getRowId(row) : String((row as { id?: string }).id ?? ""))

  const displayCount = data.length
  const totalFilterCount = filterCount + (searchValue ? 1 : 0)

  const dataTableColumns: DataTableColumn<T>[] = React.useMemo(
    () =>
      columns.map((col) => ({
        id: col.id,
        header: col.header,
        cell: col.cell,
        align: col.align,
        sortable: col.sortable === true,
        accessorKey: col.accessorKey,
      })),
    [columns]
  )

  const handleSearch = (value: string) => {
    setSearchValue(value)
    onSearch?.(value)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleSelectionChange = React.useCallback(
    (rows: T[]) => {
      setSelectedIds(new Set(rows.map((r) => getId(r))))
      onSelectionChange?.(rows)
    },
    [onSelectionChange, getId]
  )


  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <div className="relative overflow-hidden bg-primary p-6 text-primary-foreground">
        <div className="absolute right-8 top-1/2 size-32 -translate-y-1/2 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              {header.icon ?? <Filter className="size-7" />}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-xl font-semibold">{header.title}</h1>
                {header.tag && (
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
                    {header.tag}
                  </span>
                )}
              </div>
              {header.subtitle && (
                <p className="text-sm text-primary-foreground/80">{header.subtitle}</p>
              )}
            </div>
          </div>
          {primaryAction && (
            <Button
              size="sm"
              className="gap-2 bg-white text-primary hover:bg-white/90"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.icon ?? <Plus className="size-4" />}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-3">
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 ? (
            <>
              <span className="text-sm font-medium text-primary">
                已选择 {selectedIds.size} 项
              </span>
              {selectionActions.length > 0 && (
                <>
                  <div className="h-5 w-px bg-border" />
                  {selectionActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">共 {displayCount} 项</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", isRefreshing && "animate-spin")}
            onClick={handleRefresh}
            title="刷新"
          >
            <RefreshCw className="size-4" />
          </Button>
          {onExport && (
            <Button variant="ghost" size="icon" className="size-8" onClick={onExport} title="导出">
              <Download className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="size-8" title="列设置">
            <LayoutList className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" title="设置">
            <Settings className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" title="帮助">
            <HelpCircle className="size-4" />
          </Button>
        </div>
      </div>

      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          {onFilterToggle && (
            <Button
              variant={showFilter || totalFilterCount > 0 ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={onFilterToggle}
            >
              <Filter className="size-4" />
              筛选
              {totalFilterCount > 0 && (
                <span className="flex size-[18px] items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                  {totalFilterCount}
                </span>
              )}
            </Button>
          )}
          {totalFilterCount > 0 && onFilterClear && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setSearchValue("")
                onFilterClear()
              }}
            >
              <X className="size-3.5" />
              清除筛选
            </Button>
          )}
          <Button size="sm">应用</Button>
        </div>
        {showFilter && filterContent && (
          <div className="mt-4 border-t border-border pt-4">{filterContent}</div>
        )}
      </div>

      <DataTable<T>
        data={data}
        columns={dataTableColumns}
        getRowId={getRowId ?? getId}
        enablePagination={totalCount !== undefined || data.length > (pageSize ?? 10)}
        pageSize={pageSize ?? 10}
        pageIndex={pageIndex}
        onPaginationChange={onPaginationChange}
        enableSelection={selectionActions.length > 0 || onSelectionChange != null}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        loading={loading}
        onRowClick={onRowClick}
        totalCount={totalCount}
      />
    </div>
  )
}
