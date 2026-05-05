import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  totalPages: number;
  setTotal: (total: number) => void;
  total: number;
  reset: () => void;
}

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 50;

export function usePagination({
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(Math.max(1, Math.min(newPage, totalPages)));
    },
    [totalPages],
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1);
  }, []);

  const reset = useCallback(() => {
    setPageState(initialPage);
  }, [initialPage]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    totalPages,
    setTotal,
    total,
    reset,
  };
}
