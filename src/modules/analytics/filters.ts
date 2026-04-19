import type { ReportFilters } from './types';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (value: string) => {
  if (!value || !ISO_DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toIso = (value: Date) => value.toISOString().slice(0, 10);

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const getDateBounds = (filters: ReportFilters) => {
  const today = startOfToday();

  if (filters.dateWindow === 'today') {
    const iso = toIso(today);
    return { from: iso, to: iso };
  }
  if (filters.dateWindow === '7d' || filters.dateWindow === '30d') {
    const days = filters.dateWindow === '7d' ? 7 : 30;
    const from = new Date(today);
    from.setDate(from.getDate() - (days - 1));
    return { from: toIso(from), to: toIso(today) };
  }

  const customFrom = toDate(filters.dateFrom);
  const customTo = toDate(filters.dateTo);
  const from = customFrom ? toIso(customFrom) : '';
  const to = customTo ? toIso(customTo) : '';
  return { from, to };
};

export const isWithinDateBounds = (date: string, filters: ReportFilters) => {
  if (!date) return false;
  const { from, to } = getDateBounds(filters);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

export const makeDefaultFilters = (): ReportFilters => ({
  dateWindow: '30d',
  dateFrom: '',
  dateTo: '',
  itemName: 'all',
  batchNo: 'all',
  partyName: 'all',
  status: 'all',
});

