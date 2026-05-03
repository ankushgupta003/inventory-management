import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/apiError';
import { partiesApi } from '../services/partiesApi';
import type { PartyFilters, PartyListSummary, PartyRecord } from '../types';
import type { PartyFormValues } from '../schemas/partySchema';

const EMPTY_SUMMARY: PartyListSummary = {
  total: 0,
  active: 0,
  inactive: 0,
  vendors: 0,
  customers: 0,
  both: 0,
};

export function useParties() {
  const [parties, setParties] = useState<PartyRecord[]>([]);
  const [summary, setSummary] = useState<PartyListSummary>(EMPTY_SUMMARY);
  const [filters, setFilters] = useState<PartyFilters>({ search: '', status: 'all', partyType: 'all' });
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
      partyType: filters.partyType,
      paginate: false,
    }),
    [debouncedSearch, filters.partyType, filters.status],
  );

  const applyListResponse = useCallback((nextParties: PartyRecord[], nextSummary: PartyListSummary) => {
    setParties(nextParties);
    setSummary(nextSummary);
    setError(null);
  }, []);

  const refreshParties = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await partiesApi.list(listParams);
      applyListResponse(response.data, response.meta.summary);
      return response.data;
    } catch (nextError) {
      const message = getErrorMessage(nextError, 'Failed to load parties');
      setParties([]);
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
    partiesApi.list(listParams)
      .then((response) => {
        if (!active) return;
        applyListResponse(response.data, response.meta.summary);
      })
      .catch((nextError) => {
        if (!active) return;
        setParties([]);
        setSummary(EMPTY_SUMMARY);
        setError(getErrorMessage(nextError, 'Failed to load parties'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyListResponse, listParams]);

  const createParty = useCallback(async (values: PartyFormValues) => {
    const created = await partiesApi.create(values);
    await refreshParties();
    return created;
  }, [refreshParties]);

  const updateParty = useCallback(async (id: string, values: PartyFormValues) => {
    const updated = await partiesApi.update(id, values);
    await refreshParties();
    return updated;
  }, [refreshParties]);

  const toggleStatus = useCallback(async (id: string, isActive?: boolean) => {
    const updated = await partiesApi.toggleStatus(id, isActive);
    await refreshParties();
    return updated;
  }, [refreshParties]);

  return {
    parties,
    summary,
    filters,
    setFilters,
    isLoading,
    error,
    refreshParties,
    createParty,
    updateParty,
    toggleStatus,
  };
}
