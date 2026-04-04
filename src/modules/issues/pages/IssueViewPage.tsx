import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import TableWrapper from '@/components/TableWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { issuesApi } from '../services/issuesApi';
import type { IssueRecord } from '../types';

const typeLabel: Record<IssueRecord['type'], string> = {
  production: 'Production',
  sample: 'Sample / QC',
  damage: 'Damage',
  other: 'Other',
};

export default function IssueViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<IssueRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!id) return;
        const data = await issuesApi.getById(id);
        if (active) setIssue(data);
      } catch {
        if (active) setIssue(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <p className="text-muted-foreground">Loading issue...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/issues')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Issue not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Stock Issue"
        description={`${issue.issueNo} | ${issue.date}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/issues' },
          { label: 'Issue Details' },
        ]}
        action={(
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" onClick={() => navigate('/issues')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        )}
      />

      <FormSection title="Summary">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Type</div>
            <div className="font-medium">{typeLabel[issue.type]}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Reference</div>
            <div className="font-medium">{issue.mrsNo || issue.mrsId || '-'}</div>
          </div>
        </div>
      </FormSection>

      <TableWrapper title="Items">
        <Table>
          <TableHeader>
            <TableRow>
              {['Sr No','Item','Batch No','Issue Qty','Remarks'].map((h) => (
                <TableHead key={h} className="text-xs">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {issue.items.map((row, idx) => (
              <TableRow key={`${row.itemId}-${idx}`}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell className="font-medium">{row.itemName}</TableCell>
                <TableCell className="font-mono text-xs">{row.batchNo}</TableCell>
                <TableCell>{row.issueQty}</TableCell>
                <TableCell>{row.remarks || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>

      <FormSection title="Signatories">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="text-muted-foreground">Issued By</div>
            <div className="font-medium">{issue.issuedBy || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Approved By</div>
            <div className="font-medium">{issue.approvedBy || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Received By</div>
            <div className="font-medium">{issue.receivedBy || '-'}</div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
