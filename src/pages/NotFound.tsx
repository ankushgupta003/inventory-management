import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SurfaceCard from '@/components/SurfaceCard';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="dashboard-canvas flex min-h-screen items-center justify-center p-6">
      <SurfaceCard className="w-full max-w-lg text-center" padding="lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15 text-warning">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-foreground">404</h1>
        <p className="mt-3 text-lg text-foreground">Page not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The page <span className="font-mono">{location.pathname}</span> does not exist or was moved.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
          </Link>
        </Button>
      </SurfaceCard>
    </div>
  );
};

export default NotFound;
