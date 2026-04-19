import { test, expect } from '../playwright-fixture';

const adminUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@erp.com',
  role: 'admin',
};

const initAuth = (user: typeof adminUser) => {
  localStorage.clear();
  localStorage.setItem('auth_token', 'mock-jwt-token');
  localStorage.setItem('auth_user', JSON.stringify(user));
};

const getContainer = async (scope: any, label: RegExp | string) => {
  const labelLocator = typeof label === 'string'
    ? scope.getByText(label, { exact: false })
    : scope.getByText(label);
  const parent = labelLocator.locator('..');
  if (await parent.locator('input, textarea, button').count()) return parent;
  return parent.locator('..');
};

const fillByLabel = async (scope: any, label: RegExp | string, value: string) => {
  const container = await getContainer(scope, label);
  const input = container.locator('input, textarea').first();
  await input.fill(value);
};

const selectByLabel = async (page: any, scope: any, label: RegExp | string, optionText: string) => {
  const container = await getContainer(scope, label);
  const trigger = container.getByRole('button').first();
  await trigger.click();
  const option = page.getByRole('option', { name: optionText });
  if (await option.count()) {
    await option.click();
    return;
  }
  await page.getByText(optionText, { exact: false }).click();
};

test.describe('Manufacturing ERP lifecycle', () => {
  test('runs full lifecycle with validations and traceability', async ({ page }) => {
    test.setTimeout(180000);

    await page.addInitScript(initAuth, adminUser);

    await page.route('**/items**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/purchases**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'GIN-TEST' }) })
    );

    // Step 1: Master Setup (Items)
    await page.goto('/items');
    await page.getByRole('button', { name: /Add Item/i }).click();
    await fillByLabel(page, /Store Item Name/i, 'Cotton');
    await fillByLabel(page, /Tally Item Name/i, 'COTTON');
    await selectByLabel(page, page, /Item Type/i, 'Raw Material');
    await selectByLabel(page, page, /Base Unit/i, 'Kilogram (kg)');
    await page.getByRole('button', { name: /Create Item/i }).click();
    await expect(page.getByText('Cotton')).toBeVisible();

    await page.getByRole('button', { name: /Add Item/i }).click();
    await fillByLabel(page, /Store Item Name/i, 'Chemical');
    await fillByLabel(page, /Tally Item Name/i, 'CHEMICAL');
    await selectByLabel(page, page, /Item Type/i, 'Raw Material');
    await selectByLabel(page, page, /Base Unit/i, 'Kilogram (kg)');
    await page.getByRole('button', { name: /Create Item/i }).click();
    await expect(page.getByText('Chemical')).toBeVisible();

    await page.getByRole('button', { name: /Add Item/i }).click();
    await fillByLabel(page, /Store Item Name/i, 'Finished Product A');
    await fillByLabel(page, /Tally Item Name/i, 'FINISHED PRODUCT A');
    await selectByLabel(page, page, /Item Type/i, 'Finished Good');
    await selectByLabel(page, page, /Base Unit/i, 'Pieces (pcs)');
    await page.getByRole('button', { name: /Create Item/i }).click();
    await expect(page.getByText('Finished Product A')).toBeVisible();

    // Step 1: Master Setup (Parties)
    await page.goto('/parties');
    await page.getByRole('button', { name: /Add Party/i }).click();
    await page.getByLabel(/Party Name/i).fill('Vendor A');
    await selectByLabel(page, page, /Party Type/i, 'Vendor');
    await page.getByRole('button', { name: /Create Party/i }).click();
    await expect(page.getByText('Vendor A')).toBeVisible();

    await page.getByRole('button', { name: /Add Party/i }).click();
    await page.getByLabel(/Party Name/i).fill('Customer A');
    await selectByLabel(page, page, /Party Type/i, 'Customer');
    await page.getByRole('button', { name: /Create Party/i }).click();
    await expect(page.getByText('Customer A')).toBeVisible();

    // Step 2: Purchase (GIN) with multiple batches
    await page.goto('/purchases/create');
    await selectByLabel(page, page, /Vendor Name/i, 'Vendor A');
    await fillByLabel(page, /Challan No/i, 'CH-001');
    await fillByLabel(page, /Bill No/i, 'BILL-001');
    await fillByLabel(page, /Gate Entry No/i, 'GE-001');

    await page.getByRole('button', { name: /Add Row/i }).click();
    await page.getByRole('button', { name: /Add Row/i }).click();

    const rows = page.locator('tbody tr');
    // Row 1: Cotton 1000 -> RM-001
    await rows.nth(0).getByRole('button', { name: /Select/i }).click();
    await page.getByRole('option', { name: 'Cotton' }).click();
    await rows.nth(0).locator('input[type="number"]').nth(2).fill('1000');
    await rows.nth(0).locator('input[placeholder="B-001"]').fill('RM-001');
    await rows.nth(0).locator('input[type="date"]').nth(0).fill('2026-04-01');
    await rows.nth(0).locator('input[type="date"]').nth(1).fill('2027-04-01');
    await rows.nth(0).locator('input[type="number"]').nth(5).fill('40');

    // Row 2: Cotton 500 -> RM-002
    await rows.nth(1).getByRole('button', { name: /Select/i }).click();
    await page.getByRole('option', { name: 'Cotton' }).click();
    await rows.nth(1).locator('input[type="number"]').nth(2).fill('500');
    await rows.nth(1).locator('input[placeholder="B-001"]').fill('RM-002');
    await rows.nth(1).locator('input[type="date"]').nth(0).fill('2026-04-02');
    await rows.nth(1).locator('input[type="date"]').nth(1).fill('2027-04-02');
    await rows.nth(1).locator('input[type="number"]').nth(5).fill('40');

    // Row 3: Chemical 300 -> RM-003
    await rows.nth(2).getByRole('button', { name: /Select/i }).click();
    await page.getByRole('option', { name: 'Chemical' }).click();
    await rows.nth(2).locator('input[type="number"]').nth(2).fill('300');
    await rows.nth(2).locator('input[placeholder="B-001"]').fill('RM-003');
    await rows.nth(2).locator('input[type="date"]').nth(0).fill('2026-04-03');
    await rows.nth(2).locator('input[type="date"]').nth(1).fill('2027-04-03');
    await rows.nth(2).locator('input[type="number"]').nth(5).fill('120');

    await page.getByRole('button', { name: /Save GIN/i }).click();
    await expect(page.getByText(/Goods Inward Note saved successfully/i)).toBeVisible();

    // Step 3: Create Production Batch
    await page.goto('/production/create');
    await fillByLabel(page, /Product \*/i, 'Finished Product A');
    await fillByLabel(page, /Batch No \*/i, 'FG-001');
    await fillByLabel(page, /Batch Size \*/i, '500');
    await fillByLabel(page, /MFG Date \*/i, '2026-04-08');
    await fillByLabel(page, /EXP Date \*/i, '2028-04-08');
    await page.getByRole('button', { name: /Save Batch/i }).click();
    await expect(page.getByText(/Batch Snapshot/i)).toBeVisible();
    await expect(page.getByText('Draft')).toBeVisible();
    const batchId = page.url().split('/').pop() || '';

    // Step 4: Multiple MRS
    await page.getByRole('tab', { name: 'MRS' }).click();
    await fillByLabel(page, /Item \*/i, 'Cotton');
    await fillByLabel(page, /Qty Requested \*/i, '300');
    await page.getByRole('button', { name: /Create MRS/i }).click();
    await expect(page.getByText('Cotton')).toBeVisible();

    await fillByLabel(page, /Item \*/i, 'Chemical');
    await fillByLabel(page, /Qty Requested \*/i, '100');
    await page.getByRole('button', { name: /Create MRS/i }).click();
    await expect(page.getByText('Chemical')).toBeVisible();

    await fillByLabel(page, /Item \*/i, 'Cotton');
    await fillByLabel(page, /Qty Requested \*/i, '200');
    await page.getByRole('button', { name: /Create MRS/i }).click();

    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(page.getByText('600')).toBeVisible();

    // Step 5: Issues (partial + multiple)
    await page.getByRole('tab', { name: /Stock Movement/i }).click();

    await selectByLabel(page, page, /Select MRS \*/i, 'Cotton (300 remaining)');
    await fillByLabel(page, /^Qty \*/i, '250');
    await page.getByRole('button', { name: /Save Movement/i }).click();
    await expect(page.getByText(/Issue recorded/i)).toBeVisible();

    await selectByLabel(page, page, /Select MRS \*/i, 'Cotton (200 remaining)');
    await fillByLabel(page, /^Qty \*/i, '200');
    await page.getByRole('button', { name: /Save Movement/i }).click();

    await selectByLabel(page, page, /Select MRS \*/i, 'Cotton (50 remaining)');
    await fillByLabel(page, /^Qty \*/i, '50');
    await page.getByRole('button', { name: /Save Movement/i }).click();

    await selectByLabel(page, page, /Select MRS \*/i, 'Chemical (100 remaining)');
    await fillByLabel(page, /^Qty \*/i, '100');
    await page.getByRole('button', { name: /Save Movement/i }).click();

    // Step 6: Sampling
    await selectByLabel(page, page, /Movement Type \*/i, 'Sampling (QC)');
    await fillByLabel(page, /Item \*/i, 'Cotton');
    await fillByLabel(page, /^Qty \*/i, '20');
    await page.getByRole('button', { name: /Save Movement/i }).click();

    // Step 7: Transfer
    await selectByLabel(page, page, /Movement Type \*/i, 'Transfer');
    await fillByLabel(page, /Item \*/i, 'Cotton');
    await fillByLabel(page, /^Qty \*/i, '100');
    await fillByLabel(page, /From Location \*/i, 'Store');
    await fillByLabel(page, /To Location \*/i, 'Production');
    await page.getByRole('button', { name: /Save Movement/i }).click();

    // Step 8: BMR Execution (strict validation)
    await page.getByRole('tab', { name: 'BMR' }).click();
    const bmrTable = page.locator('table.bmr-table').first();
    const cottonRows = bmrTable.locator('tbody tr', { hasText: 'Cotton' });
    await cottonRows.nth(0).locator('input[type="number"]').nth(2).fill('260');
    await cottonRows.nth(0).locator('input[type="number"]').nth(3).fill('30');
    await expect(page.getByText(/Used \+ Returned must equal Issued qty/i)).toBeVisible();
    await cottonRows.nth(0).locator('input[type="number"]').nth(2).fill('270');
    await cottonRows.nth(0).locator('input[type="number"]').nth(3).fill('30');

    const chemicalRow = bmrTable.locator('tbody tr', { hasText: 'Chemical' }).first();
    await chemicalRow.locator('input[type="number"]').nth(2).fill('95');
    await chemicalRow.locator('input[type="number"]').nth(3).fill('5');

    await cottonRows.nth(1).locator('input[type="number"]').nth(2).fill('190');
    await cottonRows.nth(1).locator('input[type="number"]').nth(3).fill('10');

    await page.getByRole('tab', { name: /Page 2/i }).click();
    const processRows = page.locator('section:has-text("Manufacturing Process Log") table tbody tr');
    await processRows.nth(0).locator('input').nth(0).fill('Mixing');
    await processRows.nth(0).locator('input').nth(1).fill('08:00');
    await processRows.nth(0).locator('input').nth(2).fill('09:00');
    await processRows.nth(0).locator('input').nth(3).fill('Operator A');
    await processRows.nth(0).locator('input').nth(4).fill('Supervisor A');
    await processRows.nth(0).locator('input').nth(5).fill('Within limits');

    await page.getByRole('button', { name: /Add Step/i }).click();
    await page.getByRole('button', { name: /Add Step/i }).click();

    await processRows.nth(1).locator('input').nth(0).fill('Heating');
    await processRows.nth(1).locator('input').nth(1).fill('09:30');
    await processRows.nth(1).locator('input').nth(2).fill('10:30');
    await processRows.nth(1).locator('input').nth(3).fill('Operator B');
    await processRows.nth(1).locator('input').nth(4).fill('Supervisor B');
    await processRows.nth(1).locator('input').nth(5).fill('OK');

    await processRows.nth(2).locator('input').nth(0).fill('Packing');
    await processRows.nth(2).locator('input').nth(1).fill('11:00');
    await processRows.nth(2).locator('input').nth(2).fill('12:00');
    await processRows.nth(2).locator('input').nth(3).fill('Operator C');
    await processRows.nth(2).locator('input').nth(4).fill('Supervisor C');
    await processRows.nth(2).locator('input').nth(5).fill('OK');

    await page.getByRole('tab', { name: /Page 3/i }).click();
    const sterilization = page.locator('section:has-text("Sterilization")');
    await fillByLabel(sterilization, /Date \*/i, '2026-04-08');
    await fillByLabel(sterilization, /^Quantity \*/i, '480');
    await fillByLabel(sterilization, /Reference \*/i, 'ST-001');
    const packing = page.locator('section:has-text("Packing")');
    await fillByLabel(packing, /Packing Type \*/i, 'Box');
    await fillByLabel(packing, /^Quantity \*/i, '480');
    await fillByLabel(packing, /Done By \*/i, 'Packing Team');
    const labelling = page.locator('section:has-text("Labelling")');
    await fillByLabel(labelling, /Label Details \*/i, 'FG-001');
    await fillByLabel(labelling, /Checked By \*/i, 'QA');

    await page.getByRole('tab', { name: /Page 4/i }).click();
    await fillByLabel(page, /Expected Qty \*/i, '500');
    await fillByLabel(page, /Actual Qty \*/i, '470');
    await fillByLabel(page, /Rejected Qty \*/i, '20');
    await expect(page.getByText(/Actual \+ Rejected must equal Expected qty/i)).toBeVisible();
    await fillByLabel(page, /Actual Qty \*/i, '480');
    await fillByLabel(page, /Rejected Qty \*/i, '20');
    await selectByLabel(page, page, /QA Status \*/i, 'Pending');
    await fillByLabel(page, /Approved By \*/i, 'QA Officer');
    await fillByLabel(page, /QA Remarks \*/i, 'Awaiting QA');

    await page.getByRole('button', { name: /Submit BMR/i }).click();
    await expect(page.getByText(/BMR submitted/i)).toBeVisible();

    // Step 9: QA failure blocks invoice
    await page.getByRole('tab', { name: 'QA' }).click();
    await selectByLabel(page, page, /QA Status \*/i, 'Rejected');
    await fillByLabel(page, /Approved By \*/i, 'QA Manager');
    await fillByLabel(page, /QA Remarks \*/i, 'Failed QA');
    await page.getByRole('button', { name: /Submit QA Decision/i }).click();
    await expect(page.getByText('Blocked')).toBeVisible();

    await page.goto('/invoices/create');
    await selectByLabel(page, page, /Select PI \*/i, 'PI-FG-001');
    const invoiceRow = page.locator('tbody tr').first();
    await invoiceRow.getByRole('button', { name: /Select batch/i }).click();
    await page.getByRole('option', { name: /FG-001/i }).click();
    await invoiceRow.locator('input[type="number"]').first().fill('300');
    await page.getByRole('button', { name: /Save Invoice/i }).click();
    await expect(page.getByText(/Cannot sell blocked batch FG-001/i)).toBeVisible();

    // Step 10: QA pass
    await page.goto('/production');
    const fgRow = page.getByRole('row', { name: /FG-001/i });
    await fgRow.getByRole('button', { name: /View \/ Continue/i }).click();
    await page.getByRole('tab', { name: 'QA' }).click();
    await selectByLabel(page, page, /QA Status \*/i, 'Approved');
    await fillByLabel(page, /Approved By \*/i, 'QA Manager');
    await fillByLabel(page, /QA Remarks \*/i, 'Released');
    await page.getByRole('button', { name: /Submit QA Decision/i }).click();
    await expect(page.getByText('Released')).toBeVisible();

    // Step 11-13: Invoice flow with validations
    await page.goto('/invoices/create');
    await selectByLabel(page, page, /Select PI \*/i, 'PI-FG-001');
    const invoiceRow1 = page.locator('tbody tr').first();
    await invoiceRow1.getByRole('button', { name: /Select batch/i }).click();
    await page.getByRole('option', { name: /FG-001/i }).click();
    await invoiceRow1.locator('input[type="number"]').first().fill('300');
    await page.getByRole('button', { name: /Save Invoice/i }).click();
    await expect(page).toHaveURL(/\/invoices\//);

    await page.goto('/invoices/create');
    await selectByLabel(page, page, /Select PI \*/i, 'PI-FG-001');
    const invoiceRow2 = page.locator('tbody tr').first();
    await invoiceRow2.getByRole('button', { name: /Select batch/i }).click();
    await page.getByRole('option', { name: /FG-001/i }).click();
    await invoiceRow2.locator('input[type="number"]').first().fill('200');
    await expect(page.getByText(/Invoice qty cannot exceed available qty/i)).toBeVisible();
    await invoiceRow2.locator('input[type="number"]').first().fill('180');
    await page.getByRole('button', { name: /Save Invoice/i }).click();
    await expect(page).toHaveURL(/\/invoices\//);

    // Step 12: Over-issue validation in stock movement (available stock)
    await page.goto('/stock-movement/create');
    await selectByLabel(page, page, /Movement Type/i, 'Issue');
    await selectByLabel(page, page, /Reference MRS/i, 'MRS-001 (FG-001)');
    const issueRow = page.locator('section:has-text("Issue Details") .grid').first();
    await issueRow.getByRole('button', { name: /Select batch/i }).click();
    await page.getByRole('option', { name: /RM-001/i }).click();
    await issueRow.locator('input[type="number"]').first().fill('2000');
    await page.getByRole('button', { name: /Save Movement/i }).click();
    await expect(page.getByText(/Qty cannot exceed available stock/i)).toBeVisible();

    // Step 14: Ledger validation
    await page.goto('/stock-ledger');
    await expect(page.getByText(/Purchase/i)).toBeVisible();
    await expect(page.getByText(/Issue/i)).toBeVisible();
    await expect(page.getByText(/Sampling/i)).toBeVisible();
    await expect(page.getByText(/Transfer/i)).toBeVisible();
    await page.getByRole('tab', { name: /Finished Goods/i }).click();
    await expect(page.getByText(/Production/i)).toBeVisible();
    await expect(page.getByText(/Invoice/i)).toBeVisible();

    // Step 15: Traceability snapshot (BMR print view)
    if (batchId) {
      await page.goto(`/bmr/print/${batchId}`);
      await expect(page.getByText('FG-001')).toBeVisible();
      await expect(page.getByText('Cotton')).toBeVisible();
      await expect(page.getByText('Chemical')).toBeVisible();
    }
  });
});
