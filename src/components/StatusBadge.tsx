import { cn } from '@/lib/utils';

type StatusVariant =
  | 'pending'
  | 'partial'
  | 'completed'
  | 'closed'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'default';

const variantStyles: Record<StatusVariant, string> = {
  pending: 'status-chip status-chip-warning',
  partial: 'status-chip status-chip-info',
  completed: 'status-chip status-chip-success',
  closed: 'status-chip status-chip-neutral',
  success: 'status-chip status-chip-success',
  warning: 'status-chip status-chip-warning',
  error: 'status-chip status-chip-error',
  info: 'status-chip status-chip-info',
  default: 'status-chip status-chip-neutral',
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        variantStyles[status] || variantStyles.default,
        className,
      )}
    >
      {label || status}
    </span>
  );
}
