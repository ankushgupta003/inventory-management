import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import App from '@/App';
import { getBatch, saveQa, submitBmr } from './productionStore';
import { mockBmrData } from '@/modules/bmr/mockData';

const loginAsAdmin = () => {
  localStorage.setItem('auth_token', 'mock-jwt-token');
  localStorage.setItem('auth_user', JSON.stringify({
    id: '1',
    name: 'Admin User',
    email: 'admin@erp.com',
    role: 'admin',
  }));
};

const setRoute = (path: string) => {
  window.history.pushState({}, '', path);
};

const getFieldByLabel = (label: RegExp | string, scope?: HTMLElement) => {
  const root = scope ?? document.body;
  const labelEl = within(root).getByText(label);
  const container = labelEl.closest('div');
  if (!container) throw new Error(`No container found for label ${label}`);
  const field = container.querySelector('input, textarea');
  if (!field) throw new Error(`No input/textarea found for label ${label}`);
  return field as HTMLElement;
};

const fillInput = (label: RegExp | string, value: string, scope?: HTMLElement) => {
  const input = getFieldByLabel(label, scope) as HTMLInputElement | HTMLTextAreaElement;
  fireEvent.change(input, { target: { value } });
};

describe('Production lifecycle flow', () => {
  beforeEach(() => {
    localStorage.clear();
    loginAsAdmin();
  });

  it('completes batch -> MRS -> issue -> BMR -> QA release', async () => {
    setRoute('/production/create');
    render(<App />);

    const batchForm = screen.getByRole('button', { name: /(Create|Save) Batch/i }).closest('form');
    if (!batchForm) throw new Error('Batch form not found');
    const productInput = batchForm.querySelector('input[name=\"productName\"]');
    const batchNoInput = batchForm.querySelector('input[name=\"batchNo\"]');
    const batchSizeInput = batchForm.querySelector('input[name=\"batchSize\"]');
    const mfgInput = batchForm.querySelector('input[name=\"mfgDate\"]');
    const expInput = batchForm.querySelector('input[name=\"expDate\"]');
    if (!productInput || !batchNoInput || !batchSizeInput || !mfgInput || !expInput) {
      throw new Error('Batch form fields not found');
    }

    fireEvent.change(productInput, { target: { value: 'Sterile Gloves - Test' } });
    fireEvent.change(batchNoInput, { target: { value: 'BMR-TEST-001' } });
    fireEvent.change(batchSizeInput, { target: { value: '1000 Pairs' } });
    fireEvent.change(mfgInput, { target: { value: '2026-04-08' } });
    fireEvent.change(expInput, { target: { value: '2029-04-07' } });
    fireEvent.submit(batchForm);

    expect(await screen.findByText(/Batch Snapshot/i)).toBeInTheDocument();
    expect(await screen.findByText(/BMR-TEST-001/i)).toBeInTheDocument();

    const mainTabList = screen.getAllByRole('tablist')
      .find((tablist) => within(tablist).queryByRole('tab', { name: 'MRS' }));
    if (!mainTabList) throw new Error('Main production tab list not found');
    fireEvent.click(within(mainTabList).getByRole('tab', { name: 'MRS' }));

    const mrsCreateHeading = screen.getByRole('heading', { name: 'Create MRS' });
    const mrsCreateCard = mrsCreateHeading.closest('section')
      ?? mrsCreateHeading.closest('div')?.parentElement;
    if (!mrsCreateCard) throw new Error('MRS create card not found');
    fireEvent.change(within(mrsCreateCard).getByPlaceholderText(/Enter raw material/i), { target: { value: 'Latex Compound - Test' } });
    fireEvent.change(within(mrsCreateCard).getByRole('spinbutton'), { target: { value: '100' } });
    fireEvent.click(within(mrsCreateCard).getByRole('button', { name: /Create MRS/i }));

    expect(await screen.findByText('Latex Compound - Test')).toBeInTheDocument();

    fireEvent.click(within(mainTabList).getByRole('tab', { name: /Stock Movement/i }));

    const movementCard = screen.getByText('Record Stock Movement').closest('div')?.parentElement;
    if (!movementCard) throw new Error('Stock movement card not found');
    const mrsSelect = within(movementCard).getAllByRole('combobox')[1];
    fireEvent.click(mrsSelect);
    const mrsOption = await screen.findByRole('option', { name: /Latex Compound - Test/i });
    fireEvent.click(mrsOption);

    fireEvent.change(within(movementCard).getByRole('spinbutton'), { target: { value: '80' } });
    fireEvent.click(within(movementCard).getByRole('button', { name: /Save Movement/i }));

    expect(await screen.findByText(/ISS-/i)).toBeInTheDocument();

    const batchId = window.location.pathname.split('/').pop();
    if (!batchId) throw new Error('Batch id not found in route');

    submitBmr(batchId, mockBmrData);
    saveQa(batchId, {
      status: 'APPROVED',
      remarks: 'Released for dispatch',
      approvedBy: 'QA Manager',
      decidedAt: new Date().toISOString(),
    });

    await waitFor(() => {
      expect(getBatch(batchId)?.status).toBe('RELEASED');
    });
  });
});
