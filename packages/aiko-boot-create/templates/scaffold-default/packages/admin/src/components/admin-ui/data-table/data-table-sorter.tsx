"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type DataTableSorterProps<TData> = {
  column: Column<TData>;
} & React.ComponentProps<typeof Button>;

export function DataTableSorter<TData>({
  column,
  className,
  ...props
}: DataTableSorterProps<TData>) {
  const { t } = useTranslation();
  const id = column.id;
  const title =
    column.getIsSorted() === "desc"
      ? t("dataTable.sortDesc", { id })
      : column.getIsSorted() === "asc"
      ? t("dataTable.sortAsc", { id })
      : t("dataTable.sortBy", { id });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => column.toggleSorting(undefined, true)}
      title={title}
      aria-label={title}
      {...props}
      className={cn("data-[state=open]:bg-accent", "w-5 h-5", className)}
    >
      {column.getIsSorted() === "desc" ? (
        <ArrowDown className={cn("text-primary", "!w-3", "!h-3")} />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className={cn("text-primary", "!w-3", "!h-3")} />
      ) : (
        <ChevronsUpDown
          className={cn("text-muted-foreground", "!w-3", "!h-3")}
        />
      )}
    </Button>
  );
}

DataTableSorter.displayName = "DataTableSorter";
