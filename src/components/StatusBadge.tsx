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
  pending: 'bg-warning/15 text-warning border-warning/30',
  partial: 'bg-info/15 text-info border-info/30',
  completed: 'bg-success/15 text-success border-success/30',
  closed: 'bg-muted text-muted-foreground border-border',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  error: 'bg-destructive/15 text-destructive border-destructive/30',
  info: 'bg-info/15 text-info border-info/30',
  default: 'bg-secondary text-secondary-foreground border-border',
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
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        variantStyles[status] || variantStyles.default,
        className,
      )}
    >
      {label || status}
    </span>
  );
}
