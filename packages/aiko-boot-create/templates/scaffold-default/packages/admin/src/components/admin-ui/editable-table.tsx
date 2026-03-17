"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface EditableTableColumn<T> {
  key: string;
  title: string | ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  required?: boolean;
  render: (record: T, index: number) => ReactNode;
}

export interface EditableTableProps<T> {
  columns: EditableTableColumn<T>[];
  dataSource: T[];
  rowKey: keyof T | ((record: T) => string);
  header?: { title: string; subtitle?: string; actions?: ReactNode };
  footer?: ReactNode;
  emptyText?: string;
  minWidth?: number;
  className?: string;
  showIndex?: boolean;
  embedded?: boolean;
}

export function EditableTable<T>({
  columns,
  dataSource,
  rowKey,
  header,
  footer,
  emptyText = "暂无数据",
  minWidth = 900,
  className,
  showIndex = true,
  embedded = false,
}: EditableTableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") return rowKey(record);
    return String(record[rowKey] ?? index);
  };

  return (
    <div
      className={cn(
        "overflow-hidden",
        !embedded && "rounded-xl border border-border bg-card shadow-sm",
        embedded && "-mx-6 -mb-6 -mt-6",
        className
      )}
    >
      {header && (
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div>
            <h2 className="font-semibold">{header.title}</h2>
            {header.subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{header.subtitle}</p>
            )}
          </div>
          {header.actions && <div className="flex items-center gap-2">{header.actions}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        <Table style={{ minWidth }}>
          <TableHeader>
            <TableRow>
              {showIndex && (
                <TableHead className="w-10 px-3 py-3 text-left text-xs font-semibold">#</TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "px-3 py-3 text-xs font-semibold",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right"
                  )}
                  style={{ width: col.width }}
                >
                  {col.title}
                  {col.required && <span className="ml-0.5 text-destructive">*</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataSource.length > 0 ? (
              dataSource.map((record, index) => (
                <TableRow key={getRowKey(record, index)}>
                  {showIndex && (
                    <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                      {index + 1}
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "px-3 py-2",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right"
                      )}
                    >
                      {col.render(record, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (showIndex ? 1 : 0)}
                  className="px-3 py-12 text-center text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {footer && dataSource.length > 0 && <tfoot>{footer}</tfoot>}
        </Table>
      </div>
    </div>
  );
}

export function TableInput({
  type = "text",
  value,
  onChange,
  readOnly,
  placeholder,
  className,
  align = "left",
  ...props
}: {
  type?: "text" | "number" | "date";
  value: string | number;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  align?: "left" | "center" | "right";
  min?: number;
  max?: number;
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      className={cn(
        "h-9",
        readOnly && "bg-muted text-muted-foreground",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
      {...props}
    />
  );
}

/** Sentinel for placeholder option; Radix Select forbids SelectItem value="". */
const PLACEHOLDER_VALUE = "__select_placeholder__";

export function TableSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}) {
  const items = placeholder
    ? [{ value: PLACEHOLDER_VALUE, label: placeholder }, ...options]
    : options;
  const selectValue = value || (placeholder ? PLACEHOLDER_VALUE : undefined);
  return (
    <Select
      value={selectValue}
      onValueChange={(v) => onChange(v === PLACEHOLDER_VALUE ? "" : v)}
    >
      <SelectTrigger className={cn("h-9", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TableText({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "muted" | "mono" | "bold" | "primary";
}) {
  const variantStyles = {
    default: "text-sm",
    muted: "text-sm text-muted-foreground",
    mono: "font-mono text-xs text-muted-foreground",
    bold: "text-sm font-medium",
    primary: "text-sm font-semibold text-primary",
  };
  return <span className={cn(variantStyles[variant], className)}>{children}</span>;
}

export function TableDeleteButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-8",
        !disabled && "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

export function TableFooterRow({
  label,
  value,
  colSpan,
  valueColSpan = 1,
  tailColSpan = 0,
}: {
  label: string;
  value: ReactNode;
  colSpan: number;
  valueColSpan?: number;
  tailColSpan?: number;
}) {
  return (
    <TableRow className="bg-muted/50 border-t border-border">
      <TableCell colSpan={colSpan} className="px-3 py-3 text-right text-sm font-medium">
        {label}
      </TableCell>
      <TableCell colSpan={valueColSpan} className="px-3 py-3 text-right">
        {value}
      </TableCell>
      {tailColSpan > 0 && <TableCell colSpan={tailColSpan} />}
    </TableRow>
  );
}
