import type { ReactNode } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CompactSelectOption {
  value: string;
  label: string;
}

interface CompactSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CompactSelectOption[];
  placeholder?: string;
  className?: string;
  icon?: ReactNode;
}

export default function CompactSelect({
  value,
  onChange,
  options,
  placeholder = 'Select',
  className,
  icon,
}: CompactSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`h-9 rounded-lg border-border/70 bg-background/90 text-xs font-medium ${className || ''}`}>
        <div className="flex items-center gap-1.5">
          {icon}
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
