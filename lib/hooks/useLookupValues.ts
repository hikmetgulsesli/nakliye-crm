'use client';

import { useState, useCallback, useEffect } from 'react';

export interface LookupValue {
  id: string;
  category: string;
  value: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LookupValueInput {
  category: string;
  value: string;
  label: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface UseLookupValuesOptions {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export function useLookupValues(options: UseLookupValuesOptions = {}) {
  const [lookupValues, setLookupValues] = useState<LookupValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { category, isActive, search } = options;

  const fetchLookupValues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (isActive !== undefined) params.append('isActive', String(isActive));
      if (search) params.append('search', search);

      const response = await fetch(`/api/lookup-values?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch lookup values');
      }

      setLookupValues(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [category, isActive, search]);

  const createLookupValue = async (data: LookupValueInput): Promise<LookupValue> => {
    const response = await fetch('/api/lookup-values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create lookup value');
    }

    await fetchLookupValues();
    return result.data;
  };

  const updateLookupValue = async (id: string, data: Partial<LookupValueInput>): Promise<LookupValue> => {
    const response = await fetch(`/api/lookup-values/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update lookup value');
    }

    await fetchLookupValues();
    return result.data;
  };

  const deleteLookupValue = async (id: string): Promise<void> => {
    const response = await fetch(`/api/lookup-values/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete lookup value');
    }

    await fetchLookupValues();
  };

  const activateLookupValue = async (id: string): Promise<LookupValue> => {
    return updateLookupValue(id, { isActive: true });
  };

  const deactivateLookupValue = async (id: string): Promise<LookupValue> => {
    return updateLookupValue(id, { isActive: false });
  };

  useEffect(() => {
    fetchLookupValues();
  }, [fetchLookupValues]);

  return {
    lookupValues,
    isLoading,
    error,
    refetch: fetchLookupValues,
    createLookupValue,
    updateLookupValue,
    deleteLookupValue,
    activateLookupValue,
    deactivateLookupValue,
  };
}

export function useLookupCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lookup-values/categories');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch categories');
      }

      setCategories(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}
