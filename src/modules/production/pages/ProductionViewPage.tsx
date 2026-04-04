import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { productionApi } from '../services/productionApi';
import type { ProductionRecord } from '../types';

const useMock = import.meta.env.DEV;

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

export default function ProductionViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await productionApi.getAll();
        if (active) {
          if (useMock && data.length === 0) {
            setRecords(mockProduction);
          } else {
            setRecords(data);
          }
        }
      } catch {
        if (active) setRecords(useMock ? mockProduction : []);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const record = useMemo(
    () => records.find((r) => r.id === id),
    [records, id]
  );

  if (loading) {
    return <p className="text-muted-foreground">Loading production record...</p>;
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/production')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Production record not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate('/production')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Production</h1>
          <div className="text-right text-sm">
            <div className="font-semibold">{record.productionNo}</div>
            <div className="text-muted-foreground">{record.date}</div>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {['Sr No','Finished Item','Batch No','MFG Date','Expiry Date','Qty Produced'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {record.outputs.map((row, idx) => (
                <tr key={`${row.itemId}-${idx}`} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium">{row.itemName}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.batchNo}</td>
                  <td className="px-3 py-2">{row.mfgDate}</td>
                  <td className="px-3 py-2">{row.expiryDate}</td>
                  <td className="px-3 py-2">{row.qtyProduced}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {record.inputs && record.inputs.length > 0 && (
          <div className="border border-border rounded-lg overflow-x-auto mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {['Sr No','Raw Material','Batch No','Qty Used'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.inputs.map((row, idx) => (
                  <tr key={`${row.itemId}-${idx}`} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.itemName}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.batchNo}</td>
                    <td className="px-3 py-2">{row.qtyUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
