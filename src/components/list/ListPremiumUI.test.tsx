import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Users } from 'lucide-react';
import ListPageShell from './ListPageShell';
import ListKpiStrip from './ListKpiStrip';
import ListFilterBar from './ListFilterBar';
import ListTablePanel from './ListTablePanel';
import DataTable from '@/components/DataTable';

describe('Premium list UI', () => {
  it('renders premium list shell actions', () => {
    render(
      <ListPageShell
        title="Party Master"
        description="Premium header"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Party Master' }]}
        addLabel="Add Party"
        onAdd={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Party/i })).toBeInTheDocument();
  });

  it('renders KPI secondary and delta', () => {
    render(
      <ListKpiStrip
        items={[
          {
            id: 'total',
            label: 'Total Parties',
            value: '15',
            icon: Users,
            tone: 'blue',
            secondary: '5 shown',
            delta: '+6.3%',
            deltaTone: 'positive',
          },
        ]}
      />
    );

    expect(screen.getByText(/Total Parties/i)).toBeInTheDocument();
    expect(screen.getByText(/5 shown/i)).toBeInTheDocument();
    expect(screen.getByText(/\+6.3%/i)).toBeInTheDocument();
  });

  it('applies premium filter and table panel classes', () => {
    const { container } = render(
      <>
        <ListFilterBar>
          <div>Filter</div>
        </ListFilterBar>
        <ListTablePanel title="Parties">
          <div>Table</div>
        </ListTablePanel>
      </>
    );

    expect(container.querySelector('.list-filter-shell')).toBeTruthy();
    expect(container.querySelector('.list-table-shell')).toBeTruthy();
  });

  it('uses sticky header and comfortable rows in data table defaults', () => {
    const { container } = render(
      <DataTable
        columns={[{ key: 'name', header: 'Name' }]}
        data={[{ name: 'ABC' }, { name: 'XYZ' }]}
      />
    );

    expect(container.querySelector('thead')?.className).toContain('sticky');
    expect(container.querySelector('tbody tr')?.className).toContain('h-[62px]');
  });
});

