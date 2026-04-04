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
  ChevronRight,
  Menu,
  ClipboardList,
  BookOpen,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navSections = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', path: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Masters',
    items: [
      { title: 'Item Master', path: '/items', icon: Package },
      { title: 'Party Master', path: '/parties', icon: Users },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { title: 'Purchase', path: '/purchases', icon: ShoppingCart },
      { title: 'MRS', path: '/mrs', icon: ClipboardList },
      { title: 'Stock Issue', path: '/issues', icon: ArrowRightLeft },
      { title: 'Sampling Advice', path: '/sampling', icon: FileSpreadsheet },
      { title: 'Stock Ledger', path: '/stock-ledger', icon: BookOpen },
      { title: 'Production', path: '/production', icon: Factory },
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
    label: 'Reports',
    items: [{ title: 'Reports', path: '/reports', icon: BarChart3 }],
  },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 min-h-screen',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-sidebar-border">
        {!collapsed && <span className="text-sm font-bold text-sidebar-accent-foreground tracking-wide">ERP System</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-muted transition-colors"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] uppercase tracking-wide text-sidebar-muted">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
