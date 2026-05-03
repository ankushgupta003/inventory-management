import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import AppSidebar from './AppSidebar';
import type { User } from '@/types';

function seedAuth(user: User, portal: 'company' | 'super-admin') {
  localStorage.clear();
  localStorage.setItem('auth_token', 'mock-jwt-token');
  localStorage.setItem('auth_portal', portal);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function renderSidebar(initialPath = '/dashboard', portal?: 'company' | 'super-admin') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppSidebar portal={portal} />
      </MemoryRouter>
    </AuthProvider>,
  );
}

const baseUser: Omit<User, 'id' | 'email' | 'fullName' | 'name' | 'accountType' | 'permissions'> = {
  companyId: 'company-1',
  companyName: 'Acme Labs',
  companyStatus: 'ACTIVE',
  mustResetPassword: false,
  isActive: true,
  departmentId: null,
  departmentName: null,
  designationId: null,
  designationName: null,
  roleId: null,
  roleName: null,
};

describe('AppSidebar auth navigation', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('shows only super admin navigation inside the super admin portal', async () => {
    seedAuth(
      {
        id: 'super-admin-1',
        email: 'owner@inventoryx.com',
        fullName: 'Platform Owner',
        name: 'Platform Owner',
        accountType: 'SUPER_ADMIN',
        permissions: [],
        ...baseUser,
        companyId: null,
        companyName: null,
        companyStatus: null,
      },
      'super-admin',
    );

    renderSidebar('/super-admin/dashboard', 'super-admin');

    expect(await screen.findByText('Companies')).toBeInTheDocument();
    expect(screen.queryByText('Item Master')).not.toBeInTheDocument();
    expect(screen.queryByText('Departments')).not.toBeInTheDocument();
  });

  it('shows admin masters and business modules for a company admin', async () => {
    seedAuth(
      {
        id: 'company-admin-1',
        email: 'admin@acme.com',
        fullName: 'Acme Admin',
        name: 'Acme Admin',
        accountType: 'COMPANY_ADMIN',
        permissions: [],
        ...baseUser,
      },
      'company',
    );

    renderSidebar('/dashboard', 'company');

    expect(await screen.findByText('Item Master')).toBeInTheDocument();
    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('shows only permitted business modules for a company user', async () => {
    seedAuth(
      {
        id: 'company-user-1',
        email: 'planner@acme.com',
        fullName: 'Planner',
        name: 'Planner',
        accountType: 'COMPANY_USER',
        permissions: ['dashboard.view', 'items.view', 'production.view'],
        ...baseUser,
      },
      'company',
    );

    renderSidebar('/dashboard', 'company');

    expect(await screen.findByText('Item Master')).toBeInTheDocument();
    expect(screen.getByText('Production Batches')).toBeInTheDocument();
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();
    expect(screen.queryByText('Departments')).not.toBeInTheDocument();
  });
});
