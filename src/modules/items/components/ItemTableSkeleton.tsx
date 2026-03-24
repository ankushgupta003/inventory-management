import { Skeleton } from '@/components/ui/skeleton';

export default function ItemTableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              {Array.from({ length: 9 }).map((_, i) => (
                <th key={i} className="px-4 py-3"><Skeleton className="h-4 w-20" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, row) => (
              <tr key={row} className="border-b">
                {Array.from({ length: 9 }).map((_, col) => (
                  <td key={col} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
