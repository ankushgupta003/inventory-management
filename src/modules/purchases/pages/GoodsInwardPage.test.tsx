import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GoodsInwardPage from './GoodsInwardPage';
import { purchasesApi } from '../services/purchasesApi';
import { partiesApi } from '@/modules/parties/services/partiesApi';
import { itemsApi } from '@/modules/items/services/itemsApi';

vi.mock('../services/purchasesApi', () => ({
  purchasesApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/modules/parties/services/partiesApi', () => ({
  partiesApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleStatus: vi.fn(),
    getAll: vi.fn(),
  },
}));

vi.mock('@/modules/items/services/itemsApi', () => ({
  itemsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleStatus: vi.fn(),
    getAll: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/purchases/create']}>
      <Routes>
        <Route path="/purchases/create" element={<GoodsInwardPage />} />
        <Route path="/purchases" element={<div>Purchase List Screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function setInputByName(container: HTMLElement, name: string, value: string) {
  const input = container.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
  if (!input) {
    throw new Error(`Input ${name} not found`);
  }
  fireEvent.change(input, { target: { value } });
}

describe('GoodsInwardPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads vendor and item options and submits a GIN successfully', async () => {
    vi.mocked(partiesApi.getAll).mockResolvedValue([
      {
        id: 'vendor-1',
        name: 'ABC Steel Suppliers',
        partyType: 'vendor',
        contactPerson: '',
        phone: '',
        altPhone: '',
        email: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        pincode: '',
        gstNumber: '',
        panNumber: '',
        openingBalance: 0,
        creditLimit: 0,
        remarks: '',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]);
    vi.mocked(itemsApi.getAll).mockResolvedValue([
      {
        id: 'item-1',
        storeName: 'Steel Rod 10mm',
        tallyName: 'STEEL-ROD-10',
        sku: 'SR-10',
        itemType: 'raw',
        categoryId: 'cat-raw-metal',
        category: 'Metal',
        baseUnit: 'kg',
        hsnCode: '7214',
        gstRate: 18,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]);
    vi.mocked(purchasesApi.create).mockResolvedValue({
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
      preparedBy: '',
      sanctionedBy: '',
      authorizedSignatory: '',
      totalTaxableValue: 400,
      totalCgstAmount: 0,
      totalSgstAmount: 0,
      totalIgstAmount: 0,
      totalAmount: 400,
      totalAcceptedQty: 8,
      totalRejectedQty: 2,
      items: [],
      createdAt: '',
      updatedAt: '',
    });

    const { container } = renderPage();

    const comboboxes = await screen.findAllByRole('combobox');
    fireEvent.click(comboboxes[0]);
    fireEvent.click(await screen.findByRole('option', { name: /ABC Steel Suppliers/i }));

    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: /Steel Rod 10mm/i }));

    setInputByName(container, 'challanNo', 'CH-001');
    setInputByName(container, 'billNo', 'BILL-001');
    setInputByName(container, 'gateEntryNo', 'GE-001');
    setInputByName(container, 'items.0.receivedQty', '10');
    setInputByName(container, 'items.0.batchNo', 'B-001');
    setInputByName(container, 'items.0.mfgDate', '2026-03-01');
    setInputByName(container, 'items.0.expiryDate', '2027-03-01');
    setInputByName(container, 'items.0.rate', '50');

    fireEvent.click(screen.getByRole('button', { name: /Save GIN/i }));

    await waitFor(() => expect(purchasesApi.create).toHaveBeenCalledTimes(1));
    expect(purchasesApi.create).toHaveBeenCalledWith(expect.objectContaining({
      vendorId: 'vendor-1',
      challanNo: 'CH-001',
      billNo: 'BILL-001',
      gateEntryNo: 'GE-001',
      items: [
        expect.objectContaining({
          itemId: 'item-1',
          receivedQty: 10,
          acceptedQty: 10,
          rejectedQty: 0,
          batchNo: 'B-001',
          rate: 50,
        }),
      ],
    }));

    expect(await screen.findByText(/Purchase List Screen/i)).toBeInTheDocument();
  });
});
