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

const fallbackStock: StockBatch[] = [
  { itemName: 'Cotton', batchNo: 'RM-001', availableQty: 1000, mfgDate: '2026-04-01', expiryDate: '2027-04-01' },
  { itemName: 'Cotton', batchNo: 'RM-002', availableQty: 500, mfgDate: '2026-04-02', expiryDate: '2027-04-02' },
  { itemName: 'Chemical', batchNo: 'RM-003', availableQty: 300, mfgDate: '2026-04-03', expiryDate: '2027-04-03' },
  { itemName: 'Packing Box Large', batchNo: 'B-2026-003', availableQty: 90, mfgDate: '2026-03-01', expiryDate: '2027-03-01' },
];

const fallbackItems: ItemRecord[] = [
  { id: 'rm-1', storeName: 'Cotton', tallyName: 'COTTON', sku: 'RM-CT', itemType: 'raw', category: 'Raw', baseUnit: 'kg', hsnCode: '5201', gstRate: 5, isActive: true, createdAt: '' },
  { id: 'rm-2', storeName: 'Chemical', tallyName: 'CHEMICAL', sku: 'RM-CH', itemType: 'raw', category: 'Chemical', baseUnit: 'kg', hsnCode: '2800', gstRate: 18, isActive: true, createdAt: '' },
  { id: '3', storeName: 'Packing Box Large', tallyName: 'Packing Box Large', sku: 'PB-L', itemType: 'raw', category: 'Packaging', baseUnit: 'pcs', hsnCode: '4819', gstRate: 12, isActive: true, createdAt: '' },
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

export function useIssueStock() {
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
