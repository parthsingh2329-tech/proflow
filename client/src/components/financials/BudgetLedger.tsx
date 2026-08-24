import { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Calendar, 
  Building2, 
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ProjectBudget, BudgetCostItem, CostCategory, CostStatus } from '@/types';
import { useAddCostItem, useUpdateCostItem, useDeleteCostItem } from '@/hooks/useBudget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency } from './EVMPerformanceDashboard';

interface BudgetLedgerProps {
  projectId: string;
  budget: ProjectBudget;
}

const CATEGORY_LABELS: Record<CostCategory, string> = {
  TOOLING_AND_DIES: 'Tooling & Dies',
  PROTOTYPE_BOM: 'Prototype BOM',
  ENGINEERING_MANPOWER: 'Engineering Manpower',
  TESTING_AND_CERTIFICATION: 'Testing & Certification',
  RAW_MATERIALS: 'Raw Materials',
  SOFTWARE_AND_LICENSES: 'Software & Licenses',
  CONTINGENCY: 'Contingency',
};

const CATEGORY_COLORS: Record<CostCategory, string> = {
  TOOLING_AND_DIES: '#3b82f6',
  PROTOTYPE_BOM: '#10b981',
  ENGINEERING_MANPOWER: '#8b5cf6',
  TESTING_AND_CERTIFICATION: '#f59e0b',
  RAW_MATERIALS: '#ec4899',
  SOFTWARE_AND_LICENSES: '#6366f1',
  CONTINGENCY: '#64748b',
};

export default function BudgetLedger({ projectId, budget }: BudgetLedgerProps) {
  const addCostItemMutation = useAddCostItem(projectId);
  const updateCostItemMutation = useUpdateCostItem(projectId);
  const deleteCostItemMutation = useDeleteCostItem(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetCostItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CostCategory>('PROTOTYPE_BOM');
  const [plannedAmount, setPlannedAmount] = useState<number>(0);
  const [committedAmount, setCommittedAmount] = useState<number>(0);
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [vendor, setVendor] = useState('');
  const [purchaseOrderNo, setPurchaseOrderNo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [status, setStatus] = useState<CostStatus>('COMMITTED');
  const [dueDate, setDueDate] = useState('');

  const openCreateDialog = () => {
    setName('');
    setCategory('PROTOTYPE_BOM');
    setPlannedAmount(0);
    setCommittedAmount(0);
    setActualAmount(0);
    setVendor('');
    setPurchaseOrderNo('');
    setInvoiceNo('');
    setStatus('COMMITTED');
    setDueDate('');
    setEditingItem(null);
    setIsCreateOpen(true);
  };

  const openEditDialog = (item: BudgetCostItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPlannedAmount(item.plannedAmount);
    setCommittedAmount(item.committedAmount);
    setActualAmount(item.actualAmount);
    setVendor(item.vendor || '');
    setPurchaseOrderNo(item.purchaseOrderNo || '');
    setInvoiceNo(item.invoiceNo || '');
    setStatus(item.status);
    setDueDate(item.dueDate ? (new Date(item.dueDate).toISOString().split('T')[0] || '') : '');
    setIsCreateOpen(true);
  };

  const handleSaveCostItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      category,
      plannedAmount: Number(plannedAmount) || 0,
      committedAmount: Number(committedAmount) || 0,
      actualAmount: Number(actualAmount) || 0,
      vendor: vendor || undefined,
      purchaseOrderNo: purchaseOrderNo || undefined,
      invoiceNo: invoiceNo || undefined,
      status,
      dueDate: dueDate || undefined,
    };

    if (editingItem) {
      updateCostItemMutation.mutate(
        { costItemId: editingItem.id, data: payload },
        { onSuccess: () => setIsCreateOpen(false) }
      );
    } else {
      addCostItemMutation.mutate(payload, {
        onSuccess: () => setIsCreateOpen(false),
      });
    }
  };

  const costItems = budget.costItems || [];
  const filteredItems = costItems.filter((item) => {
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
            <Receipt className="h-5 w-5 text-indigo-600 mr-2" />
            Cost Breakdown Structure (CBS) Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed procurement POs, tooling expenditures, testing contracts, and supplier invoices.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="h-9 text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Cost Item
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Filter className="h-4 w-4 text-indigo-500" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs h-8 w-48"
          >
            <option value="ALL">All Cost Categories</option>
            <option value="TOOLING_AND_DIES">Tooling & Dies</option>
            <option value="PROTOTYPE_BOM">Prototype BOM</option>
            <option value="ENGINEERING_MANPOWER">Engineering Manpower</option>
            <option value="TESTING_AND_CERTIFICATION">Testing & Certification</option>
            <option value="RAW_MATERIALS">Raw Materials</option>
            <option value="SOFTWARE_AND_LICENSES">Software & Licenses</option>
            <option value="CONTINGENCY">Contingency</option>
          </Select>

          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs h-8 w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMMITTED">Committed (PO)</option>
            <option value="PAID">Paid (Invoiced)</option>
            <option value="PLANNED">Planned</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Cost Table */}
      <Card className="shadow-sm overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-3 pl-4">Cost Line Item</th>
                <th className="p-3">Category</th>
                <th className="p-3">Vendor / PO / Invoice</th>
                <th className="p-3 text-right">Planned (Budget)</th>
                <th className="p-3 text-right">Committed (PO)</th>
                <th className="p-3 text-right">Invoiced (Actual)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-slate-400">
                    No cost items recorded in this category. Click "Add Cost Item" to log an expenditure.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 pl-4 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </div>
                      {item.dueDate && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Target: {format(new Date(item.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#64748b' }}
                      >
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </td>

                    <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div>{item.vendor || <span className="italic text-slate-400">Internal</span>}</div>
                      {(item.purchaseOrderNo || item.invoiceNo) && (
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                          {item.purchaseOrderNo} {item.invoiceNo ? `• ${item.invoiceNo}` : ''}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatCurrency(item.plannedAmount, budget.currency)}
                    </td>

                    <td className="p-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {formatCurrency(item.committedAmount, budget.currency)}
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(item.actualAmount, budget.currency)}
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          item.status === 'PAID'
                            ? 'default'
                            : item.status === 'COMMITTED'
                            ? 'warning'
                            : item.status === 'PLANNED'
                            ? 'outline'
                            : 'destructive'
                        }
                        className="text-[10px]"
                      >
                        {item.status}
                      </Badge>
                    </td>

                    <td className="p-3 pr-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm('Remove this cost line item?')) {
                              deleteCostItemMutation.mutate(item.id);
                            }
                          }}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Edit Cost Item Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-50 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Receipt className="h-5 w-5 text-indigo-600 mr-2" />
              {editingItem ? 'Edit Cost Item' : 'Add Cost Line Item'}
            </h3>

            <form onSubmit={handleSaveCostItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Item Name / Description *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 100kWh Inverter Prototype Batch"
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CostCategory)}
                    className="text-xs"
                  >
                    <option value="TOOLING_AND_DIES">Tooling & Dies</option>
                    <option value="PROTOTYPE_BOM">Prototype BOM</option>
                    <option value="ENGINEERING_MANPOWER">Engineering Manpower</option>
                    <option value="TESTING_AND_CERTIFICATION">Testing & Certification</option>
                    <option value="RAW_MATERIALS">Raw Materials</option>
                    <option value="SOFTWARE_AND_LICENSES">Software & Licenses</option>
                    <option value="CONTINGENCY">Contingency</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CostStatus)}
                    className="text-xs"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="COMMITTED">Committed (PO Issued)</option>
                    <option value="PAID">Paid (Invoice Settled)</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Planned Budget (₹)</label>
                  <Input
                    type="number"
                    value={plannedAmount}
                    onChange={(e) => setPlannedAmount(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Committed PO (₹)</label>
                  <Input
                    type="number"
                    value={committedAmount}
                    onChange={(e) => setCommittedAmount(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Actual Invoiced (₹)</label>
                  <Input
                    type="number"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vendor / Supplier</label>
                  <Input
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. Wolfspeed GmbH"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">PO Number</label>
                  <Input
                    value={purchaseOrderNo}
                    onChange={(e) => setPurchaseOrderNo(e.target.value)}
                    placeholder="e.g. PO-8821"
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Invoice Number</label>
                  <Input
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-4011"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Payment / Delivery Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingItem ? 'Update Cost Item' : 'Save Cost Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
