import { Fragment, type ReactNode } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

type Crumb = {
  label: string;
  href?: string;
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  compact = false,
  className,
}: SectionHeaderProps) {
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedSubtitle = subtitle?.trim().toLowerCase();
  const normalizedBreadcrumbs = [...(breadcrumbs ?? [])];
  const lastCrumb = normalizedBreadcrumbs[normalizedBreadcrumbs.length - 1];

  if (lastCrumb) {
    const normalizedLastCrumb = lastCrumb.label.trim().toLowerCase();
    if (normalizedLastCrumb === normalizedTitle || normalizedLastCrumb === normalizedSubtitle) {
      normalizedBreadcrumbs.pop();
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {normalizedBreadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {normalizedBreadcrumbs.map((crumb, idx) => {
              const isLast = idx === normalizedBreadcrumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${idx}`}>
                  <BreadcrumbItem>
                    {crumb.href && !isLast ? (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className={cn('flex flex-wrap items-start justify-between gap-4', compact && 'gap-3')}>
        <div className="space-y-1">
          <h1 className={cn('font-semibold tracking-tight text-foreground', compact ? 'text-2xl' : 'text-3xl')}>
            {title}
          </h1>
          {subtitle ? <p className="text-base text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
