import { useEffect, useMemo, useState } from 'react';
import { productionApi } from '../services/productionApi';
import { USE_MOCK } from '@/services/api';
import type { ProductionRecord } from '../types';

export type ProductionBatchOption = {
  id: string;
  productionNo: string;
  batchNo: string;
  itemName: string;
  date: string;
};

const mockProduction: ProductionRecord[] = [
  {
    id: 'prd-1',
    productionNo: 'PRD-240401-201',
    date: '2026-04-01',
    outputs: [
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', mfgDate: '2026-04-01', expiryDate: '2028-04-01', qtyProduced: 120 },
    ],
    inputs: [],
    createdAt: '2026-04-01',
  },
  {
    id: 'prd-2',
    productionNo: 'PRD-240402-203',
    date: '2026-04-02',
    outputs: [
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', batchNo: 'FG-240402-02', mfgDate: '2026-04-02', expiryDate: '2028-04-02', qtyProduced: 60 },
    ],
    inputs: [],
    createdAt: '2026-04-02',
  },
];

export function useProductionBatches() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = USE_MOCK ? mockProduction : await productionApi.getAll();
        if (!active) return;
        setRecords(data.length ? data : mockProduction);
      } catch {
        if (!active) return;
        setRecords(mockProduction);
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
    return records.flatMap((record) =>
      (record.outputs || []).map((output) => ({
        id: `${record.id}:${output.batchNo}`,
        productionNo: record.productionNo,
        batchNo: output.batchNo,
        itemName: output.itemName,
        date: record.date,
      }))
    );
  }, [records]);

  return { options, loading };
}
