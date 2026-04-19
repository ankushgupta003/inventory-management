import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, ShoppingCart, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';

const mockGINs = [
  { id: 'GIN-001', date: '2026-03-28', vendorName: 'ABC Steel Suppliers', billNo: 'BILL-101', challanNo: 'CH-201', totalValue: 45200 },
  { id: 'GIN-002', date: '2026-03-27', vendorName: 'PQR Trading Co.', billNo: 'BILL-102', challanNo: 'CH-202', totalValue: 18750 },
  { id: 'GIN-003', date: '2026-03-25', vendorName: 'Shree Chemicals Ltd.', billNo: 'BILL-103', challanNo: 'CH-203', totalValue: 62300 },
  { id: 'GIN-004', date: '2026-03-24', vendorName: 'ABC Steel Suppliers', billNo: 'BILL-104', challanNo: 'CH-204', totalValue: 31000 },
  { id: 'GIN-005', date: '2026-03-22', vendorName: 'PQR Trading Co.', billNo: 'BILL-105', challanNo: 'CH-205', totalValue: 9400 },
];

type GINRow = typeof mockGINs[number];

export default function GINListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    let data = mockGINs;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((g) =>
        g.vendorName.toLowerCase().includes(q) ||
        g.billNo.toLowerCase().includes(q) ||
        g.challanNo.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q)
      );
    }
    if (dateFrom) data = data.filter((g) => g.date >= dateFrom);
    if (dateTo) data = data.filter((g) => g.date <= dateTo);
    return data;
  }, [search, dateFrom, dateTo]);

  const kpis: ListPageKpi[] = useMemo(() => {
    const totalValue = mockGINs.reduce((sum, g) => sum + g.totalValue, 0);
    return [
      { id: 'total', label: 'Total GIN', value: mockGINs.length.toLocaleString('en-IN'), icon: ShoppingCart, tone: 'blue' },
      { id: 'value', label: 'Total Value', value: `INR ${totalValue.toLocaleString('en-IN')}`, icon: Truck, tone: 'green' },
      { id: 'vendors', label: 'Vendors', value: new Set(mockGINs.map((g) => g.vendorName)).size.toLocaleString('en-IN'), icon: Truck, tone: 'purple' },
      { id: 'visible', label: 'Filtered', value: filtered.length.toLocaleString('en-IN'), icon: ShoppingCart, tone: 'orange' },
    ];
  }, [filtered.length]);

  const exportCsv = () => {
    exportCsvFile(`gin-list-${csvDateSuffix()}.csv`, [
      ['GIN No', 'Date', 'Vendor', 'Bill No', 'Challan No', 'Total Value'],
      ...filtered.map((g) => [g.id, g.date, g.vendorName, g.billNo, g.challanNo, g.totalValue]),
    ]);
  };

  const columns = [
    { key: 'id', header: 'GIN No', render: (r: GINRow) => <span className="font-medium text-primary">{r.id}</span> },
    { key: 'date', header: 'Date' },
    { key: 'vendorName', header: 'Vendor' },
    { key: 'billNo', header: 'Bill No' },
    { key: 'challanNo', header: 'Challan No' },
    { key: 'totalValue', header: 'Total Value', className: 'text-right', render: (r: GINRow) => `INR ${r.totalValue.toLocaleString('en-IN')}` },
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
          <Input placeholder="Search vendor, bill, challan, GIN no..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
        <Button variant="outline" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}>Clear</Button>
      </ListFilterBar>

      <ListTablePanel title="GIN Records" description={`${filtered.length} records`}>
        <DataTable<GINRow>
          columns={columns}
          data={filtered}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/purchases/${row.id}`)}>
                <Eye className="mr-1 h-4 w-4" /> View
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/purchases/create?edit=${row.id}`)}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
            </div>
          )}
        />
      </ListTablePanel>
    </div>
  );
}

