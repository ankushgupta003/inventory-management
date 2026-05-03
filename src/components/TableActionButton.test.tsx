import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Eye, Lock } from 'lucide-react';
import TableActionButton from './TableActionButton';
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWithTooltip(ui: ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

describe('TableActionButton', () => {
  it('renders an icon-only action with accessible name, tone classes, tooltip, and click handler', async () => {
    const onClick = vi.fn();

    renderWithTooltip(<TableActionButton label="View" icon={Eye} tone="blue" onClick={onClick} />);

    expect(screen.queryByText(/^View$/i)).not.toBeInTheDocument();

    const button = screen.getByRole('button', { name: /^View$/i });
    expect(button.className).toContain('text-sky-700');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.focus(button);
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent(/^View$/i));
  });

  it('uses muted styling and still shows tooltip for disabled actions', async () => {
    renderWithTooltip(<TableActionButton label="Close" icon={Lock} tone="rose" disabled onClick={vi.fn()} />);

    const button = screen.getByRole('button', { name: /^Close$/i });
    expect(button).toBeDisabled();
    expect(button.className).toContain('text-slate-400');

    fireEvent.focus(button.parentElement as HTMLElement);
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent(/^Close$/i));
  });
});
