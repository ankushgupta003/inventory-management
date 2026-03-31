import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data — replace with API call GET /purchases/:id
const mockGIN = {
  id: 'GIN-001',
  vendorName: 'ABC Steel Suppliers',
  challanNo: 'CH-201',
  challanDate: '2026-03-28',
  billNo: 'BILL-101',
  billDate: '2026-03-27',
  gateEntryNo: 'GE-045',
  entryDate: '2026-03-28',
  preparedBy: 'Ramesh Kumar',
  sanctionedBy: 'Suresh Sharma',
  authorizedSignatory: 'Amit Patel',
  items: [
    { description: 'Steel Rod 10mm', ulpQty: 500, billQty: 500, receivedQty: 490, acceptedQty: 480, rejectedQty: 10, batchNo: 'B-2026-001', mfgDate: '2026-01-15', expiryDate: '2028-01-15', rate: 55, remarks: 'Minor bends' },
    { description: 'Copper Wire 2mm', ulpQty: 200, billQty: 200, receivedQty: 200, acceptedQty: 200, rejectedQty: 0, batchNo: 'B-2026-002', mfgDate: '2026-02-10', expiryDate: '2029-02-10', rate: 82, remarks: '' },
    { description: 'Packing Box Large', ulpQty: 100, billQty: 100, receivedQty: 95, acceptedQty: 90, rejectedQty: 5, batchNo: 'B-2026-003', mfgDate: '2026-03-01', expiryDate: '2027-03-01', rate: 25, remarks: 'Damaged' },
  ],
};

export default function GINViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const gin = mockGIN; // Replace with useQuery

  const grandTotal = gin.items.reduce((s, i) => s + i.acceptedQty * i.rate, 0);

  return (
    <div className="space-y-4">
      {/* Action bar — hidden during print */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate('/purchases')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      {/* Printable document */}
      <div className="bg-white text-black border border-border rounded-lg print:border-0 print:rounded-none print:shadow-none" id="gin-print">
        <div className="p-8 print:p-6 space-y-6 max-w-[210mm] mx-auto">
          {/* Company Header */}
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-xl font-bold uppercase tracking-wider">Your Company Name</h1>
            <p className="text-xs text-gray-600 mt-1">Address Line 1, City, State - PIN</p>
            <p className="text-xs text-gray-600">Phone: +91-XXXXXXXXXX | Email: info@company.com</p>
            <h2 className="text-base font-bold mt-3 tracking-wide underline">GOODS INWARD NOTE</h2>
          </div>

          {/* Header Details */}
          <div className="grid grid-cols-2 gap-x-8 text-sm">
            <div className="space-y-1.5">
              <Row label="Vendor" value={gin.vendorName} />
              <Row label="Challan No" value={gin.challanNo} />
              <Row label="Challan Date" value={gin.challanDate} />
              <Row label="Bill No" value={gin.billNo} />
              <Row label="Bill Date" value={gin.billDate} />
            </div>
            <div className="space-y-1.5 text-right">
              <Row label="GIN No" value={gin.id} align="right" />
              <Row label="Entry Date" value={gin.entryDate} align="right" />
              <Row label="Gate Entry No" value={gin.gateEntryNo} align="right" />
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                {['Sr', 'Description', 'ULP Qty', 'Bill Qty', 'Recd Qty', 'Accptd', 'Rejctd', 'Batch/Lot', 'MFG Date', 'Expiry', 'Rate', 'Value', 'Remarks'].map((h) => (
                  <th key={h} className="border border-black px-1.5 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gin.items.map((item, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border border-black px-1.5 py-1.5 text-center">{idx + 1}</td>
                  <td className="border border-black px-1.5 py-1.5">{item.description}</td>
                  <td className="border border-black px-1.5 py-1.5 text-right">{item.ulpQty}</td>
                  <td className="border border-black px-1.5 py-1.5 text-right">{item.billQty}</td>
                  <td className="border border-black px-1.5 py-1.5 text-right">{item.receivedQty}</td>
                  <td className="border border-black px-1.5 py-1.5 text-right">{item.acceptedQty}</td>
                  <td className="border border-black px-1.5 py-1.5 text-right">{item.rejectedQty}</td>
                  <td className="border border-black px-1.5 py-1.5">{item.batchNo}</td>
                  <td className="border border-black px-1.5 py-1.5">{item.mfgDate}</td>
                  <td className="border border-black px-1.5 py-1.5">{item.expiryDate}</td>
                  <td className="border border-black px-1.5 py-1.5 text-right">₹{item.rate}</td>
                  <td className="border border-black px-1.5 py-1.5 text-right font-medium">₹{(item.acceptedQty * item.rate).toLocaleString('en-IN')}</td>
                  <td className="border border-black px-1.5 py-1.5">{item.remarks || '—'}</td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="font-bold">
                <td colSpan={11} className="border border-black px-1.5 py-2 text-right">Grand Total:</td>
                <td className="border border-black px-1.5 py-2 text-right">₹{grandTotal.toLocaleString('en-IN')}</td>
                <td className="border border-black px-1.5 py-2"></td>
              </tr>
            </tbody>
          </table>

          {/* Signatories */}
          <div className="grid grid-cols-3 gap-4 pt-12 text-sm text-center">
            <div className="space-y-8">
              <div className="border-t border-black pt-2 mx-4">
                <p className="font-semibold">Prepared By</p>
                <p className="text-gray-600">{gin.preparedBy || '________________'}</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="border-t border-black pt-2 mx-4">
                <p className="font-semibold">Sanctioned By</p>
                <p className="text-gray-600">{gin.sanctionedBy || '________________'}</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="border-t border-black pt-2 mx-4">
                <p className="font-semibold">Authorized Signatory</p>
                <p className="text-gray-600">{gin.authorizedSignatory || '________________'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
