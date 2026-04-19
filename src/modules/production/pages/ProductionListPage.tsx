import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Factory, FlaskConical, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { loadBatches } from '../productionStore';
import type { ProductionBatch } from '../types';

const statusLabel: Record<ProductionBatch['status'], string> = {
  DRAFT: 'Draft',
  IN_PROCESS: 'In Process',
  QA_PENDING: 'QA Pending',
  RELEASED: 'Released',
  BLOCKED: 'Blocked',
};

const statusVariant: Record<ProductionBatch['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  IN_PROCESS: 'secondary',
  QA_PENDING: 'secondary',
  RELEASED: 'default',
  BLOCKED: 'destructive',
};

export default function ProductionListPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setBatches(loadBatches());
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter((b) => `${b.batchNo} ${b.productName}`.toLowerCase().includes(q));
  }, [batches, search]);

  const kpis: ListPageKpi[] = useMemo(() => {
    const total = batches.length;
    const inProcess = batches.filter((b) => b.status === 'IN_PROCESS').length;
    const qaPending = batches.filter((b) => b.status === 'QA_PENDING').length;
    const released = batches.filter((b) => b.status === 'RELEASED').length;
    return [
      { id: 'total', label: 'Total Batches', value: total.toLocaleString('en-IN'), icon: Factory, tone: 'blue' },
      { id: 'process', label: 'In Process', value: inProcess.toLocaleString('en-IN'), icon: PackageCheck, tone: 'orange' },
      { id: 'qa', label: 'QA Pending', value: qaPending.toLocaleString('en-IN'), icon: FlaskConical, tone: 'purple' },
      { id: 'released', label: 'Released', value: released.toLocaleString('en-IN'), icon: PackageCheck, tone: 'green' },
    ];
  }, [batches]);

  const exportCsv = () => {
    exportCsvFile(`production-list-${csvDateSuffix()}.csv`, [
      ['Batch No', 'Product', 'Batch Size', 'Status', 'Start Date', 'MFG Date', 'EXP Date'],
      ...filtered.map((b) => [b.batchNo, b.productName, b.batchSize, statusLabel[b.status], b.startDate, b.mfgDate, b.expDate]),
    ]);
  };

  const columns = [
    { key: 'batchNo', header: 'Batch No', render: (r: ProductionBatch) => <span className="font-medium">{r.batchNo}</span> },
    { key: 'productName', header: 'Product' },
    { key: 'batchSize', header: 'Batch Size' },
    { key: 'status', header: 'Status', render: (r: ProductionBatch) => <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge> },
    { key: 'startDate', header: 'Start Date' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Production Batches"
        description="Manage batch lifecycle, QA checkpoints, and release readiness."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Production Batches' },
        ]}
        addLabel="Create Batch"
        onAdd={() => navigate('/production/create')}
        onExport={exportCsv}
      />

      <ListKpiStrip items={kpis} />

      <ListFilterBar>
        <div className="min-w-[240px] flex-1">
          <Input placeholder="Search by batch no or product" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
      </ListFilterBar>

      <ListTablePanel title="Production Batches" description={`${filtered.length} record(s)`}>
        <DataTable<ProductionBatch>
          columns={columns}
          data={filtered}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/production/${row.id}`)}>
              <Eye className="mr-1 h-4 w-4" /> View / Continue
            </Button>
          )}
        />
      </ListTablePanel>
    </div>
  );
}

