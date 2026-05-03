import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import PIListPage from './PIListPage';
import { piApi } from '../services/piApi';
import type { ProformaInvoiceRecord } from '../types';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) => [
      'proforma_invoices.create',
      'proforma_invoices.edit',
      'invoices.create',
    ].includes(permission),
  }),
}));

const testRecords: ProformaInvoiceRecord[] = [
  {
    id: 'pi-pending-1',
    piNo: 'PI-TEST-001',
    date: '2026-04-01',
    customerId: 'cust-1',
    customerName: 'Acme Pharma',
    customerAddress: 'Plot 5',
    items: [
      {
        id: 'pi-line-1',
        itemId: 'fg-1',
        itemName: 'Capsule A',
        unit: 'pcs',
        quantity: 10,
        invoicedQty: 0,
        remainingQty: 10,
        rate: 120,
        amount: 1200,
        remarks: '',
      },
    ],
    totalQuantity: 10,
    totalAmount: 1200,
    status: 'pending',
    createdAt: '2026-04-01',
  },
  {
    id: 'pi-complete-1',
    piNo: 'PI-TEST-002',
    date: '2026-04-02',
    customerId: 'cust-2',
    customerName: 'Beta Labs',
    customerAddress: 'Plot 8',
    items: [
      {
        id: 'pi-line-2',
        itemId: 'fg-2',
        itemName: 'Sanitizer Bottle',
        unit: 'pcs',
        quantity: 5,
        invoicedQty: 5,
        remainingQty: 0,
        rate: 200,
        amount: 1000,
        remarks: '',
      },
    ],
    totalQuantity: 5,
    totalAmount: 1000,
    status: 'completed',
    createdAt: '2026-04-02',
  },
];

function renderPage() {
  return render(
    <TooltipProvider delayDuration={0}>
      <MemoryRouter initialEntries={['/proforma-invoices']}>
        <Routes>
          <Route path="/proforma-invoices" element={<PIListPage />} />
          <Route path="/proforma-invoices/:id" element={<div>PI Detail Screen</div>} />
          <Route path="/proforma-invoices/:id/edit" element={<div>PI Edit Screen</div>} />
          <Route path="/invoices/create" element={<div>Invoice Create Screen</div>} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe('PIListPage row actions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders permission-aware PI actions and routes convert through invoice create', async () => {
    vi.spyOn(piApi, 'getAll').mockResolvedValue(testRecords);
    const closeSpy = vi.spyOn(piApi, 'close').mockResolvedValue({ ...testRecords[0], status: 'closed' });

    renderPage();

    expect(await screen.findByText(/PI-TEST-001/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Edit$/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^Convert$/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /^Close$/i })).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }));
    expect(await screen.findByText(/PI Edit Screen/i)).toBeInTheDocument();

    cleanup();
    renderPage();
    expect(await screen.findByText(/PI-TEST-001/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /^Convert$/i })[0]);
    expect(await screen.findByText(/Invoice Create Screen/i)).toBeInTheDocument();

    cleanup();
    renderPage();
    expect(await screen.findByText(/PI-TEST-001/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /^Close$/i })[0]);
    await waitFor(() => expect(closeSpy).toHaveBeenCalledWith('pi-pending-1'));

    expect(screen.getAllByRole('button', { name: /^Convert$/i })[1]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /^Close$/i })[1]).toBeDisabled();
  });
});
