import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage';
import { analyticsFixture } from '@/modules/analytics/testFixtures';
import * as analytics from '@/modules/analytics';

describe('DashboardPage', () => {
  it('renders simple workflow summary and recent activity', async () => {
    vi.spyOn(analytics, 'fetchReportDataset').mockResolvedValue(analyticsFixture);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Workflow Summary/i)).toBeInTheDocument();
    expect(await screen.findByText(/Recent Critical Activity/i)).toBeInTheDocument();
    expect(await screen.findByText(/INR 32,000/i)).toBeInTheDocument();
    expect(await screen.findByText(/MOV-001/i)).toBeInTheDocument();
  });
});
