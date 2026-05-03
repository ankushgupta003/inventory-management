import { useEffect, useState } from 'react';
import { Download, Eye, Plus, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DataTable from '@/components/DataTable';
import TableActionButton from '@/components/TableActionButton';
import { ListPageShell, ListTablePanel } from '@/components/list';
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

  const exportCsv = () => {
    exportCsvFile(`gin-list-${csvDateSuffix()}.csv`, [
      ['GIN No', 'Entry Date', 'Vendor', 'Bill No', 'Challan No', 'Accepted Qty', 'Rejected Qty', 'Taxable Value', 'Total Amount'],
      ...rows.map((row) => [
        row.ginNo,
        row.entryDate,
        row.vendorName,
        row.billNo,
        row.challanNo,
        row.totalAcceptedQty,
        row.totalRejectedQty,
        row.totalTaxableValue,
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
    { key: 'totalTaxableValue', header: 'Taxable Value', className: 'text-right', render: (row: PurchaseGinListRow) => `INR ${row.totalTaxableValue.toLocaleString('en-IN')}` },
    { key: 'totalAmount', header: 'Total Amount', className: 'text-right', render: (row: PurchaseGinListRow) => `INR ${row.totalAmount.toLocaleString('en-IN')}` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Goods Inward Note"
        description={`${meta.summary.count.toLocaleString('en-IN')} GIN records. Total amount INR ${meta.summary.totalAmount.toLocaleString('en-IN')}.`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Purchase (GIN)' }]}
      />

      <ListTablePanel
        title="GIN Records"
        description={`${meta.pagination.total.toLocaleString('en-IN')} records`}
        leftContent={(
          <>
            <div className="table-toolbar-search">
              <Input placeholder="Search vendor, bill, challan, gate entry, GIN no..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="table-toolbar-date" />
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="table-toolbar-date" />
            <Button className="table-toolbar-button" variant="outline" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Clear
            </Button>
          </>
        )}
        rightContent={(
          <>
            <Button className="table-toolbar-button" variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button className="table-toolbar-button" onClick={() => navigate('/purchases/create')}>
              <Plus className="mr-2 h-4 w-4" /> Create GIN
            </Button>
          </>
        )}
      >
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
