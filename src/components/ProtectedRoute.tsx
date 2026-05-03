import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteForUser, getLoginRouteForPortal, inferPortalFromUser } from '@/lib/auth';
import type { AccountType, AuthPortal, PermissionKey } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  portal?: AuthPortal;
  allowedAccountTypes?: AccountType[];
  requiredPermissions?: PermissionKey[];
  requireAllPermissions?: boolean;
  allowMustReset?: boolean;
}

export default function ProtectedRoute({
  children,
  portal,
  allowedAccountTypes,
  requiredPermissions,
  requireAllPermissions = false,
  allowMustReset = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasAnyPermission, hasAllPermissions } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={getLoginRouteForPortal(portal ?? 'company')} replace />;
  }

  if (portal && inferPortalFromUser(user) !== portal) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  if (!allowMustReset && user.mustResetPassword) {
    return <Navigate to="/reset-password" replace />;
  }

  if (allowMustReset && !user.mustResetPassword) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  if (allowedAccountTypes && !allowedAccountTypes.includes(user.accountType)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  if (requiredPermissions?.length) {
    const allowed = requireAllPermissions
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!allowed) {
      return <Navigate to={getDefaultRouteForUser(user)} replace />;
    }
  }

  return <>{children}</>;
}
