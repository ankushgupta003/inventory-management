import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { ItemRecord, ItemFilters } from '../types';

const SEED_DATA: ItemRecord[] = [
  { id: '1', storeName: 'Steel Rod 10mm', tallyName: 'STEEL-ROD-10', sku: 'SR-10MM', baseUnit: 'kg', tallyUnit: 'ton', conversionFactor: 1000, hsnCode: '7214', gstRate: 18, gstEffectiveFrom: '2024-01-01', isActive: true, createdAt: '2024-01-15' },
  { id: '2', storeName: 'Copper Wire 2mm', tallyName: 'COPPER-WIRE-2', sku: 'CW-2MM', baseUnit: 'kg', tallyUnit: '', hsnCode: '7408', gstRate: 18, gstEffectiveFrom: '2024-01-01', isActive: true, createdAt: '2024-01-16' },
  { id: '3', storeName: 'Motor Assembly A1', tallyName: 'MOTOR-A1', sku: 'MA-A1', baseUnit: 'pcs', tallyUnit: 'nos', conversionFactor: 1, hsnCode: '8501', gstRate: 12, gstEffectiveFrom: '2024-04-01', isActive: true, createdAt: '2024-02-01' },
  { id: '4', storeName: 'Gear Box GB-200', tallyName: 'GEARBOX-200', sku: '', baseUnit: 'pcs', tallyUnit: '', hsnCode: '8483', gstRate: 18, gstEffectiveFrom: '2024-01-01', isActive: true, createdAt: '2024-02-10' },
  { id: '5', storeName: 'Packing Box Large', tallyName: 'PKG-BOX-L', sku: 'PB-LG', baseUnit: 'pcs', tallyUnit: 'bundle', conversionFactor: 25, hsnCode: '4819', gstRate: 12, gstEffectiveFrom: '2024-01-01', isActive: false, createdAt: '2024-03-01' },
  { id: '6', storeName: 'Bearing 6205', tallyName: 'BEARING-6205', sku: 'BR-6205', baseUnit: 'pcs', tallyUnit: '', hsnCode: '8482', gstRate: 18, gstEffectiveFrom: '2024-01-01', isActive: true, createdAt: '2024-03-15' },
];

export function useItems() {
  const [items, setItems] = useState<ItemRecord[]>(SEED_DATA);
  const [filters, setFilters] = useState<ItemFilters>({ search: '', status: 'all' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timerRef.current);
  }, [filters.search]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q ||
        item.storeName.toLowerCase().includes(q) ||
        item.tallyName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.hsnCode.toLowerCase().includes(q);
      const matchStatus = filters.status === 'all' ||
        (filters.status === 'active' ? item.isActive : !item.isActive);
      return matchSearch && matchStatus;
    });
  }, [items, debouncedSearch, filters.status]);

  const addItem = useCallback((data: Omit<ItemRecord, 'id' | 'createdAt'>) => {
    const newItem: ItemRecord = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] };
    setItems((prev) => [newItem, ...prev]);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, data: Partial<ItemRecord>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items: filtered, allItems: items, filters, setFilters, addItem, updateItem, deleteItem };
}
