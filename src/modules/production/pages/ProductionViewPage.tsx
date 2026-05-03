import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Factory } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import FilterBar from '@/components/FilterBar';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/apiError';
import { BMRFormPage } from '@/modules/bmr';
import { useIssueStock } from '@/modules/issues/hooks/useIssueStock';
import { useAvailableItems } from '@/modules/mrs/hooks/useMRS';
import mrsApi from '@/modules/mrs/services/mrsApi';
import type { MRSRecord } from '@/modules/mrs/types';
import { stockMovementApi } from '@/modules/stock-movement/services/stockMovementApi';
import type { StockMovementRecord, StockMovementType } from '@/modules/stock-movement/types';
import { productionApi } from '../services/productionApi';
import type { ProductionBatch, QaRecord } from '../types';

const statusLabel: Record<ProductionBatch['status'], string> = {
  DRAFT: 'Draft',
  IN_PROCESS: 'In Process',
  QA_PENDING: 'QA Pending',
  RELEASED: 'Released',
  BLOCKED: 'Blocked',
};

const statusVariant: Record<ProductionBatch['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  IN_PROCESS: 'secondary',
  QA_PENDING: 'secondary',
  RELEASED: 'default',
  BLOCKED: 'destructive',
};

const qaSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  remarks: z.string().min(1, 'Remarks are required'),
  approvedBy: z.string().min(1, 'Approved by is required'),
});

type MrsLine = {
  id: string;
  mrsId: string;
  mrsNo: string;
  mrsStatus: MRSRecord['status'];
  itemId: string;
  itemName: string;
  qtyRequested: number;
  qtyIssued: number;
  remaining: number;
  status: 'OPEN' | 'PARTIAL' | 'CLOSED';
  date: string;
};

type MovementFormState = {
  itemId: string;
  batchNo: string;
  qty: number;
  fromLocation: string;
  toLocation: string;
  issuedBy: string;
  sampleDrawnBy: string;
};

const emptyMovement = (): MovementFormState => ({
  itemId: '',
  batchNo: '',
  qty: 0,
  fromLocation: '',
  toLocation: '',
  issuedBy: '',
  sampleDrawnBy: '',
});

const formatNumber = (value: number) => (Number.isFinite(value) ? value.toLocaleString('en-IN') : '0');

const inferQaRecord = (batch: ProductionBatch | null): QaRecord | null => {
  if (!batch) return null;
  const status = batch.status === 'RELEASED' ? 'APPROVED' : batch.status === 'BLOCKED' ? 'REJECTED' : 'PENDING';
  return {
    status,
    remarks: batch.qaRemarks || '',
    approvedBy: batch.qaApprovedBy || '',
    decidedAt: batch.qaDecidedAt || '',
  };
};

const noticeClassName = 'rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground';

function isHttpStatus(error: unknown, status: number) {
  return axios.isAxiosError(error) && error.response?.status === status;
}

export default function ProductionViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const batchId = id ?? '';
  const { hasPermission } = useAuth();

  const canCreateMrs = hasPermission('mrs.create') && hasPermission('items.view');
  const canApproveMrs = hasPermission('mrs.approve');
  const canViewMovementHistory = hasPermission('stock_movement.view');
  const canCreateMovement =
    hasPermission('stock_movement.create') &&
    hasPermission('items.view') &&
    hasPermission('stock_ledger.view');
  const canSubmitQa = hasPermission('production.approve');
  const shouldLoadRawItems = canCreateMrs || canCreateMovement;

  const { batchesByItemId } = useIssueStock(canCreateMovement);
  const { options: rawItemOptions } = useAvailableItems(shouldLoadRawItems);

  const [batch, setBatch] = useState<ProductionBatch | null>(null);
  const [mrsRecords, setMrsRecords] = useState<MRSRecord[]>([]);
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [bmrStatus, setBmrStatus] = useState<'DRAFT' | 'SUBMITTED' | null>(null);
  const [qaRecord, setQaRecord] = useState<QaRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [mrsError, setMrsError] = useState<string | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [bmrError, setBmrError] = useState<string | null>(null);

  const [mrsItemId, setMrsItemId] = useState('');
  const [mrsQtyRequested, setMrsQtyRequested] = useState(0);
  const [mrsDepartment, setMrsDepartment] = useState('Production');
  const [mrsRequestedBy, setMrsRequestedBy] = useState('');

  const [movementType, setMovementType] = useState<StockMovementType>('issue');
  const [selectedMrsLineId, setSelectedMrsLineId] = useState('');
  const [movement, setMovement] = useState<MovementFormState>(() => emptyMovement());

  const qaForm = useForm<QaRecord>({
    resolver: zodResolver(qaSchema),
    defaultValues: {
      status: 'PENDING',
      remarks: '',
      approvedBy: '',
    },
    mode: 'onChange',
  });

  const refresh = async () => {
    if (!batchId) return;
    setLoading(true);
    setNotFound(false);
    setPageError(null);
    setMrsError(null);
    setMovementError(null);
    setBmrError(null);

    try {
      const batchData = await productionApi.getById(batchId);
      setBatch(batchData);
      setBmrStatus(batchData.bmrStatus ?? null);
      const qa = inferQaRecord(batchData);
      setQaRecord(qa);
      qaForm.reset(qa ?? { status: 'PENDING', remarks: '', approvedBy: '' });

      const [mrsResult, bmrResult, movementResult] = await Promise.all([
        productionApi.getMrs(batchId)
          .then((data) => ({ ok: true as const, data }))
          .catch((error: unknown) => ({ ok: false as const, error })),
        productionApi.getBmr(batchId)
          .then((data) => ({ ok: true as const, data }))
          .catch((error: unknown) => ({ ok: false as const, error })),
        canViewMovementHistory
          ? stockMovementApi.getAll({ productionBatchId: batchId })
              .then((data) => ({ ok: true as const, data }))
              .catch((error: unknown) => ({ ok: false as const, error }))
          : Promise.resolve({ ok: true as const, data: [] as StockMovementRecord[] }),
      ]);

      if (mrsResult.ok) {
        setMrsRecords(mrsResult.data);
      } else {
        setMrsRecords([]);
        setMrsError(getErrorMessage(mrsResult.error, 'Unable to load MRS records for this batch'));
      }

      if (bmrResult.ok) {
        setBmrStatus(bmrResult.data?.status ?? batchData.bmrStatus ?? null);
      } else {
        setBmrStatus(batchData.bmrStatus ?? null);
        setBmrError(getErrorMessage(bmrResult.error, 'Unable to load saved BMR data'));
      }

      if (canViewMovementHistory) {
        if (movementResult.ok) {
          setMovements(movementResult.data);
        } else {
          setMovements([]);
          setMovementError(getErrorMessage(movementResult.error, 'Unable to load stock movement history'));
        }
      } else {
        setMovements([]);
      }
    } catch (error) {
      setBatch(null);
      setMrsRecords([]);
      setMovements([]);
      setBmrStatus(null);
      setQaRecord(null);
      if (isHttpStatus(error, 404)) {
        setNotFound(true);
      } else {
        setPageError(getErrorMessage(error, 'Unable to load this production batch'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, canViewMovementHistory]);

  const mrsLines = useMemo<MrsLine[]>(() => {
    return mrsRecords.flatMap((record) =>
      record.items.map((item) => {
        const status = item.qtyIssued <= 0 ? 'OPEN' : item.remainingQty <= 0 ? 'CLOSED' : 'PARTIAL';
        return {
          id: `${record.id}:${item.itemId}`,
          mrsId: record.id,
          mrsNo: record.mrsNo,
          mrsStatus: record.status,
          itemId: item.itemId,
          itemName: item.itemName,
          qtyRequested: item.qtyRequested,
          qtyIssued: item.qtyIssued,
          remaining: item.remainingQty,
          status,
          date: record.date,
        };
      }),
    );
  }, [mrsRecords]);

  const selectedMrsLine = useMemo(
    () => mrsLines.find((line) => line.id === selectedMrsLineId) ?? null,
    [mrsLines, selectedMrsLineId],
  );

  const selectedMovementItemId = useMemo(() => {
    if (movementType === 'issue') return selectedMrsLine?.itemId ?? '';
    if (movementType === 'sampling') return batch?.itemId ?? movement.itemId;
    return movement.itemId;
  }, [batch?.itemId, movement.itemId, movementType, selectedMrsLine]);

  const availableBatches = useMemo(() => {
    if (!selectedMovementItemId) return [];
    const rows = batchesByItemId.get(selectedMovementItemId) ?? [];
    if (movementType === 'sampling' && batch?.batchNo) {
      return rows.filter((row) => row.batchNo === batch.batchNo);
    }
    return rows;
  }, [batch?.batchNo, batchesByItemId, movementType, selectedMovementItemId]);

  const selectedBatchNo = movementType === 'sampling' && batch?.batchNo ? batch.batchNo : movement.batchNo;

  const selectedBatch = useMemo(
    () => availableBatches.find((batchOption) => batchOption.batchNo === selectedBatchNo) ?? null,
    [availableBatches, selectedBatchNo],
  );

  const totals = useMemo(() => {
    const totalRequested = mrsLines.reduce((sum, row) => sum + row.qtyRequested, 0);
    const totalIssued = mrsLines.reduce((sum, row) => sum + row.qtyIssued, 0);
    return { totalRequested, totalIssued };
  }, [mrsLines]);

  const nextAction = useMemo(() => {
    if (!batch) return '';
    if (batch.status === 'DRAFT') return 'Create MRS lines, record movements, and complete the BMR.';
    if (batch.status === 'IN_PROCESS') return 'Finish stock issue and complete BMR pages before QA.';
    if (batch.status === 'QA_PENDING') return canSubmitQa ? 'Review BMR and submit the QA decision.' : 'Waiting for a QA decision from an authorized user.';
    if (batch.status === 'BLOCKED') return 'Review QA remarks and decide the corrective action for this batch.';
    return 'This batch is released. Use the history below for traceability.';
  }, [batch, canSubmitQa]);

  useEffect(() => {
    if (movementType !== 'sampling' || !batch) return;

    setMovement((prev) => ({
      ...prev,
      itemId: batch.itemId,
      batchNo: batch.batchNo,
      fromLocation: prev.fromLocation || 'FG Store',
      toLocation: prev.toLocation || 'QC',
    }));
  }, [batch, movementType]);

  if (!batchId) {
    return <p className="text-muted-foreground">Batch not found.</p>;
  }

  if (loading && !batch) {
    return <p className="text-muted-foreground">Loading batch...</p>;
  }

  if ((notFound || pageError) && !batch) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/production')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="text-muted-foreground">{notFound ? 'Batch not found.' : pageError}</p>
      </div>
    );
  }

  const handleCreateMrs = async () => {
    if (!batch) return;
    if (!canCreateMrs) {
      toast.error('You do not have permission to create MRS from this page');
      return;
    }
    if (!mrsItemId) {
      toast.error('Select an item');
      return;
    }
    if (!mrsRequestedBy.trim()) {
      toast.error('Requisition by is required');
      return;
    }
    if (!mrsQtyRequested || mrsQtyRequested <= 0) {
      toast.error('Qty requested is required');
      return;
    }

    try {
      await mrsApi.create({
        productionBatchId: batch.id,
        date: new Date().toISOString().slice(0, 10),
        department: mrsDepartment,
        requisitionBy: mrsRequestedBy.trim(),
        items: [
          {
            itemId: mrsItemId,
            qtyRequested: mrsQtyRequested,
          },
        ],
      });
      toast.success('MRS created');
      setMrsItemId('');
      setMrsQtyRequested(0);
      setMrsRequestedBy('');
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create MRS'));
    }
  };

  const handleApproveMrs = async (mrsId: string) => {
    if (!canApproveMrs) {
      toast.error('You do not have permission to approve MRS');
      return;
    }

    try {
      await mrsApi.approve(mrsId);
      toast.success('MRS approved');
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to approve MRS'));
    }
  };

  const handleMovementSubmit = async () => {
    if (!canCreateMovement) {
      toast.error('You do not have permission to record stock movements from this page');
      return;
    }

    try {
      if (!movement.qty || movement.qty <= 0) {
        toast.error('Quantity is required');
        return;
      }

      if (!selectedBatch) {
        toast.error('Select a batch');
        return;
      }

      if (movement.qty > selectedBatch.availableQty) {
        toast.error('Qty cannot exceed available stock');
        return;
      }

      if (movementType === 'issue') {
        if (!selectedMrsLine) {
          toast.error('Select an approved MRS item');
          return;
        }
        if (selectedMrsLine.mrsStatus === 'pending') {
          toast.error('Approve MRS before issuing materials');
          return;
        }
        if (movement.qty > selectedMrsLine.remaining) {
          toast.error('Issue qty exceeds remaining requested qty');
          return;
        }

        await stockMovementApi.create({
          type: 'issue',
          date: new Date().toISOString().slice(0, 10),
          productionBatchId: batch?.id,
          materialRequisitionId: selectedMrsLine.mrsId,
          issuedBy: movement.issuedBy || undefined,
          items: [
            {
              itemId: selectedMrsLine.itemId,
              batchNo: selectedBatch.batchNo,
              quantity: movement.qty,
            },
          ],
        });
        toast.success('Issue recorded');
      } else if (movementType === 'sampling') {
        if (!movement.fromLocation || !movement.toLocation) {
          toast.error('From and To locations are required');
          return;
        }
        await stockMovementApi.create({
          type: 'sampling',
          date: new Date().toISOString().slice(0, 10),
          productionBatchId: batch?.id,
          fromLocation: movement.fromLocation,
          toLocation: movement.toLocation,
          issuedBy: movement.issuedBy || undefined,
          sampleDrawnBy: movement.sampleDrawnBy || undefined,
          items: [
            {
              itemId: batch?.itemId ?? movement.itemId,
              batchNo: batch?.batchNo ?? selectedBatch.batchNo,
              quantity: movement.qty,
            },
          ],
        });
        toast.success('Sampling recorded');
      } else {
        if (!movement.fromLocation || !movement.toLocation) {
          toast.error('From and To locations are required');
          return;
        }
        await stockMovementApi.create({
          type: 'transfer',
          date: new Date().toISOString().slice(0, 10),
          fromLocation: movement.fromLocation,
          toLocation: movement.toLocation,
          items: [
            {
              itemId: movement.itemId,
              batchNo: selectedBatch.batchNo,
              quantity: movement.qty,
            },
          ],
        });
        toast.success('Transfer recorded');
      }

      setMovement(emptyMovement());
      setSelectedMrsLineId('');
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save stock movement'));
    }
  };

  const handleQaSubmit = async (values: QaRecord) => {
    if (!batch) return;
    if (!canSubmitQa) {
      toast.error('You do not have permission to submit QA decisions');
      return;
    }
    if (bmrStatus !== 'SUBMITTED') {
      toast.error('Complete BMR before QA decision');
      return;
    }

    try {
      await productionApi.submitQa(batch.id, values);
      toast.success('QA decision saved');
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save QA decision'));
    }
  };

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Batch Details"
        description="Track the batch lifecycle with linked MRS, stock movements, BMR, and QA."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Production Batches', href: '/production' },
          { label: 'Batch Details' },
        ]}
        action={(
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/production')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        )}
      />

      {batch ? (
        <>
          <div className="simple-status-summary">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Current Status</div>
                <div className="mt-2 text-lg font-semibold">{statusLabel[batch.status]}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">BMR Status</div>
                <div className="mt-2 text-lg font-semibold">{bmrStatus ?? 'Not Started'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Material Progress</div>
                <div className="mt-2 text-lg font-semibold">{formatNumber(totals.totalIssued)} / {formatNumber(totals.totalRequested)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Next Action</div>
                <div className="mt-2 text-sm font-medium text-foreground">{nextAction}</div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Batch Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
              <div>
                <div className="text-muted-foreground">Production No</div>
                <div className="font-semibold">{batch.productionNo}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Batch No</div>
                <div className="font-semibold">{batch.batchNo}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Product</div>
                <div className="font-semibold">{batch.productName}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <Badge variant={statusVariant[batch.status]}>{statusLabel[batch.status]}</Badge>
              </div>
              <div>
                <div className="text-muted-foreground">Batch Size</div>
                <div className="font-semibold">{batch.batchSize}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Start Date</div>
                <div className="font-semibold">{batch.startDate}</div>
              </div>
              <div>
                <div className="text-muted-foreground">MFG Date</div>
                <div className="font-semibold">{batch.mfgDate}</div>
              </div>
              <div>
                <div className="text-muted-foreground">EXP Date</div>
                <div className="font-semibold">{batch.expDate}</div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex flex-wrap justify-start rounded-xl">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="mrs">MRS</TabsTrigger>
              <TabsTrigger value="stock">Stock Movement</TabsTrigger>
              <TabsTrigger value="bmr">BMR</TabsTrigger>
              <TabsTrigger value="qa">QA</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" forceMount className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Total Material Requested</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold">{formatNumber(totals.totalRequested)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Total Material Issued</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold">{formatNumber(totals.totalIssued)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Actual Output Qty</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold">{formatNumber(batch.actualQty)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Current Status</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold">{statusLabel[batch.status]}</CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="mrs" forceMount className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Create MRS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canCreateMrs ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="space-y-1.5">
                          <Label>Item *</Label>
                          <Select value={mrsItemId} onValueChange={setMrsItemId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select raw item" />
                            </SelectTrigger>
                            <SelectContent>
                              {rawItemOptions.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Qty Requested *</Label>
                          <Input type="number" value={mrsQtyRequested || ''} onChange={(event) => setMrsQtyRequested(Number(event.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Department *</Label>
                          <Input value={mrsDepartment} onChange={(event) => setMrsDepartment(event.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Requisition By *</Label>
                          <Input value={mrsRequestedBy} onChange={(event) => setMrsRequestedBy(event.target.value)} />
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <Button type="button" className="rounded-xl" onClick={handleCreateMrs}>
                          Create MRS
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className={noticeClassName}>
                      You can review linked MRS records here, but creating new requests requires both `mrs.create` and `items.view`.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">MRS Records</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {['Date', 'MRS No', 'Item', 'Requested', 'Issued', 'Remaining', 'Line Status', 'MRS Status', ''].map((header) => (
                          <th key={header} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mrsError && (
                        <tr>
                          <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">{mrsError}</td>
                        </tr>
                      )}
                      {!mrsError && mrsLines.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">No MRS linked to this batch.</td>
                        </tr>
                      )}
                      {!mrsError && mrsLines.map((row) => (
                        <tr key={row.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">{row.date}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.mrsNo}</td>
                          <td className="px-3 py-2">{row.itemName}</td>
                          <td className="px-3 py-2">{row.qtyRequested}</td>
                          <td className="px-3 py-2">{row.qtyIssued}</td>
                          <td className="px-3 py-2">{row.remaining}</td>
                          <td className="px-3 py-2">
                            <Badge variant={row.status === 'CLOSED' ? 'default' : row.status === 'PARTIAL' ? 'secondary' : 'outline'}>{row.status}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={row.mrsStatus === 'issued' ? 'default' : row.mrsStatus === 'approved' ? 'secondary' : 'outline'}>
                              {row.mrsStatus.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {row.mrsStatus === 'pending' && canApproveMrs ? (
                              <Button variant="outline" size="sm" onClick={() => handleApproveMrs(row.mrsId)}>
                                Approve
                              </Button>
                            ) : row.mrsStatus === 'pending' ? (
                              <span className="text-xs text-muted-foreground">Approval access required</span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock" forceMount className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Record Stock Movement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canCreateMovement ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label>Movement Type *</Label>
                          <Select
                            value={movementType}
                            onValueChange={(value) => {
                              setMovementType(value as StockMovementType);
                              setSelectedMrsLineId('');
                              setMovement(emptyMovement());
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select movement" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="issue">Issue (Consumption)</SelectItem>
                              <SelectItem value="transfer">Transfer</SelectItem>
                              <SelectItem value="sampling">Sampling (QC)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {movementType === 'issue' ? (
                          <div className="space-y-1.5">
                            <Label>Select Approved MRS Item *</Label>
                            <Select value={selectedMrsLineId} onValueChange={setSelectedMrsLineId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select MRS item" />
                              </SelectTrigger>
                              <SelectContent>
                                {mrsLines
                                  .filter((line) => line.remaining > 0 && line.mrsStatus !== 'pending')
                                  .map((line) => (
                                    <SelectItem key={line.id} value={line.id}>
                                      {line.mrsNo} | {line.itemName} ({line.remaining} remaining)
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <Label>{movementType === 'sampling' ? 'Finished Item' : 'Item *'}</Label>
                            {movementType === 'sampling' ? (
                              <>
                                <Input readOnly value={batch?.productName || ''} className="bg-muted/50" />
                                <p className="text-xs text-muted-foreground">
                                  Sampling on this page is tied to the current finished-good batch and auto-creates a QC report.
                                </p>
                              </>
                            ) : (
                              <Select value={movement.itemId} onValueChange={(value) => setMovement((prev) => ({ ...prev, itemId: value, batchNo: '' }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rawItemOptions.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label>Batch *</Label>
                          {movementType === 'sampling' ? (
                            <Input readOnly value={batch?.batchNo || ''} className="bg-muted/50" />
                          ) : (
                            <Select
                              value={movement.batchNo}
                              onValueChange={(value) => setMovement((prev) => ({ ...prev, batchNo: value }))}
                              disabled={!selectedMovementItemId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={selectedMovementItemId ? 'Select batch' : 'Select item first'} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableBatches.map((row) => (
                                  <SelectItem key={row.batchNo} value={row.batchNo}>
                                    {row.batchNo} (Avail: {row.availableQty})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label>Qty *</Label>
                          <Input type="number" value={movement.qty || ''} onChange={(event) => setMovement((prev) => ({ ...prev, qty: Number(event.target.value) }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Available Qty</Label>
                          <Input readOnly value={selectedBatch?.availableQty ?? 0} className="bg-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Issued By</Label>
                          <Input value={movement.issuedBy} onChange={(event) => setMovement((prev) => ({ ...prev, issuedBy: event.target.value }))} />
                        </div>
                      </div>

                      {movementType === 'issue' && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Requested Qty</Label>
                            <Input readOnly value={selectedMrsLine?.qtyRequested ?? 0} className="bg-muted/50" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Remaining Qty</Label>
                            <Input readOnly value={selectedMrsLine?.remaining ?? 0} className="bg-muted/50" />
                          </div>
                        </div>
                      )}

                      {(movementType === 'sampling' || movementType === 'transfer') && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label>From Location *</Label>
                            <Input value={movement.fromLocation} onChange={(event) => setMovement((prev) => ({ ...prev, fromLocation: event.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>To Location *</Label>
                            <Input value={movement.toLocation} onChange={(event) => setMovement((prev) => ({ ...prev, toLocation: event.target.value }))} />
                          </div>
                          {movementType === 'sampling' && (
                            <div className="space-y-1.5">
                              <Label>Sample Drawn By</Label>
                              <Input value={movement.sampleDrawnBy} onChange={(event) => setMovement((prev) => ({ ...prev, sampleDrawnBy: event.target.value }))} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => { setMovement(emptyMovement()); setSelectedMrsLineId(''); }}>
                          Reset
                        </Button>
                        <Button type="button" onClick={handleMovementSubmit}>
                          <ArrowRightLeft className="mr-2 h-4 w-4" /> Save Movement
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className={noticeClassName}>
                      Recording stock movements from this page requires `stock_movement.create`, `items.view`, and `stock_ledger.view`.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Movement History</CardTitle>
                </CardHeader>
                <CardContent className={canViewMovementHistory ? 'p-0' : 'space-y-4'}>
                  {canViewMovementHistory ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          {['Date', 'Movement', 'Type', 'Item', 'Batch', 'Qty', 'MRS', 'Reports'].map((header) => (
                            <th key={header} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {movementError && (
                          <tr>
                            <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">{movementError}</td>
                          </tr>
                        )}
                        {!movementError && movements.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No movements recorded.</td>
                          </tr>
                        )}
                        {!movementError && movements.map((row) => (
                          <tr key={row.id} className="border-b border-border last:border-0">
                            <td className="px-3 py-2">{row.date}</td>
                            <td className="px-3 py-2 font-mono text-xs">{row.movementNo}</td>
                            <td className="px-3 py-2 capitalize">{row.type}</td>
                            <td className="px-3 py-2">{row.itemName}</td>
                            <td className="px-3 py-2">{row.batchNo}</td>
                            <td className="px-3 py-2">{row.quantity}</td>
                            <td className="px-3 py-2">{row.mrsNo || '-'}</td>
                            <td className="px-3 py-2">
                              {row.qualityRequests?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {row.qualityRequests.map((request) => (
                                    <button
                                      key={request.id}
                                      type="button"
                                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                                      onClick={() => navigate(`/quality-requests/${request.id}`)}
                                    >
                                      {request.requestNo}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={noticeClassName}>
                      Stock movement history is available only to users with `stock_movement.view`.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bmr" forceMount className="space-y-4">
              <FilterBar className="p-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  Batch Manufacturing Record for this batch. Complete all four pages before QA.
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/bmr/print/${batchId}`)}>
                    <Factory className="mr-2 h-4 w-4" /> Print View
                  </Button>
                </div>
              </FilterBar>

              {bmrError ? (
                <div className={noticeClassName}>
                  {bmrError}
                </div>
              ) : null}

              <BMRFormPage embedded batchId={batchId} onStatusChange={refresh} />
            </TabsContent>

            <TabsContent value="qa" forceMount className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">QA Release</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bmrStatus !== 'SUBMITTED' && (
                    <div className={noticeClassName}>
                      Complete the BMR before submitting QA decision.
                    </div>
                  )}
                  {!canSubmitQa && (
                    <div className={noticeClassName}>
                      You can view QA details for this batch, but submitting a QA decision requires `production.approve`.
                    </div>
                  )}
                  <form onSubmit={qaForm.handleSubmit(handleQaSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>QA Status *</Label>
                        <Select
                          value={qaForm.watch('status')}
                          onValueChange={(value) => qaForm.setValue('status', value as QaRecord['status'], { shouldValidate: true })}
                          disabled={!canSubmitQa}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        {qaForm.formState.errors.status && <p className="text-xs text-destructive">{qaForm.formState.errors.status.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Approved By *</Label>
                        <Input {...qaForm.register('approvedBy')} disabled={!canSubmitQa} />
                        {qaForm.formState.errors.approvedBy && <p className="text-xs text-destructive">{qaForm.formState.errors.approvedBy.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label>QA Remarks *</Label>
                        <Textarea rows={3} {...qaForm.register('remarks')} disabled={!canSubmitQa} />
                        {qaForm.formState.errors.remarks && <p className="text-xs text-destructive">{qaForm.formState.errors.remarks.message}</p>}
                      </div>
                    </div>

                    {qaRecord?.decidedAt ? (
                      <div className="text-sm text-muted-foreground">
                        Last QA decision: {qaRecord.status} on {new Date(qaRecord.decidedAt).toLocaleString('en-IN')}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => qaForm.reset(qaRecord ?? { status: 'PENDING', remarks: '', approvedBy: '' })}
                        disabled={!canSubmitQa}
                      >
                        Reset
                      </Button>
                      <Button type="submit" disabled={!canSubmitQa || bmrStatus !== 'SUBMITTED'}>
                        Submit QA Decision
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
