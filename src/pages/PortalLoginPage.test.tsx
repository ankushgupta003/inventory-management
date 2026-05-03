import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import LoginPage from './LoginPage';
import SuperAdminLoginPage from './SuperAdminLoginPage';
import type { AuthSession, User } from '@/types';

function renderPortalLogin(initialPath: '/login' | '/super-admin/login') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
          <Route path="/dashboard" element={<div>Company Home</div>} />
          <Route path="/super-admin/dashboard" element={<div>Super Admin Home</div>} />
          <Route path="/reset-password" element={<div>Reset Password Screen</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function makeSession(user: User): AuthSession {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user,
  };
}

describe('portal login pages', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('logs company users in from /login and redirects to the company dashboard', async () => {
    vi.spyOn(authAPI, 'loginCompany').mockResolvedValue(
      makeSession({
        id: 'company-admin-1',
        email: 'admin@acme.com',
        fullName: 'Acme Admin',
        name: 'Acme Admin',
        accountType: 'COMPANY_ADMIN',
        companyId: 'company-1',
        companyName: 'Acme Labs',
        companyStatus: 'ACTIVE',
        mustResetPassword: false,
        isActive: true,
        permissions: [],
        departmentId: null,
        departmentName: null,
        designationId: null,
        designationName: null,
        roleId: null,
        roleName: null,
      }),
    );

    renderPortalLogin('/login');

    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'admin@acme.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^Log in$/i }));

    await waitFor(() => expect(authAPI.loginCompany).toHaveBeenCalledWith('admin@acme.com', 'password123'));
    expect(await screen.findByText('Company Home')).toBeInTheDocument();
  });

  it('logs super admins in from /super-admin/login and redirects to the super admin dashboard', async () => {
    vi.spyOn(authAPI, 'loginSuperAdmin').mockResolvedValue(
      makeSession({
        id: 'super-admin-1',
        email: 'owner@inventoryx.com',
        fullName: 'Platform Owner',
        name: 'Platform Owner',
        accountType: 'SUPER_ADMIN',
        companyId: null,
        companyName: null,
        companyStatus: null,
        mustResetPassword: false,
        isActive: true,
        permissions: [],
        departmentId: null,
        departmentName: null,
        designationId: null,
        designationName: null,
        roleId: null,
        roleName: null,
      }),
    );

    renderPortalLogin('/super-admin/login');

    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'owner@inventoryx.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^Log in$/i }));

    await waitFor(() => expect(authAPI.loginSuperAdmin).toHaveBeenCalledWith('owner@inventoryx.com', 'password123'));
    expect(await screen.findByText('Super Admin Home')).toBeInTheDocument();
  });
});
