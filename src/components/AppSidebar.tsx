import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Factory,
  FileCheck,
  FileText,
  Grid2x2,
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { AuthPortal, PermissionKey } from '@/types';

interface NavItem {
  title: string;
  path: string;
  icon: typeof LayoutDashboard;
  permission?: PermissionKey;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const COMPANY_NAV_SECTIONS: NavSection[] = [
  {
    label: 'Start',
    items: [{ title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' }],
  },
  {
    label: 'Master Setup',
    items: [
      { title: 'Item Master', path: '/items', icon: Package, permission: 'items.view' },
      { title: 'Party Master', path: '/parties', icon: Users, permission: 'parties.view' },
    ],
  },
  {
    label: 'Procure',
    items: [{ title: 'Purchase (GIN)', path: '/purchases', icon: ShoppingCart, permission: 'purchases.view' }],
  },
  {
    label: 'Production Flow',
    items: [
      { title: 'Production Batches', path: '/production', icon: Factory, permission: 'production.view' },
      { title: 'MRS', path: '/mrs', icon: ClipboardList, permission: 'mrs.view' },
      { title: 'Stock Movement', path: '/stock-movement', icon: ArrowRightLeft, permission: 'stock_movement.view' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { title: 'Proforma Invoice', path: '/proforma-invoices', icon: FileText, permission: 'proforma_invoices.view' },
      { title: 'Final Invoice', path: '/invoices', icon: FileCheck, permission: 'invoices.view' },
    ],
  },
  {
    label: 'Ledger & Reports',
    items: [
      { title: 'Ledger', path: '/stock-ledger', icon: BookOpen, permission: 'stock_ledger.view' },
      { title: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view' },
      { title: 'Quality Testing', path: '/quality-requests', icon: ClipboardList, permission: 'quality_requests.view' },
    ],
  },
];

const COMPANY_ADMIN_NAV_SECTION: NavSection = {
  label: 'Admin Console',
  items: [
    { title: 'Departments', path: '/admin/departments', icon: BriefcaseBusiness },
    { title: 'Designations', path: '/admin/designations', icon: BriefcaseBusiness },
    { title: 'Item Categories', path: '/admin/item-categories', icon: Package },
    { title: 'Roles', path: '/admin/roles', icon: ShieldCheck },
    { title: 'Users', path: '/admin/users', icon: Users },
  ],
};

const SUPER_ADMIN_SECTIONS: NavSection[] = [
  {
    label: 'Platform',
    items: [
      { title: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
      { title: 'Companies', path: '/super-admin/companies', icon: Building2 },
    ],
  },
];

interface AppSidebarProps {
  className?: string;
  mobile?: boolean;
  onNavigate?: () => void;
  portal?: AuthPortal;
  collapsed?: boolean;
}

export default function AppSidebar({ className, mobile = false, onNavigate, portal, collapsed = false }: AppSidebarProps) {
  const location = useLocation();
  const { user, portal: activeAuthPortal, hasPermission } = useAuth();
  const canCollapse = !mobile;
  const activePortal = portal ?? activeAuthPortal ?? 'company';

  const navSections = useMemo(() => {
    if (!user) {
      return activePortal === 'super-admin' ? SUPER_ADMIN_SECTIONS : [];
    }

    if (activePortal === 'super-admin') {
      return SUPER_ADMIN_SECTIONS;
    }

    const filteredCompanySections = COMPANY_NAV_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
      }))
      .filter((section) => section.items.length > 0);

    if (user.accountType === 'COMPANY_ADMIN') {
      return [...filteredCompanySections, COMPANY_ADMIN_NAV_SECTION];
    }

    return filteredCompanySections;
  }, [activePortal, hasPermission, user]);

  const shellClassName =
    activePortal === 'super-admin'
      ? 'bg-[linear-gradient(180deg,#061124_0%,#0f172a_52%,#052e2b_100%)]'
      : 'bg-sidebar';
  const brandHref = activePortal === 'super-admin' ? '/super-admin/dashboard' : '/dashboard';
  const brandTitle = activePortal === 'super-admin' ? 'InventoryX SaaS' : 'InventoryX';
  const brandSubtitle = activePortal === 'super-admin' ? 'Platform Control' : (user?.companyName ?? 'Operations Hub');
  const footerTitle = activePortal === 'super-admin' ? 'Tenant Oversight' : 'Reports Ready';
  const footerCopy =
    activePortal === 'super-admin'
      ? 'Create companies, manage status, and control tenant admins.'
      : 'Track KPIs and bottlenecks in one place.';

  return (
    <aside
      className={cn(
        'sidebar-premium flex h-full flex-col border-r border-sidebar-border text-sidebar-foreground transition-all duration-200',
        shellClassName,
        canCollapse ? (collapsed ? 'w-[74px]' : 'w-[280px]') : 'w-full',
        canCollapse ? 'sticky top-0 h-screen' : '',
        className,
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Link to={brandHref} className="flex items-center gap-3" onClick={onNavigate}>
            <span className="grid h-10 w-10 place-content-center rounded-lg border border-sidebar-border bg-sidebar-accent text-white">
              {activePortal === 'super-admin' ? <ShieldCheck className="h-5 w-5" /> : <Grid2x2 className="h-5 w-5" />}
            </span>
            {!collapsed && (
              <span>
                <span className="block text-base font-semibold leading-none text-white">{brandTitle}</span>
                <span className="mt-1 block text-xs text-sidebar-muted">{brandSubtitle}</span>
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent font-semibold text-white'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-sidebar-muted')} />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
          <p className="text-xs font-semibold text-white">{footerTitle}</p>
          <p className="mt-1 text-xs text-sidebar-muted">{footerCopy}</p>
        </div>
      )}
    </aside>
  );
}
