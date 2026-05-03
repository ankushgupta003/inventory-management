import { useEffect, useMemo, useState } from 'react';
import { Download, Edit2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import PanelCard from '@/components/PanelCard';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import StatusBadge from '@/components/StatusBadge';
import TableActionButton from '@/components/TableActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { companyAdminAPI } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import { csvDateSuffix, exportCsvFile } from '@/lib/csv';
import type { ItemCategoryRecord, ItemCategoryUpsertPayload } from '@/types';

const emptyForm: ItemCategoryUpsertPayload = {
  name: '',
  itemType: 'raw',
  isActive: true,
};

const typeLabel: Record<ItemCategoryRecord['itemType'], string> = {
  raw: 'Raw Material',
  finished: 'Finished Good',
};

export default function ItemCategoriesPage() {
  const [itemCategories, setItemCategories] = useState<ItemCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ItemCategoryRecord | null>(null);
  const [form, setForm] = useState<ItemCategoryUpsertPayload>(emptyForm);
  const [search, setSearch] = useState('');

  const loadItemCategories = async () => {
    try {
      const data = await companyAdminAPI.getItemCategories();
      setItemCategories(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load item categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItemCategories();
  }, []);

  const filteredItemCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return itemCategories;
    return itemCategories.filter((record) => `${record.name} ${record.itemType}`.toLowerCase().includes(query));
  }, [itemCategories, search]);

  const exportCsv = () => {
    exportCsvFile(`item-categories-${csvDateSuffix()}.csv`, [
      ['Category', 'Item Type', 'Status'],
      ...filteredItemCategories.map((record) => [record.name, typeLabel[record.itemType], record.isActive ? 'Active' : 'Inactive']),
    ]);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (record: ItemCategoryRecord) => {
    setEditing(record);
    setForm({
      name: record.name,
      itemType: record.itemType,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const updated = await companyAdminAPI.updateItemCategory(editing.id, form);
        setItemCategories((current) => current.map((record) => (record.id === updated.id ? updated : record)));
        toast.success('Item category updated successfully');
      } else {
        const created = await companyAdminAPI.createItemCategory(form);
        setItemCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Item category created successfully');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save item category'));
    }
  };

  const handleToggleStatus = async (record: ItemCategoryRecord) => {
    try {
      const updated = await companyAdminAPI.updateItemCategory(record.id, { isActive: !record.isActive });
      setItemCategories((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      toast.success('Item category status updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update item category status'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Item Categories"
        description="Maintain raw-material and finished-good category masters used by Item Master."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Item Categories' },
        ]}
      />

      <PanelCard title="Category Master" subtitle="Company-level categories grouped by item type">
        <DataTable
          toolbar={(
            <div className="table-toolbar">
              <div className="table-toolbar-filters">
                <Input placeholder="Search item categories..." value={search} onChange={(event) => setSearch(event.target.value)} className="table-toolbar-search" />
              </div>
              <div className="table-toolbar-actions">
                <Button className="table-toolbar-button" variant="outline" onClick={exportCsv}>
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button className="table-toolbar-button" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
              </div>
            </div>
          )}
          columns={[
            { key: 'name', header: 'Category', render: (row: ItemCategoryRecord) => <span className="font-medium">{row.name}</span> },
            { key: 'itemType', header: 'Item Type', render: (row: ItemCategoryRecord) => typeLabel[row.itemType] },
            {
              key: 'status',
              header: 'Status',
              render: (row: ItemCategoryRecord) => (
                <StatusBadge status={row.isActive ? 'success' : 'warning'} label={row.isActive ? 'Active' : 'Inactive'} />
              ),
            },
          ]}
          data={filteredItemCategories}
          isLoading={loading}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="Edit" icon={Edit2} tone="amber" onClick={() => openEdit(row)} />
              <TableActionButton
                label={row.isActive ? 'Deactivate' : 'Activate'}
                icon={row.isActive ? ToggleRight : ToggleLeft}
                tone={row.isActive ? 'rose' : 'emerald'}
                onClick={() => void handleToggleStatus(row)}
              />
            </div>
          )}
        />
      </PanelCard>

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setForm(emptyForm);
        }}
        title={editing ? 'Edit Item Category' : 'Add Item Category'}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="item-category-name">Category Name</Label>
            <Input
              id="item-category-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Item Type</Label>
            <Select
              value={form.itemType}
              onValueChange={(value) => setForm((current) => ({ ...current, itemType: value as ItemCategoryRecord['itemType'] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Raw Material</SelectItem>
                <SelectItem value="finished">Finished Good</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive categories stay in history but should not be chosen for new items.</p>
            </div>
            <Switch checked={!!form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button className="rounded-xl" onClick={() => void handleSave()}>
            {editing ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </FormModal>
    </div>
  );
}
