import PrintLayout from '@/components/PrintLayout';
import type { StockMovementRecord, StockMovementItem } from '../types';

interface SamplingPrintViewProps {
  record: StockMovementRecord;
  items: StockMovementItem[];
}

export default function SamplingPrintView({ record, items }: SamplingPrintViewProps) {
  return (
    <PrintLayout title="Sampling Advice">
      <div className="flex items-start justify-between text-sm">
        <div className="space-y-1">
          <div><span className="text-gray-600">From (Store):</span> <span className="font-medium">{record.fromLocation || '-'}</span></div>
          <div><span className="text-gray-600">To (QC):</span> <span className="font-medium">{record.toLocation || '-'}</span></div>
        </div>
        <div className="space-y-1 text-right">
          <div><span className="text-gray-600">Sampling No:</span> <span className="font-medium">{record.movementNo}</span></div>
          <div><span className="text-gray-600">Date:</span> <span className="font-medium">{record.date}</span></div>
        </div>
      </div>

      <table className="w-full text-xs border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100">
            {['Item Name', 'Batch No', 'MFG Date', 'Expiry Date', 'Sample Qty'].map((h) => (
              <th key={h} className="border border-black px-2 py-1.5 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => (
            <tr key={`${row.itemName}-${idx}`}>
              <td className="border border-black px-2 py-1.5 font-medium">{row.itemName}</td>
              <td className="border border-black px-2 py-1.5 font-mono text-xs">{row.batchNo}</td>
              <td className="border border-black px-2 py-1.5">{row.mfgDate || '-'}</td>
              <td className="border border-black px-2 py-1.5">{row.expiryDate || '-'}</td>
              <td className="border border-black px-2 py-1.5 text-right">{row.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm pt-8">
        <div>
          <div className="border-t border-black pt-2">Issued By</div>
          <div className="font-medium mt-1">{record.issuedBy || ''}</div>
        </div>
        <div>
          <div className="border-t border-black pt-2">Sample Drawn By</div>
          <div className="font-medium mt-1">{record.sampleDrawnBy || ''}</div>
        </div>
      </div>
    </PrintLayout>
  );
}
