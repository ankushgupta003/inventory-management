import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const { items, allItems, filters, setFilters, addItem, updateItem, deleteItem } = useItems();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => { setEditingItem(null); setModalOpen(true); };
  const openEdit = (item: ItemRecord) => { setEditingItem(item); setModalOpen(true); };

  const handleSave = (values: ItemFormValues) => {
    if (editingItem) {
      updateItem(editingItem.id, values);
      toast.success('Item updated successfully');
    } else {
      addItem(values as Omit<ItemRecord, 'id' | 'currentStock' | 'createdAt'>);
      toast.success('Item created successfully');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteItem(deleteId);
      toast.success('Item deleted');
      setDeleteId(null);
    }
  };

  const hasFilters = filters.search !== '' || filters.type !== 'all' || filters.status !== 'all';

  const columns = [
    { key: 'storeName', header: 'Store Name', render: (r: ItemRecord) => <span className="font-medium">{r.storeName}</span> },
    { key: 'tallyName', header: 'Tally Name', render: (r: ItemRecord) => <span className="font-mono text-xs text-muted-foreground">{r.tallyName}</span> },
    { key: 'type', header: 'Type', render: (r: ItemRecord) => (
      <StatusBadge status={r.type === 'raw_material' ? 'info' : 'success'} label={r.type === 'raw_material' ? 'Raw Material' : 'Finished Good'} />
    )},
    { key: 'baseUnit', header: 'Base Unit', render: (r: ItemRecord) => (
      <span className="uppercase text-xs">{r.baseUnit}{r.conversionEnabled && r.alternateUnit ? ` → ${r.alternateUnit}` : ''}</span>
    )},
    { key: 'conversionFactor', header: 'Conversion', render: (r: ItemRecord) => (
      r.conversionEnabled && r.conversionFactor
        ? <span className="text-xs">1 {r.alternateUnit} = {r.conversionFactor} {r.baseUnit}</span>
        : <span className="text-xs text-muted-foreground">—</span>
    )},
    { key: 'purchaseRate', header: 'Purchase ₹', render: (r: ItemRecord) => r.purchaseRate > 0 ? `₹${r.purchaseRate.toLocaleString('en-IN')}` : '—' },
    { key: 'sellingRate', header: 'Selling ₹', render: (r: ItemRecord) => r.sellingRate > 0 ? `₹${r.sellingRate.toLocaleString('en-IN')}` : '—' },
    { key: 'taxPercent', header: 'Tax %', render: (r: ItemRecord) => `${r.taxPercent}%` },
    { key: 'currentStock', header: 'Stock', render: (r: ItemRecord) => (
      <span className={r.currentStock === 0 ? 'text-destructive font-medium' : ''}>{r.currentStock} {r.baseUnit}</span>
    )},
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
          onClear={() => setFilters({ search: '', type: 'all', status: 'all' })}
          onCreate={openCreate}
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          pageSize={10}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        description="This item will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
