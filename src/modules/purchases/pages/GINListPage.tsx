import { useEffect, useMemo, useState } from 'react';
import { Eye, PackageCheck, ShoppingCart, Truck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DataTable from '@/components/DataTable';
import TableActionButton from '@/components/TableActionButton';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { csvDateSuffix, exportCsvFile } from '@/lib/csv';
import { purchasesApi } from '../services/purchasesApi';
import type { PurchaseGinListRow, PurchaseListMeta } from '../types';

const emptyMeta: PurchaseListMeta = {
  pagination: {
    page: 1,
    limit: 0,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    paginate: false,
  },
  filters: {
    search: '',
    vendorId: '',
    dateFrom: '',
    dateTo: '',
  },
  sort: {
    sortBy: 'entryDate',
    sortOrder: 'desc',
  },
  summary: {
    count: 0,
    totalAmount: 0,
    totalAcceptedQty: 0,
    totalRejectedQty: 0,
    vendorCount: 0,
  },
};

export default function GINListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PurchaseGinListRow[]>([]);
  const [meta, setMeta] = useState<PurchaseListMeta>(emptyMeta);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await purchasesApi.list({
          paginate: false,
          search,
          dateFrom,
          dateTo,
          sortBy: 'entryDate',
          sortOrder: 'desc',
        });
        if (!active) return;
        setRows(response.data);
        setMeta(response.meta);
      } catch {
        if (!active) return;
        setRows([]);
        setMeta(emptyMeta);
        toast.error('Failed to load GIN records');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [dateFrom, dateTo, search]);

  const kpis: ListPageKpi[] = useMemo(() => [
    { id: 'count', label: 'Total GIN', value: meta.summary.count.toLocaleString('en-IN'), icon: ShoppingCart, tone: 'blue' },
    { id: 'value', label: 'Total Value', value: `INR ${meta.summary.totalAmount.toLocaleString('en-IN')}`, icon: Truck, tone: 'green' },
    { id: 'accepted', label: 'Accepted Qty', value: meta.summary.totalAcceptedQty.toLocaleString('en-IN'), icon: PackageCheck, tone: 'emerald' },
    { id: 'rejected', label: 'Rejected Qty', value: meta.summary.totalRejectedQty.toLocaleString('en-IN'), icon: XCircle, tone: 'orange' },
    { id: 'vendors', label: 'Vendors', value: meta.summary.vendorCount.toLocaleString('en-IN'), icon: Truck, tone: 'purple' },
  ], [meta.summary]);

  const exportCsv = () => {
    exportCsvFile(`gin-list-${csvDateSuffix()}.csv`, [
      ['GIN No', 'Entry Date', 'Vendor', 'Bill No', 'Challan No', 'Accepted Qty', 'Rejected Qty', 'Total Value'],
      ...rows.map((row) => [
        row.ginNo,
        row.entryDate,
        row.vendorName,
        row.billNo,
        row.challanNo,
        row.totalAcceptedQty,
        row.totalRejectedQty,
        row.totalAmount,
      ]),
    ]);
  };

  const columns = [
    { key: 'ginNo', header: 'GIN No', render: (row: PurchaseGinListRow) => <span className="font-medium text-primary">{row.ginNo}</span> },
    { key: 'entryDate', header: 'Entry Date' },
    { key: 'vendorName', header: 'Vendor' },
    { key: 'billNo', header: 'Bill No' },
    { key: 'challanNo', header: 'Challan No' },
    { key: 'totalAcceptedQty', header: 'Accepted Qty', className: 'text-right', render: (row: PurchaseGinListRow) => row.totalAcceptedQty.toLocaleString('en-IN') },
    { key: 'totalRejectedQty', header: 'Rejected Qty', className: 'text-right', render: (row: PurchaseGinListRow) => row.totalRejectedQty.toLocaleString('en-IN') },
    { key: 'totalAmount', header: 'Total Value', className: 'text-right', render: (row: PurchaseGinListRow) => `INR ${row.totalAmount.toLocaleString('en-IN')}` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Goods Inward Note"
        description="Inbound purchase entries with accepted stock values."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Purchase (GIN)' }]}
        addLabel="Create GIN"
        onAdd={() => navigate('/purchases/create')}
        onExport={exportCsv}
      />

      <ListKpiStrip items={kpis} />

      <ListFilterBar>
        <div className="min-w-[220px] flex-1">
          <Input placeholder="Search vendor, bill, challan, gate entry, GIN no..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-[150px]" />
        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-[150px]" />
        <Button variant="outline" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}>Clear</Button>
      </ListFilterBar>

      <ListTablePanel title="GIN Records" description={`${meta.pagination.total.toLocaleString('en-IN')} records`}>
        <DataTable<PurchaseGinListRow>
          columns={columns}
          data={rows}
          isLoading={loading}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => navigate(`/purchases/${row.id}`)} />
            </div>
          )}
        />
      </ListTablePanel>
    </div>
  );
}
