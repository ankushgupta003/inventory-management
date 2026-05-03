import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  authAPI,
  clearAuthSession,
  getStoredAccessToken,
  getStoredPortal,
  getStoredRefreshToken,
  getStoredUser,
  persistAuthSession,
  persistStoredUser,
} from '@/services/api';
import {
  getDefaultRouteForUser,
  hasAllPermissionsForUser,
  hasAnyPermissionForUser,
  hasPermissionForUser,
  inferPortalFromUser,
} from '@/lib/auth';
import type { AuthPortal, PermissionKey, User } from '@/types';

interface AuthContextType {
  user: User | null;
  portal: AuthPortal | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  defaultRoute: string;
  loginCompany: (email: string, password: string) => Promise<User>;
  loginSuperAdmin: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<User>;
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function inferPortal(user: User | null) {
  return user ? inferPortalFromUser(user) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [portal, setPortal] = useState<AuthPortal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyUser = useCallback((nextUser: User | null, explicitPortal?: AuthPortal | null) => {
    setUser(nextUser);
    setPortal(explicitPortal ?? inferPortal(nextUser));
  }, []);

  const applySession = useCallback((nextUser: User, explicitPortal?: AuthPortal) => {
    persistStoredUser(nextUser, explicitPortal);
    applyUser(nextUser, explicitPortal ?? inferPortalFromUser(nextUser));
  }, [applyUser]);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await authAPI.me();
      applySession(nextUser, getStoredPortal() ?? inferPortalFromUser(nextUser));
      return nextUser;
    } catch {
      clearAuthSession();
      applyUser(null, null);
      return null;
    }
  }, [applySession, applyUser]);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedPortal = getStoredPortal();

    if (storedUser) {
      applyUser(storedUser, storedPortal ?? inferPortalFromUser(storedUser));
    }

    setIsLoading(false);

    const accessToken = getStoredAccessToken();
    if (storedUser && accessToken && accessToken !== 'mock-jwt-token') {
      void refreshUser();
    }
  }, [applyUser, refreshUser]);

  const loginCompany = useCallback(async (email: string, password: string) => {
    const session = await authAPI.loginCompany(email, password);
    persistAuthSession(session, 'company');
    applyUser(session.user, 'company');
    return session.user;
  }, [applyUser]);

  const loginSuperAdmin = useCallback(async (email: string, password: string) => {
    const session = await authAPI.loginSuperAdmin(email, password);
    persistAuthSession(session, 'super-admin');
    applyUser(session.user, 'super-admin');
    return session.user;
  }, [applyUser]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout(getStoredRefreshToken());
    } catch {
      // Ignore logout failures and clear local state regardless.
    } finally {
      clearAuthSession();
      applyUser(null, null);
    }
  }, [applyUser]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const session = await authAPI.changePassword(currentPassword, newPassword);
    const nextPortal = getStoredPortal() ?? inferPortalFromUser(session.user);
    persistAuthSession(session, nextPortal);
    applyUser(session.user, nextPortal);
    return session.user;
  }, [applyUser]);

  const defaultRoute = useMemo(() => getDefaultRouteForUser(user), [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    portal,
    isAuthenticated: !!user,
    isLoading,
    defaultRoute,
    loginCompany,
    loginSuperAdmin,
    logout,
    refreshUser,
    changePassword,
    hasPermission: (permission) => hasPermissionForUser(user, permission),
    hasAnyPermission: (permissions) => hasAnyPermissionForUser(user, permissions),
    hasAllPermissions: (permissions) => hasAllPermissionsForUser(user, permissions),
  }), [
    changePassword,
    defaultRoute,
    isLoading,
    loginCompany,
    loginSuperAdmin,
    logout,
    portal,
    refreshUser,
    user,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
