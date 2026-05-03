import { useEffect, useMemo, useState } from 'react';
import { itemsApi } from '@/modules/items/services/itemsApi';
import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import type { ItemRecord } from '@/modules/items/types';
import type { LedgerEntry } from '@/modules/ledger/types';
import { USE_MOCK } from '@/services/api';

export interface StockBatch {
  itemId: string;
  itemName: string;
  batchNo: string;
  availableQty: number;
  mfgDate: string;
  expiryDate: string;
}

const fallbackStock: StockBatch[] = [
  { itemId: 'rm-1', itemName: 'Cotton', batchNo: 'RM-001', availableQty: 1000, mfgDate: '2026-04-01', expiryDate: '2027-04-01' },
  { itemId: 'rm-1', itemName: 'Cotton', batchNo: 'RM-002', availableQty: 500, mfgDate: '2026-04-02', expiryDate: '2027-04-02' },
  { itemId: 'rm-2', itemName: 'Chemical', batchNo: 'RM-003', availableQty: 300, mfgDate: '2026-04-03', expiryDate: '2027-04-03' },
  { itemId: '3', itemName: 'Packing Box Large', batchNo: 'B-2026-003', availableQty: 90, mfgDate: '2026-03-01', expiryDate: '2027-03-01' },
  { itemId: 'fg-1', itemName: 'Finished Product A', batchNo: 'FG-001', availableQty: 120, mfgDate: '2026-04-10', expiryDate: '2028-04-10' },
];

const fallbackItems: ItemRecord[] = [
  { id: 'rm-1', storeName: 'Cotton', tallyName: 'COTTON', sku: 'RM-CT', itemType: 'raw', categoryId: 'cat-raw-fiber', category: 'Raw', baseUnit: 'kg', hsnCode: '5201', gstRate: 5, isActive: true, createdAt: '' },
  { id: 'rm-2', storeName: 'Chemical', tallyName: 'CHEMICAL', sku: 'RM-CH', itemType: 'raw', categoryId: 'cat-raw-chem', category: 'Chemical', baseUnit: 'kg', hsnCode: '2800', gstRate: 18, isActive: true, createdAt: '' },
  { id: '3', storeName: 'Packing Box Large', tallyName: 'Packing Box Large', sku: 'PB-L', itemType: 'raw', categoryId: 'cat-raw-pack', category: 'Packaging', baseUnit: 'pcs', hsnCode: '4819', gstRate: 12, isActive: true, createdAt: '' },
  { id: 'fg-1', storeName: 'Finished Product A', tallyName: 'FINISHED PRODUCT A', sku: 'FG-001', itemType: 'finished', categoryId: 'cat-fg-main', category: 'Finished Goods', baseUnit: 'pcs', hsnCode: '3004', gstRate: 12, isActive: true, createdAt: '' },
];

function computeBalances(entries: LedgerEntry[]): StockBatch[] {
  const map = new Map<string, StockBatch>();
  entries.forEach((entry) => {
    const key = `${entry.itemId}||${entry.batchNo}`;
    const prev = map.get(key);
    const base = prev ?? {
      itemId: entry.itemId,
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

export function useIssueStock(enabled = true) {
  const [allItems, setAllItems] = useState<ItemRecord[]>([]);
  const [stock, setStock] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setAllItems([]);
      setStock([]);
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [itemsData, ledgerData] = await Promise.all([
          itemsApi.getAll({ paginate: false, status: 'active', itemType: 'all' }),
          ledgerApi.getAll({}, 1, 2000).then((r) => r.data),
        ]);
        if (!active) return;
        setAllItems(itemsData.length ? itemsData : (USE_MOCK ? fallbackItems : []));
        const computed = computeBalances(ledgerData ?? []);
        setStock(computed.length ? computed : (USE_MOCK ? fallbackStock : []));
      } catch {
        if (!active) return;
        setAllItems(USE_MOCK ? fallbackItems : []);
        setStock(USE_MOCK ? fallbackStock : []);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [enabled]);

  const items = useMemo(
    () => allItems.filter((item) => item.itemType === 'raw'),
    [allItems],
  );

  const finishedItems = useMemo(
    () => allItems.filter((item) => item.itemType === 'finished'),
    [allItems],
  );

  const itemNameById = useMemo(() => {
    const map = new Map<string, string>();
    allItems.forEach((item) => {
      map.set(item.id, item.storeName || item.tallyName || item.sku);
    });
    return map;
  }, [allItems]);

  const batchesByItemId = useMemo(() => {
    const map = new Map<string, StockBatch[]>();
    stock.forEach((batch) => {
      const list = map.get(batch.itemId) ?? [];
      list.push(batch);
      map.set(batch.itemId, list);
    });
    return map;
  }, [stock]);

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
    rawItems: items,
    allItems,
    finishedItems,
    stock,
    loading,
    itemNameById,
    batchesByItemId,
    batchesByItemName,
  };
}
