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
import { BMRFormPage } from '@/modules/bmr';
import FilterBar from '@/components/FilterBar';
import type { ProductionBatch, StockMovementRecord, QaRecord, StockMovementType } from '../types';
import {
  getBatch,
  loadMrs,
  loadStockMovements,
  loadBmr,
  loadQa,
  addMrs,
  addStockMovement,
  saveQa,
  getDefaultStockMovement,
} from '../productionStore';

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

const formatNumber = (value: number) => Number.isFinite(value) ? value.toLocaleString() : '0';

const buildReference = (type: StockMovementType) => {
  const stamp = Date.now();
  if (type === 'ISSUE') return `ISS-${stamp}`;
  if (type === 'TRANSFER') return `TRF-${stamp}`;
  return `SMP-${stamp}`;
};

export default function ProductionViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const batchId = id ?? '';

  const [batch, setBatch] = useState<ProductionBatch | null>(null);
  const [mrsList, setMrsList] = useState<ReturnType<typeof loadMrs>>([]);
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [bmrStatus, setBmrStatus] = useState<'DRAFT' | 'SUBMITTED' | null>(null);
  const [qaRecord, setQaRecord] = useState<QaRecord | null>(null);

  const [movementType, setMovementType] = useState<StockMovementType>('ISSUE');
  const [movement, setMovement] = useState<StockMovementRecord>(() => getDefaultStockMovement());
  const [selectedMrsItemId, setSelectedMrsItemId] = useState('');
  const [mrsItemName, setMrsItemName] = useState('');
  const [mrsQtyRequested, setMrsQtyRequested] = useState(0);

  const qaForm = useForm<QaRecord>({
    resolver: zodResolver(qaSchema),
    defaultValues: {
      status: 'PENDING',
      remarks: '',
      approvedBy: '',
    },
    mode: 'onChange',
  });

  const refresh = () => {
    if (!batchId) return;
    setBatch(getBatch(batchId) ?? null);
    setMrsList(loadMrs(batchId));
    setMovements(loadStockMovements(batchId));
    const bmr = loadBmr(batchId);
    setBmrStatus(bmr?.status ?? null);
    const qa = loadQa(batchId);
    setQaRecord(qa);
    if (qa) {
      qaForm.reset(qa);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  const mrsItems = useMemo(() => {
    if (!batch) return [];
    const issuedMap = new Map<string, number>();
    movements
      .filter((m) => m.type === 'ISSUE' && m.mrsId)
      .forEach((m) => {
        const key = `${m.mrsId}::${m.itemName}`;
        issuedMap.set(key, (issuedMap.get(key) || 0) + m.qty);
      });

    return mrsList.map((mrs) => {
      const key = `${mrs.id}::${mrs.itemName}`;
      const issuedQty = issuedMap.get(key) ?? mrs.qtyIssued ?? 0;
      const remaining = Math.max(0, mrs.qtyRequested - issuedQty);
      const status = issuedQty === 0 ? 'OPEN' : issuedQty >= mrs.qtyRequested ? 'CLOSED' : 'PARTIAL';
      return {
        id: mrs.id,
        mrsId: mrs.id,
        mrsNo: mrs.id.toUpperCase(),
        itemName: mrs.itemName,
        qtyRequested: mrs.qtyRequested,
        qtyIssued: issuedQty,
        remaining,
        status,
        date: mrs.date,
      };
    });
  }, [mrsList, movements, batch]);

  const totals = useMemo(() => {
    const totalRequested = mrsItems.reduce((sum, row) => sum + row.qtyRequested, 0);
    const totalIssued = mrsItems.reduce((sum, row) => sum + row.qtyIssued, 0);
    return { totalRequested, totalIssued };
  }, [mrsItems]);
  const outputTotal = useMemo(() => loadBmr(batchId)?.data.finalOutput.actualQty ?? 0, [batchId, bmrStatus]);

  if (!batchId || !batch) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/production')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Batch not found.</p>
      </div>
    );
  }

  const activeMrsItem = mrsItems.find((mrs) => mrs.id === selectedMrsItemId);
  const remainingQty = activeMrsItem ? Math.max(activeMrsItem.qtyRequested - activeMrsItem.qtyIssued, 0) : 0;

  const handleMovementSubmit = () => {
    if (movementType === 'ISSUE') {
      if (!activeMrsItem) {
        toast.error('Select an MRS');
        return;
      }
      if (!movement.qty || movement.qty <= 0) {
        toast.error('Issue qty is required');
        return;
      }
      if (movement.qty > remainingQty) {
        toast.error('Issue qty exceeds remaining qty');
        return;
      }
      const record: StockMovementRecord = {
        ...movement,
        id: `mv-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        reference: buildReference('ISSUE'),
        type: 'ISSUE',
        itemName: activeMrsItem.itemName,
        mrsId: activeMrsItem.mrsId,
      };
      addStockMovement(batchId, record);
      toast.success('Issue recorded');
      setMovement(getDefaultStockMovement());
      setSelectedMrsItemId('');
      refresh();
      return;
    }

    if (!movement.itemName) {
      toast.error('Item name is required');
      return;
    }
    if (!movement.qty || movement.qty <= 0) {
      toast.error('Quantity is required');
      return;
    }
    if (movementType === 'TRANSFER' && (!movement.fromLocation || !movement.toLocation)) {
      toast.error('From and To locations are required');
      return;
    }

    const record: StockMovementRecord = {
      ...movement,
      id: `mv-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      reference: buildReference(movementType),
      type: movementType,
    };
    addStockMovement(batchId, record);
    toast.success('Stock movement recorded');
    setMovement(getDefaultStockMovement());
    refresh();
  };

  const handleQaSubmit = (values: QaRecord) => {
    if (bmrStatus !== 'SUBMITTED') {
      toast.error('Complete BMR before QA decision');
      return;
    }
    const record: QaRecord = {
      ...values,
      decidedAt: new Date().toISOString(),
    };
    saveQa(batchId, record);
    toast.success('QA decision saved');
    refresh();
  };

  const handleCreateMrs = () => {
    if (!mrsItemName.trim()) {
      toast.error('Item is required');
      return;
    }
    if (!mrsQtyRequested || mrsQtyRequested <= 0) {
      toast.error('Qty Requested is required');
      return;
    }

    const id = `mrs-${Date.now()}`;
    addMrs(batchId, {
      id,
      date: new Date().toISOString().slice(0, 10),
      itemName: mrsItemName.trim(),
      qtyRequested: mrsQtyRequested,
      qtyIssued: 0,
      status: 'OPEN',
    });
    toast.success('MRS created');
    setMrsItemName('');
    setMrsQtyRequested(0);
    refresh();
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
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
          </Button>
        )}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Batch Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
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
            <div className="text-muted-foreground">Dates</div>
            <div className="font-semibold">MFG {batch.mfgDate} | EXP {batch.expDate}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Material Requested</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{formatNumber(totals.totalRequested)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Material Issued</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{formatNumber(totals.totalIssued)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Output Qty</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{formatNumber(outputTotal)}</CardContent>
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Item *</Label>
                  <Input value={mrsItemName} onChange={(e) => setMrsItemName(e.target.value)} placeholder="Enter raw material" />
                </div>
                <div className="space-y-1.5">
                  <Label>Qty Requested *</Label>
                  <Input type="number" value={mrsQtyRequested || ''} onChange={(e) => setMrsQtyRequested(Number(e.target.value))} />
                </div>
                <div className="flex items-end justify-start md:justify-end">
                  <Button type="button" className="rounded-xl" onClick={handleCreateMrs}>
                    Create MRS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">MRS Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {['Date','MRS No','Item','Requested','Issued','Remaining','Status'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mrsItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No MRS linked to this batch.</td>
                    </tr>
                  )}
                  {mrsItems.map((row) => {
                    return (
                      <tr key={row.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2 font-mono text-xs">{row.mrsNo}</td>
                        <td className="px-3 py-2">{row.itemName}</td>
                        <td className="px-3 py-2">{row.qtyRequested}</td>
                        <td className="px-3 py-2">{row.qtyIssued}</td>
                        <td className="px-3 py-2">{row.remaining}</td>
                        <td className="px-3 py-2">
                          <Badge variant={row.status === 'CLOSED' ? 'default' : row.status === 'PARTIAL' ? 'secondary' : 'outline'}>
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Movement Type *</Label>
                  <Select value={movementType} onValueChange={(value) => setMovementType(value as StockMovementType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select movement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISSUE">Issue (Consumption)</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="SAMPLING">Sampling (QC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {movementType !== 'ISSUE' && (
                  <div className="space-y-1.5">
                    <Label>Item *</Label>
                    <Input value={movement.itemName} onChange={(e) => setMovement((prev) => ({ ...prev, itemName: e.target.value }))} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Qty *</Label>
                  <Input type="number" value={movement.qty} onChange={(e) => setMovement((prev) => ({ ...prev, qty: Number(e.target.value) }))} />
                </div>
              </div>

              {movementType === 'ISSUE' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Select MRS *</Label>
                    <Select value={selectedMrsItemId} onValueChange={setSelectedMrsItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select MRS" />
                      </SelectTrigger>
                      <SelectContent>
                        {mrsItems.filter((mrs) => mrs.remaining > 0).map((mrs) => (
                          <SelectItem key={mrs.id} value={mrs.id}>
                            {mrs.itemName} ({mrs.remaining} remaining)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Requested Qty</Label>
                    <Input readOnly value={activeMrsItem?.qtyRequested ?? 0} className="bg-muted/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Remaining Qty</Label>
                    <Input readOnly value={remainingQty} className="bg-muted/50" />
                  </div>
                </div>
              )}

              {movementType === 'TRANSFER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>From Location *</Label>
                    <Input value={movement.fromLocation ?? ''} onChange={(e) => setMovement((prev) => ({ ...prev, fromLocation: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>To Location *</Label>
                    <Input value={movement.toLocation ?? ''} onChange={(e) => setMovement((prev) => ({ ...prev, toLocation: e.target.value }))} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setMovement(getDefaultStockMovement())}>
                  Reset
                </Button>
                <Button type="button" onClick={handleMovementSubmit}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" /> Save Movement
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movement History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {['Date','Reference','Type','Item','Qty','MRS'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No movements recorded.</td>
                    </tr>
                  )}
                  {movements.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.reference}</td>
                      <td className="px-3 py-2">{row.type}</td>
                      <td className="px-3 py-2">{row.itemName}</td>
                      <td className="px-3 py-2">{row.qty}</td>
                      <td className="px-3 py-2">{row.mrsId ? row.mrsId : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bmr" forceMount className="space-y-4">
          <FilterBar className="p-4">
            <div className="text-sm text-muted-foreground flex-1">
              Batch Manufacturing Record for this batch. Complete all four pages before QA.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/bmr/print/${batchId}`)}>
                <Factory className="h-4 w-4 mr-2" /> Print View
              </Button>
            </div>
          </FilterBar>

          <BMRFormPage
            embedded
            batchId={batchId}
            onStatusChange={refresh}
          />
        </TabsContent>

        <TabsContent value="qa" forceMount className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">QA Release</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bmrStatus !== 'SUBMITTED' && (
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Complete the BMR before submitting QA decision.
                </div>
              )}
              <form onSubmit={qaForm.handleSubmit(handleQaSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>QA Status *</Label>
                    <Select
                      value={qaForm.watch('status')}
                      onValueChange={(value) => qaForm.setValue('status', value as QaRecord['status'], { shouldValidate: true })}
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
                    {qaForm.formState.errors.status && (
                      <p className="text-xs text-destructive">{qaForm.formState.errors.status.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Approved By *</Label>
                    <Input {...qaForm.register('approvedBy')} />
                    {qaForm.formState.errors.approvedBy && (
                      <p className="text-xs text-destructive">{qaForm.formState.errors.approvedBy.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>QA Remarks *</Label>
                    <Textarea rows={3} {...qaForm.register('remarks')} />
                    {qaForm.formState.errors.remarks && (
                      <p className="text-xs text-destructive">{qaForm.formState.errors.remarks.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => qaForm.reset(qaRecord ?? {
                    status: 'PENDING',
                    remarks: '',
                    approvedBy: '',
                  })}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={bmrStatus !== 'SUBMITTED'}>
                    Submit QA Decision
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
