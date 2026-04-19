import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { stockMovementApi } from '../services/stockMovementApi';
import type { StockMovementRecord, StockMovementItem } from '../types';
import IssuePrintView from '../components/IssuePrintView';
import TransferPrintView from '../components/TransferPrintView';
import SamplingPrintView from '../components/SamplingPrintView';

const typeLabel: Record<StockMovementRecord['type'], string> = {
  issue: 'Issue',
  transfer: 'Transfer',
  sampling: 'Sampling',
};

export default function StockMovementViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<StockMovementRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!id) return;
        const data = await stockMovementApi.getById(id);
        if (active) setRecord(data);
      } catch {
        if (active) setRecord(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const items = useMemo<StockMovementItem[]>(() => {
    if (!record) return [];
    return record.items && record.items.length > 0
      ? record.items
      : [{
          itemId: undefined,
          itemName: record.itemName,
          batchNo: record.batchNo,
          quantity: record.quantity,
          availableQty: record.availableQty,
          mfgDate: record.mfgDate,
          expiryDate: record.expiryDate,
          remarks: '',
        }];
  }, [record]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <p className="text-muted-foreground">Loading movement...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/stock-movement')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Stock movement not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Stock Movement"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/stock-movement' },
          { label: 'View' },
        ]}
        action={(
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/stock-movement')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button className="rounded-xl" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        )}
      />

      <FormSection title="Movement Summary" description="Core movement metadata and contextual references." className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Movement No</div>
            <div className="font-medium">{record.movementNo}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Date</div>
            <div className="font-medium">{record.date}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Type</div>
            <div className="font-medium">{typeLabel[record.type]}</div>
          </div>
          {record.type === 'issue' && (
            <>
              <div className="space-y-1">
                <div className="text-muted-foreground">MRS</div>
                <div className="font-medium">{record.mrsNo || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Production Batch</div>
                <div className="font-medium">{record.productionBatchNo || '-'}</div>
              </div>
            </>
          )}
          {(record.type === 'transfer' || record.type === 'sampling') && (
            <>
              <div className="space-y-1">
                <div className="text-muted-foreground">From Location</div>
                <div className="font-medium">{record.fromLocation || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">To Location</div>
                <div className="font-medium">{record.toLocation || '-'}</div>
              </div>
            </>
          )}
        </div>
      </FormSection>

      <FormSection title="Items" description="Line-level quantities, batch mapping, and residual tracking." className="print:hidden">
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                {(record.type === 'issue'
                  ? ['#', 'Item', 'Batch', 'Requested', 'Issued', 'Remaining']
                  : ['#', 'Item', 'Batch', 'Qty', 'MFG Date', 'Expiry Date']
                ).map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={`${row.itemName}-${idx}`} className="border-b last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium">{row.itemName}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.batchNo}</td>
                  {record.type === 'issue' ? (
                    <>
                      <td className="px-3 py-2 text-right">{row.requestedQty ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{row.quantity}</td>
                      <td className="px-3 py-2 text-right">{row.remainingQty ?? '-'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-right">{row.quantity}</td>
                      <td className="px-3 py-2">{row.mfgDate || '-'}</td>
                      <td className="px-3 py-2">{row.expiryDate || '-'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>

      <div className="hidden print:block">
        {record.type === 'issue' && <IssuePrintView record={record} items={items} />}
        {record.type === 'transfer' && <TransferPrintView record={record} items={items} />}
        {record.type === 'sampling' && <SamplingPrintView record={record} items={items} />}
      </div>
    </div>
  );
}
