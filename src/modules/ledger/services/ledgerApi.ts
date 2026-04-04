import api from '@/services/api';
import type { LedgerEntry, LedgerFilters } from '../types';

export const ledgerApi = {
  getAll: (filters?: Partial<LedgerFilters>, page = 1, limit = 50) =>
    api
      .get<{ data: LedgerEntry[]; total: number }>('/ledger', {
        params: { ...filters, page, limit },
      })
      .then((r) => r.data),
  create: (data: Partial<LedgerEntry> | { entries: Partial<LedgerEntry>[] }) =>
    api.post('/ledger', data).then((r) => r.data),
};
