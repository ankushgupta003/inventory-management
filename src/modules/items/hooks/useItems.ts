import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { ItemRecord, ItemFilters } from '../types';

const SEED_DATA: ItemRecord[] = [
  { id: '1', storeName: 'Steel Rod 10mm', tallyName: 'STEEL-ROD-10', type: 'raw_material', baseUnit: 'kg', conversionEnabled: true, alternateUnit: 'ton', conversionFactor: 1000, purchaseRate: 55, sellingRate: 0, hsnCode: '7214', taxPercent: 18, isActive: true, currentStock: 450, createdAt: '2024-01-15' },
  { id: '2', storeName: 'Copper Wire 2mm', tallyName: 'COPPER-WIRE-2', type: 'raw_material', baseUnit: 'kg', conversionEnabled: false, purchaseRate: 720, sellingRate: 0, hsnCode: '7408', taxPercent: 18, isActive: true, currentStock: 120, createdAt: '2024-01-16' },
  { id: '3', storeName: 'Motor Assembly A1', tallyName: 'MOTOR-A1', type: 'finished_good', baseUnit: 'pcs', conversionEnabled: true, alternateUnit: 'box', conversionFactor: 10, purchaseRate: 0, sellingRate: 4500, hsnCode: '8501', taxPercent: 12, isActive: true, currentStock: 85, createdAt: '2024-02-01' },
  { id: '4', storeName: 'Gear Box GB-200', tallyName: 'GEARBOX-200', type: 'finished_good', baseUnit: 'pcs', conversionEnabled: false, purchaseRate: 0, sellingRate: 8200, hsnCode: '8483', taxPercent: 18, isActive: true, currentStock: 42, createdAt: '2024-02-10' },
  { id: '5', storeName: 'Packing Box Large', tallyName: 'PKG-BOX-L', type: 'raw_material', baseUnit: 'pcs', conversionEnabled: true, alternateUnit: 'bundle', conversionFactor: 25, purchaseRate: 35, sellingRate: 0, hsnCode: '4819', taxPercent: 12, isActive: false, currentStock: 300, createdAt: '2024-03-01' },
  { id: '6', storeName: 'Bearing 6205', tallyName: 'BEARING-6205', type: 'raw_material', baseUnit: 'pcs', conversionEnabled: false, purchaseRate: 180, sellingRate: 0, hsnCode: '8482', taxPercent: 18, isActive: true, currentStock: 0, createdAt: '2024-03-15' },
];

export function useItems() {
  const [items, setItems] = useState<ItemRecord[]>(SEED_DATA);
  const [filters, setFilters] = useState<ItemFilters>({ search: '', type: 'all', status: 'all' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timerRef.current);
  }, [filters.search]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !debouncedSearch ||
        item.storeName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.tallyName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.hsnCode.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchType = filters.type === 'all' || item.type === filters.type;
      const matchStatus = filters.status === 'all' ||
        (filters.status === 'active' ? item.isActive : !item.isActive);
      return matchSearch && matchType && matchStatus;
    });
  }, [items, debouncedSearch, filters.type, filters.status]);

  const addItem = useCallback((data: Omit<ItemRecord, 'id' | 'currentStock' | 'createdAt'>) => {
    const newItem: ItemRecord = { ...data, id: Date.now().toString(), currentStock: 0, createdAt: new Date().toISOString().split('T')[0] };
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
