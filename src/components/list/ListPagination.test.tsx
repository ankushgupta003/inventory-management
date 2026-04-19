import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ListPagination from './ListPagination';

describe('ListPagination', () => {
  it('renders numbered controls and emits page changes', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <ListPagination
        page={2}
        pageSize={10}
        totalPages={5}
        totalRows={42}
        startRow={11}
        endRow={20}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    expect(screen.getByText(/Showing 11-20 of 42/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

