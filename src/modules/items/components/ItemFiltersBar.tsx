import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { ItemFilters } from '../types';

interface Props {
  filters: ItemFilters;
  onChange: (filters: ItemFilters) => void;
}

export default function ItemFiltersBar({ filters, onChange }: Props) {
  const hasFilters = filters.status !== 'all' || filters.search.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, SKU, or HSN..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>
      <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v as ItemFilters['status'] })}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ search: '', status: 'all' })}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
