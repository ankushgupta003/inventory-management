import { useState, useMemo, useCallback } from 'react';
import type { MRSRecord, MRSFilters } from '../types';

const mockItems = [
  { id: '1', name: 'Steel Rod 10mm', unit: 'kg' },
  { id: '2', name: 'Copper Wire 2mm', unit: 'kg' },
  { id: '3', name: 'Lubricant Oil', unit: 'liter' },
  { id: '4', name: 'Packing Box Large', unit: 'pcs' },
  { id: '5', name: 'Aluminium Sheet 3mm', unit: 'kg' },
];

const mockData: MRSRecord[] = [
  {
    id: 'mrs-1', mrsNo: 'MRS-001', date: '2026-03-28', department: 'Production',
    requisitionBy: 'Ramesh Kumar', sanctionedBy: '', issuedBy: '', receivedBy: '',
    status: 'pending', createdAt: '2026-03-28',
    items: [
      { itemId: '1', itemName: 'Steel Rod 10mm', unit: 'kg', qtyRequested: 100, qtyIssued: 0, batchNo: '', remarks: 'Urgent' },
      { itemId: '2', itemName: 'Copper Wire 2mm', unit: 'kg', qtyRequested: 50, qtyIssued: 0, batchNo: '', remarks: '' },
    ],
  },
  {
    id: 'mrs-2', mrsNo: 'MRS-002', date: '2026-03-27', department: 'Testing',
    requisitionBy: 'Suresh Sharma', sanctionedBy: 'Amit Patel', issuedBy: '', receivedBy: '',
    status: 'approved', createdAt: '2026-03-27',
    items: [
      { itemId: '3', itemName: 'Lubricant Oil', unit: 'liter', qtyRequested: 20, qtyIssued: 0, batchNo: '', remarks: '' },
    ],
  },
  {
    id: 'mrs-3', mrsNo: 'MRS-003', date: '2026-03-25', department: 'Production',
    requisitionBy: 'Vikram Singh', sanctionedBy: 'Amit Patel', issuedBy: 'Ravi Verma', receivedBy: 'Vikram Singh',
    status: 'issued', createdAt: '2026-03-25',
    items: [
      { itemId: '4', itemName: 'Packing Box Large', unit: 'pcs', qtyRequested: 200, qtyIssued: 195, batchNo: 'B-2026-010', remarks: '5 damaged' },
      { itemId: '5', itemName: 'Aluminium Sheet 3mm', unit: 'kg', qtyRequested: 75, qtyIssued: 75, batchNo: 'B-2026-011', remarks: '' },
    ],
  },
];

export function useMRSList() {
  const [records, setRecords] = useState<MRSRecord[]>(mockData);
  const [filters, setFilters] = useState<MRSFilters>({ search: '', status: 'all' });

  const filtered = useMemo(() => {
    let data = records;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (r) =>
          r.mrsNo.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.requisitionBy.toLowerCase().includes(q)
      );
    }
    if (filters.status !== 'all') data = data.filter((r) => r.status === filters.status);
    return data;
  }, [records, filters]);

  const updateStatus = useCallback((id: string, status: MRSRecord['status']) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  const addRecord = useCallback((record: MRSRecord) => {
    setRecords((prev) => [record, ...prev]);
  }, []);

  return { records: filtered, allRecords: records, filters, setFilters, updateStatus, addRecord };
}

export function useAvailableItems() {
  return mockItems;
}
