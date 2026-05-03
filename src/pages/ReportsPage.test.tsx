import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReportsPage from './ReportsPage';
import { analyticsFixture } from '@/modules/analytics/testFixtures';
import * as analytics from '@/modules/analytics';

describe('ReportsPage', () => {
  it('renders simple report sections and supports csv export', async () => {
    vi.spyOn(analytics, 'fetchReportDataset').mockResolvedValue(analyticsFixture);
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:mock', writable: true });
    }
    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', { value: () => {}, writable: true });
    }
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Inventory Health/i)).toBeInTheDocument();
    expect(await screen.findByText(/Movement Analysis/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /^Export$/i })[0]);
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });
});
