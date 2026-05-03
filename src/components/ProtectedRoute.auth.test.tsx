import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import type { User } from '@/types';

function seedAuth(user: User) {
  localStorage.clear();
  localStorage.setItem('auth_token', 'mock-jwt-token');
  localStorage.setItem('auth_portal', user.accountType === 'SUPER_ADMIN' ? 'super-admin' : 'company');
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function renderProtectedApp(initialPath: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute portal="company" allowedAccountTypes={['COMPANY_ADMIN', 'COMPANY_USER']}>
                <div>Company Dashboard</div>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/reset-password"
            element={(
              <ProtectedRoute allowMustReset>
                <div>Reset Password Screen</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const makeCompanyUser = (overrides?: Partial<User>): User => ({
  id: 'company-user-1',
  email: 'user@acme.com',
  fullName: 'Acme User',
  name: 'Acme User',
  accountType: 'COMPANY_USER',
  companyId: 'company-1',
  companyName: 'Acme Labs',
  companyStatus: 'ACTIVE',
  mustResetPassword: false,
  isActive: true,
  permissions: ['dashboard.view'],
  departmentId: null,
  departmentName: null,
  designationId: null,
  designationName: null,
  roleId: null,
  roleName: null,
  ...overrides,
});

describe('ProtectedRoute auth flows', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('redirects forced-reset users away from normal pages', async () => {
    seedAuth(makeCompanyUser({ mustResetPassword: true }));

    renderProtectedApp('/dashboard');

    expect(await screen.findByText('Reset Password Screen')).toBeInTheDocument();
    expect(screen.queryByText('Company Dashboard')).not.toBeInTheDocument();
  });

  it('allows the dedicated reset screen while reset is pending', async () => {
    seedAuth(makeCompanyUser({ mustResetPassword: true }));

    renderProtectedApp('/reset-password');

    expect(await screen.findByText('Reset Password Screen')).toBeInTheDocument();
  });
});
