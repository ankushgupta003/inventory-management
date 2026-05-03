import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Factory, FlaskConical, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { productionApi } from '../services/productionApi';
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await productionApi.getAll();
        if (!active) return;
        setBatches(data);
      } catch {
        if (!active) return;
        setBatches([]);
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
    if (!q) return batches;
    return batches.filter((batch) =>
      `${batch.batchNo} ${batch.productName} ${batch.productionNo}`.toLowerCase().includes(q),
    );
  }, [batches, search]);

  const kpis: ListPageKpi[] = useMemo(() => {
    const total = batches.length;
    const inProcess = batches.filter((batch) => batch.status === 'IN_PROCESS').length;
    const qaPending = batches.filter((batch) => batch.status === 'QA_PENDING').length;
    const released = batches.filter((batch) => batch.status === 'RELEASED').length;
    return [
      { id: 'total', label: 'Total Batches', value: total.toLocaleString('en-IN'), icon: Factory, tone: 'blue' },
      { id: 'process', label: 'In Process', value: inProcess.toLocaleString('en-IN'), icon: PackageCheck, tone: 'orange' },
      { id: 'qa', label: 'QA Pending', value: qaPending.toLocaleString('en-IN'), icon: FlaskConical, tone: 'purple' },
      { id: 'released', label: 'Released', value: released.toLocaleString('en-IN'), icon: PackageCheck, tone: 'green' },
    ];
  }, [batches]);

  const exportCsv = () => {
    exportCsvFile(`production-list-${csvDateSuffix()}.csv`, [
      ['Production No', 'Batch No', 'Product', 'Batch Size', 'Status', 'Start Date', 'MFG Date', 'EXP Date'],
      ...filtered.map((batch) => [
        batch.productionNo,
        batch.batchNo,
        batch.productName,
        batch.batchSize,
        statusLabel[batch.status],
        batch.startDate,
        batch.mfgDate,
        batch.expDate,
      ]),
    ]);
  };

  const columns = [
    { key: 'productionNo', header: 'Production No', render: (row: ProductionBatch) => <span className="font-medium">{row.productionNo}</span> },
    { key: 'batchNo', header: 'Batch No', render: (row: ProductionBatch) => <span className="font-medium">{row.batchNo}</span> },
    { key: 'productName', header: 'Product' },
    { key: 'batchSize', header: 'Batch Size' },
    { key: 'status', header: 'Status', render: (row: ProductionBatch) => <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge> },
    { key: 'startDate', header: 'Start Date' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Production Batches"
        description="Manage batch lifecycle, MRS, BMR, QA, and release readiness."
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
          <Input placeholder="Search by production no, batch no, or product" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
      </ListFilterBar>

      <ListTablePanel title="Production Batches" description={`${filtered.length} record(s)`}>
        <DataTable<ProductionBatch>
          columns={columns}
          data={filtered}
          isLoading={loading}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => <TableActionButton label="View / Continue" icon={Eye} tone="blue" onClick={() => navigate(`/production/${row.id}`)} />}
        />
      </ListTablePanel>
    </div>
  );
}
