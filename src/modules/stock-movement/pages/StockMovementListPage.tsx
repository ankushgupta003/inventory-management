import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import { ListPageShell, ListTablePanel } from '@/components/list';
import CompactSelect from '@/components/CompactSelect';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { stockMovementApi } from '../services/stockMovementApi';
import type { StockMovementRecord, StockMovementType } from '../types';

const typeLabel: Record<StockMovementType, string> = {
  issue: 'Issue',
  transfer: 'Transfer',
  sampling: 'Sampling',
};

export default function StockMovementListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<StockMovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | StockMovementType>('all');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await stockMovementApi.getAll();
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
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (type !== 'all' && r.type !== type) return false;
      if (!q) return true;
      const text = `${r.movementNo} ${r.itemName} ${r.batchNo} ${r.mrsNo || ''} ${r.qualityRequests?.map((request) => request.requestNo).join(' ') || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [records, search, type]);

  const summary = useMemo(() => {
    const issueCount = records.filter((r) => r.type === 'issue').length;
    const transferCount = records.filter((r) => r.type === 'transfer').length;
    const samplingCount = records.filter((r) => r.type === 'sampling').length;
    const totalQty = records.reduce((sum, r) => sum + (r.quantity || 0), 0);
    return { issueCount, transferCount, samplingCount, totalQty };
  }, [records]);

  const exportCsv = () => {
    exportCsvFile(`stock-movement-list-${csvDateSuffix()}.csv`, [
      ['Movement No', 'Date', 'Type', 'MRS No', 'Production Batch', 'Item', 'Batch', 'Qty', 'Sample Reports', 'From', 'To'],
      ...filtered.map((r) => [
        r.movementNo,
        r.date,
        typeLabel[r.type],
        r.mrsNo || '-',
        r.productionBatchNo || '-',
        r.itemName,
        r.batchNo,
        r.quantity,
        r.qualityRequests?.map((request) => request.requestNo).join(', ') || '-',
        r.fromLocation || '-',
        r.toLocation || '-',
      ]),
    ]);
  };

  const columns = [
    { key: 'movementNo', header: 'Movement No', render: (r: StockMovementRecord) => <span className="font-medium text-primary">{r.movementNo}</span> },
    { key: 'date', header: 'Date' },
    { key: 'type', header: 'Type', render: (r: StockMovementRecord) => typeLabel[r.type] },
    { key: 'mrsNo', header: 'MRS', render: (r: StockMovementRecord) => r.mrsNo || '-' },
    { key: 'productionBatchNo', header: 'Production Batch', render: (r: StockMovementRecord) => r.productionBatchNo || '-' },
    { key: 'itemName', header: 'Item' },
    { key: 'batchNo', header: 'Batch' },
    { key: 'quantity', header: 'Qty', className: 'text-right', render: (r: StockMovementRecord) => r.quantity.toLocaleString('en-IN') },
    {
      key: 'qualityRequests',
      header: 'Sample Reports',
      render: (r: StockMovementRecord) =>
        r.qualityRequests?.length ? (
          <div className="flex flex-wrap gap-1">
            {r.qualityRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => navigate(`/quality-requests/${request.id}`)}
              >
                {request.requestNo}
              </button>
            ))}
          </div>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Stock Movement"
        description={`${records.length.toLocaleString('en-IN')} movement records. ${summary.issueCount.toLocaleString('en-IN')} issues, ${summary.transferCount.toLocaleString('en-IN')} transfers, ${summary.samplingCount.toLocaleString('en-IN')} sampling.`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Stock Movement' },
        ]}
      />

      <ListTablePanel
        title="Movement Records"
        description={`${filtered.length} records`}
        leftContent={(
          <>
            <div className="table-toolbar-search">
              <Input placeholder="Search movement no, item, batch, MRS..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <CompactSelect
              value={type}
              onChange={(value) => setType(value as 'all' | StockMovementType)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'issue', label: 'Issue' },
                { value: 'transfer', label: 'Transfer' },
                { value: 'sampling', label: 'Sampling' },
              ]}
              className="table-toolbar-control-sm"
            />
            <Button className="table-toolbar-button" variant="outline" onClick={() => { setSearch(''); setType('all'); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Clear
            </Button>
          </>
        )}
        rightContent={(
          <>
            <Button className="table-toolbar-button" variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button className="table-toolbar-button" onClick={() => navigate('/stock-movement/create')}>
              <Plus className="mr-2 h-4 w-4" /> Create Movement
            </Button>
          </>
        )}
      >
        <DataTable<StockMovementRecord>
          columns={columns}
          data={filtered}
          isLoading={loading}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => navigate(`/stock-movement/${row.id}`)} />}
        />
      </ListTablePanel>
    </div>
  );
}
