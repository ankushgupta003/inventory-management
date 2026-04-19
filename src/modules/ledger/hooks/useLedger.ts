import { useState, useMemo, useCallback, useEffect } from 'react';
import type { LedgerEntry, LedgerFilters, ItemCategory } from '../types';
import { ledgerApi } from '../services/ledgerApi';

const MOCK_DATA: LedgerEntry[] = [
  { id: '1', date: '2025-04-01', referenceNo: 'GIN-001', type: 'purchase', particulars: 'ABC Chemicals Pvt Ltd', itemName: 'Sodium Chloride', itemCategory: 'RAW', batchNo: 'B-2025-001', mfgDate: '2025-03-15', expiryDate: '2027-03-15', receiptQty: 500, issueQty: 0, rate: 45, remarks: 'Initial purchase' },
  { id: '2', date: '2025-04-03', referenceNo: 'MRS-001', type: 'issue', particulars: 'Production Dept', itemName: 'Sodium Chloride', itemCategory: 'RAW', batchNo: 'B-2025-001', mfgDate: '2025-03-15', expiryDate: '2027-03-15', receiptQty: 0, issueQty: 100, rate: 45, remarks: 'For Batch P-101' },
  { id: '3', date: '2025-04-03', referenceNo: 'PRD-001', type: 'production', particulars: 'Production Output', itemName: 'Finished Product A', itemCategory: 'FINISHED', batchNo: 'FP-001', mfgDate: '2025-04-03', expiryDate: '2027-04-03', receiptQty: 80, issueQty: 0, rate: 120, remarks: 'Batch P-101' },
  { id: '4', date: '2025-04-05', referenceNo: 'GIN-002', type: 'purchase', particulars: 'XYZ Supplies', itemName: 'Sodium Chloride', itemCategory: 'RAW', batchNo: 'B-2025-002', mfgDate: '2025-04-01', expiryDate: '2027-04-01', receiptQty: 300, issueQty: 0, rate: 47, remarks: '' },
  { id: '5', date: '2025-04-06', referenceNo: 'INV-001', type: 'invoice', particulars: 'Customer Corp', itemName: 'Finished Product A', itemCategory: 'FINISHED', batchNo: 'FP-001', mfgDate: '2025-04-03', expiryDate: '2027-04-03', receiptQty: 0, issueQty: 30, rate: 200, remarks: 'Sales' },
  { id: '6', date: '2025-04-07', referenceNo: 'RET-001', type: 'return', particulars: 'ABC Chemicals Pvt Ltd', itemName: 'Sodium Chloride', itemCategory: 'RAW', batchNo: 'B-2025-001', mfgDate: '2025-03-15', expiryDate: '2027-03-15', receiptQty: 0, issueQty: 20, rate: 45, remarks: 'Rejected lot returned' },
  { id: '7', date: '2025-04-08', referenceNo: 'SMP-001', type: 'sampling', particulars: 'QC Lab', itemName: 'Sodium Chloride', itemCategory: 'RAW', batchNo: 'B-2025-002', mfgDate: '2025-04-01', expiryDate: '2027-04-01', receiptQty: 0, issueQty: 5, rate: 47, remarks: 'Quality testing' },
  { id: '8', date: '2025-04-10', referenceNo: 'TRF-001', type: 'transfer', particulars: 'Warehouse B → Warehouse A', itemName: 'Sodium Chloride', itemCategory: 'RAW', batchNo: 'B-2025-002', mfgDate: '2025-04-01', expiryDate: '2027-04-01', receiptQty: 0, issueQty: 0, rate: 47, remarks: 'Internal transfer log' },
  { id: '9', date: '2025-04-12', referenceNo: 'MRS-002', type: 'issue', particulars: 'R&D Dept', itemName: 'Sodium Chloride', itemCategory: 'RAW', batchNo: 'B-2025-001', mfgDate: '2025-03-15', expiryDate: '2027-03-15', receiptQty: 0, issueQty: 50, rate: 45, remarks: 'Testing' },
  { id: '10', date: '2025-04-15', referenceNo: 'GIN-003', type: 'purchase', particulars: 'ABC Chemicals Pvt Ltd', itemName: 'Citric Acid', itemCategory: 'RAW', batchNo: 'CA-001', mfgDate: '2025-04-10', expiryDate: '2026-04-10', receiptQty: 200, issueQty: 0, rate: 85, remarks: '' },
  { id: '11', date: '2025-04-16', referenceNo: 'MRS-003', type: 'issue', particulars: 'Production Dept', itemName: 'Citric Acid', itemCategory: 'RAW', batchNo: 'CA-001', mfgDate: '2025-04-10', expiryDate: '2026-04-10', receiptQty: 0, issueQty: 60, rate: 85, remarks: '' },
  { id: '12', date: '2025-04-18', referenceNo: 'PRD-002', type: 'production', particulars: 'Production Output', itemName: 'Finished Product B', itemCategory: 'FINISHED', batchNo: 'FP-002', mfgDate: '2025-04-18', expiryDate: '2027-04-18', receiptQty: 50, issueQty: 0, rate: 180, remarks: '' },
];

const defaultFilters: LedgerFilters = {
  itemId: 'all',
  batchNo: 'all',
  dateFrom: '',
  dateTo: '',
  type: 'all',
};

export function useLedger(category: ItemCategory) {
  const [data, setData] = useState<LedgerEntry[]>([]);
  const [filters, setFilters] = useState<LedgerFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await ledgerApi.getAll({}, 1, 2000);
        if (!active) return;
        setData(res.data ?? []);
      } catch {
        if (active) setData(MOCK_DATA);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const source = data.length ? data : MOCK_DATA;
  const categoryData = useMemo(() => source.filter((e) => e.itemCategory === category), [source, category]);

  const items = useMemo(() => [...new Set(categoryData.map((e) => e.itemName))], [categoryData]);
  const batches = useMemo(() => [...new Set(categoryData.map((e) => e.batchNo))], [categoryData]);

  const filtered = useMemo(() => {
    let data = [...categoryData];
    if (filters.itemId !== 'all') data = data.filter((e) => e.itemName === filters.itemId);
    if (filters.batchNo !== 'all') data = data.filter((e) => e.batchNo === filters.batchNo);
    if (filters.type !== 'all') data = data.filter((e) => e.type === filters.type);
    if (filters.dateFrom) data = data.filter((e) => e.date >= filters.dateFrom);
    if (filters.dateTo) data = data.filter((e) => e.date <= filters.dateTo);
    data.sort((a, b) => a.date.localeCompare(b.date) || a.itemName.localeCompare(b.itemName) || a.batchNo.localeCompare(b.batchNo));
    return data;
  }, [categoryData, filters]);

  const withBalance = useMemo(() => {
    const balances: Record<string, number> = {};
    return filtered.map((entry) => {
      const key = `${entry.itemName}||${entry.batchNo}`;
      const prev = balances[key] ?? 0;
      const balance = prev + entry.receiptQty - entry.issueQty;
      balances[key] = balance;
      return { ...entry, balanceQty: balance, value: (entry.receiptQty || entry.issueQty) * entry.rate };
    });
  }, [filtered]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return withBalance.slice(start, start + pageSize);
  }, [withBalance, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(withBalance.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPage(1);
  }, []);

  const applyFilters = useCallback((f: Partial<LedgerFilters>) => {
    setFilters((prev) => ({ ...prev, ...f }));
    setPage(1);
  }, []);

  const changePageSize = useCallback((next: number) => {
    setPageSize(next);
    setPage(1);
  }, []);

  return {
    entries: paginated,
    filteredEntries: withBalance,
    totalEntries: withBalance.length,
    filters,
    applyFilters,
    resetFilters,
    page,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    totalPages,
    items,
    batches,
  };
}
