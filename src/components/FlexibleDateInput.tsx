import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type FlexibleDateMode = 'date' | 'month';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthYearPattern = /^\d{2}\/\d{4}$/;

const detectMode = (value: string): FlexibleDateMode => (
  monthYearPattern.test(value) ? 'month' : 'date'
);

const toInputValue = (value: string, mode: FlexibleDateMode) => {
  if (!value) return '';

  if (mode === 'date') {
    return isoDatePattern.test(value) ? value : '';
  }

  if (monthYearPattern.test(value)) {
    const [month, year] = value.split('/');
    return `${year}-${month}`;
  }

  if (isoDatePattern.test(value)) {
    return value.slice(0, 7);
  }

  return '';
};

const toStoredValue = (value: string, mode: FlexibleDateMode) => {
  if (!value) return '';

  if (mode === 'date') {
    return value;
  }

  const [year, month] = value.split('-');
  return `${month}/${year}`;
};

export interface FlexibleDateInputProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'onChange'> {
  value?: string;
  onChange: (value: string) => void;
}

const FlexibleDateInput = React.forwardRef<HTMLInputElement, FlexibleDateInputProps>(
  ({ className, value = '', onChange, onBlur, disabled, ...props }, forwardedRef) => {
    const [mode, setMode] = React.useState<FlexibleDateMode>(() => detectMode(value));
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
      if (!value) return;
      const nextMode = detectMode(value);
      if (nextMode !== mode) {
        setMode(nextMode);
      }
    }, [mode, value]);

    const setRefs = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    const openPicker = () => {
      try {
        inputRef.current?.showPicker?.();
      } catch {
        // Some browsers restrict showPicker to direct user gestures only.
      }
    };

    const handleModeToggle = () => {
      const nextMode: FlexibleDateMode = mode === 'date' ? 'month' : 'date';
      setMode(nextMode);

      if (!value) return;

      if (nextMode === 'month') {
        const nextValue = toInputValue(value, 'month');
        onChange(nextValue ? toStoredValue(nextValue, 'month') : '');
        return;
      }

      if (!isoDatePattern.test(value)) {
        onChange('');
      }
    };

    return (
      <div className="flex min-w-0 items-center gap-1">
        <Input
          {...props}
          ref={setRefs}
          type={mode}
          value={toInputValue(value, mode)}
          onBlur={onBlur}
          onFocus={openPicker}
          onClick={openPicker}
          onChange={(event) => onChange(toStoredValue(event.target.value, mode))}
          disabled={disabled}
          className={cn('min-w-0', className)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleModeToggle}
          className="h-10 shrink-0 px-2 text-[11px] font-semibold"
          title={mode === 'date' ? 'Switch to month picker' : 'Switch to exact date picker'}
          aria-label={mode === 'date' ? 'Using exact date, switch to month picker' : 'Using month picker, switch to exact date picker'}
        >
          {mode === 'date' ? 'Date' : 'Month'}
        </Button>
      </div>
    );
  },
);

FlexibleDateInput.displayName = 'FlexibleDateInput';

export default FlexibleDateInput;
