import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import TopNavbar from './TopNavbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { AuthPortal } from '@/types';

interface DashboardLayoutProps {
  portal?: AuthPortal;
}

export default function DashboardLayout({ portal = 'company' }: DashboardLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'app-shell flex min-h-screen w-full',
        portal === 'super-admin'
          ? 'bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(15,118,110,0.14),transparent_26%),#020617]'
          : 'bg-shell-canvas',
      )}
    >
      <AppSidebar
        className="hidden md:flex"
        portal={portal}
        collapsed={sidebarCollapsed}
      />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[290px] p-0 sm:max-w-[290px]">
          <AppSidebar mobile portal={portal} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          onMenuClick={() => setMobileNavOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed((current) => !current)}
          isSidebarCollapsed={sidebarCollapsed}
          portal={portal}
        />
        <main className={cn('flex-1 overflow-auto p-4 sm:p-5 lg:p-6', portal === 'super-admin' ? 'bg-transparent' : 'dashboard-canvas')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
