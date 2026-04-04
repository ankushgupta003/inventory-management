import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const availableItems = [
  { id: '1', name: 'Steel Rod 10mm', unit: 'kg' },
  { id: '2', name: 'Copper Wire 2mm', unit: 'kg' },
  { id: '5', name: 'Packing Box Large', unit: 'pcs' },
];

interface IssueRow { itemId: string; quantity: number; }

export default function MaterialIssuePage() {
  const [issueType, setIssueType] = useState<'testing' | 'production'>('production');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<IssueRow[]>([{ itemId: '', quantity: 0 }]);

  const addRow = () => setRows([...rows, { itemId: '', quantity: 0 }]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof IssueRow, value: string | number) =>
    setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSubmit = () => {
    if (rows.some(r => !r.itemId || r.quantity <= 0)) { toast.error('Fill all item rows'); return; }
    toast.success('Material issue submitted');
    setRows([{ itemId: '', quantity: 0 }]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Material Issue"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/material-issue' },
          { label: 'Material Issue' },
        ]}
      />

      <FormSection title="Issue Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Issue Type *</Label>
            <Select value={issueType} onValueChange={(v) => setIssueType(v as 'testing' | 'production')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Items"
        actions={(
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
          </Button>
        )}
      >
        <div className="border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Select value={row.itemId} onValueChange={(v) => updateRow(i, 'itemId', v)}>
                      <SelectTrigger className="w-56"><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>
                        {availableItems.map(it => (
                          <SelectItem key={it.id} value={it.id}>
                            {it.name} ({it.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-28"
                      value={row.quantity || ''}
                      onChange={(e) => updateRow(i, 'quantity', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {rows.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeRow(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </FormSection>

      <FormSection title="Review">
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Submit Issue</Button>
        </div>
      </FormSection>
    </div>
  );
}
