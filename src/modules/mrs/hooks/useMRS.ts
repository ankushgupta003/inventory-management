import { useCallback, useEffect, useMemo, useState } from 'react';
import { itemsApi } from '@/modules/items/services/itemsApi';
import type { ItemRecord } from '@/modules/items/types';
import mrsApi from '../services/mrsApi';
import type { MRSFilters, MRSRecord } from '../types';

export function useMRSList() {
  const [records, setRecords] = useState<MRSRecord[]>([]);
  const [filters, setFilters] = useState<MRSFilters>({ search: '', status: 'all' });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mrsApi.getAll();
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return records.filter((record) => {
      if (filters.status !== 'all' && record.status !== filters.status) return false;
      if (!query) return true;
      return `${record.mrsNo} ${record.department} ${record.requisitionBy}`.toLowerCase().includes(query);
    });
  }, [records, filters]);

  const updateStatus = useCallback(
    async (id: string) => {
      const updated = await mrsApi.approve(id);
      if (!updated) return null;
      setRecords((prev) => prev.map((record) => (record.id === id ? updated : record)));
      return updated;
    },
    [],
  );

  const addRecord = useCallback((record: MRSRecord) => {
    setRecords((prev) => [record, ...prev]);
  }, []);

  return { records: filtered, allRecords: records, filters, setFilters, updateStatus, addRecord, loading, refresh };
}

export function useAvailableItems(enabled = true) {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await itemsApi.getAll({ paginate: false, status: 'active', itemType: 'raw' });
        if (!active) return;
        setItems(data);
      } catch {
        if (!active) return;
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [enabled]);

  return {
    items,
    loading,
    options: items.map((item) => ({
      id: item.id,
      name: item.storeName,
      unit: item.baseUnit,
    })),
  };
}
