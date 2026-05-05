import { cn } from '@/utils/cn';
import { Icon } from './Icon';
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  /** Verilirse sayfa boyutu seçici görünür (25/50/100). */
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  pageSize,
  onPageSizeChange,
  className,
}: PaginationProps) {
  function getVisiblePages(): (number | '...')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  }

  const showSizeSelector = pageSize !== undefined && onPageSizeChange !== undefined;
  const showPager = totalPages > 1;

  // Hicbir sey gostermek gerekmiyorsa null don
  if (!showPager && !showSizeSelector) return null;

  const visiblePages = showPager ? getVisiblePages() : [];

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span>
          Toplam <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span> kayıt
        </span>
        {showSizeSelector && (
          <label className="inline-flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Sayfa boyutu:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange!(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {showPager && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Önceki sayfa"
            className="flex items-center justify-center size-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Icon name="chevron_left" size="sm" />
          </button>

          {visiblePages.map((page, i) =>
            page === '...' ? (
              <span
                key={`dots-${i}`}
                className="flex items-center justify-center size-9 text-slate-400 dark:text-slate-500 text-sm"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-center size-9 rounded-lg text-sm font-medium transition-colors',
                  page === currentPage
                    ? 'bg-primary text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {page}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Sonraki sayfa"
            className="flex items-center justify-center size-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Icon name="chevron_right" size="sm" />
          </button>
        </div>
      )}
    </div>
  );
}
