import { useState, useCallback } from 'react';

export interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface UseSortReturn extends SortState {
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

/**
 * Tablo siralama state'i. Liste sayfalari `usePagination` ile yan yana kullanir
 * ve servise queryparam olarak iletir. URL ile entegrasyon caller'a birakildi
 * (bazi sayfalar URL ile bootstrap eder, bazilari etmez).
 */
export function useSort(initial?: Partial<SortState>): UseSortReturn {
  const [state, setState] = useState<SortState>({
    sortBy: initial?.sortBy ?? '',
    sortOrder: initial?.sortOrder ?? 'desc',
  });

  const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setState({ sortBy, sortOrder });
  }, []);

  return { ...state, setSort };
}
