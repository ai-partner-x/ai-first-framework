"use client"

import { useState, type ReactNode } from "react"
import { Search, Plus, FileText, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface MasterDetailItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  status?: { label: string; color: "green" | "yellow" | "red" | "gray" | "blue" }
  badge?: string | number
  icon?: ReactNode
}

export type EditMode = "view" | "edit" | "create"

export interface MasterDetailProps<T extends MasterDetailItem> {
  title: string
  subtitle?: string
  headerIcon?: ReactNode
  items: T[]
  selectedId?: string
  onSelect?: (item: T) => void
  renderDetail: (item: T, actionButtons?: ReactNode) => ReactNode
  renderForm?: (item: T | null, mode: EditMode) => ReactNode
  renderEmpty?: () => ReactNode
  searchPlaceholder?: string
  onSearch?: (keyword: string) => void
  showCreate?: boolean
  createLabel?: string
  allowEdit?: boolean
  allowDelete?: boolean
  onSave?: (item: T | null, mode: EditMode) => void
  onDelete?: (item: T) => void
  masterWidth?: number
}

const statusColors: Record<string, { bg: string; text: string }> = {
  green: { bg: "bg-emerald-500", text: "text-emerald-600" },
  yellow: { bg: "bg-amber-500", text: "text-amber-600" },
  red: { bg: "bg-red-500", text: "text-red-600" },
  gray: { bg: "bg-gray-400", text: "text-gray-600" },
  blue: { bg: "bg-blue-500", text: "text-blue-600" },
}

export const MasterDetailIcons = {
  search: <Search className="size-4" />,
  plus: <Plus className="size-4" />,
  empty: <FileText className="size-12 text-muted-foreground" />,
  edit: <Pencil className="size-4" />,
  delete: <Trash2 className="size-4" />,
}

function MasterListItem<T extends MasterDetailItem>({
  item,
  isSelected,
  onClick,
  disabled,
}: {
  item: T
  isSelected: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => !disabled && (e.key === "Enter" || e.key === " ") && onClick()}
      className={cn(
        "relative px-4 py-3 transition-colors",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        isSelected
          ? "border-l-4 border-l-primary bg-primary/10"
          : "border-l-4 border-l-transparent hover:bg-muted/50"
      )}
    >
      <div className="flex items-start gap-3">
        {item.icon && (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {item.icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={cn("truncate text-sm font-medium", isSelected ? "text-primary" : "")}>
              {item.title}
            </h3>
            {item.badge != null && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {item.badge}
              </span>
            )}
          </div>
          {item.subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>
          )}
          {item.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">{item.description}</p>
          )}
        </div>
        {item.status && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className={cn("size-2 rounded-full", statusColors[item.status.color]?.bg ?? "bg-muted")} />
            <span className={cn("text-xs", statusColors[item.status.color]?.text ?? "text-muted-foreground")}>
              {item.status.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function MasterDetail<T extends MasterDetailItem>({
  title,
  subtitle,
  headerIcon,
  items,
  selectedId,
  onSelect,
  renderDetail,
  renderForm,
  renderEmpty,
  searchPlaceholder = "搜索...",
  onSearch,
  showCreate = true,
  createLabel = "新建",
  allowEdit = true,
  allowDelete = true,
  onSave,
  onDelete,
  masterWidth = 360,
}: MasterDetailProps<T>) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(
    selectedId ?? items[0]?.id
  )
  const [editMode, setEditMode] = useState<EditMode>("view")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const currentSelectedId = selectedId ?? internalSelectedId
  const selectedItem = items.find((item) => item.id === currentSelectedId)
  const isEditing = editMode !== "view"

  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    onSearch?.(value)
  }

  const handleSelect = (item: T) => {
    if (isEditing) return
    setInternalSelectedId(item.id)
    onSelect?.(item)
  }

  const handleCreate = () => setEditMode("create")
  const handleEdit = () => setEditMode("edit")
  const handleCancel = () => setEditMode("view")
  const handleSave = () => {
    onSave?.(editMode === "create" ? null : selectedItem ?? null, editMode)
    setEditMode("view")
  }

  const handleDeleteClick = () => setShowDeleteConfirm(true)
  const handleDeleteConfirm = () => {
    if (selectedItem) onDelete?.(selectedItem)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-lg bg-muted/30 shadow-sm">
      <div className="bg-primary px-6 py-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {headerIcon && (
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                {headerIcon}
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-primary-foreground/80">{subtitle}</p>}
            </div>
          </div>
          {showCreate && !isEditing && (
            <Button
              size="sm"
              className="gap-2 bg-white text-primary hover:bg-white/90"
              onClick={handleCreate}
            >
              {MasterDetailIcons.plus}
              {createLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            "flex flex-col border-r border-border bg-card transition-opacity",
            isEditing && "pointer-events-none opacity-60"
          )}
          style={{ width: masterWidth, minWidth: masterWidth }}
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchKeyword}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 bg-muted/50 pl-9"
                disabled={isEditing}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.length > 0 ? (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <MasterListItem
                    key={item.id}
                    item={item}
                    isSelected={item.id === currentSelectedId && editMode !== "create"}
                    onClick={() => handleSelect(item)}
                    disabled={isEditing}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                {MasterDetailIcons.empty}
                <p className="mt-3 text-sm">暂无数据</p>
              </div>
            )}
          </div>
          <div className="border-t h-12 border-border bg-muted/30 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">共 {items.length} 项</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-muted/30">
          <div className="flex-1 overflow-y-auto">
            {editMode === "create" && renderForm ? (
              <div className="p-4">{renderForm(null, "create")}</div>
            ) : editMode === "edit" && selectedItem && renderForm ? (
              <div className="p-4">{renderForm(selectedItem, "edit")}</div>
            ) : selectedItem ? (
              <div className="p-4">
                {renderDetail(
                  selectedItem,
                  (allowEdit || allowDelete) ? (
                    <div className="flex items-center gap-2">
                      {allowEdit && renderForm && (
                        <Button size="sm" variant="secondary" className="gap-1.5" onClick={handleEdit}>
                          {MasterDetailIcons.edit}
                          编辑
                        </Button>
                      )}
                      {allowDelete && onDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={handleDeleteClick}
                          title="删除"
                        >
                          {MasterDetailIcons.delete}
                        </Button>
                      )}
                    </div>
                  ) : undefined
                )}
              </div>
            ) : renderEmpty ? (
              renderEmpty()
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                {MasterDetailIcons.empty}
                <p className="mt-3 text-sm">请选择一项查看详情</p>
              </div>
            )}
          </div>
          {isEditing && (
            <div className="flex h-12 shrink-0 items-center justify-end gap-3 border-t border-border bg-card px-6 py-3">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                取消
              </Button>
              <Button size="sm" onClick={handleSave}>
                保存
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 <span className="font-medium">{selectedItem?.title}</span> 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export interface DetailSectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}>
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export interface DetailFieldProps {
  label: string
  value: ReactNode
  className?: string
}

export function DetailField({ label, value, className }: DetailFieldProps) {
  return (
    <div className={className}>
      <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value ?? "-"}</dd>
    </div>
  )
}

export function DetailFieldGrid({
  children,
  columns = 3,
  className,
}: {
  children: ReactNode
  columns?: 2 | 3 | 4
  className?: string
}) {
  const gridCols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }
  return <dl className={cn("grid gap-x-6 gap-y-4", gridCols[columns], className)}>{children}</dl>
}
