import {
  Package, Layers, Box, FileText, Factory, DollarSign, AlertTriangle, Clock,
} from 'lucide-react';
import KPICard from '@/components/KPICard';
import StatusBadge from '@/components/StatusBadge';

const kpis = [
  { title: 'Total Stock', value: '12,450', icon: Package, color: 'bg-kpi-blue' },
  { title: 'Raw Materials', value: '8,230', icon: Layers, color: 'bg-kpi-green' },
  { title: 'Finished Goods', value: '4,220', icon: Box, color: 'bg-kpi-purple' },
  { title: 'Pending PI', value: '18', icon: FileText, color: 'bg-kpi-orange' },
  { title: "Today's Production", value: '340', icon: Factory, color: 'bg-kpi-teal' },
  { title: "Today's Sales", value: '₹2.4L', icon: DollarSign, color: 'bg-kpi-red' },
];

const recentActivities = [
  { id: 1, action: 'Purchase entry created', user: 'Manager', time: '10 min ago', status: 'success' as const },
  { id: 2, action: 'Production batch #1042 completed', user: 'Staff', time: '25 min ago', status: 'completed' as const },
  { id: 3, action: 'PI #2084 sent to ABC Corp', user: 'Admin', time: '1 hr ago', status: 'pending' as const },
  { id: 4, action: 'Material issued for testing', user: 'Staff', time: '2 hrs ago', status: 'info' as const },
  { id: 5, action: 'Low stock alert: Steel Rods', user: 'System', time: '3 hrs ago', status: 'warning' as const },
];

const lowStockItems = [
  { name: 'Steel Rods (10mm)', current: 45, minimum: 100, unit: 'kg' },
  { name: 'Copper Wire', current: 12, minimum: 50, unit: 'kg' },
  { name: 'Packing Boxes (Large)', current: 30, minimum: 100, unit: 'pcs' },
  { name: 'Lubricant Oil', current: 5, minimum: 20, unit: 'ltr' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="erp-page-header">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 erp-section">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Recent Activities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Action</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">User</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Time</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-2.5 px-3 text-foreground">{a.action}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{a.user}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{a.time}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="erp-section">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="font-semibold text-foreground">Low Stock Alerts</h2>
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Min: {item.minimum} {item.unit}</p>
                </div>
                <span className="text-sm font-bold text-destructive">{item.current} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
