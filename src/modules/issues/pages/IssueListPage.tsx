import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import PageHeader from '@/components/PageHeader';
import TableWrapper from '@/components/TableWrapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { issuesApi } from '../services/issuesApi';
import type { IssueRecord, IssueType } from '../types';

const typeLabel: Record<IssueType, string> = {
  production: 'Production',
  sample: 'Sample / QC',
  damage: 'Damage',
  other: 'Other',
};

export default function IssueListPage() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await issuesApi.getAll();
        if (active) setIssues(data);
      } catch {
        if (active) setIssues([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Stock Issue"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/issues' },
          { label: 'Stock Issue' },
        ]}
        action={(
          <Button onClick={() => navigate('/issues/create')}>
            <Plus className="h-4 w-4 mr-2" /> Create Issue
          </Button>
        )}
      />

      <TableWrapper title="Issues" description={`${issues.length} records`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Issue No</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead className="min-w-[140px]">Type</TableHead>
              <TableHead className="min-w-[160px]">Reference</TableHead>
              <TableHead className="min-w-[120px] text-right">Total Items</TableHead>
              <TableHead className="min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading issues...
                </TableCell>
              </TableRow>
            )}
            {!loading && issues.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No issues recorded yet.
                </TableCell>
              </TableRow>
            )}
            {issues.map((issue) => {
              const total = issue.totalItems ?? issue.items?.reduce((s, r) => s + (r.issueQty || 0), 0) ?? 0;
              return (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">{issue.issueNo}</TableCell>
                  <TableCell>{issue.date}</TableCell>
                  <TableCell>{typeLabel[issue.type]}</TableCell>
                  <TableCell>{issue.mrsNo || issue.mrsId || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{total}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => navigate(`/issues/${issue.id}`)} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  );
}
