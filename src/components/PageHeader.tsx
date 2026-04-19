import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import SectionHeader from '@/components/SectionHeader';

type Crumb = {
  label: string;
  href?: string;
};

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  action?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  className,
}: PageHeaderProps) {
  return (
    <SectionHeader
      title={title}
      subtitle={description}
      breadcrumbs={breadcrumbs}
      actions={action}
      compact
      className={cn('section-rhythm', className)}
    />
  );
}
