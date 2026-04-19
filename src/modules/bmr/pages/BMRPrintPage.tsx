import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import PrintLayout from '../components/PrintLayout';
import { mockBmrData } from '../mockData';
import type { BmrSchemaValues } from '../schemas/bmrSchema';
import { useParams } from 'react-router-dom';
import { getBatch, loadBmr } from '@/modules/production/productionStore';

const STORAGE_KEY = 'bmr_form_draft';
const BATCH_KEY = 'bmr_batch_draft';

const loadDraft = (): BmrSchemaValues | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BmrSchemaValues;
  } catch {
    return null;
  }
};

const loadBatch = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(BATCH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BmrSchemaValues['batchInfo'];
  } catch {
    return null;
  }
};

export default function BMRPrintPage() {
  const params = useParams();
  const batchId = params.batchId;
  const stored = batchId ? loadBmr(batchId) : null;
  const batch = batchId ? getBatch(batchId) : null;
  const draft = loadDraft();
  const batchOverride = loadBatch();
  const fallback = draft ? { ...draft, batchInfo: batchOverride ?? draft.batchInfo } : { ...mockBmrData, batchInfo: batchOverride ?? mockBmrData.batchInfo };
  const data = stored?.data
    ? {
      ...stored.data,
      batchInfo: batch
        ? {
          productName: batch.productName,
          batchNo: batch.batchNo,
          batchSize: batch.batchSize,
          mfgDate: batch.mfgDate,
          expDate: batch.expDate,
        }
        : stored.data.batchInfo,
    }
    : fallback;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="BMR Print View"
        description="Exact A4 document layout for printing."
        className="print:hidden"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Production', href: '/production' },
          { label: 'Print View' },
        ]}
        action={(
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        )}
      />

      <div className="space-y-6 print:space-y-0">
        <PrintLayout title="Page 1 - Basic Info & Raw Material" pageNumber={1}>
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2 text-xs">
              <div className="border border-black p-2">
                <div className="text-[10px] uppercase">Product Name</div>
                <div className="font-semibold">{data.batchInfo.productName}</div>
              </div>
              <div className="border border-black p-2">
                <div className="text-[10px] uppercase">Batch No</div>
                <div className="font-semibold">{data.batchInfo.batchNo}</div>
              </div>
              <div className="border border-black p-2">
                <div className="text-[10px] uppercase">Batch Size</div>
                <div className="font-semibold">{data.batchInfo.batchSize}</div>
              </div>
              <div className="border border-black p-2">
                <div className="text-[10px] uppercase">MFG Date</div>
                <div className="font-semibold">{data.batchInfo.mfgDate}</div>
              </div>
              <div className="border border-black p-2">
                <div className="text-[10px] uppercase">EXP Date</div>
                <div className="font-semibold">{data.batchInfo.expDate}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase mb-1">Raw Material Consumption</div>
              <table className="bmr-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Material Name</th>
                    <th>Required Qty</th>
                    <th>Issued Qty</th>
                    <th>Used Qty</th>
                    <th>Returned Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rawMaterials.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{idx + 1}</td>
                      <td>{row.materialName}</td>
                      <td>{row.requiredQty}</td>
                      <td>{row.issuedQty}</td>
                      <td>{row.usedQty}</td>
                      <td>{row.returnedQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </PrintLayout>

        <PrintLayout title="Page 2 - Manufacturing Process" pageNumber={2}>
          <div className="text-xs font-semibold uppercase mb-1">Manufacturing Process Log</div>
          <table className="bmr-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Process Step</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Operator Name</th>
                <th>Checked By</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {data.processSteps.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{row.stepName}</td>
                  <td>{row.startTime}</td>
                  <td>{row.endTime}</td>
                  <td>{row.operatorName}</td>
                  <td>{row.checkedBy}</td>
                  <td>{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PrintLayout>

        <PrintLayout title="Page 3 - Sterilization & Packing" pageNumber={3}>
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase mb-1">Sterilization</div>
              <table className="bmr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Quantity</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{data.sterilization.date}</td>
                    <td>{data.sterilization.quantity}</td>
                    <td>{data.sterilization.reference}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase mb-1">Packing</div>
              <table className="bmr-table">
                <thead>
                  <tr>
                    <th>Packing Type</th>
                    <th>Quantity</th>
                    <th>Done By</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{data.packing.packingType}</td>
                    <td>{data.packing.quantity}</td>
                    <td>{data.packing.doneBy}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase mb-1">Labelling</div>
              <table className="bmr-table">
                <thead>
                  <tr>
                    <th>Label Details</th>
                    <th>Checked By</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{data.labelling.labelDetails}</td>
                    <td>{data.labelling.checkedBy}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </PrintLayout>

        <PrintLayout title="Page 4 - Final Output & QA Release" pageNumber={4}>
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase mb-1">Final Output</div>
              <table className="bmr-table">
                <thead>
                  <tr>
                    <th>Expected Qty</th>
                    <th>Actual Qty</th>
                    <th>Rejected Qty</th>
                    <th>Yield %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{data.finalOutput.expectedQty}</td>
                    <td>{data.finalOutput.actualQty}</td>
                    <td>{data.finalOutput.rejectedQty}</td>
                    <td>{data.finalOutput.expectedQty ? ((data.finalOutput.actualQty / data.finalOutput.expectedQty) * 100).toFixed(2) : '0'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase mb-1">QA Release</div>
              <table className="bmr-table">
                <thead>
                  <tr>
                    <th>QA Status</th>
                    <th>QA Remarks</th>
                    <th>Approved By</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{data.qa.status}</td>
                    <td>{data.qa.remarks}</td>
                    <td>{data.qa.approvedBy || '________________'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs mt-6">
              <div className="border-t border-black pt-2">Operator</div>
              <div className="border-t border-black pt-2 text-center">Supervisor</div>
              <div className="border-t border-black pt-2 text-right">QA</div>
            </div>
          </div>
        </PrintLayout>
      </div>
    </div>
  );
}
