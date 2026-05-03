import { useEffect, useMemo, useState } from 'react';
import { itemsApi } from '@/modules/items/services/itemsApi';
import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import type { ItemRecord } from '@/modules/items/types';
import type { LedgerEntry } from '@/modules/ledger/types';
import { USE_MOCK } from '@/services/api';

export interface StockBatch {
  itemId?: string;
  itemName: string;
  batchNo: string;
  availableQty: number;
  mfgDate: string;
  expiryDate: string;
}

const fallbackItems: ItemRecord[] = [
  { id: 'fg-1', storeName: 'Finished Product A', tallyName: 'Finished Product A', sku: 'FG-001', itemType: 'finished', categoryId: 'cat-fg-main', category: 'Finished', baseUnit: 'pcs', hsnCode: '3004', gstRate: 12, isActive: true, createdAt: '' },
  { id: '10', storeName: 'Motor Assembly A1', tallyName: 'Motor Assembly A1', sku: 'MA-1', itemType: 'finished', categoryId: 'cat-fg-motor', category: 'Finished', baseUnit: 'pcs', hsnCode: '8501', gstRate: 18, isActive: true, createdAt: '' },
];

const fallbackStock: StockBatch[] = [
  { itemId: 'fg-1', itemName: 'Finished Product A', batchNo: 'FG-001', availableQty: 480, mfgDate: '2026-04-08', expiryDate: '2028-04-08' },
  { itemId: '10', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', availableQty: 120, mfgDate: '2026-04-01', expiryDate: '2028-04-01' },
];

function computeBalances(entries: LedgerEntry[]): StockBatch[] {
  const map = new Map<string, StockBatch>();
  entries.forEach((entry) => {
    if (entry.itemCategory !== 'FINISHED') return;
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
          itemsApi.getAll({ paginate: false, status: 'active', itemType: 'finished' }),
          ledgerApi.getAll({}, 1, 2000).then((r) => r.data),
        ]);
        if (!active) return;
        const finished = itemsData.filter((i) => i.itemType === 'finished');
        setItems(finished.length ? finished : (USE_MOCK ? fallbackItems : []));
        const finishedNames = new Set(finished.map((item) => item.storeName || item.tallyName || item.sku));
        const computed = computeBalances(ledgerData ?? []).filter((row) => finishedNames.has(row.itemName));
        setStock(computed.length ? computed : (USE_MOCK ? fallbackStock : []));
      } catch {
        if (!active) return;
        setItems(USE_MOCK ? fallbackItems : []);
        setStock(USE_MOCK ? fallbackStock : []);
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

  const batchesByItemId = useMemo(() => {
    const map = new Map<string, StockBatch[]>();
    stock.forEach((batch) => {
      const itemId = batch.itemId ?? items.find((item) => (item.storeName || item.tallyName || item.sku) === batch.itemName)?.id;
      if (!itemId) return;
      const list = map.get(itemId) ?? [];
      list.push({ ...batch, itemId });
      map.set(itemId, list);
    });
    return map;
  }, [items, stock]);

  return {
    items,
    stock,
    loading,
    itemNameById,
    batchesByItemName,
    batchesByItemId,
  };
}
