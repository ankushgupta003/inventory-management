import type { MRSItemRow } from '../types';

export type MRSProgressStatus = 'pending' | 'partial' | 'completed';

export function getMRSProgress(items: MRSItemRow[]) {
  const requested = items.reduce((sum, item) => sum + (item.qtyRequested || 0), 0);
  const issued = items.reduce((sum, item) => sum + (item.qtyIssued || 0), 0);
  const remaining = Math.max(0, requested - issued);
  const status: MRSProgressStatus =
    issued <= 0 ? 'pending' : issued < requested ? 'partial' : 'completed';
  return { requested, issued, remaining, status };
}
