import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { samplingApi } from '../services/samplingApi';
import type { SamplingRecord } from '../types';

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

export default function SamplingViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<SamplingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!id) return;
        const data = await samplingApi.getById(id);
        if (active) setRecord(data);
      } catch {
        if (active) {
          const fallback = useMock ? mockSampling.find((s) => s.id === id) ?? null : null;
          setRecord(fallback);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <p className="text-muted-foreground">Loading sampling advice...</p>;
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/sampling')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Sampling advice not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate('/sampling')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <div className="bg-white text-slate-900 border border-border rounded-lg p-6 print:p-0 print:border-0 print:bg-transparent">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold tracking-wide">Sampling Advice</h1>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm mb-6">
          <div>
            <div><span className="text-muted-foreground">From:</span> <span className="font-medium">{record.fromStore}</span></div>
            <div><span className="text-muted-foreground">To:</span> <span className="font-medium">{record.toDepartment}</span></div>
          </div>
          <div className="text-right">
            <div><span className="text-muted-foreground">Sampling No:</span> <span className="font-medium">{record.samplingNo}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{record.date}</span></div>
          </div>
        </div>

        <div className="border border-slate-300 rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                {['Item Name','Batch No','Manufactured By','MFG Date','Expiry Date','Sample Qty'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {record.items.map((row, idx) => (
                <tr key={`${row.itemId}-${idx}`} className="border-b border-slate-200 last:border-0">
                  <td className="px-3 py-2 font-medium">{row.itemName}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.batchNo}</td>
                  <td className="px-3 py-2">{row.manufacturedBy}</td>
                  <td className="px-3 py-2">{row.mfgDate}</td>
                  <td className="px-3 py-2">{row.expiryDate}</td>
                  <td className="px-3 py-2">{row.sampleQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-muted-foreground">Issued By</div>
            <div className="border-t border-slate-300 pt-2">{record.issuedBy}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Sample Drawn By</div>
            <div className="border-t border-slate-300 pt-2">{record.sampleDrawnBy}</div>
          </div>
        </div>

        <div className="mt-8">
          <div className="border-t border-slate-300 pt-2 w-56 text-sm">Authorized Signature</div>
        </div>
      </div>
    </div>
  );
}
