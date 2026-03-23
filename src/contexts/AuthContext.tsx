import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock login for frontend demo (replace with real API)
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@erp.com': { password: 'admin123', user: { id: '1', name: 'Admin User', email: 'admin@erp.com', role: 'admin' } },
  'manager@erp.com': { password: 'manager123', user: { id: '2', name: 'Manager User', email: 'manager@erp.com', role: 'manager' } },
  'staff@erp.com': { password: 'staff123', user: { id: '3', name: 'Staff User', email: 'staff@erp.com', role: 'staff' } },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Mock authentication - replace with: const res = await authAPI.login(email, password);
    const entry = MOCK_USERS[email];
    if (!entry || entry.password !== password) {
      throw new Error('Invalid email or password');
    }
    const loggedInUser = entry.user;
    localStorage.setItem('auth_token', 'mock-jwt-token');
    localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
