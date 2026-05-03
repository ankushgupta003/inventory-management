import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import TableActionButton from '@/components/TableActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/apiError';
import { productionApi } from '@/modules/production/services/productionApi';
import { stockMovementApi } from '@/modules/stock-movement/services/stockMovementApi';
import FormSection from '../components/FormSection';
import DataTable from '../components/DataTable';
import { mockBmrData } from '../mockData';
import { bmrSchema, type BmrSchemaValues } from '../schemas/bmrSchema';
import { buildDefaultBmrValues, createEmptyProcessRow, createEmptyRawMaterialRow, hasIssuedMaterials } from '../utils/bmrData';

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

type BmrFormProps = {
  embedded?: boolean;
  batchId?: string;
  onStatusChange?: () => void;
};

const noticeClassName = 'rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground';

function isHttpStatus(error: unknown, status: number) {
  return axios.isAxiosError(error) && error.response?.status === status;
}

export default function BMRFormPage({ embedded = false, batchId, onStatusChange }: BmrFormProps) {
  const navigate = useNavigate();
  const params = useParams();
  const resolvedBatchId = batchId ?? params.batchId;
  const { hasPermission } = useAuth();
  const [localInitialValues] = useState<BmrSchemaValues>(() => {
    const draft = loadDraft();
    const batchInfoOverride = loadBatchOverride();
    return buildDefaultBmrValues({
      existingData: draft
        ? {
            ...draft,
            batchInfo: batchInfoOverride ?? draft.batchInfo,
          }
        : {
            ...mockBmrData,
            batchInfo: batchInfoOverride ?? mockBmrData.batchInfo,
          },
    });
  });

  const form = useForm<BmrSchemaValues>({
    resolver: zodResolver(bmrSchema),
    defaultValues: resolvedBatchId ? buildDefaultBmrValues({ existingData: null }) : localInitialValues,
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { errors, isValid },
    getValues,
  } = form;

  const rawMaterialsArray = useFieldArray({ control, name: 'rawMaterials' });
  const processArray = useFieldArray({ control, name: 'processSteps' });

  const rawMaterials = watch('rawMaterials');
  const processSteps = watch('processSteps');
  const finalOutput = watch('finalOutput');

  const [loading, setLoading] = useState(Boolean(resolvedBatchId));
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasIssue, setHasIssue] = useState(!resolvedBatchId);
  const [batchLocked, setBatchLocked] = useState(Boolean(resolvedBatchId));
  const [loadNotice, setLoadNotice] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const canViewMovements = hasPermission('stock_movement.view');
  const canEditBmr = !resolvedBatchId || hasPermission('production.edit');
  const isReadOnly = Boolean(resolvedBatchId) && !canEditBmr;

  useEffect(() => {
    if (!resolvedBatchId) {
      reset(localInitialValues);
      setBatchLocked(false);
      setHasIssue(true);
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
        const batch = await productionApi.getById(resolvedBatchId);

        if (!active) return;

        const [bmrResult, mrsResult, movementResult] = await Promise.all([
          productionApi.getBmr(resolvedBatchId)
            .then((data) => ({ ok: true as const, data }))
            .catch((error: unknown) => ({ ok: false as const, error })),
          productionApi.getMrs(resolvedBatchId)
            .then((data) => ({ ok: true as const, data }))
            .catch((error: unknown) => ({ ok: false as const, error })),
          canViewMovements
            ? stockMovementApi.getAll({ productionBatchId: resolvedBatchId })
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

        reset(
          buildDefaultBmrValues({
            batch,
            existingData,
            mrsRecords,
            movements,
          }),
        );
        setBatchLocked(Boolean(batch));
        setHasIssue(hasIssuedMaterials({ mrsRecords, movements }));
        setLoadNotice(notices.length ? notices.join(' ') : null);
      } catch (error) {
        if (!active) return;
        if (isHttpStatus(error, 404)) {
          setNotFound(true);
        } else {
          setLoadNotice(getErrorMessage(error, 'Failed to load BMR data'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [canViewMovements, localInitialValues, reset, resolvedBatchId]);

  const yieldPercent = useMemo(() => {
    const expected = finalOutput?.expectedQty ?? 0;
    const actual = finalOutput?.actualQty ?? 0;
    if (!expected) return 0;
    return Number(((actual / expected) * 100).toFixed(2));
  }, [finalOutput]);

  const saveDraft = async () => {
    if (isReadOnly) {
      toast.error('You do not have permission to edit this BMR');
      return;
    }

    const values = getValues();
    setSavingDraft(true);
    try {
      if (resolvedBatchId) {
        await productionApi.saveBmr(resolvedBatchId, values);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      }
      toast.success('BMR draft saved');
      onStatusChange?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save BMR draft'));
    } finally {
      setSavingDraft(false);
    }
  };

  const onSubmit = async (values: BmrSchemaValues) => {
    if (isReadOnly) {
      toast.error('You do not have permission to edit this BMR');
      return;
    }

    setSubmitting(true);
    try {
      if (resolvedBatchId) {
        if (!hasIssue) {
          toast.error('Record stock issue before submitting BMR');
          return;
        }
        await productionApi.submitBmr(resolvedBatchId, values);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      }
      toast.success('BMR submitted');
      onStatusChange?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to submit BMR'));
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = (section: 'page1' | 'page2' | 'page3' | 'page4') => {
    if (section === 'page1') return !!errors.batchInfo || !!errors.rawMaterials;
    if (section === 'page2') return !!errors.processSteps;
    if (section === 'page3') return !!errors.sterilization || !!errors.packing || !!errors.labelling;
    return !!errors.finalOutput || !!errors.qa;
  };

  const sectionIncomplete = (section: 'page1' | 'page2' | 'page3' | 'page4') => {
    if (section === 'page1') {
      const info = watch('batchInfo');
      const infoComplete = !!info?.productName && !!info?.batchNo && !!info?.batchSize && !!info?.mfgDate && !!info?.expDate;
      const materialsComplete = (rawMaterials ?? []).every((row) => row.usedQty >= 0 && row.returnedQty >= 0);
      return !(infoComplete && materialsComplete);
    }
    if (section === 'page2') {
      return (processSteps ?? []).some((row) => !row.stepName || !row.startTime || !row.endTime || !row.operatorName || !row.checkedBy || !row.remarks);
    }
    if (section === 'page3') {
      const ster = watch('sterilization');
      const pack = watch('packing');
      const lab = watch('labelling');
      return !ster?.date || !ster?.reference || !pack?.packingType || !pack?.doneBy || !lab?.labelDetails || !lab?.checkedBy;
    }
    const out = watch('finalOutput');
    const qa = watch('qa');
    return !out?.expectedQty || !qa?.status || !qa?.remarks || !qa?.approvedBy;
  };

  const tabLabel = (label: string, section: 'page1' | 'page2' | 'page3' | 'page4') => (
    <span className="flex items-center gap-2">
      <span>{label}</span>
      {(hasErrors(section) || sectionIncomplete(section)) && <span className="h-2 w-2 rounded-full bg-destructive" />}
    </span>
  );

  const fieldClass = (err?: unknown) => (err ? 'border-destructive' : '');

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading BMR...</div>;
  }

  if (notFound) {
    return <div className="text-sm text-muted-foreground">Batch not found.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {!embedded && (
        <PageHeader
          title="Batch Manufacturing Record"
          description="Complete the 4-page BMR exactly as per the physical document."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'BMR' },
          ]}
          action={(
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/production/create')}>Create Batch</Button>
              <Button variant="outline" onClick={() => navigate(resolvedBatchId ? `/bmr/print/${resolvedBatchId}` : '/bmr/print')}>
                <Printer className="mr-2 h-4 w-4" /> Print View
              </Button>
            </div>
          )}
        />
      )}

      {!embedded && (
        <div className="sticky top-0 z-10 rounded-md border border-border bg-background/95 p-3 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-5">
            <div>
              <div className="text-muted-foreground">Product Name</div>
              <div className="font-semibold">{watch('batchInfo.productName')}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Batch No</div>
              <div className="font-semibold">{watch('batchInfo.batchNo')}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Batch Size</div>
              <div className="font-semibold">{watch('batchInfo.batchSize')}</div>
            </div>
            <div>
              <div className="text-muted-foreground">MFG Date</div>
              <div className="font-semibold">{watch('batchInfo.mfgDate')}</div>
            </div>
            <div>
              <div className="text-muted-foreground">EXP Date</div>
              <div className="font-semibold">{watch('batchInfo.expDate')}</div>
            </div>
          </div>
        </div>
      )}

      {loadNotice ? (
        <div className={noticeClassName}>
          {loadNotice}
        </div>
      ) : null}

      {isReadOnly ? (
        <div className={noticeClassName}>
          You can review this BMR, but saving or submitting changes requires `production.edit`.
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="page1" className="space-y-4">
          <TabsList className="flex flex-wrap justify-start">
            <TabsTrigger value="page1">{tabLabel('Page 1: Basic Info & Raw Material', 'page1')}</TabsTrigger>
            <TabsTrigger value="page2">{tabLabel('Page 2: Manufacturing Process', 'page2')}</TabsTrigger>
            <TabsTrigger value="page3">{tabLabel('Page 3: Sterilization & Packing', 'page3')}</TabsTrigger>
            <TabsTrigger value="page4">{tabLabel('Page 4: Final Output & QA', 'page4')}</TabsTrigger>
          </TabsList>

          <fieldset disabled={isReadOnly} className={!isReadOnly ? 'space-y-4' : 'space-y-4 opacity-80'}>
            <TabsContent value="page1" className="space-y-4">
            <FormSection title="Batch Header" description="Basic information as per the BMR document header.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Product Name *</Label>
                  <Input
                    {...register('batchInfo.productName')}
                    readOnly={batchLocked}
                    className={`${fieldClass(errors.batchInfo?.productName)} ${batchLocked ? 'bg-muted/50' : ''}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Batch No *</Label>
                  <Input
                    {...register('batchInfo.batchNo')}
                    readOnly={batchLocked}
                    className={`${fieldClass(errors.batchInfo?.batchNo)} ${batchLocked ? 'bg-muted/50' : ''}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Batch Size *</Label>
                  <Input
                    {...register('batchInfo.batchSize')}
                    readOnly={batchLocked}
                    className={`${fieldClass(errors.batchInfo?.batchSize)} ${batchLocked ? 'bg-muted/50' : ''}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>MFG Date *</Label>
                  <Input
                    type="date"
                    {...register('batchInfo.mfgDate')}
                    readOnly={batchLocked}
                    className={`${fieldClass(errors.batchInfo?.mfgDate)} ${batchLocked ? 'bg-muted/50' : ''}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>EXP Date *</Label>
                  <Input
                    type="date"
                    {...register('batchInfo.expDate')}
                    readOnly={batchLocked}
                    className={`${fieldClass(errors.batchInfo?.expDate)} ${batchLocked ? 'bg-muted/50' : ''}`}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Raw Material Consumption"
              description="Required and issued quantities are pulled from linked MRS and issue records."
            >
              <DataTable headers={['Sr No', 'Material Name', 'Required Qty', 'Issued Qty', 'Used Qty', 'Returned Qty', '']}>
                {rawMaterialsArray.fields.map((field, idx) => {
                  const rowError = errors.rawMaterials?.[idx];
                  return (
                    <tr key={field.id} className="border-b border-border last:border-0">
                      <td className="px-2.5 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-2.5 py-2">
                        <Input
                          {...register(`rawMaterials.${idx}.materialName`)}
                          className={fieldClass(rowError?.materialName)}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          {...register(`rawMaterials.${idx}.requiredQty`, { valueAsNumber: true })}
                          className={fieldClass(rowError?.requiredQty)}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          readOnly
                          {...register(`rawMaterials.${idx}.issuedQty`, { valueAsNumber: true })}
                          className="bg-muted/50"
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          {...register(`rawMaterials.${idx}.usedQty`, { valueAsNumber: true })}
                          className={fieldClass(rowError?.usedQty)}
                        />
                        {rowError?.usedQty && (
                          <p className="mt-1 text-[10px] text-destructive">{rowError.usedQty.message}</p>
                        )}
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          {...register(`rawMaterials.${idx}.returnedQty`, { valueAsNumber: true })}
                          className={fieldClass(rowError?.returnedQty)}
                        />
                        {rowError?.returnedQty && (
                          <p className="mt-1 text-[10px] text-destructive">{rowError.returnedQty.message}</p>
                        )}
                      </td>
                      <td className="px-2.5 py-2">
                        <TableActionButton
                          label="Remove Row"
                          icon={Trash2}
                          tone="rose"
                          onClick={() => rawMaterialsArray.remove(idx)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => rawMaterialsArray.append(createEmptyRawMaterialRow())}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Row
                </Button>
              </div>
            </FormSection>
            </TabsContent>

            <TabsContent value="page2" className="space-y-4">
            <FormSection title="Manufacturing Process Log" description="Record each processing step as per the paper form.">
              <DataTable headers={['Sr No', 'Process Step', 'Start Time', 'End Time', 'Operator', 'Checked By', 'Remarks', '']}>
                {processArray.fields.map((field, idx) => {
                  const rowError = errors.processSteps?.[idx];
                  return (
                    <tr key={field.id} className="border-b border-border last:border-0">
                      <td className="px-2.5 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-2.5 py-2">
                        <Input
                          {...register(`processSteps.${idx}.stepName`)}
                          className={fieldClass(rowError?.stepName)}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="time"
                          {...register(`processSteps.${idx}.startTime`)}
                          className={fieldClass(rowError?.startTime)}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="time"
                          {...register(`processSteps.${idx}.endTime`)}
                          className={fieldClass(rowError?.endTime)}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          {...register(`processSteps.${idx}.operatorName`)}
                          className={fieldClass(rowError?.operatorName)}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          {...register(`processSteps.${idx}.checkedBy`)}
                          className={fieldClass(rowError?.checkedBy)}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          {...register(`processSteps.${idx}.remarks`)}
                          className={fieldClass(rowError?.remarks)}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <TableActionButton label="Remove Row" icon={Trash2} tone="rose" onClick={() => processArray.remove(idx)} />
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => processArray.append(createEmptyProcessRow())}>
                  <Plus className="mr-2 h-4 w-4" /> Add Step
                </Button>
              </div>
            </FormSection>
            </TabsContent>

            <TabsContent value="page3" className="space-y-4">
            <FormSection title="Sterilization" description="Record sterilization details.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input type="date" {...register('sterilization.date')} className={fieldClass(errors.sterilization?.date)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Quantity *</Label>
                  <Input type="number" {...register('sterilization.quantity', { valueAsNumber: true })} className={fieldClass(errors.sterilization?.quantity)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Reference *</Label>
                  <Input {...register('sterilization.reference')} className={fieldClass(errors.sterilization?.reference)} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Packing" description="Packing entry as per BMR form.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Packing Type *</Label>
                  <Input {...register('packing.packingType')} className={fieldClass(errors.packing?.packingType)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Quantity *</Label>
                  <Input type="number" {...register('packing.quantity', { valueAsNumber: true })} className={fieldClass(errors.packing?.quantity)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Done By *</Label>
                  <Input {...register('packing.doneBy')} className={fieldClass(errors.packing?.doneBy)} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Labelling" description="Label verification details.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Label Details *</Label>
                  <Input {...register('labelling.labelDetails')} className={fieldClass(errors.labelling?.labelDetails)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Checked By *</Label>
                  <Input {...register('labelling.checkedBy')} className={fieldClass(errors.labelling?.checkedBy)} />
                </div>
              </div>
            </FormSection>
            </TabsContent>

            <TabsContent value="page4" className="space-y-4">
            <FormSection title="Final Output" description="Yield is auto-calculated.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Expected Qty *</Label>
                  <Input type="number" {...register('finalOutput.expectedQty', { valueAsNumber: true })} className={fieldClass(errors.finalOutput?.expectedQty)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Actual Qty *</Label>
                  <Input type="number" {...register('finalOutput.actualQty', { valueAsNumber: true })} className={fieldClass(errors.finalOutput?.actualQty)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Rejected Qty *</Label>
                  <Input type="number" {...register('finalOutput.rejectedQty', { valueAsNumber: true })} className={fieldClass(errors.finalOutput?.rejectedQty)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Yield %</Label>
                  <Input readOnly value={Number.isFinite(yieldPercent) ? `${yieldPercent}` : '0'} className="bg-muted/50" />
                </div>
              </div>
            </FormSection>

            <FormSection title="QA Release" description="QA decision is recorded in the BMR and then finalized separately in the QA tab.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>QA Status *</Label>
                  <Select
                    value={watch('qa.status')}
                    onValueChange={(value) => setValue('qa.status', value as BmrSchemaValues['qa']['status'], { shouldValidate: true })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className={fieldClass(errors.qa?.status)}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Approved By *</Label>
                  <Input {...register('qa.approvedBy')} className={fieldClass(errors.qa?.approvedBy)} />
                </div>
                <div className="space-y-1.5">
                  <Label>QA Remarks *</Label>
                  <Textarea {...register('qa.remarks')} className={fieldClass(errors.qa?.remarks)} rows={3} />
                </div>
              </div>
            </FormSection>
            </TabsContent>
          </fieldset>
        </Tabs>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4">
          <div className="text-xs text-muted-foreground">
            All sections are required. Yield is calculated from Actual vs Expected quantity.
            {!hasIssue && (
              <div className="mt-1 text-destructive">Record stock issue before submitting BMR.</div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void saveDraft()} disabled={isReadOnly || savingDraft || submitting}>
              {savingDraft ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button type="submit" disabled={isReadOnly || !isValid || !hasIssue || savingDraft || submitting}>
              {submitting ? 'Submitting...' : 'Submit BMR'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
