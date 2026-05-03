import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIssueStock } from '@/modules/issues/hooks/useIssueStock';
import { itemsApi } from '@/modules/items/services/itemsApi';
import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import { useAvailableItems } from '@/modules/mrs/hooks/useMRS';

vi.mock('@/modules/items/services/itemsApi', () => ({
  itemsApi: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/modules/ledger/services/ledgerApi', () => ({
  ledgerApi: {
    getAll: vi.fn(),
  },
}));

describe('permission-aware helper hooks', () => {
  beforeEach(() => {
    vi.mocked(itemsApi.getAll).mockReset();
    vi.mocked(ledgerApi.getAll).mockReset();
  });

  it('useIssueStock skips item and ledger fetches when disabled', () => {
    const { result } = renderHook(() => useIssueStock(false));

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.stock).toEqual([]);
    expect(vi.mocked(itemsApi.getAll)).not.toHaveBeenCalled();
    expect(vi.mocked(ledgerApi.getAll)).not.toHaveBeenCalled();
  });

  it('useAvailableItems skips item fetches when disabled', () => {
    const { result } = renderHook(() => useAvailableItems(false));

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.options).toEqual([]);
    expect(vi.mocked(itemsApi.getAll)).not.toHaveBeenCalled();
  });
});
