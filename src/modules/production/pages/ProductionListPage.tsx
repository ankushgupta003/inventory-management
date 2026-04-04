import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import TableWrapper from '@/components/TableWrapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { productionApi } from '../services/productionApi';
import { USE_MOCK } from '@/services/api';
import type { ProductionRecord } from '../types';

const pageSize = 10;
const useMock = USE_MOCK || import.meta.env.DEV;

const mockProduction: ProductionRecord[] = [
  {
    id: 'prd-1',
    productionNo: 'PRD-240401-201',
    date: '2026-04-01',
    outputs: [
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', mfgDate: '2026-04-01', expiryDate: '2028-04-01', qtyProduced: 120 },
    ],
    inputs: [
      { itemId: 'rm-1', itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', availableQty: 320, qtyUsed: 80 },
    ],
    createdAt: '2026-04-01',
  },
  {
    id: 'prd-2',
    productionNo: 'PRD-240402-203',
    date: '2026-04-02',
    outputs: [
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', batchNo: 'FG-240402-02', mfgDate: '2026-04-02', expiryDate: '2028-04-02', qtyProduced: 60 },
    ],
    inputs: [
      { itemId: 'rm-2', itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', availableQty: 180, qtyUsed: 30 },
    ],
    createdAt: '2026-04-02',
  },
];

export default function ProductionListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (useMock) {
        setRecords(mockProduction);
        setLoading(false);
        return;
      }
      try {
        const data = await productionApi.getAll();
        if (active) setRecords(data);
      } catch {
        if (active) setRecords([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [useMock]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (!q) return true;
      const outputs = r.outputs ?? [];
      const text = outputs
        .map((o) => `${o.itemName} ${o.batchNo}`)
        .join(' ')
        .toLowerCase();
      return text.includes(q) || r.productionNo.toLowerCase().includes(q);
    });
  }, [records, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Production"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/production' },
          { label: 'Production' },
        ]}
        action={(
          <Button onClick={() => navigate('/production/create')}>
            <Plus className="h-4 w-4 mr-2" /> Create Production
          </Button>
        )}
      />

      <FormSection title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Search by item or batch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </FormSection>

      <TableWrapper title="Production Records" description={`Showing ${filtered.length} records`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Production No</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead className="min-w-[180px]">Finished Item</TableHead>
              <TableHead className="min-w-[140px]">Batch No</TableHead>
              <TableHead className="min-w-[140px] text-right">Qty Produced</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading production records...
                </TableCell>
              </TableRow>
            )}
            {!loading && paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No production records found.
                </TableCell>
              </TableRow>
            )}
            {paginated.map((record) => {
              const firstOutput = record.outputs?.[0];
              const qtyTotal = record.outputs?.reduce((s, o) => s + (o.qtyProduced || 0), 0) ?? 0;
              const status = new Date(record.date) > new Date() ? 'Planned' : 'Completed';
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.productionNo}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{firstOutput?.itemName || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{firstOutput?.batchNo || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{qtyTotal}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/production/${record.id}`)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrapper>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
