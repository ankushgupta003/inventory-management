import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PrintLayoutProps {
  title: string;
  children: ReactNode;
  className?: string;
  companyName?: string;
  companyAddress?: string;
}

export default function PrintLayout({
  title,
  children,
  className,
  companyName = 'Company',
  companyAddress = '',
}: PrintLayoutProps) {
  return (
    <div className={cn('bg-white text-black border border-border rounded-lg print:border-0 print:rounded-none print:shadow-none', className)}>
      <div className="p-8 print:p-6 space-y-6 max-w-[210mm] mx-auto">
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-xl font-bold uppercase tracking-wider">{companyName}</h1>
          {companyAddress ? <p className="mt-1 text-xs text-gray-600">{companyAddress}</p> : null}
          <h2 className="text-base font-bold mt-3 tracking-wide underline">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
