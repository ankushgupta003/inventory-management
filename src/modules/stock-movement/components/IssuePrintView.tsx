import PrintLayout from '@/components/PrintLayout';
import type { StockMovementRecord, StockMovementItem } from '../types';

interface IssuePrintViewProps {
  record: StockMovementRecord;
  items: StockMovementItem[];
}

export default function IssuePrintView({ record, items }: IssuePrintViewProps) {
  return (
    <PrintLayout title="Material Issue Slip">
      <div className="flex items-start justify-between text-sm">
        <div className="space-y-1">
          <div><span className="text-gray-600">Issue No:</span> <span className="font-medium">{record.movementNo}</span></div>
          <div><span className="text-gray-600">Date:</span> <span className="font-medium">{record.date}</span></div>
          <div><span className="text-gray-600">MRS No:</span> <span className="font-medium">{record.mrsNo || '-'}</span></div>
        </div>
        <div className="space-y-1 text-right">
          <div><span className="text-gray-600">Production No:</span> <span className="font-medium">{record.productionNo || '-'}</span></div>
          <div><span className="text-gray-600">Production Batch:</span> <span className="font-medium">{record.productionBatchNo || '-'}</span></div>
        </div>
      </div>

      <table className="w-full text-xs border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100">
            {['Sr No', 'Item', 'Batch No', 'Requested', 'Issued', 'Remaining', 'Remarks'].map((h) => (
              <th key={h} className="border border-black px-2 py-1.5 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => (
            <tr key={`${row.itemName}-${idx}`}>
              <td className="border border-black px-2 py-1.5">{idx + 1}</td>
              <td className="border border-black px-2 py-1.5 font-medium">{row.itemName}</td>
              <td className="border border-black px-2 py-1.5 font-mono text-xs">{row.batchNo}</td>
              <td className="border border-black px-2 py-1.5 text-right">{row.requestedQty ?? '-'}</td>
              <td className="border border-black px-2 py-1.5 text-right">{row.quantity}</td>
              <td className="border border-black px-2 py-1.5 text-right">{row.remainingQty ?? '-'}</td>
              <td className="border border-black px-2 py-1.5">{row.remarks || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm pt-8">
        <div>
          <div className="border-t border-black pt-2">Issued By</div>
          <div className="font-medium mt-1">{record.issuedBy || ''}</div>
        </div>
        <div>
          <div className="border-t border-black pt-2">Approved By</div>
        </div>
        <div>
          <div className="border-t border-black pt-2">Received By</div>
        </div>
      </div>
    </PrintLayout>
  );
}
