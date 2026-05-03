import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIssueStock } from '@/modules/issues/hooks/useIssueStock';
import { useMRSList } from '@/modules/mrs/hooks/useMRS';
import { stockMovementApi } from '../services/stockMovementApi';
import type { StockMovementType } from '../types';

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

const getRemainingQty = (row: { remainingQty?: number; qtyRequested?: number; qtyIssued?: number }) =>
  typeof row.remainingQty === 'number'
    ? row.remainingQty
    : Math.max(0, Number(row.qtyRequested || 0) - Number(row.qtyIssued || 0));

export default function StockMovementCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedMrsId = searchParams.get('mrsId') || '';
  const { items, batchesByItemName } = useIssueStock();
  const { allRecords: mrsRecords } = useMRSList();

  const [date, setDate] = useState(today);
  const [type, setType] = useState<StockMovementType>('issue');
  const [selectedMrsId, setSelectedMrsId] = useState(preselectedMrsId);
  const [rows, setRows] = useState<MovementRow[]>([{ ...emptyRow }]);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [sampleDrawnBy, setSampleDrawnBy] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedMrsId(preselectedMrsId);
  }, [preselectedMrsId]);

  const selectableMrsRecords = useMemo(
    () =>
      mrsRecords.filter(
        (mrs) =>
          (mrs.status === 'approved' || mrs.status === 'issued') &&
          mrs.items.some((item) => getRemainingQty(item) > 0),
      ),
    [mrsRecords],
  );

  useEffect(() => {
    if (!selectedMrsId) return;
    if (selectableMrsRecords.some((mrs) => mrs.id === selectedMrsId)) return;
    setSelectedMrsId('');
  }, [selectableMrsRecords, selectedMrsId]);

  const selectedMrs = useMemo(() => {
    if (!selectedMrsId) return null;
    return selectableMrsRecords.find((mrs) => mrs.id === selectedMrsId) ?? null;
  }, [selectableMrsRecords, selectedMrsId]);

  useEffect(() => {
    if (type !== 'issue') return;
    if (!selectedMrs) {
      setRows([{ ...emptyRow }]);
      return;
    }

    const mapped = selectedMrs.items
      .filter((item) => getRemainingQty(item) > 0)
      .map((item) => ({
        ...emptyRow,
        itemId: item.itemId,
        itemName: item.itemName,
        unit: item.unit,
        requestedQty: item.qtyRequested,
        issuedQty: item.qtyIssued,
        remainingQty: getRemainingQty(item),
      }));

    setRows(mapped.length ? mapped : [{ ...emptyRow }]);
  }, [selectedMrs, type]);

  const addRow = () => {
    setRows((prev) => [...prev, { ...emptyRow }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItem = (index: number, value: string) => {
    const selected = items.find((item) => item.id === value);
    const itemName = selected?.storeName || selected?.tallyName || selected?.sku || '';
    const unit = selected?.baseUnit || '';

    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              itemId: value,
              itemName,
              unit,
              batchNo: '',
              availableQty: 0,
              mfgDate: '',
              expiryDate: '',
            }
          : row,
      ),
    );
  };

  const handleBatch = (index: number, value: string) => {
    const itemName = rows[index]?.itemName;
    const list = itemName ? (batchesByItemName.get(itemName) ?? []) : [];
    const batch = list.find((entry) => entry.batchNo === value);

    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              batchNo: value,
              availableQty: batch?.availableQty ?? 0,
              mfgDate: batch?.mfgDate ?? '',
              expiryDate: batch?.expiryDate ?? '',
            }
          : row,
      ),
    );
  };

  const qtyError = (row: MovementRow) => {
    if (row.qty <= 0) return false;
    const exceedsAvailable = row.qty > row.availableQty;
    const exceedsRemaining = type === 'issue' && typeof row.remainingQty === 'number' && row.qty > row.remainingQty;
    return exceedsAvailable || exceedsRemaining;
  };

  const hasRowErrors = () => rows.some((row) => qtyError(row));
  const validRows = rows.filter((row) => row.qty > 0 && row.itemId && row.batchNo);

  const onSubmit = async () => {
    if (validRows.length === 0) {
      toast.error('Please enter at least one valid row with quantity');
      return;
    }
    if (rows.some((row) => row.qty > 0 && (!row.itemId || !row.batchNo))) {
      toast.error('Please fill required fields in all rows');
      return;
    }
    if (hasRowErrors()) {
      toast.error('Please fix quantity errors');
      return;
    }
    if (type === 'issue' && !selectedMrs) {
      toast.error('Select an approved MRS before issuing materials');
      return;
    }
    if ((type === 'sampling' || type === 'transfer') && (!fromLocation || !toLocation)) {
      toast.error('From and To locations are required');
      return;
    }

    setSaving(true);
    try {
      const created = await stockMovementApi.create({
        type,
        date,
        productionBatchId: type === 'issue' ? selectedMrs?.productionBatchId : undefined,
        materialRequisitionId: type === 'issue' ? selectedMrs?.id : undefined,
        fromLocation: type === 'issue' ? undefined : fromLocation,
        toLocation: type === 'issue' ? undefined : toLocation,
        issuedBy: issuedBy || undefined,
        sampleDrawnBy: type === 'sampling' ? (sampleDrawnBy || undefined) : undefined,
        items: validRows.map((row) => ({
          itemId: row.itemId,
          batchNo: row.batchNo,
          quantity: row.qty,
        })),
      });

      toast.success('Stock movement saved');
      navigate(`/stock-movement/${created.id}`);
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
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
      />

      <FormSection title="Header" description="Define movement meta, type, and optional MRS reference.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Movement No</Label>
            <Input readOnly value="Auto-generated on save" />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Movement Type</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as StockMovementType);
                setSelectedMrsId('');
                setRows([{ ...emptyRow }]);
              }}
            >
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
              <Select value={selectedMrsId} onValueChange={setSelectedMrsId}>
                <SelectTrigger><SelectValue placeholder="Select open MRS" /></SelectTrigger>
                <SelectContent>
                  {selectableMrsRecords.map((mrs) => (
                    <SelectItem key={mrs.id} value={mrs.id}>
                      {mrs.mrsNo} ({mrs.productionBatchNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMrs && (
                <p className="text-xs text-muted-foreground">
                  Batch: {selectedMrs.productionBatchNo} | Dept: {selectedMrs.department}
                </p>
              )}
              {!selectedMrs && selectableMrsRecords.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No approved MRS with pending issue quantity are available.
                </p>
              )}
            </div>
          )}
        </div>
      </FormSection>

      {(type === 'transfer' || type === 'sampling') && (
        <FormSection title="Locations" description="Source and destination mapping for transfer or sampling.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>From Location</Label>
              <Input value={fromLocation} onChange={(event) => setFromLocation(event.target.value)} placeholder={type === 'sampling' ? 'Store' : 'From location'} />
            </div>
            <div className="space-y-1.5">
              <Label>To Location</Label>
              <Input value={toLocation} onChange={(event) => setToLocation(event.target.value)} placeholder={type === 'sampling' ? 'QC' : 'To location'} />
            </div>
          </div>
        </FormSection>
      )}

      <FormSection
        title={type === 'issue' ? 'Issue Details' : type === 'sampling' ? 'Sampling Details' : 'Transfer Details'}
        description="Capture item, batch, and quantity lines for this movement."
        actions={!issueWithMrs ? (
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            Add Row
          </Button>
        ) : undefined}
      >
        <div className="space-y-4">
          {rows.map((row, index) => {
            const rowBatches = row.itemName ? (batchesByItemName.get(row.itemName) ?? []) : [];
            const availableBatches = rowBatches.filter((batch) => batch.availableQty > 0);
            const remaining = typeof row.remainingQty === 'number' ? row.remainingQty : undefined;

            return (
              <div
                key={`${row.itemId || 'row'}-${index}`}
                className={`grid grid-cols-1 gap-4 rounded-xl border p-4 sm:grid-cols-2 ${
                  issueWithMrs ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
                }`}
              >
                <div className="space-y-1.5">
                  <Label>Item</Label>
                  <Select value={row.itemId} onValueChange={(value) => handleItem(index, value)} disabled={issueWithMrs}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.storeName || item.tallyName || item.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Batch No</Label>
                  <Select value={row.batchNo} onValueChange={(value) => handleBatch(index, value)} disabled={!row.itemName}>
                    <SelectTrigger><SelectValue placeholder={row.itemName ? 'Select batch' : 'Select item first'} /></SelectTrigger>
                    <SelectContent>
                      {availableBatches.map((batch) => (
                        <SelectItem key={batch.batchNo} value={batch.batchNo}>
                          {batch.batchNo} (Avail: {batch.availableQty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {issueWithMrs && (
                  <div className="space-y-1.5">
                    <Label>Requested Qty</Label>
                    <Input readOnly value={row.requestedQty ?? 0} className="bg-muted/50" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Available Qty</Label>
                  <Input readOnly value={row.availableQty} className="bg-muted/50" />
                </div>

                <div className="space-y-1.5">
                  <Label>{type === 'issue' ? 'Issue Qty' : type === 'sampling' ? 'Sample Qty' : 'Transfer Qty'}</Label>
                  <Input
                    type="number"
                    value={row.qty || ''}
                    onChange={(event) =>
                      setRows((prev) => prev.map((entry, rowIndex) => (rowIndex === index ? { ...entry, qty: Number(event.target.value) } : entry)))
                    }
                    disabled={remaining === 0}
                  />
                  {remaining !== undefined && <p className="text-xs text-muted-foreground">Remaining: {remaining}</p>}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Issued By</Label>
              <Input value={issuedBy} onChange={(event) => setIssuedBy(event.target.value)} placeholder="Name" />
            </div>
            {type === 'sampling' && (
              <div className="space-y-1.5">
                <Label>Sample Drawn By</Label>
                <Input value={sampleDrawnBy} onChange={(event) => setSampleDrawnBy(event.target.value)} placeholder="Name" />
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
