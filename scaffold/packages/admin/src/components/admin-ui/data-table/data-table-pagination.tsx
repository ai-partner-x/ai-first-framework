"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataTablePaginationProps = {
  currentPage: number;
  pageCount: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  total?: number;
};

export function DataTablePagination({
  currentPage,
  pageCount,
  setCurrentPage,
  pageSize,
  setPageSize,
  total,
}: DataTablePaginationProps) {
  const { t } = useTranslation();
  const pageSizeOptions = useMemo(() => {
    const baseOptions = [10, 20, 30, 40, 50];
    const optionsSet = new Set(baseOptions);

    if (!optionsSet.has(pageSize)) {
      optionsSet.add(pageSize);
    }

    return Array.from(optionsSet).sort((a, b) => a - b);
  }, [pageSize]);

  return (
    <div
      className={cn(
        "flex",
        "items-center",
        "justify-between",
        "flex-wrap",
        "px-2",
        "w-full",
        "gap-2"
      )}
    >
      <div
        className={cn(
          "flex-1",
          "text-sm",
          "text-muted-foreground",
          "whitespace-nowrap"
        )}
      >
        {typeof total === "number" ? `${total} ${t("dataTable.rows")}` : null}
      </div>
      <div className={cn("flex", "items-center", "flex-wrap", "gap-2")}>
        <div className={cn("flex", "items-center", "gap-2")}>
          <span className={cn("text-sm", "font-medium")}>{t("dataTable.rowsPerPage")}</span>
          <Select
            value={`${pageSize}`}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className={cn("h-8", "w-[70px]")}>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={cn("flex", "items-center", "flex-wrap", "gap-2")}>
          <div
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "text-sm",
              "font-medium"
            )}
          >
            {t("dataTable.pageOf", { current: currentPage, total: pageCount })}
          </div>
          <div className={cn("flex", "items-center", "gap-2")}>
            <Button
              variant="outline"
              className={cn("hidden", "h-8", "w-8", "p-0", "lg:flex")}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label={t("dataTable.goToFirstPage")}
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className={cn("h-8", "w-8", "p-0")}
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label={t("dataTable.goToPreviousPage")}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              className={cn("h-8", "w-8", "p-0")}
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pageCount}
              aria-label={t("dataTable.goToNextPage")}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              className={cn("hidden", "h-8", "w-8", "p-0", "lg:flex")}
              onClick={() => setCurrentPage(pageCount)}
              disabled={currentPage === pageCount}
              aria-label={t("dataTable.goToLastPage")}
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

DataTablePagination.displayName = "DataTablePagination";
