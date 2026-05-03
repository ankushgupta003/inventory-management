import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/apiError';
import { itemsApi } from '../services/itemsApi';
import type { ItemFilters, ItemListSummary, ItemRecord } from '../types';
import type { ItemFormValues } from '../schemas/itemSchema';

const EMPTY_SUMMARY: ItemListSummary = {
  total: 0,
  active: 0,
  inactive: 0,
  raw: 0,
  finished: 0,
};

export function useItems() {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [summary, setSummary] = useState<ItemListSummary>(EMPTY_SUMMARY);
  const [filters, setFilters] = useState<ItemFilters>({ search: '', status: 'all', itemType: 'all' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timerRef.current);
  }, [filters.search]);

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      status: filters.status,
      itemType: filters.itemType,
      paginate: false,
    }),
    [debouncedSearch, filters.itemType, filters.status],
  );

  const applyListResponse = useCallback((nextItems: ItemRecord[], nextSummary: ItemListSummary) => {
    setItems(nextItems);
    setSummary(nextSummary);
    setError(null);
  }, []);

  const refreshItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await itemsApi.list(listParams);
      applyListResponse(response.data, response.meta.summary);
      return response.data;
    } catch (nextError) {
      const message = getErrorMessage(nextError, 'Failed to load items');
      setItems([]);
      setSummary(EMPTY_SUMMARY);
      setError(message);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, [applyListResponse, listParams]);

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    itemsApi.list(listParams)
      .then((response) => {
        if (!active) return;
        applyListResponse(response.data, response.meta.summary);
      })
      .catch((nextError) => {
        if (!active) return;
        setItems([]);
        setSummary(EMPTY_SUMMARY);
        setError(getErrorMessage(nextError, 'Failed to load items'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyListResponse, listParams]);

  const createItem = useCallback(async (values: ItemFormValues) => {
    const created = await itemsApi.create(values);
    await refreshItems();
    return created;
  }, [refreshItems]);

  const updateItem = useCallback(async (id: string, values: ItemFormValues) => {
    const updated = await itemsApi.update(id, values);
    await refreshItems();
    return updated;
  }, [refreshItems]);

  const toggleStatus = useCallback(async (id: string, isActive?: boolean) => {
    const updated = await itemsApi.toggleStatus(id, isActive);
    await refreshItems();
    return updated;
  }, [refreshItems]);

  return {
    items,
    summary,
    filters,
    setFilters,
    isLoading,
    error,
    refreshItems,
    createItem,
    updateItem,
    toggleStatus,
  };
}
