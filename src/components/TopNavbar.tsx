import { Bell, Grid2x2, LogOut, Menu, Moon, Search, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopNavbarProps {
  onMenuClick?: () => void;
  className?: string;
}

export default function TopNavbar({ onMenuClick, className }: TopNavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className={cn('glass-topbar sticky top-0 z-20 h-[74px] border-b border-border/70 px-4 sm:px-6', className)}>
      <div className="flex h-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative hidden w-[420px] max-w-[45vw] lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search" className="h-11 rounded-2xl border-border/80 bg-secondary/60 pl-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]" />
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-border/70 bg-card shadow-[var(--shadow-surface)]">
                <Moon className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full border border-border/70 bg-card shadow-[var(--shadow-surface)]">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute right-2 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">1</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-border/70 bg-card shadow-[var(--shadow-surface)]">
                <Grid2x2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="hidden items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm shadow-[var(--shadow-surface)] lg:flex">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">{user.role}</p>
              </div>
              <Badge variant="secondary" className="ml-2 text-[11px] uppercase tracking-wide">
                Active
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="rounded-xl" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
