import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import ItemFormModal from '../components/ItemFormModal';
import ItemFiltersBar from '../components/ItemFiltersBar';
import EmptyState from '../components/EmptyState';
import { useItems } from '../hooks/useItems';
import type { ItemRecord } from '../types';
import type { ItemFormValues } from '../schemas/itemSchema';
import { toast } from 'sonner';

export default function ItemMasterPage() {
  const { items, allItems, filters, setFilters, addItem, updateItem, toggleStatus, deleteItem } = useItems();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);

  const openCreate = () => { setEditingItem(null); setModalOpen(true); };
  const openEdit = (item: ItemRecord) => { setEditingItem(item); setModalOpen(true); };

  const handleSave = (values: ItemFormValues) => {
    if (editingItem) {
      updateItem(editingItem.id, values);
      toast.success('Item updated successfully');
    } else {
      addItem({
        ...values,
        sku: values.sku || '',
        category: values.category || '',
        hsnCode: values.hsnCode || '',
        isActive: values.isActive,
      } as Omit<ItemRecord, 'id' | 'createdAt'>);
      toast.success('Item created successfully');
    }
    setModalOpen(false);
  };

  const handleToggleStatus = () => {
    if (toggleId) {
      toggleStatus(toggleId);
      toast.success('Item status updated');
      setToggleId(null);
    }
  };

  const toggleItem = allItems.find((i) => i.id === toggleId);

  const hasFilters = filters.search !== '' || filters.status !== 'all' || filters.itemType !== 'all';

  const columns = [
    { key: 'storeName', header: 'Store Item Name', render: (r: ItemRecord) => <span className="font-medium">{r.storeName}</span> },
    { key: 'tallyName', header: 'Tally Item Name', render: (r: ItemRecord) => <span className="font-mono text-xs text-muted-foreground">{r.tallyName}</span> },
    { key: 'sku', header: 'SKU', render: (r: ItemRecord) => r.sku ? <span className="text-xs">{r.sku}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'itemType', header: 'Type', render: (r: ItemRecord) => (
      <Badge variant={r.itemType === 'raw' ? 'secondary' : 'default'} className="text-xs capitalize">
        {r.itemType === 'raw' ? 'Raw Material' : 'Finished Good'}
      </Badge>
    )},
    { key: 'category', header: 'Category', render: (r: ItemRecord) => r.category ? <span className="text-xs">{r.category}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'baseUnit', header: 'Unit', render: (r: ItemRecord) => <span className="uppercase text-xs">{r.baseUnit}</span> },
    { key: 'hsnCode', header: 'HSN Code', render: (r: ItemRecord) => r.hsnCode ? <span className="text-xs">{r.hsnCode}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'gstRate', header: 'GST %', render: (r: ItemRecord) => `${r.gstRate}%` },
    { key: 'isActive', header: 'Status', render: (r: ItemRecord) => (
      <StatusBadge status={r.isActive ? 'success' : 'warning'} label={r.isActive ? 'Active' : 'Inactive'} />
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="erp-page-header mb-0">Item Master</h1>
          <p className="text-sm text-muted-foreground mt-1">{allItems.length} items total · {items.length} shown</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> Add Item</Button>
      </div>

      <ItemFiltersBar filters={filters} onChange={setFilters} />

      {items.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onClear={() => setFilters({ search: '', status: 'all', itemType: 'all' })}
          onCreate={openCreate}
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          pageSize={10}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(row)} title="Edit">
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setToggleId(row.id)} title={row.isActive ? 'Deactivate' : 'Activate'}>
                {row.isActive
                  ? <ToggleRight className="h-3.5 w-3.5 text-green-600" />
                  : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
              </Button>
            </div>
          )}
        />
      )}

      <ItemFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
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
