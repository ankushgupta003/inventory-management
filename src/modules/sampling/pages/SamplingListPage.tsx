import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { samplingApi } from '../services/samplingApi';
import type { SamplingRecord } from '../types';

const pageSize = 10;
const useMock = import.meta.env.DEV;

const mockSampling: SamplingRecord[] = [
  {
    id: 'smp-1',
    samplingNo: 'SMP-240401-301',
    date: '2026-04-01',
    fromStore: 'Main Store',
    toDepartment: 'QC',
    items: [
      { itemId: '1', itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', manufacturedBy: 'ABC Steel Pvt Ltd', mfgDate: '2026-01-15', expiryDate: '2028-01-15', availableQty: 320, sampleQty: 5 },
    ],
    issuedBy: 'Store Admin',
    sampleDrawnBy: 'QC Analyst',
    createdAt: '2026-04-01',
  },
  {
    id: 'smp-2',
    samplingNo: 'SMP-240402-302',
    date: '2026-04-02',
    fromStore: 'Warehouse B',
    toDepartment: 'QC',
    items: [
      { itemId: '2', itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', manufacturedBy: 'CopperWorks India', mfgDate: '2026-02-10', expiryDate: '2029-02-10', availableQty: 180, sampleQty: 3 },
    ],
    issuedBy: 'Store Lead',
    sampleDrawnBy: 'QC Lead',
    createdAt: '2026-04-02',
  },
];

export default function SamplingListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<SamplingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await samplingApi.getAll();
        if (active) {
          if (useMock && data.length === 0) {
            setRecords(mockSampling);
          } else {
            setRecords(data);
          }
        }
      } catch {
        if (active) setRecords(useMock ? mockSampling : []);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (!q) return true;
      const itemText = r.items.map((i) => `${i.itemName} ${i.batchNo}`).join(' ').toLowerCase();
      return itemText.includes(q) || r.samplingNo.toLowerCase().includes(q);
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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Sampling Advice</h1>
        <Button onClick={() => navigate('/sampling/create')}>
          <Plus className="h-4 w-4 mr-2" /> Create Sampling
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card border border-border rounded-lg p-4">
        <Input
          placeholder="Search by item or batch"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Sampling No</TableHead>
                <TableHead className="min-w-[120px]">Date</TableHead>
                <TableHead className="min-w-[180px]">Item Name</TableHead>
                <TableHead className="min-w-[140px]">Batch No</TableHead>
                <TableHead className="min-w-[120px] text-right">Sample Qty</TableHead>
                <TableHead className="min-w-[140px]">Department</TableHead>
                <TableHead className="min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading sampling records...
                  </TableCell>
                </TableRow>
              )}
              {!loading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No sampling records found.
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((record) => {
                const firstItem = record.items?.[0];
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.samplingNo}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{firstItem?.itemName || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{firstItem?.batchNo || '—'}</TableCell>
                    <TableCell className="text-right">{firstItem?.sampleQty ?? 0}</TableCell>
                    <TableCell>{record.toDepartment || 'QC'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/sampling/${record.id}`)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

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
