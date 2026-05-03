import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import SurfaceCard from '@/components/SurfaceCard';
import MRSPrintView from '../components/MRSPrintView';
import { getMRSProgress } from '../utils/mrsProgress';
import mrsApi from '../services/mrsApi';
import type { MRSRecord } from '../types';

export default function MRSViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mrs, setMrs] = useState<MRSRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id) {
        setMrs(null);
        setLoading(false);
        return;
      }

      try {
        const record = await mrsApi.getById(id);
        if (active) setMrs(record);
      } catch {
        if (active) setMrs(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading MRS...</div>;
  }

  if (!mrs) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/mrs')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
        <p className="text-muted-foreground">MRS record not found.</p>
      </div>
    );
  }

  const progress = getMRSProgress(mrs.items);
  const statusLabel = progress.status.charAt(0).toUpperCase() + progress.status.slice(1);

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title={`MRS ${mrs.mrsNo}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/mrs' },
          { label: mrs.mrsNo },
        ]}
        action={(
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/mrs')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/stock-movement/create?mrsId=${mrs.id}`)}>
              <PackageCheck className="h-4 w-4 mr-2" /> Issue Materials
            </Button>
            <Button className="rounded-xl" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        )}
      />

      <SurfaceCard className="print:hidden flex items-center gap-3" padding="sm">
        <StatusBadge status={progress.status} label={statusLabel} />
        <p className="text-sm text-muted-foreground">
          Requested: {progress.requested} | Issued: {progress.issued} | Remaining: {progress.remaining}
        </p>
      </SurfaceCard>

      <FormSection title="MRS Summary" className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">MRS No</div>
            <div className="font-medium">{mrs.mrsNo}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Date</div>
            <div className="font-medium">{mrs.date}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Department</div>
            <div className="font-medium">{mrs.department}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Production No</div>
            <div className="font-medium">{mrs.productionNo || '-'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Production Batch</div>
            <div className="font-medium">{mrs.productionBatchNo || '-'}</div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Items" className="print:hidden">
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                {['#', 'Item', 'Unit', 'Qty Requested', 'Qty Issued', 'Remaining', 'Batch No', 'Remarks'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mrs.items.map((item, i) => {
                const remaining = Math.max(0, item.qtyRequested - (item.qtyIssued || 0));
                return (
                  <tr key={`${item.itemId}-${i}`} className="border-b last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{item.itemName}</td>
                    <td className="px-3 py-2">{item.unit}</td>
                    <td className="px-3 py-2 text-right">{item.qtyRequested}</td>
                    <td className="px-3 py-2 text-right">{item.qtyIssued || 0}</td>
                    <td className="px-3 py-2 text-right font-medium">{remaining}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.batchNo || '-'}</td>
                    <td className="px-3 py-2">{item.remarks || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </FormSection>

      <div className="hidden print:block">
        <MRSPrintView record={mrs} />
      </div>
    </div>
  );
}
