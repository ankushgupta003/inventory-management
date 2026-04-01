import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { PartyFilters } from '../types';

interface Props {
  filters: PartyFilters;
  onChange: (filters: PartyFilters) => void;
}

export default function PartyFiltersBar({ filters, onChange }: Props) {
  const hasFilters = filters.status !== 'all' || filters.partyType !== 'all' || filters.search.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, GST, phone, city..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>
      <Select value={filters.partyType} onValueChange={(v) => onChange({ ...filters, partyType: v as PartyFilters['partyType'] })}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="vendor">Vendor</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
          <SelectItem value="both">Both</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v as PartyFilters['status'] })}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ search: '', status: 'all', partyType: 'all' })}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
