import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import GINListPage from './GINListPage';
import { purchasesApi } from '../services/purchasesApi';

vi.mock('../services/purchasesApi', () => ({
  purchasesApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <TooltipProvider delayDuration={0}>
      <MemoryRouter initialEntries={['/purchases']}>
        <Routes>
          <Route path="/purchases" element={<GINListPage />} />
          <Route path="/purchases/:id" element={<div>GIN Detail Screen</div>} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe('GINListPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders API data, exports CSV, and keeps only the view action', async () => {
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:mock', writable: true });
    }
    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', { value: () => {}, writable: true });
    }

    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    vi.mocked(purchasesApi.list).mockResolvedValue({
      data: [
        {
          id: 'gin-1',
          ginNo: 'GIN-00001',
          vendorId: 'vendor-1',
          vendorName: 'ABC Steel Suppliers',
          challanNo: 'CH-001',
          billNo: 'BILL-001',
          gateEntryNo: 'GE-001',
          entryDate: '2026-04-01',
          totalAmount: 400,
          totalAcceptedQty: 8,
          totalRejectedQty: 2,
          itemCount: 1,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ],
      meta: {
        pagination: {
          page: 1,
          limit: 1,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          paginate: false,
        },
        filters: {
          search: '',
          vendorId: '',
          dateFrom: '',
          dateTo: '',
        },
        sort: {
          sortBy: 'entryDate',
          sortOrder: 'desc',
        },
        summary: {
          count: 1,
          totalAmount: 400,
          totalAcceptedQty: 8,
          totalRejectedQty: 2,
          vendorCount: 1,
        },
      },
    });

    renderPage();

    expect(await screen.findByText(/GIN-00001/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText(/GIN Detail Screen/i)).toBeInTheDocument());

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });
});
