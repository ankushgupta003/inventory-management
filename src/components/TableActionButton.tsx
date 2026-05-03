import type { LucideIcon } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type TableActionTone = 'blue' | 'amber' | 'indigo' | 'emerald' | 'cyan' | 'rose' | 'slate';

const toneClasses: Record<TableActionTone, string> = {
  blue: 'text-sky-700 hover:bg-sky-50 hover:text-sky-800 focus-visible:ring-sky-300',
  amber: 'text-amber-700 hover:bg-amber-50 hover:text-amber-800 focus-visible:ring-amber-300',
  indigo: 'text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 focus-visible:ring-indigo-300',
  emerald: 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:ring-emerald-300',
  cyan: 'text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:ring-cyan-300',
  rose: 'text-rose-700 hover:bg-rose-50 hover:text-rose-800 focus-visible:ring-rose-300',
  slate: 'text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus-visible:ring-slate-300',
};

export interface TableActionButtonProps extends Omit<ButtonProps, 'children' | 'size' | 'variant'> {
  label: string;
  icon: LucideIcon;
  tone?: TableActionTone;
  iconClassName?: string;
}

export default function TableActionButton({
  label,
  icon: Icon,
  tone = 'blue',
  type = 'button',
  disabled = false,
  className,
  iconClassName,
  ...props
}: TableActionButtonProps) {
  const effectiveTone = disabled ? 'slate' : tone;

  const button = (
    <Button
      {...props}
      type={type}
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={disabled}
      className={cn(
        'h-8 w-8 rounded-md focus-visible:ring-offset-0',
        toneClasses[effectiveTone],
        disabled && 'opacity-100',
        className,
      )}
    >
      <Icon className={cn('h-4 w-4', iconClassName)} />
    </Button>
  );

  return (
    <Tooltip>
      {disabled ? (
        <TooltipTrigger asChild>
          <span className="inline-flex" tabIndex={0}>
            {button}
          </span>
        </TooltipTrigger>
      ) : (
        <TooltipTrigger asChild>{button}</TooltipTrigger>
      )}
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
