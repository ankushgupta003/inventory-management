import type { MRSRecord } from '@/modules/mrs/types';
import type { ProductionBatch } from '@/modules/production/types';
import type { StockMovementRecord } from '@/modules/stock-movement/types';
import type { BmrSchemaValues } from '../schemas/bmrSchema';

type RawMaterialRow = BmrSchemaValues['rawMaterials'][number];

const normalizeKey = (value: string) => value.trim().toLowerCase();

const roundQty = (value: number) => Number(value.toFixed(3));

export const createEmptyProcessRow = () => ({
  id: `ps-${Date.now()}`,
  stepName: '',
  startTime: '',
  endTime: '',
  operatorName: '',
  checkedBy: '',
  remarks: '',
});

export const createEmptyRawMaterialRow = (
  overrides: Partial<RawMaterialRow> = {},
): RawMaterialRow => ({
  id: overrides.id ?? `rm-${Date.now()}`,
  materialName: overrides.materialName ?? '',
  requiredQty: overrides.requiredQty ?? 0,
  issuedQty: overrides.issuedQty ?? 0,
  usedQty: overrides.usedQty ?? 0,
  returnedQty: overrides.returnedQty ?? 0,
});

export const getBatchInfoFromBatch = (
  batch: ProductionBatch | null | undefined,
): BmrSchemaValues['batchInfo'] | null => {
  if (!batch) return null;

  return {
    productName: batch.productName,
    batchNo: batch.batchNo,
    batchSize: batch.batchSize,
    mfgDate: batch.mfgDate,
    expDate: batch.expDate,
  };
};

export const buildRawMaterialsFromRecords = ({
  mrsRecords,
  movements,
  existingRows = [],
}: {
  mrsRecords: MRSRecord[];
  movements: StockMovementRecord[];
  existingRows?: RawMaterialRow[];
}): RawMaterialRow[] => {
  type Aggregate = {
    key: string;
    name: string;
    requestedQty: number;
    issuedQty: number;
    issuedMovementQty: number;
    existing?: RawMaterialRow;
  };

  const aggregates = new Map<string, Aggregate>();
  const order: string[] = [];

  const ensureAggregate = (key: string, name: string) => {
    const normalizedKey = normalizeKey(key || name);
    if (!aggregates.has(normalizedKey)) {
      aggregates.set(normalizedKey, {
        key: normalizedKey,
        name,
        requestedQty: 0,
        issuedQty: 0,
        issuedMovementQty: 0,
      });
      order.push(normalizedKey);
    }

    const aggregate = aggregates.get(normalizedKey)!;
    if (!aggregate.name && name) {
      aggregate.name = name;
    }

    return aggregate;
  };

  existingRows.forEach((row) => {
    const aggregate = ensureAggregate(row.materialName, row.materialName);
    aggregate.existing = row;
  });

  mrsRecords.forEach((record) => {
    record.items.forEach((item) => {
      const aggregate = ensureAggregate(item.itemId || item.itemName, item.itemName);
      aggregate.requestedQty += Number(item.qtyRequested || 0);
      aggregate.issuedQty = Math.max(aggregate.issuedQty, Number(item.qtyIssued || 0));
    });
  });

  movements
    .filter((movement) => movement.type === 'issue')
    .forEach((movement) => {
      const movementItems = movement.items?.length
        ? movement.items
        : [{
            itemId: undefined,
            itemName: movement.itemName,
            batchNo: movement.batchNo,
            quantity: movement.quantity,
          }];

      movementItems.forEach((item) => {
        const aggregate = ensureAggregate(item.itemId || item.itemName, item.itemName);
        aggregate.issuedQty = Math.max(aggregate.issuedQty, Number(item.issuedQty || 0));
        aggregate.issuedMovementQty += Number(item.quantity || 0);
      });
    });

  const rows = order
    .map((key) => {
      const aggregate = aggregates.get(key);
      if (!aggregate) return null;

      const requiredQty = roundQty(aggregate.requestedQty || aggregate.existing?.requiredQty || 0);
      const issuedQty = roundQty(
        Math.max(
          aggregate.issuedQty,
          aggregate.issuedMovementQty,
          Number(aggregate.existing?.issuedQty || 0),
        ),
      );
      const existingUsedQty = Number(aggregate.existing?.usedQty || 0);
      const usedQty = roundQty(Math.min(existingUsedQty, issuedQty));
      const existingReturnedQty = Number(aggregate.existing?.returnedQty ?? Math.max(0, issuedQty - usedQty));
      const returnedQty = roundQty(
        Math.abs((usedQty + existingReturnedQty) - issuedQty) <= 0.001
          ? existingReturnedQty
          : Math.max(0, issuedQty - usedQty),
      );

      return createEmptyRawMaterialRow({
        id: aggregate.existing?.id ?? `rm-${aggregate.key}`,
        materialName: aggregate.name,
        requiredQty,
        issuedQty,
        usedQty,
        returnedQty,
      });
    })
    .filter((row): row is RawMaterialRow => Boolean(row && row.materialName));

  return rows.length ? rows : existingRows;
};

export function hasIssuedMaterials({
  mrsRecords,
  movements = [],
}: {
  mrsRecords: MRSRecord[];
  movements?: StockMovementRecord[];
}) {
  if (
    mrsRecords.some((record) =>
      record.items.some((item) => Number(item.qtyIssued || 0) > 0),
    )
  ) {
    return true;
  }

  return movements.some((movement) => movement.type === 'issue' && Number(movement.quantity || 0) > 0);
}

export const buildDefaultBmrValues = ({
  batch,
  existingData,
  mrsRecords = [],
  movements = [],
}: {
  batch?: ProductionBatch | null;
  existingData?: BmrSchemaValues | null;
  mrsRecords?: MRSRecord[];
  movements?: StockMovementRecord[];
}): BmrSchemaValues => {
  const batchInfo = getBatchInfoFromBatch(batch) ?? existingData?.batchInfo ?? {
    productName: '',
    batchNo: '',
    batchSize: '',
    mfgDate: '',
    expDate: '',
  };

  const rawMaterials = buildRawMaterialsFromRecords({
    mrsRecords,
    movements,
    existingRows: existingData?.rawMaterials ?? [],
  });

  return {
    batchInfo,
    rawMaterials: rawMaterials.length ? rawMaterials : [createEmptyRawMaterialRow()],
    processSteps: existingData?.processSteps?.length ? existingData.processSteps : [createEmptyProcessRow()],
    sterilization: existingData?.sterilization ?? { date: '', quantity: 0, reference: '' },
    packing: existingData?.packing ?? { packingType: '', quantity: 0, doneBy: '' },
    labelling: existingData?.labelling ?? { labelDetails: '', checkedBy: '' },
    finalOutput: existingData?.finalOutput ?? { expectedQty: 0, actualQty: 0, rejectedQty: 0 },
    qa: existingData?.qa ?? { status: 'PENDING', remarks: '', approvedBy: '' },
  };
};
