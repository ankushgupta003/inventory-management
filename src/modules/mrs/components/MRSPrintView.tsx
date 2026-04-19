import PrintLayout from '@/components/PrintLayout';
import type { MRSRecord } from '../types';

interface MRSPrintViewProps {
  record: MRSRecord;
}

export default function MRSPrintView({ record }: MRSPrintViewProps) {
  const rows = record.items || [];

  return (
    <PrintLayout title="Material Requisition Slip">
      <div className="grid grid-cols-2 gap-x-8 text-sm">
        <div className="space-y-1.5">
          <PrintRow label="MRS No" value={record.mrsNo} />
          <PrintRow label="Date" value={record.date} />
          <PrintRow label="Department" value={record.department} />
        </div>
        <div className="space-y-1.5 text-right">
          <PrintRow label="Production No" value={record.productionNo || '-'} align="right" />
          <PrintRow label="Production Batch" value={record.productionBatchNo || '-'} align="right" />
        </div>
      </div>

      <table className="w-full text-xs border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100">
            {['Sr No', 'Product Description', 'Unit', 'Qty Requested', 'Qty Issued', 'Remaining', 'Batch / Lot No', 'Remarks'].map((h) => (
              <th key={h} className="border border-black px-2 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => {
            const remaining = Math.max(0, item.qtyRequested - (item.qtyIssued || 0));
            return (
              <tr key={`${item.itemId}-${idx}`} className="border-b border-black">
                <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                <td className="border border-black px-2 py-1.5">{item.itemName}</td>
                <td className="border border-black px-2 py-1.5">{item.unit}</td>
                <td className="border border-black px-2 py-1.5 text-right">{item.qtyRequested}</td>
                <td className="border border-black px-2 py-1.5 text-right">{item.qtyIssued || 0}</td>
                <td className="border border-black px-2 py-1.5 text-right">{remaining}</td>
                <td className="border border-black px-2 py-1.5">{item.batchNo || '-'}</td>
                <td className="border border-black px-2 py-1.5">{item.remarks || '-'}</td>
              </tr>
            );
          })}
          {Array.from({ length: Math.max(0, 5 - rows.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="border-b border-black">
              {Array.from({ length: 8 }).map((_, j) => (
                <td key={`empty-${i}-${j}`} className="border border-black px-2 py-3">&nbsp;</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-4 gap-4 pt-12 text-sm text-center">
        {[
          { label: 'Requisition By', value: record.requisitionBy },
          { label: 'Sanctioned By', value: record.sanctionedBy },
          { label: 'Issued By', value: record.issuedBy },
          { label: 'Received By', value: record.receivedBy },
        ].map((sig) => (
          <div key={sig.label} className="space-y-8">
            <div className="border-t border-black pt-2 mx-2">
              <p className="font-semibold">{sig.label}</p>
              <p className="text-gray-600">{sig.value || '________________'}</p>
            </div>
          </div>
        ))}
      </div>
    </PrintLayout>
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
