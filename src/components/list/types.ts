import type { LucideIcon } from 'lucide-react';

export type ListVisualPreset = 'standard' | 'premium' | 'simple';
export type TableDensity = 'comfortable' | 'compact';

export interface ListPageKpi {
  id: string;
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: 'blue' | 'green' | 'orange' | 'purple';
  secondary?: string;
  delta?: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
}

export interface ListFilterConfig {
  key: string;
  label: string;
  type: 'search' | 'select' | 'date';
}

export interface ListRowAction {
  id: string;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'info' | 'success' | 'danger';
}

export interface PaginatedResultMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRows: number;
  startRow: number;
  endRow: number;
}
