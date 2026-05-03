import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ListPagination from '@/components/list/ListPagination';
import type { TableDensity } from '@/components/list';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
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
  toolbar?: React.ReactNode;
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
  toolbar,
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
      String((row as Record<string, unknown>)[searchKey] ?? '')
        .toLowerCase()
        .includes(effectiveSearch.toLowerCase())
    );
  }, [data, searchKey, effectiveSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const startRow = filtered.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const endRow = Math.min(safePage * rowsPerPage, filtered.length);
  const cellPaddingClass = density === 'comfortable' ? 'px-4 py-3.5' : 'px-4 py-2.5';

  return (
    <div className="space-y-4">
      {(toolbar || searchKey || exportAction) && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className={cn(toolbar ? 'space-y-3' : 'table-toolbar')}>
            {toolbar}

            {(searchKey || exportAction) && (
              <div className="table-toolbar-actions">
              {searchKey && (
                <div className="table-toolbar-search relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={effectiveSearch}
                    onChange={(e) => {
                      if (onSearchValueChange) {
                        onSearchValueChange(e.target.value);
                      } else {
                        setSearch(e.target.value);
                      }
                      setPage(1);
                    }}
                    className="h-10 pl-9"
                  />
                </div>
              )}

              {exportAction && (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                  {exportAction}
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {isLoading &&
          Array.from({ length: Math.min(rowsPerPage, 6) }).map((_, idx) => (
            <div
              key={`mobile-skeleton-${idx}`}
              className="rounded-xl border border-border bg-card p-4"
            >
              <Skeleton className="mb-3 h-4 w-1/2" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}

        {!isLoading && paginated.length === 0 && (
          <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
            No data found
          </div>
        )}

        {!isLoading &&
          paginated.map((row, i) => (
            <div
              key={i}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'rounded-xl border border-border bg-card p-4 shadow-sm',
                onRowClick && 'cursor-pointer active:scale-[0.99]'
              )}
            >
              <div className="space-y-3">
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {col.header}
                    </span>

                    <div className="min-w-0 text-right font-medium break-words">
                      {col.render
                        ? col.render(row)
                        : String(
                            (row as Record<string, unknown>)[col.key] ?? ''
                          )}
                    </div>
                  </div>
                ))}
              </div>

              {actions && (
                <div
                  className="mt-4 flex justify-end border-t border-border pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actions(row)}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table className="min-w-full md:w-max">
          <TableHeader
            className={cn(
              'bg-muted/40',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'h-auto min-w-[96px] px-4 py-3 text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-muted-foreground whitespace-normal',
                    col.className,
                    col.headerClassName
                  )}
                >
                  {col.header}
                </TableHead>
              ))}

              {actions && (
                <TableHead className="h-auto min-w-[112px] px-4 py-3 text-right text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-muted-foreground whitespace-normal">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading &&
              Array.from({ length: Math.min(rowsPerPage, 6) }).map(
                (_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cellPaddingClass}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}

                    {actions && (
                      <TableCell className={cn(cellPaddingClass, 'text-right')}>
                        <Skeleton className="ml-auto h-4 w-16" />
                      </TableCell>
                    )}
                  </TableRow>
                )
              )}

            {!isLoading && paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-40 text-center text-sm text-muted-foreground"
                >
                  No data found
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              paginated.map((row, i) => (
                <TableRow
                  key={i}
                  className={cn(
                    rowVariant === 'zebra' && i % 2 === 1 && 'bg-muted/10',
                    onRowClick &&
                      'cursor-pointer transition-colors hover:bg-muted/35'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        'align-top text-sm leading-5 whitespace-nowrap',
                        cellPaddingClass,
                        col.className,
                        col.cellClassName
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String(
                            (row as Record<string, unknown>)[col.key] ?? ''
                          )}
                    </TableCell>
                  ))}

                  {actions && (
                    <TableCell
                      className={cn(cellPaddingClass, 'whitespace-nowrap text-right')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
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
      )}
    </div>
  );
}
