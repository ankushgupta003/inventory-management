import { useEffect, useMemo, useState } from 'react';
import {
  Wallet, Boxes, AlertTriangle, Clock, PackageCheck,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import KPICard from '@/components/KPICard';
import PageHeader from '@/components/PageHeader';
import TableWrapper from '@/components/TableWrapper';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api, { USE_MOCK } from '@/services/api';

type DashboardKPI = {
  totalStockValue: number;
  totalStockQty: number;
  lowStockCount: number;
  expiringSoonCount: number;
};

type RecentTransaction = {
  id: string;
  date: string;
  type: 'GIN' | 'Issue' | 'Invoice' | 'Production';
  itemName: string;
  qty: number;
  batchNo: string;
};

type DashboardResponse = {
  kpis: DashboardKPI;
  recentTransactions: RecentTransaction[];
  monthlySales: { month: string; amount: number }[];
};

const useMock = USE_MOCK || import.meta.env.DEV;

const mockDashboard: DashboardResponse = {
  kpis: {
    totalStockValue: 2450000,
    totalStockQty: 12850,
    lowStockCount: 6,
    expiringSoonCount: 4,
  },
  recentTransactions: [
    { id: 't1', date: '2026-04-03', type: 'GIN', itemName: 'Steel Rod 10mm', qty: 200, batchNo: 'B-2026-010' },
    { id: 't2', date: '2026-04-03', type: 'Issue', itemName: 'Copper Wire 2mm', qty: 25, batchNo: 'B-2026-002' },
    { id: 't3', date: '2026-04-02', type: 'Production', itemName: 'Motor Assembly A1', qty: 120, batchNo: 'FG-240401-01' },
    { id: 't4', date: '2026-04-02', type: 'Invoice', itemName: 'Gear Box GB-200', qty: 20, batchNo: 'FG-240402-02' },
  ],
  monthlySales: [
    { month: 'Jan', amount: 320000 },
    { month: 'Feb', amount: 420000 },
    { month: 'Mar', amount: 380000 },
    { month: 'Apr', amount: 510000 },
    { month: 'May', amount: 460000 },
    { month: 'Jun', amount: 620000 },
  ],
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (useMock) {
      setData(mockDashboard);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    const load = async () => {
      try {
        const res = await api.get<DashboardResponse>('/dashboard').then((r) => r.data);
        if (!active) return;
        setData(res);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [useMock]);

  const kpis = useMemo(() => {
    if (!data) return [] as { title: string; value: string; icon: any; color: string }[];
    return [
      { title: 'Total Stock Value', value: `?${data.kpis.totalStockValue.toLocaleString('en-IN')}`, icon: Wallet, color: 'bg-kpi-blue' },
      { title: 'Total Stock Quantity', value: data.kpis.totalStockQty.toLocaleString('en-IN'), icon: Boxes, color: 'bg-kpi-green' },
      { title: 'Low Stock Items', value: data.kpis.lowStockCount.toString(), icon: AlertTriangle, color: 'bg-kpi-orange' },
      { title: 'Expiring Soon', value: data.kpis.expiringSoonCount.toString(), icon: Clock, color: 'bg-kpi-red' },
    ];
  }, [data]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableWrapper title="Recent Transactions" description="Latest inventory movements">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[110px]">Date</TableHead>
                  <TableHead className="min-w-[120px]">Type</TableHead>
                  <TableHead className="min-w-[180px]">Item</TableHead>
                  <TableHead className="min-w-[100px] text-right">Qty</TableHead>
                  <TableHead className="min-w-[140px]">Batch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                )}
                {!loading && (!data || data.recentTransactions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No transactions found.</TableCell>
                  </TableRow>
                )}
                {data?.recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell className="font-medium">{tx.itemName}</TableCell>
                    <TableCell className="text-right">{tx.qty}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.batchNo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ amount: { label: 'Sales', color: 'hsl(var(--primary))' } }}
              className="h-56"
            >
              <BarChart data={data?.monthlySales || []}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
