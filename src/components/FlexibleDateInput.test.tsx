import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FlexibleDateInput from './FlexibleDateInput';

function Harness() {
  const [value, setValue] = useState('');

  return (
    <div>
      <FlexibleDateInput value={value} onChange={setValue} />
      <div data-testid="stored-value">{value}</div>
    </div>
  );
}

describe('FlexibleDateInput', () => {
  it('supports exact dates and month-only selection without raw text typing', () => {
    const { container } = render(<Harness />);
    const input = container.querySelector('input') as HTMLInputElement;

    expect(input.type).toBe('date');

    fireEvent.change(input, { target: { value: '2026-03-01' } });
    expect(screen.getByTestId('stored-value')).toHaveTextContent('2026-03-01');

    fireEvent.click(screen.getByRole('button', { name: /using exact date, switch to month picker/i }));
    expect(screen.getByTestId('stored-value')).toHaveTextContent('03/2026');

    const monthInput = container.querySelector('input') as HTMLInputElement;
    expect(monthInput.type).toBe('month');

    fireEvent.change(monthInput, { target: { value: '2027-05' } });
    expect(screen.getByTestId('stored-value')).toHaveTextContent('05/2027');
  });
});
