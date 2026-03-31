import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageCheck, Plus, Eye, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/DataTable';

// Mock data — replace with API call
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
      data = data.filter(
        (g) =>
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

  const columns = [
    { key: 'id', header: 'GIN No', render: (r: GINRow) => <span className="font-medium text-primary">{r.id}</span> },
    { key: 'date', header: 'Date' },
    { key: 'vendorName', header: 'Vendor Name' },
    { key: 'billNo', header: 'Bill No' },
    { key: 'challanNo', header: 'Challan No' },
    {
      key: 'totalValue',
      header: 'Total Value',
      className: 'text-right',
      render: (r: GINRow) => <span className="font-medium">₹{r.totalValue.toLocaleString('en-IN')}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageCheck className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Goods Inward Note (GIN)</h1>
        </div>
        <Button onClick={() => navigate('/purchases/create')}>
          <Plus className="h-4 w-4 mr-2" /> Create GIN
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendor, bill no, challan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
            <span className="text-muted-foreground text-sm">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
          </div>
          {(search || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable<GINRow>
        columns={columns}
        data={filtered}
        pageSize={10}
        actions={(row) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/purchases/${row.id}`)}>
              <Eye className="h-3.5 w-3.5 mr-1" /> View
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/purchases/create?edit=${row.id}`)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          </div>
        )}
      />

      <div className="text-sm text-muted-foreground">
        Showing {filtered.length} of {mockGINs.length} records
      </div>
    </div>
  );
}
