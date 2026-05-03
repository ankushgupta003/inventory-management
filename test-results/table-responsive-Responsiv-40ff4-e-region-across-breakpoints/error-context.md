# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: table-responsive.spec.ts >> Responsive table layout guards >> contains ledger overflow inside the table region across breakpoints
- Location: tests\table-responsive.spec.ts:244:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /^Ledger$/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: /^Ledger$/i })

```

# Test source

```ts
  157 |     itemId: 'item-fg',
  158 |     date: '2026-05-05',
  159 |     createdAt: '2026-05-05T12:00:00.000Z',
  160 |     referenceNo: 'INV-2026-EPSILON-LONG-REFERENCE-000005',
  161 |     type: 'invoice',
  162 |     particulars: 'Apex Industrial Procurement and Contract Manufacturing Private Limited',
  163 |     itemName: 'Finished Surgical Dressing Kit Ultra',
  164 |     itemCategory: 'FINISHED',
  165 |     batchNo: 'FG-001',
  166 |     mfgDate: '2026-05-04',
  167 |     expiryDate: '2028-05-04',
  168 |     receiptQty: 0,
  169 |     issueQty: 180,
  170 |     rate: 250,
  171 |     remarks: 'Sales invoice',
  172 |     transactionValue: 45000,
  173 |     sourceModule: 'invoices',
  174 |     sourceId: 'inv-1',
  175 |     sourcePath: '/invoices/inv-1',
  176 |     sourceLabel: 'Final Invoice',
  177 |   },
  178 | ];
  179 | 
  180 | const viewports = [
  181 |   { width: 375, height: 900 },
  182 |   { width: 768, height: 1024 },
  183 |   { width: 1280, height: 900 },
  184 | ];
  185 | 
  186 | const initAuth = (user: typeof adminUser) => {
  187 |   localStorage.clear();
  188 |   localStorage.setItem('auth_token', 'mock-jwt-token');
  189 |   localStorage.setItem('auth_portal', 'company');
  190 |   localStorage.setItem('auth_user', JSON.stringify(user));
  191 | };
  192 | 
  193 | async function expectNoPageOverflow(page: Page) {
  194 |   const metrics = await page.evaluate(() => ({
  195 |     pageWidth: document.documentElement.scrollWidth,
  196 |     viewportWidth: window.innerWidth,
  197 |   }));
  198 | 
  199 |   expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  200 | }
  201 | 
  202 | test.describe('Responsive table layout guards', () => {
  203 |   test.beforeEach(async ({ page }) => {
  204 |     await page.addInitScript(initAuth, adminUser);
  205 |   });
  206 | 
  207 |   test('keeps the invoice list toolbar responsive across breakpoints', async ({ page }) => {
  208 |     await page.route('**/invoices**', (route) =>
  209 |       route.fulfill({
  210 |         status: 200,
  211 |         contentType: 'application/json',
  212 |         body: JSON.stringify({ data: invoiceRecords }),
  213 |       }),
  214 |     );
  215 | 
  216 |     for (const viewport of viewports) {
  217 |       await page.setViewportSize(viewport);
  218 |       await page.goto('/invoices');
  219 | 
  220 |       await expect(page.getByRole('heading', { name: /Final Invoice/i })).toBeVisible();
  221 |       await expect(page.getByRole('heading', { name: /Invoice Records/i })).toBeVisible();
  222 |       await expect(page.getByPlaceholder(/Search invoice no, PI no, or customer/i)).toBeVisible();
  223 |       await expect(page.getByRole('button', { name: /Clear/i })).toBeVisible();
  224 |       await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
  225 |       await expect(page.getByRole('button', { name: /Create Invoice/i })).toBeVisible();
  226 |       await expect(page.getByText(/2 records/i)).toBeVisible();
  227 | 
  228 |       await expectNoPageOverflow(page);
  229 | 
  230 |       if (viewport.width >= 768) {
  231 |         const tableMetrics = await page.locator('table').first().evaluate((table) => {
  232 |           const container = table.parentElement as HTMLElement | null;
  233 |           return container
  234 |             ? { scrollWidth: container.scrollWidth, clientWidth: container.clientWidth }
  235 |             : null;
  236 |         });
  237 | 
  238 |         expect(tableMetrics).not.toBeNull();
  239 |         expect(tableMetrics?.clientWidth ?? 0).toBeGreaterThan(0);
  240 |       }
  241 |     }
  242 |   });
  243 | 
  244 |   test('contains ledger overflow inside the table region across breakpoints', async ({ page }) => {
  245 |     await page.route('**/ledger**', (route) =>
  246 |       route.fulfill({
  247 |         status: 200,
  248 |         contentType: 'application/json',
  249 |         body: JSON.stringify({ data: ledgerEntries, total: ledgerEntries.length }),
  250 |       }),
  251 |     );
  252 | 
  253 |     for (const viewport of viewports) {
  254 |       await page.setViewportSize(viewport);
  255 |       await page.goto('/stock-ledger');
  256 | 
> 257 |       await expect(page.getByRole('heading', { name: /^Ledger$/i })).toBeVisible();
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
  258 |       await expect(page.getByRole('heading', { name: /Transaction Register/i })).toBeVisible();
  259 |       await expect(page.getByPlaceholder(/Search ref, party, item, batch/i)).toBeVisible();
  260 |       await expect(page.getByRole('button', { name: /^Clear$/i })).toBeVisible();
  261 |       await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
  262 |       await expect(page.getByText(/grouped transactions/i)).toBeVisible();
  263 | 
  264 |       await expectNoPageOverflow(page);
  265 | 
  266 |       const tableMetrics = await page.locator('table').first().evaluate((table) => {
  267 |         const container = table.parentElement as HTMLElement | null;
  268 |         return container
  269 |           ? { scrollWidth: container.scrollWidth, clientWidth: container.clientWidth }
  270 |           : null;
  271 |       });
  272 | 
  273 |       expect(tableMetrics).not.toBeNull();
  274 |       expect(tableMetrics?.scrollWidth ?? 0).toBeGreaterThan(tableMetrics?.clientWidth ?? 0);
  275 |     }
  276 |   });
  277 | });
  278 | 
```