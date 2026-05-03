import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { productionApi } from '../services/productionApi';
import { stockMovementApi } from '@/modules/stock-movement/services/stockMovementApi';
import ProductionViewPage from './ProductionViewPage';

let currentPermissions: string[] = [];

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) => currentPermissions.includes(permission),
  }),
}));

vi.mock('@/modules/bmr', () => ({
  BMRFormPage: () => <div>BMR Form Stub</div>,
}));

vi.mock('@/modules/issues/hooks/useIssueStock', () => ({
  useIssueStock: () => ({
    items: [],
    stock: [],
    loading: false,
    itemNameById: new Map(),
    batchesByItemName: new Map(),
  }),
}));

vi.mock('@/modules/mrs/hooks/useMRS', () => ({
  useAvailableItems: () => ({
    items: [],
    loading: false,
    options: [],
  }),
}));

vi.mock('@/modules/mrs/services/mrsApi', () => ({
  default: {
    create: vi.fn(),
    approve: vi.fn(),
  },
}));

vi.mock('../services/productionApi', () => ({
  productionApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    getBmr: vi.fn(),
    saveBmr: vi.fn(),
    submitBmr: vi.fn(),
    submitQa: vi.fn(),
    getMrs: vi.fn(),
  },
}));

vi.mock('@/modules/stock-movement/services/stockMovementApi', () => ({
  stockMovementApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

const batchRecord = {
  id: 'batch-1',
  itemId: 'fg-1',
  productionNo: 'PRD-00001',
  batchNo: 'FG-001',
  productName: 'Finished Product A',
  batchSize: '500',
  status: 'IN_PROCESS' as const,
  startDate: '2026-04-08',
  mfgDate: '2026-04-08',
  expDate: '2028-04-08',
  expectedQty: 0,
  actualQty: 0,
  rejectedQty: 0,
  bmrStatus: 'DRAFT' as const,
  qaApprovedBy: '',
  qaRemarks: '',
  qaDecidedAt: '',
  createdAt: '2026-04-08T00:00:00.000Z',
  updatedAt: '2026-04-08T00:00:00.000Z',
  mrsCount: 0,
  movementCount: 0,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/production/batch-1']}>
      <Routes>
        <Route path="/production/:id" element={<ProductionViewPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProductionViewPage permission-aware loading', () => {
  beforeEach(() => {
    currentPermissions = ['production.view'];
    vi.mocked(productionApi.getById).mockResolvedValue(batchRecord);
    vi.mocked(productionApi.getMrs).mockResolvedValue([]);
    vi.mocked(productionApi.getBmr).mockResolvedValue(null);
    vi.mocked(stockMovementApi.getAll).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    currentPermissions = [];
  });

  it('keeps the batch visible without stock movement view permission', async () => {
    renderPage();

    expect(await screen.findByText('PRD-00001')).toBeInTheDocument();
    expect(screen.getByText(/stock movement history is available only to users with `stock_movement.view`/i)).toBeInTheDocument();
    expect(screen.queryByText('Batch not found.')).not.toBeInTheDocument();
    expect(vi.mocked(stockMovementApi.getAll)).not.toHaveBeenCalled();
  });

  it('loads stock movement history when the user has stock_movement.view', async () => {
    currentPermissions = ['production.view', 'stock_movement.view'];
    vi.mocked(stockMovementApi.getAll).mockResolvedValue([
      {
        id: 'sm-1',
        movementNo: 'MOV-00001',
        date: '2026-04-08',
        type: 'issue',
        itemName: 'Cotton',
        batchNo: 'RM-001',
        quantity: 80,
        mrsNo: 'MRS-00001',
      },
    ]);

    renderPage();

    expect(await screen.findByText('MOV-00001')).toBeInTheDocument();
    expect(vi.mocked(stockMovementApi.getAll)).toHaveBeenCalledWith({ productionBatchId: 'batch-1' });
    expect(screen.queryByText(/stock movement history is available only/i)).not.toBeInTheDocument();
  });
});
