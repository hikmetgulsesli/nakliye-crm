import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string | number;
}

export function DataTable<T>({
  data,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  isLoading,
  emptyMessage = "Veri bulunamadı",
  keyExtractor,
}: DataTableProps<T>) {
  const handleSort = (columnKey: string) => {
    if (onSort && sortColumn !== undefined && sortDirection !== undefined) {
      onSort(columnKey);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />;
    }
    if (sortDirection === "asc") {
      return <ChevronUp className="h-4 w-4 text-primary" />;
    }
    return <ChevronDown className="h-4 w-4 text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-muted rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted/50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                  column.sortable && "cursor-pointer hover:text-foreground",
                  column.width && column.width
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    column.align === "center" && "justify-center",
                    column.align === "right" && "justify-end"
                  )}
                >
                  {column.header}
                  {column.sortable && getSortIcon(String(column.key))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              {columns.map((column) => (
                <td
                  key={`${keyExtractor(row)}-${String(column.key)}`}
                  className={cn(
                    "p-4 align-middle",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                >
                  {column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.key as string] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
