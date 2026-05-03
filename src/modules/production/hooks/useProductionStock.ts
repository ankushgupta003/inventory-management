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
  { id: '1', storeName: 'Steel Rod 10mm', tallyName: 'Steel Rod 10mm', sku: 'SR-10', itemType: 'raw', categoryId: 'cat-raw-metal', category: 'Raw', baseUnit: 'kg', hsnCode: '7214', gstRate: 18, isActive: true, createdAt: '' },
  { id: '2', storeName: 'Copper Wire 2mm', tallyName: 'Copper Wire 2mm', sku: 'CW-2', itemType: 'raw', categoryId: 'cat-raw-metal', category: 'Raw', baseUnit: 'kg', hsnCode: '7408', gstRate: 18, isActive: true, createdAt: '' },
  { id: '10', storeName: 'Motor Assembly A1', tallyName: 'Motor Assembly A1', sku: 'MA-1', itemType: 'finished', categoryId: 'cat-fg-main', category: 'Finished', baseUnit: 'pcs', hsnCode: '8501', gstRate: 18, isActive: true, createdAt: '' },
];

const fallbackStock: StockBatch[] = [
  { itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', availableQty: 320, mfgDate: '2026-01-15', expiryDate: '2028-01-15' },
  { itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', availableQty: 180, mfgDate: '2026-02-10', expiryDate: '2029-02-10' },
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

export function useProductionStock() {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [stock, setStock] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [itemsData, ledgerData] = await Promise.all([
          itemsApi.getAll({ paginate: false, status: 'active' }),
          ledgerApi.getAll({}, 1, 2000).then((r) => r.data),
        ]);
        if (!active) return;
        setItems(itemsData.length ? itemsData : fallbackItems);
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
