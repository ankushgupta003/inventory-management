import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PartyMasterPage from '@/modules/parties/pages/PartyMasterPage';
import ProductionListPage from '@/modules/production/pages/ProductionListPage';
import InvoiceListPage from '@/modules/invoices/pages/InvoiceListPage';
import StockLedgerPage from '@/modules/ledger/pages/StockLedgerPage';

describe('Premium list page composition', () => {
  it('renders Party Master with KPI/filter/table structure', async () => {
    render(
      <MemoryRouter>
        <PartyMasterPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Party Master/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Filters/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Parties$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Party/i })).toBeInTheDocument();
  });

  it('renders Production list with consistent premium sections', async () => {
    render(
      <MemoryRouter>
        <ProductionListPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Production Batches/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/^Filters$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Production Batches/i).length).toBeGreaterThan(1);
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
  });

  it('renders Invoice and Stock Ledger with shared layout affordances', async () => {
    render(
      <MemoryRouter>
        <InvoiceListPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Final Invoice/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Invoice/i })).toBeInTheDocument();

    render(
      <MemoryRouter>
        <StockLedgerPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Stock Ledger/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Export CSV/i }).length).toBeGreaterThan(0);
  });
});
