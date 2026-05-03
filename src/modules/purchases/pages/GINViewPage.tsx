import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PrintLayout from '@/components/PrintLayout';
import { Button } from '@/components/ui/button';
import { purchasesApi } from '../services/purchasesApi';
import type { PurchaseGinRecord } from '../types';

export default function GINViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gin, setGin] = useState<PurchaseGinRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const data = await purchasesApi.getById(id);
        if (active) setGin(data);
      } catch {
        if (active) setGin(null);
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
    return <div className="space-y-4"><p className="text-sm text-muted-foreground">Loading GIN...</p></div>;
  }

  if (!gin) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/purchases')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Purchase GIN not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate('/purchases')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      <PrintLayout title="Goods Inward Note" companyName={user?.companyName ?? 'Company'} className="print:shadow-none">
        <div className="grid grid-cols-2 gap-x-8 text-sm">
          <div className="space-y-1.5">
            <Row label="Vendor" value={gin.vendorName} />
            <Row label="Challan No" value={gin.challanNo} />
            <Row label="Challan Date" value={gin.challanDate} />
            <Row label="Bill No" value={gin.billNo} />
            <Row label="Bill Date" value={gin.billDate} />
          </div>
          <div className="space-y-1.5 text-right">
            <Row label="GIN No" value={gin.ginNo} align="right" />
            <Row label="Entry Date" value={gin.entryDate} align="right" />
            <Row label="Gate Entry No" value={gin.gateEntryNo} align="right" />
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100">
              {['Sr', 'Description', 'ULP Qty', 'Bill Qty', 'Recd Qty', 'Accptd', 'Rejctd', 'Batch/Lot', 'MFG Date', 'Expiry', 'Rate', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total', 'Remarks'].map((header) => (
                <th key={header} className="whitespace-nowrap border border-black px-1.5 py-1.5 text-left font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gin.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-black">
                <td className="border border-black px-1.5 py-1.5 text-center">{idx + 1}</td>
                <td className="border border-black px-1.5 py-1.5">{item.itemName}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">{item.ulpQty}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">{item.billQty}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">{item.receivedQty}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">{item.acceptedQty}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">{item.rejectedQty}</td>
                <td className="border border-black px-1.5 py-1.5">{item.batchNo}</td>
                <td className="border border-black px-1.5 py-1.5">{item.mfgDate || '-'}</td>
                <td className="border border-black px-1.5 py-1.5">{item.expiryDate || '-'}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">Rs {item.rate.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">Rs {item.taxableValue.toLocaleString('en-IN')}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">Rs {item.cgstAmount.toLocaleString('en-IN')}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">Rs {item.sgstAmount.toLocaleString('en-IN')}</td>
                <td className="border border-black px-1.5 py-1.5 text-right">Rs {item.igstAmount.toLocaleString('en-IN')}</td>
                <td className="border border-black px-1.5 py-1.5 text-right font-medium">Rs {item.lineTotalAmount.toLocaleString('en-IN')}</td>
                <td className="border border-black px-1.5 py-1.5">{item.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <Row label="Taxable Value" value={`Rs ${gin.totalTaxableValue.toLocaleString('en-IN')}`} />
            <Row label="CGST" value={`Rs ${gin.totalCgstAmount.toLocaleString('en-IN')}`} />
          </div>
          <div className="space-y-1">
            <Row label="SGST" value={`Rs ${gin.totalSgstAmount.toLocaleString('en-IN')}`} align="right" />
            <Row label="IGST" value={`Rs ${gin.totalIgstAmount.toLocaleString('en-IN')}`} align="right" />
            <Row label="Grand Total" value={`Rs ${gin.totalAmount.toLocaleString('en-IN')}`} align="right" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-12 text-sm text-center">
          <SignatureBlock title="Prepared By" value={gin.preparedBy} />
          <SignatureBlock title="Sanctioned By" value={gin.sanctionedBy} />
          <SignatureBlock title="Authorized Signatory" value={gin.authorizedSignatory} />
        </div>
      </PrintLayout>
    </div>
  );
}

function Row({ label, value, align = 'left' }: { label: string; value: string; align?: 'left' | 'right' }) {
  return (
    <div className={`flex gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
      <span className="font-semibold">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function SignatureBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="space-y-8">
      <div className="mx-4 border-t border-black pt-2">
        <p className="font-semibold">{title}</p>
        <p className="text-gray-600">{value || '________________'}</p>
      </div>
    </div>
  );
}
