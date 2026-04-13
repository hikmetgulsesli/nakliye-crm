import { useEffect } from 'react';
import { useLookupStore } from '@/stores/lookupStore';

/**
 * Hook that wraps the lookup store and auto-fetches lookups on mount.
 * Returns lookups grouped by category and a helper to get values by category.
 */
export function useLookups() {
  const { lookups, isLoaded, isLoading, fetchAll, getByCategory } = useLookupStore();

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      fetchAll();
    }
  }, [isLoaded, isLoading, fetchAll]);

  /**
   * Get lookup values for a category as Select-compatible options.
   */
  function getOptions(category: string): { value: string; label: string }[] {
    return getByCategory(category)
      .filter((item) => item.isActive)
      .map((item) => ({
        value: item.value,
        label: item.value,
      }));
  }

  return {
    lookups,
    isLoaded,
    isLoading,
    getByCategory,
    getOptions,
  };
}
