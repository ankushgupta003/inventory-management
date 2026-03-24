import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}

export default function EmptyState({ hasFilters, onClear, onCreate }: Props) {
  return (
    <div className="border rounded-lg flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="font-medium text-foreground mb-1">No items match your filters</h3>
          <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filter criteria.</p>
          <Button variant="outline" size="sm" onClick={onClear}>Clear Filters</Button>
        </>
      ) : (
        <>
          <h3 className="font-medium text-foreground mb-1">No items yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by adding your first item to the inventory.</p>
          <Button size="sm" onClick={onCreate}>Add First Item</Button>
        </>
      )}
    </div>
  );
}
