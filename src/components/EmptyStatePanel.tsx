import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import SurfaceCard from '@/components/SurfaceCard';

interface EmptyStatePanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyStatePanel({ icon: Icon, title, description, action }: EmptyStatePanelProps) {
  return (
    <SurfaceCard className="flex flex-col items-center justify-center py-14 text-center" variant="muted">
      <div className="mb-4 rounded-2xl bg-primary/10 p-3">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </SurfaceCard>
  );
}
