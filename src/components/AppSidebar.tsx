import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  ArrowRightLeft,
  Factory,
  FileText,
  FileCheck,
  BarChart3,
  ChevronLeft,
  Menu,
  ClipboardList,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navSections = [
  {
    label: 'Start',
    items: [{ title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Master Setup',
    items: [
      { title: 'Item Master', path: '/items', icon: Package },
      { title: 'Party Master', path: '/parties', icon: Users },
    ],
  },
  {
    label: 'Procure',
    items: [
      { title: 'Purchase (GIN)', path: '/purchases', icon: ShoppingCart },
    ],
  },
  {
    label: 'Production Flow',
    items: [
      { title: 'Production Batches', path: '/production', icon: Factory },
      { title: 'MRS', path: '/mrs', icon: ClipboardList },
      { title: 'Stock Movement', path: '/stock-movement', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Sales',
    items: [
      { title: 'Proforma Invoice', path: '/proforma-invoices', icon: FileText },
      { title: 'Final Invoice', path: '/invoices', icon: FileCheck },
    ],
  },
  {
    label: 'Ledger & Reports',
    items: [
      { title: 'Stock Ledger', path: '/stock-ledger', icon: BookOpen },
      { title: 'Reports', path: '/reports', icon: BarChart3 },
      { title: 'Quality Testing', path: '/quality-requests', icon: ClipboardList },
    ],
  },
];

interface AppSidebarProps {
  className?: string;
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function AppSidebar({ className, mobile = false, onNavigate }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const canCollapse = !mobile;

  return (
    <aside
      className={cn(
        'sidebar-premium flex h-full flex-col border-r border-sidebar-border bg-[linear-gradient(180deg,hsl(var(--sidebar-background))_0%,hsl(231_58%_14%)_100%)] text-sidebar-foreground transition-all duration-200',
        canCollapse ? (collapsed ? 'w-[74px]' : 'w-[280px]') : 'w-full',
        canCollapse ? 'sticky top-0 h-screen' : '',
        className,
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
              <span className="grid h-11 w-11 place-content-center rounded-2xl bg-gradient-to-br from-[#2557ff] to-[#7e5eff] text-white shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
                <LayoutDashboard className="h-5 w-5" />
              </span>
            {!collapsed && (
              <span>
                <span className="block text-base font-semibold leading-none text-white">InventoryX</span>
                <span className="mt-1 block text-xs text-sidebar-muted">Operations Hub</span>
              </span>
            )}
          </Link>
          {canCollapse ? (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-lg p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          ) : null}
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
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-[#2557ff] to-[#765eff] text-white font-semibold shadow-[0_14px_28px_-18px_rgba(37,87,255,0.95)]'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground'
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
        <div className="m-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="text-xs font-semibold text-white">Reports Ready</p>
          <p className="mt-1 text-xs text-sidebar-muted">Track KPIs and bottlenecks in one place.</p>
        </div>
      )}
    </aside>
  );
}
