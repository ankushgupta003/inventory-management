import { useEffect, useMemo, useState } from 'react';
import type { LedgerEntry } from '../types';
import { ledgerApi } from '../services/ledgerApi';

function getEntryDirectionPriority(entry: LedgerEntry) {
  if (entry.receiptQty > 0 && entry.issueQty <= 0) return 0;
  if (entry.receiptQty <= 0 && entry.issueQty <= 0) return 1;
  return 2;
}

function compareEntries(a: LedgerEntry, b: LedgerEntry) {
  const dateCompare = a.date.localeCompare(b.date);
  if (dateCompare !== 0) {
    return dateCompare;
  }

  const sameBatchOnSameItem = a.itemId === b.itemId && a.batchNo === b.batchNo;
  if (sameBatchOnSameItem) {
    const directionCompare = getEntryDirectionPriority(a) - getEntryDirectionPriority(b);
    if (directionCompare !== 0) {
      return directionCompare;
    }
  }

  return (
    a.createdAt.localeCompare(b.createdAt) ||
    a.referenceNo.localeCompare(b.referenceNo) ||
    a.id.localeCompare(b.id)
  );
}

export function useLedger() {
  const [data, setData] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await ledgerApi.getAll({ paginate: false }, 1, 5000);
        if (!active) return;
        setData(response.data ?? []);
      } catch {
        if (active) {
          setData([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const entries = useMemo(() => [...data].sort(compareEntries), [data]);

  return {
    entries,
    loading,
  };
}
