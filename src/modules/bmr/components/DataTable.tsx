import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DataTableProps {
  headers: string[];
  className?: string;
  children: ReactNode;
}

export default function DataTable({ headers, className, children }: DataTableProps) {
  return (
    <div className={cn('border border-border rounded-md overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            {headers.map((header) => (
              <th
                key={header}
                className="text-left px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
