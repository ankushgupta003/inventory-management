import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import PartyMasterPage from '@/modules/parties/pages/PartyMasterPage';
import ProductionListPage from '@/modules/production/pages/ProductionListPage';
import InvoiceListPage from '@/modules/invoices/pages/InvoiceListPage';
import StockLedgerPage from '@/modules/ledger/pages/StockLedgerPage';
import { ALL_PERMISSION_KEYS } from '@/constants/permissions';

vi.mock('@/modules/parties/services/partiesApi', () => ({
  partiesApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'party-1',
          name: 'ABC Steel Suppliers',
          partyType: 'vendor',
          contactPerson: 'Rajesh Kumar',
          phone: '9876543210',
          altPhone: '',
          email: 'rajesh@abcsteel.com',
          address1: 'Plot 45, MIDC',
          address2: 'Andheri East',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400093',
          gstNumber: '27AABCU9603R1ZM',
          panNumber: 'AABCU9603R',
          openingBalance: 50000,
          creditLimit: 200000,
          remarks: 'Primary steel vendor',
          isActive: true,
          createdAt: '2024-01-10T00:00:00.000Z',
          updatedAt: '2024-01-10T00:00:00.000Z',
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
          status: 'all',
          partyType: 'all',
        },
        sort: {
          sortBy: 'name',
          sortOrder: 'asc',
        },
        summary: {
          total: 1,
          active: 1,
          inactive: 0,
          vendors: 1,
          customers: 0,
          both: 0,
        },
      },
    }),
    create: vi.fn(),
    update: vi.fn(),
    toggleStatus: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(),
  },
}));

function renderWithTooltip(ui: ReactNode) {
  localStorage.clear();
  localStorage.setItem('auth_token', 'mock-jwt-token');
  localStorage.setItem('auth_portal', 'company');
  localStorage.setItem(
    'auth_user',
    JSON.stringify({
      id: 'company-admin-1',
      email: 'admin@inventoryx.test',
      fullName: 'Inventory Admin',
      name: 'Inventory Admin',
      accountType: 'COMPANY_ADMIN',
      companyId: 'company-1',
      companyName: 'InventoryX Demo',
      companyStatus: 'ACTIVE',
      mustResetPassword: false,
      isActive: true,
      permissions: [...ALL_PERMISSION_KEYS],
      departmentId: null,
      departmentName: null,
      designationId: null,
      designationName: null,
      roleId: null,
      roleName: 'Administrator',
    }),
  );

  return render(
    <AuthProvider>
      <TooltipProvider delayDuration={0}>
        {ui}
      </TooltipProvider>
    </AuthProvider>,
  );
}

describe('Simple list page composition', () => {
  it('renders Party Master with filters and actions inside the table header', async () => {
    renderWithTooltip(
      <MemoryRouter>
        <PartyMasterPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Party Master/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Parties$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Party/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by name, GST, phone, city/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Filters$/i)).not.toBeInTheDocument();
  });

  it('renders Production list with inline filters and actions', async () => {
    renderWithTooltip(
      <MemoryRouter>
        <ProductionListPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Production Batches/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by production no, batch no, or product/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Production Batches/i).length).toBeGreaterThan(1);
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Batch/i })).toBeInTheDocument();
  });

  it('renders Invoice and Ledger with shared layout affordances', async () => {
    renderWithTooltip(
      <MemoryRouter>
        <InvoiceListPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Final Invoice/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Invoice/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search invoice no, PI no, or customer/i)).toBeInTheDocument();

    renderWithTooltip(
      <MemoryRouter>
        <StockLedgerPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/^Ledger$/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Transactions/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Export CSV/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Filters$/i)).not.toBeInTheDocument();
  });
});
