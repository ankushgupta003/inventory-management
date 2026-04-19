import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIssueStock } from '@/modules/issues/hooks/useIssueStock';
import { useMRSList } from '@/modules/mrs/hooks/useMRS';
import { stockMovementApi } from '../services/stockMovementApi';
import type { StockMovementRecord, StockMovementType } from '../types';
import { toast } from 'sonner';

const createMovementNo = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `MOV-${datePart}-${rand}`;
};

const today = new Date().toISOString().split('T')[0];

type MovementRow = {
  itemId: string;
  itemName: string;
  unit?: string;
  batchNo: string;
  availableQty: number;
  mfgDate: string;
  expiryDate: string;
  qty: number;
  requestedQty?: number;
  issuedQty?: number;
  remainingQty?: number;
};

const emptyRow: MovementRow = {
  itemId: '',
  itemName: '',
  unit: '',
  batchNo: '',
  availableQty: 0,
  mfgDate: '',
  expiryDate: '',
  qty: 0,
  requestedQty: undefined,
  issuedQty: undefined,
  remainingQty: undefined,
};

export default function StockMovementCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedMrsId = searchParams.get('mrsId') || '';
  const { items, batchesByItemName } = useIssueStock();
  const { allRecords: mrsRecords } = useMRSList();

  const [movementNo] = useState(createMovementNo);
  const [date, setDate] = useState(today);
  const [type, setType] = useState<StockMovementType>('issue');
  const [selectedMrsId, setSelectedMrsId] = useState(preselectedMrsId);
  const [rows, setRows] = useState<MovementRow[]>([{ ...emptyRow }]);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [sampleDrawnBy, setSampleDrawnBy] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingIssues, setExistingIssues] = useState<StockMovementRecord[]>([]);

  useEffect(() => {
    setSelectedMrsId(preselectedMrsId);
  }, [preselectedMrsId]);

  useEffect(() => {
    let active = true;
    const loadIssues = async () => {
      try {
        const data = await stockMovementApi.getAll();
        if (!active) return;
        setExistingIssues(data.filter((m) => m.type === 'issue'));
      } catch {
        if (active) setExistingIssues([]);
      }
    };
    loadIssues();
    return () => {
      active = false;
    };
  }, []);

  const selectedMrs = useMemo(() => {
    if (!selectedMrsId) return null;
    return mrsRecords.find((mrs) => mrs.id === selectedMrsId) ?? null;
  }, [mrsRecords, selectedMrsId]);

  const issuedMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!selectedMrsId) return map;
    existingIssues
      .filter((m) => m.mrsId === selectedMrsId)
      .forEach((movement) => {
        (movement.items || []).forEach((item) => {
          const key = item.itemId ? `id:${item.itemId}` : `name:${item.itemName}`;
          map.set(key, (map.get(key) || 0) + (item.quantity || 0));
        });
      });
    return map;
  }, [existingIssues, selectedMrsId]);

  useEffect(() => {
    if (type !== 'issue') return;
    if (!selectedMrs) {
      setRows([{ ...emptyRow }]);
      return;
    }
    const mapped = selectedMrs.items.map((item) => {
      const key = item.itemId ? `id:${item.itemId}` : `name:${item.itemName}`;
      const issuedFromIssues = issuedMap.get(key) || 0;
      const issuedBase = item.qtyIssued || 0;
      const issuedQty = Math.max(issuedBase, issuedFromIssues);
      const remainingQty = Math.max(0, item.qtyRequested - issuedQty);
      return {
        ...emptyRow,
        itemId: item.itemId,
        itemName: item.itemName,
        unit: item.unit,
        requestedQty: item.qtyRequested,
        issuedQty,
        remainingQty,
      };
    });
    setRows(mapped.length ? mapped : [{ ...emptyRow }]);
  }, [selectedMrs, issuedMap, type]);

  const addRow = () => {
    setRows((prev) => [...prev, { ...emptyRow }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItem = (index: number, value: string) => {
    const selected = items.find((i) => i.id === value);
    const name = selected?.storeName || selected?.tallyName || selected?.sku || '';
    const unit = selected?.baseUnit || '';
    setRows((prev) => prev.map((r, i) =>
      i === index
        ? { ...r, itemId: value, itemName: name, unit, batchNo: '', availableQty: 0, mfgDate: '', expiryDate: '' }
        : r
    ));
  };

  const handleBatch = (index: number, value: string) => {
    const itemName = rows[index]?.itemName;
    const list = itemName ? (batchesByItemName.get(itemName) ?? []) : [];
    const batch = list.find((b) => b.batchNo === value);
    setRows((prev) => prev.map((r, i) =>
      i === index
        ? { ...r, batchNo: value, availableQty: batch?.availableQty ?? 0, mfgDate: batch?.mfgDate ?? '', expiryDate: batch?.expiryDate ?? '' }
        : r
    ));
  };

  const qtyError = (row: MovementRow) => {
    if (row.qty <= 0) return false;
    const exceedsAvailable = row.qty > row.availableQty && (type === 'issue' || type === 'sampling' || type === 'transfer');
    const exceedsRemaining = type === 'issue' && typeof row.remainingQty === 'number' && row.qty > row.remainingQty;
    return exceedsAvailable || exceedsRemaining;
  };

  const hasRowErrors = () => rows.some((row) => qtyError(row));

  const validRows = rows.filter((r) => r.qty > 0 && r.itemId && r.batchNo);

  const onSubmit = async () => {
    if (validRows.length === 0) {
      toast.error('Please enter at least one valid row with quantity');
      return;
    }
    if (rows.some((r) => r.qty > 0 && (!r.itemId || !r.batchNo))) {
      toast.error('Please fill required fields in all rows');
      return;
    }
    if (hasRowErrors()) {
      toast.error('Please fix quantity errors');
      return;
    }
    setSaving(true);
    try {
      for (const row of validRows) {
        if (type === 'issue') {
          await stockMovementApi.createIssue({
            movementNo,
            date,
            itemId: row.itemId,
            itemName: row.itemName,
            batchNo: row.batchNo,
            availableQty: row.availableQty,
            qty: row.qty,
            mfgDate: row.mfgDate,
            expiryDate: row.expiryDate,
            issuedBy: issuedBy || 'Store Admin',
            mrsId: selectedMrs?.id,
            requestedQty: row.requestedQty,
          });
        }
        if (type === 'sampling') {
          await stockMovementApi.createSampling({
            movementNo,
            date,
            fromLocation: fromLocation || 'Main Store',
            toLocation: toLocation || 'QC',
            itemId: row.itemId,
            itemName: row.itemName,
            batchNo: row.batchNo,
            availableQty: row.availableQty,
            qty: row.qty,
            mfgDate: row.mfgDate,
            expiryDate: row.expiryDate,
            issuedBy: issuedBy || 'QC Lead',
            sampleDrawnBy: sampleDrawnBy || 'QC Analyst',
          });
        }
        if (type === 'transfer') {
          await stockMovementApi.createTransfer({
            movementNo,
            date,
            fromLocation: fromLocation || 'Main Store',
            toLocation: toLocation || 'Warehouse B',
            itemName: row.itemName,
            batchNo: row.batchNo,
            qty: row.qty,
          });
        }
      }

      const mrsMeta = type === 'issue' ? selectedMrs : null;
      await stockMovementApi.create({
        id: '',
        movementNo,
        date,
        type,
        mrsId: mrsMeta?.id,
        mrsNo: mrsMeta?.mrsNo,
        productionBatchId: mrsMeta?.productionBatchId,
        productionBatchNo: mrsMeta?.productionBatchNo,
        productionNo: mrsMeta?.productionNo,
        itemName: validRows[0]?.itemName || '',
        batchNo: validRows[0]?.batchNo || '',
        quantity: validRows.reduce((s, r) => s + (r.qty || 0), 0),
        availableQty: validRows[0]?.availableQty || 0,
        items: validRows.map((r) => {
          const issuedAfter = (r.issuedQty || 0) + r.qty;
          const remainingAfter = typeof r.remainingQty === 'number' ? Math.max(0, r.remainingQty - r.qty) : undefined;
          return {
            itemId: r.itemId,
            itemName: r.itemName,
            batchNo: r.batchNo,
            quantity: r.qty,
            availableQty: r.availableQty,
            mfgDate: r.mfgDate,
            expiryDate: r.expiryDate,
            unit: r.unit,
            requestedQty: r.requestedQty,
            issuedQty: issuedAfter,
            remainingQty: remainingAfter,
          };
        }),
        fromLocation: fromLocation || undefined,
        toLocation: toLocation || undefined,
        currentLocation: type === 'transfer' ? (toLocation || 'Warehouse B') : undefined,
        locationHistory: type === 'transfer' ? [{ date, from: fromLocation || 'Main Store', to: toLocation || 'Warehouse B' }] : undefined,
        mfgDate: validRows[0]?.mfgDate || '',
        expiryDate: validRows[0]?.expiryDate || '',
        issuedBy: issuedBy || undefined,
        sampleDrawnBy: sampleDrawnBy || undefined,
      });

      toast.success('Stock movement saved');
      navigate('/stock-movement');
    } catch {
      toast.error('Failed to save movement');
    } finally {
      setSaving(false);
    }
  };

  const issueWithMrs = type === 'issue' && selectedMrs;

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Create Stock Movement"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/stock-movement' },
          { label: 'Create Movement' },
        ]}
        action={(
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/stock-movement')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}
      />

      <FormSection title="Header" description="Define movement meta, type, and optional MRS reference.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Movement No</Label>
            <Input readOnly value={movementNo} />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Movement Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as StockMovementType)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="sampling">Sampling</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === 'issue' && (
            <div className="space-y-1.5">
              <Label>Reference MRS</Label>
              <Select value={selectedMrsId || 'none'} onValueChange={(v) => setSelectedMrsId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select MRS" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Reference</SelectItem>
                  {mrsRecords.map((mrs) => (
                    <SelectItem key={mrs.id} value={mrs.id}>{mrs.mrsNo} ({mrs.productionBatchNo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMrs && (
                <p className="text-xs text-muted-foreground">
                  Batch: {selectedMrs.productionBatchNo} | Dept: {selectedMrs.department}
                </p>
              )}
            </div>
          )}
        </div>
      </FormSection>

      {(type === 'transfer' || type === 'sampling') && (
        <FormSection title="Locations" description="Source and destination mapping for transfer or sampling.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>From Location</Label>
              <Input value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} placeholder={type === 'sampling' ? 'Store' : 'From location'} />
            </div>
            <div className="space-y-1.5">
              <Label>To Location</Label>
              <Input value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder={type === 'sampling' ? 'QC' : 'To location'} />
            </div>
          </div>
        </FormSection>
      )}

      <FormSection
        title={type === 'issue' ? 'Issue Details' : type === 'sampling' ? 'Sampling Details' : 'Transfer Details'}
        description="Capture item, batch, and quantity lines for this movement."
        actions={(!issueWithMrs || type !== 'issue') ? (
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            Add Row
          </Button>
        ) : undefined}
      >
        <div className="space-y-4">
          {rows.map((row, index) => {
            const rowBatches = row.itemName ? (batchesByItemName.get(row.itemName) ?? []) : [];
            const availableBatches = rowBatches.filter((b) => b.availableQty > 0);
            const remaining = typeof row.remainingQty === 'number' ? row.remainingQty : undefined;
            return (
              <div key={`${row.itemId}-${index}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border rounded-xl p-4">
                <div className="space-y-1.5">
                  <Label>Item</Label>
                  <Select value={row.itemId} onValueChange={(v) => handleItem(index, v)} disabled={issueWithMrs}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {items.map((it) => (
                        <SelectItem key={it.id} value={it.id}>
                          {it.storeName || it.tallyName || it.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {issueWithMrs && (
                    <p className="text-xs text-muted-foreground">Requested: {row.requestedQty || 0}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Batch No</Label>
                  <Select value={row.batchNo} onValueChange={(v) => handleBatch(index, v)} disabled={!row.itemName}>
                    <SelectTrigger><SelectValue placeholder={row.itemName ? 'Select batch' : 'Select item first'} /></SelectTrigger>
                    <SelectContent>
                      {availableBatches.map((b) => (
                        <SelectItem key={b.batchNo} value={b.batchNo}>
                          {b.batchNo} (Avail: {b.availableQty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Available Qty</Label>
                  <Input readOnly value={row.availableQty} className="bg-muted/50" />
                </div>
                <div className="space-y-1.5">
                  <Label>{type === 'issue' ? 'Issue Qty' : type === 'sampling' ? 'Sample Qty' : 'Transfer Qty'}</Label>
                  <Input
                    type="number"
                    value={row.qty || ''}
                    onChange={(e) => setRows((prev) => prev.map((r, i) => i === index ? { ...r, qty: Number(e.target.value) } : r))}
                    disabled={remaining === 0}
                  />
                  {remaining !== undefined && (
                    <p className="text-xs text-muted-foreground">Remaining: {remaining}</p>
                  )}
                  {qtyError(row) && (
                    <p className="text-xs text-destructive">
                      {type === 'issue' && remaining !== undefined && row.qty > remaining
                        ? 'Qty cannot exceed remaining request.'
                        : 'Qty cannot exceed available stock.'}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>MFG Date</Label>
                  <Input readOnly value={row.mfgDate} className="bg-muted/50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <Input readOnly value={row.expiryDate} className="bg-muted/50" />
                </div>
                {rows.length > 1 && !issueWithMrs && (
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" onClick={() => removeRow(index)}>Remove</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FormSection>

      {(type === 'issue' || type === 'sampling') && (
        <FormSection title="Signatories" description="Record responsible personnel for audit traceability.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Issued By</Label>
              <Input value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} placeholder="Name" />
            </div>
            {type === 'sampling' && (
              <div className="space-y-1.5">
                <Label>Sample Drawn By</Label>
                <Input value={sampleDrawnBy} onChange={(e) => setSampleDrawnBy(e.target.value)} placeholder="Name" />
              </div>
            )}
          </div>
        </FormSection>
      )}

      <FormSection title="Review & Submit">
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/stock-movement')}>Cancel</Button>
          <Button className="rounded-xl" onClick={onSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Movement'}
          </Button>
        </div>
      </FormSection>
    </div>
  );
}
