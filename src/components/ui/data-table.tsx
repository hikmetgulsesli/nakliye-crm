"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Loader2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SortDirection = "asc" | "desc" | null

export interface Column<T> {
  key: string
  header: string
  accessorFn?: (row: T) => unknown
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: "left" | "center" | "right"
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  isLoading?: boolean
  selectable?: boolean
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onRowClick?: (row: T) => void
  onSort?: (column: string, direction: SortDirection) => void
  sortColumn?: string | null
  sortDirection?: SortDirection
  onFilter?: (column: string, value: string) => void
  filters?: Record<string, string>
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
    pageSizeOptions?: number[]
  }
  bulkActions?: {
    label: string
    icon?: React.ReactNode
    onClick: (selectedIds: string[]) => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  }[]
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  emptyMessage?: string
  className?: string
  rowClassName?: (row: T) => string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  onRowClick,
  onSort,
  sortColumn = null,
  sortDirection = null,
  onFilter,
  filters = {},
  pagination,
  bulkActions,
  columnVisibility,
  onColumnVisibilityChange,
  emptyMessage = "No data available",
  className,
  rowClassName,
}: DataTableProps<T>) {
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {}
      columns.forEach((col) => {
        initial[col.key] = columnVisibility?.[col.key] ?? true
      })
      return initial
    }
  )

  const visibleColumns = React.useMemo(
    () => columns.filter((col) => (columnVisibility || internalColumnVisibility)[col.key] !== false),
    [columns, columnVisibility, internalColumnVisibility]
  )

  const allSelected = data.length > 0 && data.every((row) => selectedRows.includes(keyExtractor(row)))
  const someSelected = data.some((row) => selectedRows.includes(keyExtractor(row))) && !allSelected

  const handleSelectAll = React.useCallback(() => {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map((row) => keyExtractor(row)))
    }
  }, [allSelected, data, keyExtractor, onSelectionChange])

  const handleSelectRow = React.useCallback((rowId: string) => {
    if (!onSelectionChange) return
    if (selectedRows.includes(rowId)) {
      onSelectionChange(selectedRows.filter((id) => id !== rowId))
    } else {
      onSelectionChange([...selectedRows, rowId])
    }
  }, [selectedRows, onSelectionChange])

  const handleSort = React.useCallback((columnKey: string, sortable?: boolean) => {
    if (!sortable || !onSort) return
    
    let newDirection: SortDirection
    if (sortColumn === columnKey) {
      newDirection = sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc"
    } else {
      newDirection = "asc"
    }
    onSort(columnKey, newDirection)
  }, [onSort, sortColumn, sortDirection])

  const handleColumnVisibilityToggle = React.useCallback((columnKey: string, visible: boolean) => {
    const newVisibility = { ...(columnVisibility || internalColumnVisibility), [columnKey]: visible }
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(newVisibility)
    } else {
      setInternalColumnVisibility(newVisibility)
    }
  }, [columnVisibility, internalColumnVisibility, onColumnVisibilityChange])

  const getSortIcon = React.useCallback((columnKey: string, sortable?: boolean) => {
    if (!sortable) return null
    if (sortColumn !== columnKey) return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />
    if (sortDirection === "asc") return <ChevronUp className="h-4 w-4 ml-1" />
    if (sortDirection === "desc") return <ChevronDown className="h-4 w-4 ml-1" />
    return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />
  }, [sortColumn, sortDirection])

  // Pagination calculations
  const currentPage = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? 10
  const totalPages = pagination ? Math.ceil(pagination.total / pageSize) : 1
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, pagination?.total ?? data.length)

  return (
    <div className={cn("w-full", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk actions */}
          {selectable && selectedRows.length > 0 && bulkActions && bulkActions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">
                {selectedRows.length} selected
              </span>
              {bulkActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={() => action.onClick(selectedRows)}
                  className="h-8"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Column filters */}
          {columns.filter((col) => col.filterable).map((column) => (
            <Input
              key={column.key}
              placeholder={`Filter ${column.header.toLowerCase()}...`}
              value={filters[column.key] || ""}
              onChange={(e) => onFilter?.(column.key, e.target.value)}
              className="h-8 w-[150px] lg:w-[200px]"
              aria-label={`Filter by ${column.header}`}
            />
          ))}
        </div>

        {/* Column visibility */}
        {onColumnVisibilityChange || columns.some((col) => internalColumnVisibility[col.key] !== undefined) ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Eye className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={(columnVisibility || internalColumnVisibility)[column.key] !== false}
                  onCheckedChange={(checked) => handleColumnVisibilityToggle(column.key, checked)}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm" role="grid">
            <thead className="border-b bg-muted/50">
              <tr>
                {selectable && (
                  <th
                    className="w-[50px] p-4 text-left"
                    scope="col"
                    role="columnheader"
                  >
                    <Checkbox
                      checked={allSelected}
                      data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "p-4 text-left font-medium",
                      column.sortable && "cursor-pointer select-none",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                    style={{ width: column.width }}
                    scope="col"
                    role="columnheader"
                    aria-sort={sortColumn === column.key ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                    onClick={() => handleSort(column.key, column.sortable)}
                  >
                    <div className={cn(
                      "flex items-center gap-1",
                      column.align === "center" && "justify-center",
                      column.align === "right" && "justify-end"
                    )}>
                      {column.header}
                      {getSortIcon(column.key, column.sortable)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                    className="p-8 text-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <span className="sr-only">Loading data...</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => {
                  const rowId = keyExtractor(row)
                  const isSelected = selectedRows.includes(rowId)

                  return (
                    <tr
                      key={rowId}
                      role="row"
                      aria-rowindex={rowIndex + 1}
                      aria-selected={selectable ? isSelected : undefined}
                      className={cn(
                        "border-b transition-colors hover:bg-muted/50",
                        isSelected && "bg-muted",
                        onRowClick && "cursor-pointer",
                        rowClassName?.(row)
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(rowId)}
                            aria-label={`Select row ${rowIndex + 1}`}
                          />
                        </td>
                      )}
                      {visibleColumns.map((column) => {
                        const cellValue = column.accessorFn
                          ? column.accessorFn(row)
                          : (row as Record<string, unknown>)[column.key]

                        return (
                          <td
                            key={column.key}
                            className={cn(
                              "p-4",
                              column.align === "center" && "text-center",
                              column.align === "right" && "text-right"
                            )}
                          >
                            {column.cell
                              ? column.cell(row)
                              : cellValue as React.ReactNode}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {pagination.total} results
          </div>
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {(pagination.pageSizeOptions || [10, 20, 30, 50, 100]).map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(1)}
                disabled={currentPage === 1}
                aria-label="Go to first page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Go to last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Re-export types and utilities
export { type Column as DataTableColumn }
