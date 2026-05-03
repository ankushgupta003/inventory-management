import { useEffect, useMemo, useState } from 'react';
import { productionApi } from '../services/productionApi';
import type { ProductionBatch } from '../types';

export type ProductionBatchOption = {
  id: string;
  productionNo: string;
  batchNo: string;
  itemName: string;
  date: string;
};

export function useProductionBatches() {
  const [records, setRecords] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await productionApi.getAll();
        if (!active) return;
        setRecords(data);
      } catch {
        if (!active) return;
        setRecords([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const options = useMemo<ProductionBatchOption[]>(() => {
    return records
      .filter((record) => record.status === 'DRAFT' || record.status === 'IN_PROCESS')
      .map((record) => ({
        id: record.id,
        productionNo: record.productionNo,
        batchNo: record.batchNo,
        itemName: record.productName,
        date: record.startDate || record.createdAt.slice(0, 10),
      }));
  }, [records]);

  return { records, options, loading };
}
