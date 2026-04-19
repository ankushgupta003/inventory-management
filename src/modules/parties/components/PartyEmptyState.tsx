import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyStatePanel from '@/components/EmptyStatePanel';

interface Props {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}

export default function PartyEmptyState({ hasFilters, onClear, onCreate }: Props) {
  return (
    <EmptyStatePanel
      icon={Users}
      title={hasFilters ? 'No parties match your filters' : 'No parties yet'}
      description={hasFilters
        ? 'Try adjusting your search or filter criteria.'
        : 'Get started by adding your first vendor or customer.'}
      action={hasFilters
        ? <Button variant="outline" size="sm" onClick={onClear}>Clear Filters</Button>
        : <Button size="sm" onClick={onCreate}>Add First Party</Button>}
    />
  );
}
