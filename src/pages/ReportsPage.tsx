import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

const stockData = [
  { id: '1', name: 'Steel Rod 10mm', type: 'Raw Material', stock: 450, unit: 'kg', status: 'success' as const },
  { id: '2', name: 'Copper Wire 2mm', type: 'Raw Material', stock: 12, unit: 'kg', status: 'error' as const },
  { id: '3', name: 'Motor Assembly A1', type: 'Finished Good', stock: 85, unit: 'pcs', status: 'success' as const },
  { id: '4', name: 'Gear Box GB-200', type: 'Finished Good', stock: 42, unit: 'pcs', status: 'warning' as const },
  { id: '5', name: 'Packing Box Large', type: 'Raw Material', stock: 30, unit: 'pcs', status: 'error' as const },
];

const salesData = [
  { id: '1', invoice: 'INV-001', customer: 'XYZ Industries', date: '2024-03-10', amount: 151200, status: 'completed' as const },
  { id: '2', invoice: 'PI-002', customer: 'PQR Trading Co.', date: '2024-03-05', amount: 164000, status: 'pending' as const },
];

const productionData = [
  { id: '1', date: '2024-03-15', inputItems: 'Steel Rod, Copper Wire', outputItems: 'Motor Assembly A1', outputQty: 25, wastage: 3 },
  { id: '2', date: '2024-03-14', inputItems: 'Steel Rod', outputItems: 'Gear Box GB-200', outputQty: 10, wastage: 1 },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('stock');

  const stockColumns = [
    { key: 'name', header: 'Item Name' },
    { key: 'type', header: 'Type' },
    { key: 'stock', header: 'Current Stock', render: (r: typeof stockData[0]) => `${r.stock} ${r.unit}` },
    { key: 'status', header: 'Status', render: (r: typeof stockData[0]) => <StatusBadge status={r.status} label={r.status === 'error' ? 'Low' : r.status === 'warning' ? 'Medium' : 'Good'} /> },
  ];

  const salesColumns = [
    { key: 'invoice', header: 'Invoice' },
    { key: 'customer', header: 'Customer' },
    { key: 'date', header: 'Date' },
    { key: 'amount', header: 'Amount', render: (r: typeof salesData[0]) => `₹${r.amount.toLocaleString()}` },
    { key: 'status', header: 'Status', render: (r: typeof salesData[0]) => <StatusBadge status={r.status} /> },
  ];

  const prodColumns = [
    { key: 'date', header: 'Date' },
    { key: 'inputItems', header: 'Input Materials' },
    { key: 'outputItems', header: 'Output' },
    { key: 'outputQty', header: 'Output Qty' },
    { key: 'wastage', header: 'Wastage' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="erp-page-header">Reports</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="production">Production Report</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <DataTable columns={stockColumns} data={stockData} searchKey="name" searchPlaceholder="Search items..." />
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <DataTable columns={salesColumns} data={salesData} searchKey="customer" searchPlaceholder="Search by customer..." />
        </TabsContent>

        <TabsContent value="production" className="mt-4">
          <DataTable columns={prodColumns} data={productionData} searchKey="outputItems" searchPlaceholder="Search by output..." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
