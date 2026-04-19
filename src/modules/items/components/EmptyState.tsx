import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyStatePanel from '@/components/EmptyStatePanel';

interface Props {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}

export default function EmptyState({ hasFilters, onClear, onCreate }: Props) {
  return (
    <EmptyStatePanel
      icon={Package}
      title={hasFilters ? 'No items match your filters' : 'No items yet'}
      description={hasFilters
        ? 'Try adjusting your search or filter criteria.'
        : 'Get started by adding your first item to the inventory.'}
      action={hasFilters
        ? <Button variant="outline" size="sm" onClick={onClear}>Clear Filters</Button>
        : <Button size="sm" onClick={onCreate}>Add First Item</Button>}
    />
  );
}
