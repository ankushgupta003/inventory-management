import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TableWrapperProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function TableWrapper({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: TableWrapperProps) {
  const showHeader = Boolean(title || description || actions);

  return (
    <Card className={cn('rounded-xl shadow-sm border', className)}>
      {showHeader && (
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 space-y-0">
          <div className="space-y-1">
            {title && <CardTitle className="text-lg font-medium">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn('p-0', contentClassName)}>
        <div className="w-full overflow-x-auto">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
