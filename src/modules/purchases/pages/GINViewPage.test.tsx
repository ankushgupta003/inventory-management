import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GINViewPage from './GINViewPage';
import { purchasesApi } from '../services/purchasesApi';

vi.mock('../services/purchasesApi', () => ({
  purchasesApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      companyName: 'Acme Labs',
    },
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/purchases/gin-1']}>
      <Routes>
        <Route path="/purchases/:id" element={<GINViewPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GINViewPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders real GIN data and prints with the authenticated company name', async () => {
    Object.defineProperty(window, 'print', {
      writable: true,
      value: vi.fn(),
    });

    vi.mocked(purchasesApi.getById).mockResolvedValue({
      id: 'gin-1',
      ginNo: 'GIN-00001',
      vendorId: 'vendor-1',
      vendorName: 'ABC Steel Suppliers',
      challanNo: 'CH-001',
      challanDate: '2026-04-01',
      billNo: 'BILL-001',
      billDate: '2026-04-01',
      gateEntryNo: 'GE-001',
      entryDate: '2026-04-01',
      preparedBy: 'Stores',
      sanctionedBy: 'QA Lead',
      authorizedSignatory: 'Plant Head',
      totalTaxableValue: 400,
      totalCgstAmount: 0,
      totalSgstAmount: 0,
      totalIgstAmount: 0,
      totalAmount: 400,
      totalAcceptedQty: 8,
      totalRejectedQty: 2,
      items: [
        {
          id: 'line-1',
          lineNo: 1,
          itemId: 'item-1',
          itemName: 'Steel Rod 10mm',
          itemType: 'raw',
          baseUnit: 'kg',
          ulpQty: 10,
          billQty: 10,
          receivedQty: 10,
          acceptedQty: 8,
          rejectedQty: 2,
          batchNo: 'B-001',
          mfgDate: '2026-03-01',
          expiryDate: '2027-03-01',
          rate: 50,
          taxableValue: 400,
          cgstRate: 0,
          cgstAmount: 0,
          sgstRate: 0,
          sgstAmount: 0,
          igstRate: 0,
          igstAmount: 0,
          lineTotalAmount: 400,
          amount: 400,
          remarks: 'Accepted with minor bends',
        },
      ],
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    });

    renderPage();

    expect(await screen.findByText(/Acme Labs/i)).toBeInTheDocument();
    expect(screen.getByText(/GIN-00001/i)).toBeInTheDocument();
    expect(screen.getByText(/Steel Rod 10mm/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Print/i }));
    expect(window.print).toHaveBeenCalled();
  });
});
