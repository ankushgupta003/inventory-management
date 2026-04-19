import { useState, useMemo, useCallback } from 'react';
import type { MRSRecord, MRSFilters } from '../types';
import { mockMRSItems, mockMRSRecords } from '../data/mockMRS';

export function useMRSList() {
  const [records, setRecords] = useState<MRSRecord[]>(mockMRSRecords);
  const [filters, setFilters] = useState<MRSFilters>({ search: '', status: 'all' });

  const filtered = useMemo(() => {
    let data = records;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (r) =>
          r.mrsNo.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.requisitionBy.toLowerCase().includes(q)
      );
    }
    if (filters.status !== 'all') data = data.filter((r) => r.status === filters.status);
    return data;
  }, [records, filters]);

  const updateStatus = useCallback((id: string, status: MRSRecord['status']) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  const addRecord = useCallback((record: MRSRecord) => {
    setRecords((prev) => [record, ...prev]);
  }, []);

  return { records: filtered, allRecords: records, filters, setFilters, updateStatus, addRecord };
}

export function useAvailableItems() {
  return mockMRSItems;
}
