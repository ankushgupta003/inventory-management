import { useEffect, useMemo, useState } from 'react';
import { itemsApi } from '@/modules/items/services/itemsApi';
import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import type { ItemRecord } from '@/modules/items/types';
import type { LedgerEntry } from '@/modules/ledger/types';

export interface StockBatch {
  itemName: string;
  batchNo: string;
  availableQty: number;
  mfgDate: string;
  expiryDate: string;
}

const fallbackItems: ItemRecord[] = [
  { id: 'fg-1', storeName: 'Finished Product A', tallyName: 'Finished Product A', sku: 'FG-001', itemType: 'finished', category: 'Finished', baseUnit: 'pcs', hsnCode: '3004', gstRate: 12, isActive: true, createdAt: '' },
  { id: '10', storeName: 'Motor Assembly A1', tallyName: 'Motor Assembly A1', sku: 'MA-1', itemType: 'finished', category: 'Finished', baseUnit: 'pcs', hsnCode: '8501', gstRate: 18, isActive: true, createdAt: '' },
];

const fallbackStock: StockBatch[] = [
  { itemName: 'Finished Product A', batchNo: 'FG-001', availableQty: 480, mfgDate: '2026-04-08', expiryDate: '2028-04-08' },
  { itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', availableQty: 120, mfgDate: '2026-04-01', expiryDate: '2028-04-01' },
];

function computeBalances(entries: LedgerEntry[]): StockBatch[] {
  const map = new Map<string, StockBatch>();
  entries.forEach((entry) => {
    const key = `${entry.itemName}||${entry.batchNo}`;
    const prev = map.get(key);
    const base = prev ?? {
      itemName: entry.itemName,
      batchNo: entry.batchNo,
      availableQty: 0,
      mfgDate: entry.mfgDate,
      expiryDate: entry.expiryDate,
    };
    map.set(key, {
      ...base,
      availableQty: base.availableQty + entry.receiptQty - entry.issueQty,
      mfgDate: entry.mfgDate || base.mfgDate,
      expiryDate: entry.expiryDate || base.expiryDate,
    });
  });
  return Array.from(map.values()).filter((b) => b.availableQty > 0);
}

export function useInvoiceStock() {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [stock, setStock] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [itemsData, ledgerData] = await Promise.all([
          itemsApi.getAll(),
          ledgerApi.getAll({}, 1, 2000).then((r) => r.data),
        ]);
        if (!active) return;
        const finished = itemsData.filter((i) => i.itemType === 'finished');
        setItems(finished.length ? finished : fallbackItems);
        const computed = computeBalances(ledgerData ?? []);
        setStock(computed.length ? computed : fallbackStock);
      } catch {
        if (!active) return;
        setItems(fallbackItems);
        setStock(fallbackStock);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const itemNameById = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      map.set(item.id, item.storeName || item.tallyName || item.sku);
    });
    return map;
  }, [items]);

  const batchesByItemName = useMemo(() => {
    const map = new Map<string, StockBatch[]>();
    stock.forEach((b) => {
      const list = map.get(b.itemName) ?? [];
      list.push(b);
      map.set(b.itemName, list);
    });
    return map;
  }, [stock]);

  return {
    items,
    stock,
    loading,
    itemNameById,
    batchesByItemName,
  };
}
