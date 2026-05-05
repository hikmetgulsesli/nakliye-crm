import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  /** Bu kolonu sıralanabilir yap. Backend'e gönderilecek alan adı sortKey ya da key olur. */
  sortable?: boolean;
  /** orderBy alaninda kullanilacak ad — verilmezse `key` kullanilir */
  sortKey?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
  /**
   * İlk kolonu sola yapıştırır (sticky). Yatay scroll edildikçe kayıt no /
   * birincil tanimlayici görünmeye devam eder.
   */
  stickyFirstColumn?: boolean;
  /**
   * Sıralama state'i (controlled). Verilirse sortable kolon başlıklarına
   * tıklamak onSortChange'i tetikler.
   */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Kayıt bulunamadı',
  className,
  stickyFirstColumn,
  sortBy,
  sortOrder,
  onSortChange,
}: TableProps<T>) {
  function handleSortClick(col: Column<T>) {
    if (!col.sortable || !onSortChange) return;
    const key = col.sortKey || col.key;
    if (sortBy === key) {
      onSortChange(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(key, 'desc');
    }
  }

  function sortIcon(col: Column<T>): string | null {
    if (!col.sortable) return null;
    const key = col.sortKey || col.key;
    if (sortBy !== key) return 'unfold_more';
    return sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // Sticky ilk kolon: alta gri arka plan + sag border ile ayrim. Hem th hem td.
  const stickyHeadCls = stickyFirstColumn
    ? 'sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-sm'
    : '';
  const stickyCellCls = stickyFirstColumn
    ? 'sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 shadow-[2px_0_3px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_3px_-2px_rgba(0,0,0,0.4)]'
    : '';

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60">
            {columns.map((col, i) => {
              const icon = sortIcon(col);
              const isFirst = i === 0;
              return (
                <th
                  key={col.key}
                  onClick={() => handleSortClick(col)}
                  className={cn(
                    'text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold',
                    col.sortable && onSortChange && 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200',
                    isFirst && stickyHeadCls,
                    col.className,
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {icon && (
                      <Icon
                        name={icon}
                        size="sm"
                        className={cn(
                          '!text-[14px] transition-opacity',
                          sortBy === (col.sortKey || col.key) ? 'opacity-90' : 'opacity-40',
                        )}
                      />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={cn(
                  'group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col, i) => {
                  const isFirst = i === 0;
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-6 py-4 text-sm text-slate-700 dark:text-slate-300',
                        isFirst && stickyCellCls,
                        col.className,
                      )}
                    >
                      {col.render
                        ? col.render(row, rowIndex)
                        : (row[col.key] as ReactNode) ?? '-'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
