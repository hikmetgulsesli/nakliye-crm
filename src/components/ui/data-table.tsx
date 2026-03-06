import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown, Eye, Filter } from "lucide-react";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";

export interface FilterConfig<T> {
  key: keyof T | string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { label: string; value: string }[];
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (rows: T[]) => void;
  variant?: 'default' | 'destructive';
}

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
  hidden?: boolean;
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
  
  // Row selection
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  
  // Filtering
  filters?: FilterConfig<T>[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  
  // Bulk actions
  bulkActions?: BulkAction<T>[];
  
  // Column visibility
  columnVisibility?: boolean;
  onColumnVisibilityChange?: (columns: Column<T>[]) => void;
  
  // Pagination
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
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
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  filters,
  filterValues = {},
  onFilterChange,
  onClearFilters,
  bulkActions,
  columnVisibility = false,
  onColumnVisibilityChange,
  pagination,
}: DataTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = React.useState<Column<T>[]>(columns);

  React.useEffect(() => {
    setVisibleColumns(columns.filter((col) => !col.hidden));
  }, [columns]);

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

  const allSelected = data.length > 0 && data.every((row) => 
    selectedRows.includes(String(keyExtractor(row)))
  );
  const someSelected = data.some((row) => 
    selectedRows.includes(String(keyExtractor(row)))
  ) && !allSelected;

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (allSelected) {
      const currentIds = data.map((row) => String(keyExtractor(row)));
      onSelectionChange(selectedRows.filter((id) => !currentIds.includes(id)));
    } else {
      const currentIds = data.map((row) => String(keyExtractor(row)));
      const newSelection = Array.from(new Set([...selectedRows, ...currentIds]));
      onSelectionChange(newSelection);
    }
  };

  const toggleRowSelection = (rowId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedRows.includes(rowId)) {
      onSelectionChange(selectedRows.filter((id) => id !== rowId));
    } else {
      onSelectionChange([...selectedRows, rowId]);
    }
  };

  const selectedData = React.useMemo(() => {
    return data.filter((row) => selectedRows.includes(String(keyExtractor(row))));
  }, [data, selectedRows, keyExtractor]);

  const hasActiveFilters = filters?.some((f) => filterValues[f.key as string]);

  const toggleColumnVisibility = (key: string) => {
    const newColumns = visibleColumns.map((col) =>
      col.key === key ? { ...col, hidden: !col.hidden } : col
    );
    setVisibleColumns(newColumns);
    onColumnVisibilityChange?.(newColumns);
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

  if (data.length === 0 && !hasActiveFilters) {
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
    <div className="space-y-4">
      {/* Filters and Actions Bar */}
      {(filters || bulkActions || columnVisibility) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filters */}
          {filters && filters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {filters.map((filter) => (
                <div key={String(filter.key)} className="flex items-center gap-1">
                  {filter.type === 'select' ? (
                    <select
                      value={filterValues[filter.key as string] || ''}
                      onChange={(e) => onFilterChange?.(filter.key as string, e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      aria-label={filter.label}
                    >
                      <option value="">{filter.label}</option>
                      {filter.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={filter.type}
                      value={filterValues[filter.key as string] || ''}
                      onChange={(e) => onFilterChange?.(filter.key as string, e.target.value)}
                      placeholder={filter.label}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      aria-label={filter.label}
                    />
                  )}
                </div>
              ))}
              {hasActiveFilters && onClearFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          )}

          {/* Bulk Actions and Column Visibility */}
          <div className="flex items-center gap-2">
            {selectedRows.length > 0 && bulkActions && bulkActions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRows.length} seçili
                </span>
                {bulkActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'default'}
                    size="sm"
                    onClick={() => action.onClick(selectedData)}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {columnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Kolonlar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {columns.map((col) => (
                    <DropdownMenuItem
                      key={String(col.key)}
                      onClick={() => toggleColumnVisibility(String(col.key))}
                    >
                      <Checkbox
                        checked={!visibleColumns.find((c) => c.key === col.key)?.hidden}
                        className="mr-2"
                      />
                      {col.header}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Tümünü seç"
                  />
                </th>
              )}
              {visibleColumns.map((column) => (
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
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const rowId = String(keyExtractor(row));
                const isSelected = selectedRows.includes(rowId);
                
                return (
                  <tr
                    key={rowId}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(
                      "border-b transition-colors",
                      "hover:bg-muted/50",
                      isSelected && "bg-muted"
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRowSelection(rowId)}
                          aria-label={`Satır ${rowId} seç`}
                        />
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td
                        key={`${rowId}-${String(column.key)}`}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Toplam {pagination.total} kayıt
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              aria-label="Sayfa başına kayıt"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / sayfa
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Önceki
              </Button>
              <span className="px-2 text-sm">
                Sayfa {pagination.page} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
