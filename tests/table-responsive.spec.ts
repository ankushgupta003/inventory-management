import { test, expect } from '../playwright-fixture';
import type { Page } from '@playwright/test';

const adminUser = {
  id: 'company-admin-1',
  name: 'Inventory Admin',
  fullName: 'Inventory Admin',
  email: 'admin@inventoryx.test',
  accountType: 'COMPANY_ADMIN',
  companyId: 'company-1',
  companyName: 'InventoryX Demo',
  companyStatus: 'ACTIVE',
  mustResetPassword: false,
  isActive: true,
  permissions: [
    'dashboard.view',
    'invoices.view',
    'invoices.create',
    'stock_ledger.view',
  ],
  departmentId: null,
  departmentName: null,
  designationId: null,
  designationName: null,
  roleId: null,
  roleName: 'Administrator',
};

const invoiceRecords = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-2026-0001',
    date: '2026-05-01',
    customerId: 'party-1',
    customerName: 'Apex Industrial Procurement and Contract Manufacturing Private Limited',
    piId: 'pi-1',
    piNo: 'PI-2026-0001',
    items: [],
    totalQuantity: 120,
    totalAmount: 145000,
    taxAmount: 26100,
    grandTotal: 171100,
    status: 'completed',
  },
  {
    id: 'inv-2',
    invoiceNo: 'INV-2026-0002',
    date: '2026-05-02',
    customerId: 'party-2',
    customerName: 'Northern Clinical Research and Supply Chain Partners LLP',
    piId: 'pi-2',
    piNo: 'PI-2026-0002',
    items: [],
    totalQuantity: 48,
    totalAmount: 58500,
    taxAmount: 10530,
    grandTotal: 69030,
    status: 'partial',
  },
];

const ledgerEntries = [
  {
    id: 'l-1',
    itemId: 'item-cotton',
    date: '2026-05-01',
    createdAt: '2026-05-01T08:00:00.000Z',
    referenceNo: 'GIN-2026-ALPHA-LONG-REFERENCE-000001',
    type: 'purchase',
    particulars: 'Vendor Alpha for strategic buffer stock replenishment',
    itemName: 'Sterile Cotton Roll 10mm',
    itemCategory: 'RAW',
    batchNo: 'RM-001',
    mfgDate: '2026-04-01',
    expiryDate: '2027-04-01',
    receiptQty: 1000,
    issueQty: 0,
    rate: 40,
    remarks: 'Goods inward',
    transactionValue: 40000,
    sourceModule: 'purchases',
    sourceId: 'gin-1',
    sourcePath: '/purchases/gin-1',
    sourceLabel: 'Purchase GIN',
  },
  {
    id: 'l-2',
    itemId: 'item-cotton',
    date: '2026-05-02',
    createdAt: '2026-05-02T09:00:00.000Z',
    referenceNo: 'MOV-2026-BETA-LONG-REFERENCE-000002',
    type: 'sampling',
    particulars: 'Store -> QC',
    itemName: 'Sterile Cotton Roll 10mm',
    itemCategory: 'RAW',
    batchNo: 'RM-001',
    mfgDate: '2026-04-01',
    expiryDate: '2027-04-01',
    receiptQty: 0,
    issueQty: 24,
    rate: 40,
    remarks: 'QC sampling',
    transactionValue: 960,
    sourceModule: 'stock-movement',
    sourceId: 'mov-1',
    sourcePath: '/stock-movement/mov-1',
    sourceLabel: 'Stock Movement',
  },
  {
    id: 'l-3',
    itemId: 'item-cotton',
    date: '2026-05-03',
    createdAt: '2026-05-03T10:00:00.000Z',
    referenceNo: 'MOV-2026-GAMMA-LONG-REFERENCE-000003',
    type: 'issue',
    particulars: 'MRS-00001',
    itemName: 'Sterile Cotton Roll 10mm',
    itemCategory: 'RAW',
    batchNo: 'RM-001',
    mfgDate: '2026-04-01',
    expiryDate: '2027-04-01',
    receiptQty: 0,
    issueQty: 300,
    rate: 40,
    remarks: 'Issued to production',
    transactionValue: 12000,
    sourceModule: 'stock-movement',
    sourceId: 'mov-2',
    sourcePath: '/stock-movement/mov-2',
    sourceLabel: 'Stock Movement',
  },
  {
    id: 'l-4',
    itemId: 'item-fg',
    date: '2026-05-04',
    createdAt: '2026-05-04T11:00:00.000Z',
    referenceNo: 'PRD-2026-DELTA-LONG-REFERENCE-000004',
    type: 'production',
    particulars: 'Production Output',
    itemName: 'Finished Surgical Dressing Kit Ultra',
    itemCategory: 'FINISHED',
    batchNo: 'FG-001',
    mfgDate: '2026-05-04',
    expiryDate: '2028-05-04',
    receiptQty: 480,
    issueQty: 0,
    rate: 0,
    remarks: 'Finished goods entry',
    transactionValue: 0,
    sourceModule: 'production',
    sourceId: 'batch-1',
    sourcePath: '/production/batch-1',
    sourceLabel: 'Production Batch',
  },
  {
    id: 'l-5',
    itemId: 'item-fg',
    date: '2026-05-05',
    createdAt: '2026-05-05T12:00:00.000Z',
    referenceNo: 'INV-2026-EPSILON-LONG-REFERENCE-000005',
    type: 'invoice',
    particulars: 'Apex Industrial Procurement and Contract Manufacturing Private Limited',
    itemName: 'Finished Surgical Dressing Kit Ultra',
    itemCategory: 'FINISHED',
    batchNo: 'FG-001',
    mfgDate: '2026-05-04',
    expiryDate: '2028-05-04',
    receiptQty: 0,
    issueQty: 180,
    rate: 250,
    remarks: 'Sales invoice',
    transactionValue: 45000,
    sourceModule: 'invoices',
    sourceId: 'inv-1',
    sourcePath: '/invoices/inv-1',
    sourceLabel: 'Final Invoice',
  },
];

const viewports = [
  { width: 375, height: 900 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];

const initAuth = (user: typeof adminUser) => {
  localStorage.clear();
  localStorage.setItem('auth_token', 'mock-jwt-token');
  localStorage.setItem('auth_portal', 'company');
  localStorage.setItem('auth_user', JSON.stringify(user));
};

async function expectNoPageOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

test.describe('Responsive table layout guards', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(initAuth, adminUser);
  });

  test('keeps the invoice list toolbar responsive across breakpoints', async ({ page }) => {
    await page.route('**/invoices**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: invoiceRecords }),
      }),
    );

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/invoices');

      await expect(page.getByRole('heading', { name: /Final Invoice/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Invoice Records/i })).toBeVisible();
      await expect(page.getByPlaceholder(/Search invoice no, PI no, or customer/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Clear/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Create Invoice/i })).toBeVisible();
      await expect(page.getByText(/2 records/i)).toBeVisible();

      await expectNoPageOverflow(page);

      if (viewport.width >= 768) {
        const tableMetrics = await page.locator('table').first().evaluate((table) => {
          const container = table.parentElement as HTMLElement | null;
          return container
            ? { scrollWidth: container.scrollWidth, clientWidth: container.clientWidth }
            : null;
        });

        expect(tableMetrics).not.toBeNull();
        expect(tableMetrics?.clientWidth ?? 0).toBeGreaterThan(0);
      }
    }
  });

  test('contains ledger overflow inside the table region across breakpoints', async ({ page }) => {
    await page.route('**/ledger**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: ledgerEntries, total: ledgerEntries.length }),
      }),
    );

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/stock-ledger');

      await expect(page.getByRole('heading', { name: /^Ledger$/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Transaction Register/i })).toBeVisible();
      await expect(page.getByPlaceholder(/Search ref, party, item, batch/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /^Clear$/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
      await expect(page.getByText(/grouped transactions/i)).toBeVisible();

      await expectNoPageOverflow(page);

      const tableMetrics = await page.locator('table').first().evaluate((table) => {
        const container = table.parentElement as HTMLElement | null;
        return container
          ? { scrollWidth: container.scrollWidth, clientWidth: container.clientWidth }
          : null;
      });

      expect(tableMetrics).not.toBeNull();
      expect(tableMetrics?.scrollWidth ?? 0).toBeGreaterThan(tableMetrics?.clientWidth ?? 0);
    }
  });
});
