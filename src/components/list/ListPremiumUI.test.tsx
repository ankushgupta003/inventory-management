import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Users } from 'lucide-react';
import ListPageShell from './ListPageShell';
import ListKpiStrip from './ListKpiStrip';
import ListTablePanel from './ListTablePanel';
import DataTable from '@/components/DataTable';

describe('Simple list UI', () => {
  it('renders list shell actions when explicitly provided', () => {
    render(
      <ListPageShell
        title="Party Master"
        description="Simple header"
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

  it('keeps filters in the body toolbar and actions in the panel header', () => {
    const { container } = render(
      <ListTablePanel
        title="Parties"
        leftContent={<span>Filter</span>}
        rightContent={<button type="button">Create</button>}
      >
        <div>Table</div>
      </ListTablePanel>
    );

    const cardHeader = container.querySelector('section > header');
    const cardBody = container.querySelector('section > div');

    expect(cardHeader).not.toBeNull();
    expect(cardBody).not.toBeNull();
    expect(within(cardHeader as HTMLElement).queryByText('Filter')).not.toBeInTheDocument();
    expect(within(cardHeader as HTMLElement).getByRole('button', { name: /Create/i })).toBeInTheDocument();
    expect(within(cardBody as HTMLElement).getByText('Filter')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('renders data table toolbar and sticky header defaults', () => {
    const { container } = render(
      <DataTable
        columns={[{ key: 'name', header: 'Name' }]}
        data={[{ name: 'ABC' }, { name: 'XYZ' }]}
        toolbar={<div>Inline Filters</div>}
      />
    );

    expect(screen.getByText(/Inline Filters/i)).toBeInTheDocument();
    expect(container.querySelector('thead')?.className).toContain('sticky');
    expect(container.querySelector('table')?.className).toContain('md:w-max');
    expect(container.querySelector('th')?.className).toContain('whitespace-normal');
    expect(container.querySelector('tbody tr')?.className).not.toContain('h-[62px]');
  });

  it('applies shared and per-target column classes independently', () => {
    render(
      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Display Name',
            className: 'text-right',
            headerClassName: 'min-w-[180px]',
            cellClassName: 'text-emerald-600',
          },
        ]}
        data={[{ name: 'ABC' }]}
      />
    );

    const header = screen.getByRole('columnheader', { name: /Display Name/i });
    const cell = screen.getAllByText('ABC')
      .map((node) => node.closest('td'))
      .find((node): node is HTMLTableCellElement => !!node);

    expect(header).toHaveClass('text-right');
    expect(header).toHaveClass('min-w-[180px]');
    expect(cell).toHaveClass('text-right');
    expect(cell).toHaveClass('text-emerald-600');
  });
});
