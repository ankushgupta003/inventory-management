import { useEffect, useMemo, useState } from 'react';
import { Download, Edit2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/DataTable';
import TableActionButton from '@/components/TableActionButton';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { ListPageShell, ListTablePanel } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { getErrorMessage } from '@/lib/apiError';
import ItemFormModal from '../components/ItemFormModal';
import ItemFiltersBar from '../components/ItemFiltersBar';
import EmptyState from '../components/EmptyState';
import { useItems } from '../hooks/useItems';
import { itemsApi } from '../services/itemsApi';
import type { ItemCategoryOption, ItemRecord } from '../types';
import type { ItemFormValues } from '../schemas/itemSchema';
import { toast } from 'sonner';

export default function ItemMasterPage() {
  const { items, summary, filters, setFilters, createItem, updateItem, toggleStatus, isLoading } = useItems();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<ItemCategoryOption[]>([]);

  useEffect(() => {
    let active = true;

    itemsApi.getCategoryOptions()
      .then((data) => {
        if (!active) return;
        setCategoryOptions(data);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(getErrorMessage(error, 'Failed to load item categories'));
        setCategoryOptions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const openCreate = () => { setEditingItem(null); setModalOpen(true); };
  const openEdit = (item: ItemRecord) => { setEditingItem(item); setModalOpen(true); };

  const handleSave = async (values: ItemFormValues) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, values);
        toast.success('Item updated successfully');
      } else {
        await createItem(values);
        toast.success('Item created successfully');
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, editingItem ? 'Failed to update item' : 'Failed to create item'));
    }
  };

  const handleToggleStatus = async () => {
    if (toggleId) {
      try {
        await toggleStatus(toggleId);
        toast.success('Item status updated');
        setToggleId(null);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to update item status'));
      }
    }
  };

  const toggleItem = items.find((i) => i.id === toggleId);

  const hasFilters = filters.search !== '' || filters.status !== 'all' || filters.itemType !== 'all';

  const exportCsv = () => {
    exportCsvFile(`item-master-list-${csvDateSuffix()}.csv`, [
      ['Store Name', 'Tally Name', 'SKU', 'Type', 'Category', 'Unit', 'HSN', 'GST', 'Status'],
      ...items.map((i) => [
        i.storeName,
        i.tallyName,
        i.sku || '-',
        i.itemType,
        i.category || '-',
        i.baseUnit,
        i.hsnCode || '-',
        i.gstRate,
        i.isActive ? 'Active' : 'Inactive',
      ]),
    ]);
  };

  const columns = [
    { key: 'storeName', header: 'Store Item Name', render: (r: ItemRecord) => <span className="font-medium">{r.storeName}</span> },
    { key: 'tallyName', header: 'Tally Item Name', render: (r: ItemRecord) => <span className="font-mono text-xs text-muted-foreground">{r.tallyName}</span> },
    { key: 'sku', header: 'SKU', render: (r: ItemRecord) => r.sku ? <span className="text-xs">{r.sku}</span> : <span className="text-xs text-muted-foreground">-</span> },
    { key: 'itemType', header: 'Type', render: (r: ItemRecord) => (
      <Badge variant={r.itemType === 'raw' ? 'secondary' : 'default'} className="text-xs capitalize">
        {r.itemType === 'raw' ? 'Raw Material' : 'Finished Good'}
      </Badge>
    )},
    { key: 'category', header: 'Category', render: (r: ItemRecord) => r.category ? <span className="text-xs">{r.category}</span> : <span className="text-xs text-muted-foreground">-</span> },
    { key: 'baseUnit', header: 'Unit', render: (r: ItemRecord) => <span className="uppercase text-xs">{r.baseUnit}</span> },
    { key: 'hsnCode', header: 'HSN Code', render: (r: ItemRecord) => r.hsnCode ? <span className="text-xs">{r.hsnCode}</span> : <span className="text-xs text-muted-foreground">-</span> },
    { key: 'gstRate', header: 'GST %', render: (r: ItemRecord) => `${r.gstRate}%` },
    { key: 'isActive', header: 'Status', render: (r: ItemRecord) => (
      <StatusBadge status={r.isActive ? 'success' : 'warning'} label={r.isActive ? 'Active' : 'Inactive'} />
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Item Master"
        description={`${summary.total} items total. ${items.length} shown in the list below.`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Item Master' },
        ]}
      />

      {!isLoading && items.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onClear={() => setFilters({ search: '', status: 'all', itemType: 'all' })}
          onCreate={openCreate}
        />
      ) : (
        <ListTablePanel
          title="Items"
          description={isLoading ? 'Loading items...' : `${items.length} records`}
          leftContent={<ItemFiltersBar filters={filters} onChange={setFilters} />}
          rightContent={(
            <>
              <Button className="table-toolbar-button" variant="outline" onClick={exportCsv}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button className="table-toolbar-button" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </>
          )}
        >
          <DataTable
            columns={columns}
            data={items}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            isLoading={isLoading}
            actions={(row) => (
              <div className="flex items-center justify-end gap-1">
                <TableActionButton label="Edit" icon={Edit2} tone="amber" onClick={() => openEdit(row)} />
                <TableActionButton
                  label={row.isActive ? 'Deactivate' : 'Activate'}
                  icon={row.isActive ? ToggleRight : ToggleLeft}
                  tone={row.isActive ? 'rose' : 'emerald'}
                  onClick={() => setToggleId(row.id)}
                />
              </div>
            )}
          />
        </ListTablePanel>
      )}

      <ItemFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        categoryOptions={categoryOptions}
        editingItem={editingItem}
      />

      <ConfirmDialog
        open={!!toggleId}
        onClose={() => setToggleId(null)}
        onConfirm={handleToggleStatus}
        title={toggleItem?.isActive ? 'Deactivate Item' : 'Activate Item'}
        description={toggleItem?.isActive
          ? `"${toggleItem?.storeName}" will be marked as inactive.`
          : `"${toggleItem?.storeName}" will be marked as active.`}
        confirmLabel={toggleItem?.isActive ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
}
