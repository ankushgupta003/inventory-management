import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { issueSchema, type IssueFormValues } from '../schemas/issueSchema';
import { issuesApi } from '../services/issuesApi';
import { useIssueStock } from '../hooks/useIssueStock';
import mrsApi from '@/modules/mrs/services/mrsApi';
import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import type { MRSRecord } from '@/modules/mrs/types';

const issueTypeOptions = [
  { value: 'production', label: 'Production' },
  { value: 'sample', label: 'Sample / QC' },
  { value: 'damage', label: 'Damage' },
  { value: 'other', label: 'Other' },
] as const;

const normalize = (val: string) => val.trim().toLowerCase();

const createIssueNo = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `ISS-${datePart}-${rand}`;
};

const emptyRow = {
  itemId: '',
  itemName: '',
  batchNo: '',
  availableQty: 0,
  issueQty: 0,
  mfgDate: '',
  expiryDate: '',
  remarks: '',
};

export default function IssueCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [mrsOptions, setMrsOptions] = useState<MRSRecord[]>([]);
  const [mrsLoading, setMrsLoading] = useState(true);
  const { items, itemNameById, batchesByItemName } = useIssueStock();

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issueNo: createIssueNo(),
      date: today,
      issueType: 'production',
      mrsId: '',
      items: [{ ...emptyRow }],
      issuedBy: '',
      approvedBy: '',
      receivedBy: '',
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const selectedMrsId = watch('mrsId');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await mrsApi.getAll();
        if (active) setMrsOptions(data);
      } catch {
        if (active) setMrsOptions([]);
      } finally {
        if (active) setMrsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMrsId) return;
    let active = true;
    const loadMrs = async () => {
      try {
        const mrs = await mrsApi.getById(selectedMrsId);
        if (!active) return;
        const mapped = mrs.items.map((item) => {
          const match = items.find((it) =>
            normalize(it.storeName) === normalize(item.itemName)
            || normalize(it.tallyName) === normalize(item.itemName)
          );
          return {
            ...emptyRow,
            itemId: match?.id ?? '',
            itemName: item.itemName,
            requestedQty: item.qtyRequested,
          };
        });
        replace(mapped.length ? mapped : [{ ...emptyRow }]);
      } catch {
        toast.error('Failed to load MRS details');
      }
    };
    loadMrs();
    return () => {
      active = false;
    };
  }, [selectedMrsId, items, replace]);

  useEffect(() => {
    if (!selectedMrsId) {
      replace([{ ...emptyRow }]);
    }
  }, [selectedMrsId, replace]);

  const handleItemChange = (index: number, itemId: string) => {
    const itemName = itemNameById.get(itemId) ?? '';
    setValue(`items.${index}.itemId`, itemId, { shouldValidate: true });
    setValue(`items.${index}.itemName`, itemName, { shouldValidate: true });
    setValue(`items.${index}.batchNo`, '');
    setValue(`items.${index}.availableQty`, 0);
    setValue(`items.${index}.issueQty`, 0);
    setValue(`items.${index}.mfgDate`, '');
    setValue(`items.${index}.expiryDate`, '');
  };

  const handleBatchChange = (index: number, batchNo: string) => {
    const itemName = watchedItems?.[index]?.itemName ?? '';
    const batches = batchesByItemName.get(itemName) ?? [];
    const batch = batches.find((b) => b.batchNo === batchNo);
    setValue(`items.${index}.batchNo`, batchNo, { shouldValidate: true });
    setValue(`items.${index}.availableQty`, batch?.availableQty ?? 0, { shouldValidate: true });
    setValue(`items.${index}.mfgDate`, batch?.mfgDate ?? '', { shouldValidate: true });
    setValue(`items.${index}.expiryDate`, batch?.expiryDate ?? '', { shouldValidate: true });
  };

  const onSubmit = async (data: IssueFormValues) => {
    setSubmitting(true);
    try {
      const created = await issuesApi.create(data);
      const entries = data.items.map((row) => {
        const item = items.find((it) => it.id === row.itemId);
        const itemCategory = item?.itemType === 'finished' ? 'FINISHED' : 'RAW';
        return {
          date: data.date,
          referenceNo: data.issueNo,
          type: 'issue',
          particulars: data.issueType,
          itemName: row.itemName,
          itemCategory,
          batchNo: row.batchNo,
          mfgDate: row.mfgDate,
          expiryDate: row.expiryDate,
          receiptQty: 0,
          issueQty: row.issueQty,
          rate: 0,
          remarks: row.remarks || '',
        };
      });
      try {
        await ledgerApi.create({ entries });
        toast.success('Stock issue saved successfully');
      } catch {
        toast.error('Issue saved, but ledger update failed. Please retry ledger sync.');
      }
      navigate(`/issues/${created.id}`);
    } catch {
      toast.error('Failed to save issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (err: unknown) => err ? 'border-destructive' : '';

  const issueTypeValue = watch('issueType');
  const issueTypeLabel = issueTypeOptions.find((o) => o.value === issueTypeValue)?.label ?? 'Production';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Create Stock Issue"
        description={`Issue Type: ${issueTypeLabel}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/issues' },
          { label: 'Create Issue' },
        ]}
        action={(
          <Button variant="outline" onClick={() => navigate('/issues')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Header">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Issue No</Label>
              <Input readOnly {...register('issueNo')} />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} className={fieldClass(errors.date)} />
            </div>
            <div className="space-y-1.5">
              <Label>Issue Type *</Label>
              <Select value={watch('issueType')} onValueChange={(v) => setValue('issueType', v as IssueFormValues['issueType'], { shouldValidate: true })}>
                <SelectTrigger className={fieldClass(errors.issueType)}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference MRS (optional)</Label>
              <Select
                value={watch('mrsId') || ''}
                onValueChange={(v) => setValue('mrsId', v === 'none' ? '' : v)}
                disabled={mrsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={mrsLoading ? 'Loading...' : 'Select MRS'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Reference</SelectItem>
                  {mrsOptions.map((mrs) => (
                    <SelectItem key={mrs.id} value={mrs.id}>{mrs.mrsNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Items"
          actions={(
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyRow })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </Button>
          )}
        >
          <div className="border rounded-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Item *','Batch No *','Available Qty','Issue Qty *','MFG Date','Expiry Date','Remarks',''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap text-xs">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, idx) => {
                  const re = errors.items?.[idx];
                  const row = watchedItems?.[idx];
                  const itemName = row?.itemName ?? '';
                  const batches = itemName ? (batchesByItemName.get(itemName) ?? []) : [];
                  return (
                    <TableRow key={field.id} className="align-top">
                      <TableCell className="min-w-[220px]">
                        <Select value={row?.itemId ?? ''} onValueChange={(v) => handleItemChange(idx, v)}>
                          <SelectTrigger className={`w-52 ${fieldClass(re?.itemId)}`}>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((it) => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.storeName || it.tallyName || it.sku}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {re?.itemId && <p className="text-[10px] text-destructive mt-1">{re.itemId.message}</p>}
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <Select value={row?.batchNo ?? ''} onValueChange={(v) => handleBatchChange(idx, v)} disabled={!row?.itemName}>
                          <SelectTrigger className={`w-40 ${fieldClass(re?.batchNo)}`}>
                            <SelectValue placeholder={row?.itemName ? 'Select batch' : 'Select item first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((b) => (
                              <SelectItem key={b.batchNo} value={b.batchNo}>
                                {b.batchNo} (Avail: {b.availableQty})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {re?.batchNo && <p className="text-[10px] text-destructive mt-1">{re.batchNo.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input readOnly value={row?.availableQty ?? 0} className="w-24 bg-muted/50" />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className={`w-24 ${fieldClass(re?.issueQty)}`}
                          {...register(`items.${idx}.issueQty`, { valueAsNumber: true })}
                        />
                        {row?.requestedQty !== undefined && (
                          <p className="text-[10px] text-muted-foreground mt-1">Requested: {row.requestedQty}</p>
                        )}
                        {re?.issueQty && <p className="text-[10px] text-destructive mt-1">{re.issueQty.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input readOnly value={row?.mfgDate ?? ''} className={`w-[130px] bg-muted/50 ${fieldClass(re?.mfgDate)}`} />
                      </TableCell>
                      <TableCell>
                        <Input readOnly value={row?.expiryDate ?? ''} className={`w-[130px] bg-muted/50 ${fieldClass(re?.expiryDate)}`} />
                      </TableCell>
                      <TableCell>
                        <Textarea rows={1} className="w-40" {...register(`items.${idx}.remarks`)} />
                      </TableCell>
                      <TableCell className="text-right">
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {errors.items?.root?.message && (
            <p className="text-xs text-destructive">{errors.items.root.message}</p>
          )}
        </FormSection>

        <FormSection title="Signatories">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Issued By *</Label>
              <Input placeholder="Name" {...register('issuedBy')} className={fieldClass(errors.issuedBy)} />
              {errors.issuedBy && <p className="text-xs text-destructive">{errors.issuedBy.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Approved By</Label>
              <Input placeholder="Name" {...register('approvedBy')} />
            </div>
            <div className="space-y-1.5">
              <Label>Received By</Label>
              <Input placeholder="Name" {...register('receivedBy')} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Review" description="Stock will be reduced per batch and a ledger entry will be created for each line.">
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/issues')}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Issue'}
            </Button>
          </div>
        </FormSection>
      </form>
    </div>
  );
}
