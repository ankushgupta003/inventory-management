import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PrintLayoutProps {
  title: string;
  pageNumber: number;
  children: ReactNode;
  className?: string;
}

export default function PrintLayout({ title, pageNumber, children, className }: PrintLayoutProps) {
  return (
    <section className={cn('bmr-print-page', className)}>
      <div className="flex items-start justify-between border-b border-black pb-2 mb-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide">Batch Manufacturing Record</div>
          <div className="text-xs">{title}</div>
        </div>
        <div className="text-xs text-right">
          <div>Page {pageNumber} of 4</div>
        </div>
      </div>
      {children}
    </section>
  );
}
