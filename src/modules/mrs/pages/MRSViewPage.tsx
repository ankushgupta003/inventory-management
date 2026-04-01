import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import type { MRSStatus } from '../types';

const statusVariantMap: Record<MRSStatus, 'pending' | 'info' | 'success'> = {
  pending: 'pending',
  approved: 'info',
  issued: 'success',
};

// Mock data — replace with API call GET /mrs/:id
const mockMRS = {
  id: 'mrs-1',
  mrsNo: 'MRS-001',
  date: '2026-03-28',
  department: 'Production',
  requisitionBy: 'Ramesh Kumar',
  sanctionedBy: 'Amit Patel',
  issuedBy: 'Ravi Verma',
  receivedBy: 'Ramesh Kumar',
  status: 'issued' as MRSStatus,
  items: [
    { itemName: 'Steel Rod 10mm', unit: 'kg', qtyRequested: 100, qtyIssued: 95, batchNo: 'B-2026-001', remarks: 'Urgent' },
    { itemName: 'Copper Wire 2mm', unit: 'kg', qtyRequested: 50, qtyIssued: 50, batchNo: 'B-2026-002', remarks: '' },
    { itemName: 'Lubricant Oil', unit: 'liter', qtyRequested: 20, qtyIssued: 18, batchNo: 'B-2026-003', remarks: '2L not available' },
  ],
};

export default function MRSViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mrs = mockMRS; // Replace with useQuery

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/mrs')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
          </Button>
          <StatusBadge status={statusVariantMap[mrs.status]} label={mrs.status} />
        </div>
        <div className="flex items-center gap-2">
          {mrs.status === 'pending' && (
            <Button variant="outline" className="text-info border-info/30">
              <CheckCircle className="h-4 w-4 mr-2" /> Approve
            </Button>
          )}
          {mrs.status === 'approved' && (
            <Button variant="outline" className="text-success border-success/30" onClick={() => navigate(`/mrs/${id}/issue`)}>
              <PackageCheck className="h-4 w-4 mr-2" /> Issue Materials
            </Button>
          )}
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Printable document */}
      <div className="bg-white text-black border border-border rounded-lg print:border-0 print:rounded-none print:shadow-none">
        <div className="p-8 print:p-6 space-y-6 max-w-[210mm] mx-auto">
          {/* Company Header */}
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-xl font-bold uppercase tracking-wider">Your Company Name</h1>
            <p className="text-xs text-gray-600 mt-1">Address Line 1, City, State - PIN</p>
            <h2 className="text-base font-bold mt-3 tracking-wide underline">MATERIAL REQUISITION SLIP</h2>
          </div>

          {/* Header Details */}
          <div className="grid grid-cols-2 gap-x-8 text-sm">
            <div className="space-y-1.5">
              <PrintRow label="MRS No" value={mrs.mrsNo} />
              <PrintRow label="Date" value={mrs.date} />
            </div>
            <div className="space-y-1.5 text-right">
              <PrintRow label="Department" value={mrs.department} align="right" />
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                {['Sr No', 'Product Description', 'Unit', 'Qty Requested', 'Qty Issued', 'Batch / Lot No', 'Remarks'].map((h) => (
                  <th key={h} className="border border-black px-2 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mrs.items.map((item, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                  <td className="border border-black px-2 py-1.5">{item.itemName}</td>
                  <td className="border border-black px-2 py-1.5">{item.unit}</td>
                  <td className="border border-black px-2 py-1.5 text-right">{item.qtyRequested}</td>
                  <td className="border border-black px-2 py-1.5 text-right">{item.qtyIssued || '—'}</td>
                  <td className="border border-black px-2 py-1.5">{item.batchNo || '—'}</td>
                  <td className="border border-black px-2 py-1.5">{item.remarks || '—'}</td>
                </tr>
              ))}
              {/* Empty rows for printing */}
              {Array.from({ length: Math.max(0, 5 - mrs.items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-black">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="border border-black px-2 py-3">&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatories */}
          <div className="grid grid-cols-4 gap-4 pt-12 text-sm text-center">
            {[
              { label: 'Requisition By', value: mrs.requisitionBy },
              { label: 'Sanctioned By', value: mrs.sanctionedBy },
              { label: 'Issued By', value: mrs.issuedBy },
              { label: 'Received By', value: mrs.receivedBy },
            ].map((sig) => (
              <div key={sig.label} className="space-y-8">
                <div className="border-t border-black pt-2 mx-2">
                  <p className="font-semibold">{sig.label}</p>
                  <p className="text-gray-600">{sig.value || '________________'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintRow({ label, value, align = 'left' }: { label: string; value: string; align?: 'left' | 'right' }) {
  return (
    <div className={`flex gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
      <span className="font-semibold">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
