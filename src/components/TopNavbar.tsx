import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export default function TopNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-card border-b flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{user.name}</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {user.role}
              </Badge>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
