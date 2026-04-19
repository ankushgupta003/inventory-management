import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ListPagination from '@/components/list/ListPagination';
import type { TableDensity } from '@/components/list';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: keyof T & string;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  isLoading?: boolean;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  exportAction?: React.ReactNode;
  stickyHeader?: boolean;
  density?: TableDensity;
  rowVariant?: 'default' | 'zebra';
}

export default function DataTable<T>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKey,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  actions,
  isLoading = false,
  searchValue,
  onSearchValueChange,
  exportAction,
  stickyHeader = true,
  density = 'comfortable',
  rowVariant = 'zebra',
}: DataTableProps<T>) {
  const [search, setSearch] = useState(searchValue ?? '');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const effectiveSearch = searchValue ?? search;

  const filtered = useMemo(() => {
    if (!searchKey) return data;
    return data.filter((row) =>
      String((row as Record<string, unknown>)[searchKey] ?? '').toLowerCase().includes(effectiveSearch.toLowerCase())
    );
  }, [data, searchKey, effectiveSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const startRow = filtered.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const endRow = Math.min(safePage * rowsPerPage, filtered.length);

  return (
    <div className="space-y-4">
      {(searchKey || exportAction) ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {searchKey ? (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={effectiveSearch}
                onChange={(e) => {
                  if (onSearchValueChange) onSearchValueChange(e.target.value);
                  else setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          ) : <div />}
          {exportAction}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <Table>
          <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={cn('text-xs font-semibold uppercase tracking-[0.08em]', col.className || '')}>
                  {col.header}
                </TableHead>
              ))}
              {actions ? <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.08em]">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: Math.min(rowsPerPage, 6) }).map((_, idx) => (
              <TableRow key={`skeleton-${idx}`} className={cn(density === 'comfortable' ? 'h-[62px]' : 'h-[52px]')}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                {actions ? (
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {!isLoading && paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="py-14 text-center text-sm text-muted-foreground">
                  No data found
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && paginated.map((row, i) => (
              <TableRow
                key={i}
                className={cn(
                  density === 'comfortable' ? 'h-[62px]' : 'h-[52px]',
                  rowVariant === 'zebra' && i % 2 === 1 && 'bg-muted/20',
                  onRowClick && 'cursor-pointer transition-colors hover:bg-muted/35'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn('py-3.5', col.className || '')}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </TableCell>
                ))}
                {actions ? (
                  <TableCell className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading ? (
        <ListPagination
          page={safePage}
          pageSize={rowsPerPage}
          totalPages={totalPages}
          totalRows={filtered.length}
          startRow={startRow}
          endRow={endRow}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setRowsPerPage(next);
            setPage(1);
          }}
        />
      ) : null}
    </div>
  );
}
