import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import PartyMasterPage from './PartyMasterPage';

vi.mock('../services/partiesApi', () => ({
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

function renderPage() {
  return render(
    <TooltipProvider delayDuration={0}>
      <MemoryRouter initialEntries={['/parties']}>
        <Routes>
          <Route path="/parties" element={<PartyMasterPage />} />
          <Route path="/parties/:id" element={<div>Party Detail Screen</div>} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe('PartyMasterPage row actions', () => {
  it('keeps icon-only labels while preserving accessible names and view behavior', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: /Party Master/i, level: 1 })).toBeInTheDocument();
    expect(await screen.findByText(/ABC Steel Suppliers/i)).toBeInTheDocument();
    expect(screen.queryByText(/^View$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Edit$/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Edit$/i }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /^View$/i })[0]);
    expect(await screen.findByText(/Party Detail Screen/i)).toBeInTheDocument();
  });
});
