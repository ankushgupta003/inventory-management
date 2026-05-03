import { Bell, ChevronLeft, Grid2x2, LogOut, Menu, Moon, Search, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatAccountType } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AuthPortal } from '@/types';

interface TopNavbarProps {
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
  className?: string;
  portal?: AuthPortal;
}

export default function TopNavbar({
  onMenuClick,
  onSidebarToggle,
  isSidebarCollapsed = false,
  className,
  portal,
}: TopNavbarProps) {
  const { user, logout } = useAuth();
  const activePortal = portal ?? (user?.accountType === 'SUPER_ADMIN' ? 'super-admin' : 'company');

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-[66px] border-b px-4 sm:px-6',
        activePortal === 'super-admin'
          ? 'border-white/10 bg-slate-950/80 backdrop-blur'
          : 'glass-topbar border-border',
        className,
      )}
    >
      <div className="flex h-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-lg border border-border bg-card md:inline-flex"
            onClick={onSidebarToggle}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <div className="relative hidden w-[420px] max-w-[45vw] lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activePortal === 'super-admin' ? 'Search company, admin, or tenant' : 'Search'}
              className={cn(
                'h-10 rounded-lg pl-9',
                activePortal === 'super-admin'
                  ? 'border-white/10 bg-slate-900/70 text-white placeholder:text-slate-400'
                  : 'border-border bg-background',
              )}
            />
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg border border-border bg-card">
                <Moon className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg border border-border bg-card">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute right-2 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">1</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg border border-border bg-card">
                {activePortal === 'super-admin' ? (
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Grid2x2 className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm lg:flex">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium leading-none text-foreground">{user.fullName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatAccountType(user.accountType)}
                  {activePortal === 'super-admin' ? ' | Platform' : ` | ${user.companyName ?? 'Company'}`}
                </p>
              </div>
              <Badge variant="secondary" className="ml-2 text-[11px] uppercase tracking-wide">
                {activePortal === 'super-admin' ? 'Platform' : user.companyStatus ?? 'Active'}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => void logout()} className="rounded-lg" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
