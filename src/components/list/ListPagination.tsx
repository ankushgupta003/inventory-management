import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CompactSelect from '@/components/CompactSelect';
import type { PaginatedResultMeta } from './types';

interface ListPaginationProps extends PaginatedResultMeta {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

const buildPageWindow = (page: number, totalPages: number) => {
  const pages = new Set<number>([1, totalPages, page - 2, page - 1, page, page + 1, page + 2]);
  return Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
};

export default function ListPagination({
  page,
  pageSize,
  totalPages,
  totalRows,
  startRow,
  endRow,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: ListPaginationProps) {
  if (totalRows <= 0) return null;

  const pages = buildPageWindow(page, totalPages);

  return (
    <div className="list-pagination-shell flex flex-col gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-[var(--shadow-surface)] sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-medium text-muted-foreground">
        Showing {startRow}-{endRow} of {totalRows}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CompactSelect
          value={String(pageSize)}
          onChange={(v) => onPageSizeChange(Number(v))}
          options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n} / page` }))}
          className="w-28"
        />
        <Button variant="outline" size="icon" className="rounded-xl border-border/80" disabled={page <= 1} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-xl border-border/80" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            className="min-w-9 rounded-xl border-border/80"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        <Button variant="outline" size="icon" className="rounded-xl border-border/80" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-xl border-border/80" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
