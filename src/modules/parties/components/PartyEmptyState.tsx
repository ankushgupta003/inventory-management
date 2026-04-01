import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}

export default function PartyEmptyState({ hasFilters, onClear, onCreate }: Props) {
  return (
    <div className="border rounded-lg flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="font-medium text-foreground mb-1">No parties match your filters</h3>
          <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filter criteria.</p>
          <Button variant="outline" size="sm" onClick={onClear}>Clear Filters</Button>
        </>
      ) : (
        <>
          <h3 className="font-medium text-foreground mb-1">No parties yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by adding your first vendor or customer.</p>
          <Button size="sm" onClick={onCreate}>Add First Party</Button>
        </>
      )}
    </div>
  );
}
