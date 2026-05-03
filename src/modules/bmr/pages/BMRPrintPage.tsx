import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/apiError';
import { productionApi } from '@/modules/production/services/productionApi';
import { stockMovementApi } from '@/modules/stock-movement/services/stockMovementApi';
import PrintLayout from '../components/PrintLayout';
import { mockBmrData } from '../mockData';
import type { BmrSchemaValues } from '../schemas/bmrSchema';
import { buildDefaultBmrValues } from '../utils/bmrData';

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

const loadBatchOverride = (): BmrSchemaValues['batchInfo'] | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(BATCH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BmrSchemaValues['batchInfo'];
  } catch {
    return null;
  }
};

const noticeClassName = 'rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground';

function isHttpStatus(error: unknown, status: number) {
  return axios.isAxiosError(error) && error.response?.status === status;
}

export default function BMRPrintPage() {
  const params = useParams();
  const batchId = params.batchId;
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(Boolean(batchId));
  const [data, setData] = useState<BmrSchemaValues>(() => {
    const draft = loadDraft();
    const batchOverride = loadBatchOverride();
    return buildDefaultBmrValues({
      existingData: draft
        ? {
            ...draft,
            batchInfo: batchOverride ?? draft.batchInfo,
          }
        : {
            ...mockBmrData,
            batchInfo: batchOverride ?? mockBmrData.batchInfo,
          },
      });
  });
  const [loadNotice, setLoadNotice] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const canViewMovements = hasPermission('stock_movement.view');

  useEffect(() => {
    if (!batchId) {
      setLoadNotice(null);
      setNotFound(false);
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadNotice(null);
      setNotFound(false);
      try {
        const batch = await productionApi.getById(batchId);

        if (!active) return;

        const [bmrResult, mrsResult, movementResult] = await Promise.all([
          productionApi.getBmr(batchId)
            .then((data) => ({ ok: true as const, data }))
            .catch((error: unknown) => ({ ok: false as const, error })),
          productionApi.getMrs(batchId)
            .then((data) => ({ ok: true as const, data }))
            .catch((error: unknown) => ({ ok: false as const, error })),
          canViewMovements
            ? stockMovementApi.getAll({ productionBatchId: batchId })
                .then((data) => ({ ok: true as const, data }))
                .catch((error: unknown) => ({ ok: false as const, error }))
            : Promise.resolve({ ok: true as const, data: [] }),
        ]);

        const notices: string[] = [];
        const existingData = bmrResult.ok ? (bmrResult.data?.data ?? null) : null;
        const mrsRecords = mrsResult.ok ? mrsResult.data : [];
        const movements = canViewMovements && movementResult.ok ? movementResult.data : [];

        if (!bmrResult.ok) {
          notices.push(getErrorMessage(bmrResult.error, 'Unable to load saved BMR data.'));
        }

        if (!mrsResult.ok) {
          notices.push(getErrorMessage(mrsResult.error, 'Unable to load linked MRS records.'));
        }

        if (canViewMovements && !movementResult.ok) {
          notices.push(getErrorMessage(movementResult.error, 'Unable to load stock movement history.'));
        }

        setData(
          buildDefaultBmrValues({
            batch,
            existingData,
            mrsRecords,
            movements,
          }),
        );
        setLoadNotice(notices.length ? notices.join(' ') : null);
      } catch (error) {
        if (!active) return;
        if (isHttpStatus(error, 404)) {
          setNotFound(true);
        } else {
          setLoadNotice(getErrorMessage(error, 'Failed to load print view'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [batchId, canViewMovements]);

  const yieldPercent = useMemo(
    () => (data.finalOutput.expectedQty ? ((data.finalOutput.actualQty / data.finalOutput.expectedQty) * 100).toFixed(2) : '0'),
    [data.finalOutput.actualQty, data.finalOutput.expectedQty],
  );

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading print view...</div>;
  }

  if (notFound) {
    return <div className="text-sm text-muted-foreground">Batch not found.</div>;
  }

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
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        )}
      />

      {loadNotice ? (
        <div className={noticeClassName}>
          {loadNotice}
        </div>
      ) : null}

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
              <div className="mb-1 text-xs font-semibold uppercase">Raw Material Consumption</div>
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
          <div className="mb-1 text-xs font-semibold uppercase">Manufacturing Process Log</div>
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
              <div className="mb-1 text-xs font-semibold uppercase">Sterilization</div>
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
              <div className="mb-1 text-xs font-semibold uppercase">Packing</div>
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
              <div className="mb-1 text-xs font-semibold uppercase">Labelling</div>
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
              <div className="mb-1 text-xs font-semibold uppercase">Final Output</div>
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
                    <td>{yieldPercent}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold uppercase">QA Release</div>
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

            <div className="mt-6 grid grid-cols-3 gap-4 text-xs">
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
