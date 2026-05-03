import { describe, expect, it } from 'vitest';
import { buildDefaultBmrValues, hasIssuedMaterials } from '@/modules/bmr/utils/bmrData';

describe('production BMR mapping', () => {
  it('hydrates raw material rows from MRS issue totals', () => {
    const values = buildDefaultBmrValues({
      batch: {
        id: 'batch-1',
        itemId: 'fg-1',
        productionNo: 'PRD-00001',
        batchNo: 'FG-001',
        productName: 'Finished Product A',
        batchSize: '500',
        status: 'IN_PROCESS',
        startDate: '2026-04-08',
        mfgDate: '2026-04-08',
        expDate: '2028-04-08',
        expectedQty: 0,
        actualQty: 0,
        rejectedQty: 0,
        bmrStatus: 'DRAFT',
        qaApprovedBy: '',
        qaRemarks: '',
        qaDecidedAt: '',
        createdAt: '2026-04-08T00:00:00.000Z',
        updatedAt: '2026-04-08T00:00:00.000Z',
      },
      mrsRecords: [
        {
          id: 'mrs-1',
          mrsNo: 'MRS-00001',
          date: '2026-04-08',
          department: 'Production',
          productionBatchId: 'batch-1',
          productionBatchNo: 'FG-001',
          productionNo: 'PRD-00001',
          requisitionBy: 'Supervisor',
          approvedBy: 'Manager',
          approvedAt: '2026-04-08T00:00:00.000Z',
          sanctionedBy: 'Manager',
          issuedBy: '',
          receivedBy: '',
          status: 'approved',
          items: [
            {
              itemId: 'rm-1',
              itemName: 'Cotton',
              unit: 'kg',
              qtyRequested: 120,
              qtyIssued: 80,
              remainingQty: 40,
              batchNo: '',
              remarks: '',
            },
          ],
          createdAt: '2026-04-08T00:00:00.000Z',
          updatedAt: '2026-04-08T00:00:00.000Z',
        },
      ],
    });

    expect(values.batchInfo.batchNo).toBe('FG-001');
    expect(values.rawMaterials).toHaveLength(1);
    expect(values.rawMaterials[0]).toMatchObject({
      materialName: 'Cotton',
      requiredQty: 120,
      issuedQty: 80,
    });
  });

  it('treats issued MRS quantities as enough to unlock BMR submission even without movement history', () => {
    expect(
      hasIssuedMaterials({
        mrsRecords: [
          {
            id: 'mrs-1',
            mrsNo: 'MRS-00001',
            date: '2026-04-08',
            department: 'Production',
            productionBatchId: 'batch-1',
            productionBatchNo: 'FG-001',
            productionNo: 'PRD-00001',
            requisitionBy: 'Supervisor',
            approvedBy: 'Manager',
            approvedAt: '2026-04-08T00:00:00.000Z',
            sanctionedBy: 'Manager',
            issuedBy: '',
            receivedBy: '',
            status: 'issued',
            items: [
              {
                itemId: 'rm-1',
                itemName: 'Cotton',
                unit: 'kg',
                qtyRequested: 120,
                qtyIssued: 80,
                remainingQty: 40,
                batchNo: '',
                remarks: '',
              },
            ],
            createdAt: '2026-04-08T00:00:00.000Z',
            updatedAt: '2026-04-08T00:00:00.000Z',
          },
        ],
      }),
    ).toBe(true);
  });
});
