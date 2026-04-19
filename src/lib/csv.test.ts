import { describe, expect, it, vi } from 'vitest';
import { csvDateSuffix, exportCsvFile } from './csv';

describe('csv util', () => {
  it('returns date suffix in yyyy-mm-dd', () => {
    expect(csvDateSuffix()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('triggers csv download link', () => {
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:mock', writable: true });
    }
    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', { value: () => {}, writable: true });
    }
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    exportCsvFile('test.csv', [['A', 'B'], ['1', '2']]);

    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    clickSpy.mockRestore();
  });
});
