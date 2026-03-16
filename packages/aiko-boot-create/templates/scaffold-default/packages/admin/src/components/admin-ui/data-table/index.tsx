"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/admin-ui/data-table/data-table-pagination";
import { DataTableSorter } from "@/components/admin-ui/data-table/data-table-sorter";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  /** 是否可排序，默认 true */
  sortable?: boolean;
  /** 排序依据的字段，不传则用 id 从 row 上取值 */
  accessorKey?: keyof T;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId?: (row: T) => string;
  /** 是否显示分页，默认 true */
  enablePagination?: boolean;
  pageSize?: number;
  pageIndex?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  /** 是否显示选择列 */
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (rows: T[]) => void;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  totalCount?: number;
  className?: string;
}

function defaultGetRowId<T>(row: T): string {
  return String((row as { id?: string }).id ?? "");
}

export function DataTable<T extends object>({
  data,
  columns,
  getRowId = defaultGetRowId,
  enablePagination = true,
  pageSize: initialPageSize = 10,
  pageIndex: controlledPageIndex,
  onPaginationChange,
  enableSelection = false,
  selectedIds = new Set(),
  onSelectionChange,
  loading = false,
  onRowClick,
  totalCount,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: controlledPageIndex ?? 0,
    pageSize: initialPageSize,
  });

  const columnDefs = React.useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = [];
    if (enableSelection) {
      cols.push({
        id: "select",
        size: 40,
        accessorFn: () => undefined,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="全选"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="选择行"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
      });
    }
    columns.forEach((col) => {
      const key = col.accessorKey ?? (col.id as keyof T);
      const keyStr = String(key);
      cols.push({
        id: col.id,
        accessorKey: keyStr,
        accessorFn: (row: T) =>
          (row as Record<string, unknown>)[keyStr] as unknown,
        header: col.header,
        cell: ({ row }) => col.cell(row.original),
        enableSorting: col.sortable === true,
        meta: { align: col.align },
      });
    });
    return cols;
  }, [columns, enableSelection]);

  const rowSelection = React.useMemo(
    () =>
      enableSelection && selectedIds
        ? Object.fromEntries([...selectedIds].map((id) => [id, true]))
        : {},
    [enableSelection, selectedIds]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    getRowId: (row: T) => getRowId(row),
    state: {
      sorting,
      pagination,
      ...(enableSelection ? { rowSelection } : {}),
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      setPagination(next);
      onPaginationChange?.(next.pageIndex, next.pageSize);
    },
    onRowSelectionChange: enableSelection
      ? (updater) => {
          const next = typeof updater === "function" ? updater(rowSelection) : updater;
          const ids = Object.keys(next).filter((id) => next[id]);
          const rows = data.filter((r) => ids.includes(getRowId(r)));
          onSelectionChange?.(rows);
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    manualPagination: false,
  });

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className={cn("overflow-hidden", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    header.id === "select" && "w-10",
                    (header.column.columnDef.meta as { align?: string })?.align ===
                      "center" && "text-center",
                    (header.column.columnDef.meta as { align?: string })?.align ===
                      "right" && "text-right"
                  )}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getCanSort() && (
                      <DataTableSorter column={header.column} />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columnDefs.length}
                className="h-24 text-center"
              >
                加载中...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnDefs.length}
                className="h-24 text-center text-muted-foreground"
              >
                暂无数据
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={() => onRowClick?.(row.original as T)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      (cell.column.columnDef.meta as { align?: string })?.align ===
                        "center" && "text-center",
                      (cell.column.columnDef.meta as { align?: string })?.align ===
                        "right" && "text-right"
                    )}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {enablePagination && pageCount > 0 && (
        <div className="p-3">
          <DataTablePagination
            currentPage={currentPage}
            pageCount={pageCount}
            setCurrentPage={(p) => table.setPageIndex(p - 1)}
            pageSize={table.getState().pagination.pageSize}
            setPageSize={(size) => table.setPageSize(size)}
            total={totalCount ?? data.length}
          />
        </div>
      )}
    </div>
  );
}

DataTable.displayName = "DataTable";
