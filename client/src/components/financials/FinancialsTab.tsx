import { useState } from 'react';
import { 
  DollarSign, 
  Settings, 
  TrendingUp, 
  Layers, 
  Plus, 
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { useProjectBudget, useUpdateBudget } from '@/hooks/useBudget';
import EVMPerformanceDashboard from './EVMPerformanceDashboard';
import BudgetLedger from './BudgetLedger';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

interface FinancialsTabProps {
  projectId: string;
}

export default function FinancialsTab({ projectId }: FinancialsTabProps) {
  const { data: budget, isLoading } = useProjectBudget(projectId);
  const updateBudgetMutation = useUpdateBudget(projectId);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [approvedBudget, setApprovedBudget] = useState<number>(0);
  const [contingencyReserve, setContingencyReserve] = useState<number>(0);
  const [currency, setCurrency] = useState('INR');
  const [notes, setNotes] = useState('');

  const openSettings = () => {
    if (budget) {
      setApprovedBudget(budget.approvedBudget);
      setContingencyReserve(budget.contingencyReserve);
      setCurrency(budget.currency);
      setNotes(budget.notes || '');
    }
    setIsSettingsOpen(true);
  };

  const handleSaveBudgetSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudgetMutation.mutate(
      {
        approvedBudget: Number(approvedBudget),
        contingencyReserve: Number(contingencyReserve),
        currency,
        notes,
      },
      {
        onSuccess: () => setIsSettingsOpen(false),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!budget) {
    return (
      <Card className="p-8 text-center text-xs text-slate-400">
        Budget details could not be loaded.
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner with Settings Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <DollarSign className="h-5 w-5 text-indigo-600 mr-2" />
            Project Financials & Earned Value Management (EVM)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor Approved Budget (BAC), Cost & Schedule Performance Indexes (CPI / SPI), and Cost Breakdown Structure (CBS).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={openSettings}
          className="h-9 text-xs font-semibold space-x-1.5 shadow-sm"
        >
          <Settings className="h-4 w-4" />
          <span>Configure Project Budget</span>
        </Button>
      </div>

      {/* EVM Performance Dashboard & S-Curve */}
      <EVMPerformanceDashboard budget={budget} />

      {/* CBS Budget Ledger */}
      <BudgetLedger projectId={projectId} budget={budget} />

      {/* Configure Budget Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Settings className="h-5 w-5 text-indigo-600 mr-2" />
              Configure Project Approved Budget
            </h3>

            <form onSubmit={handleSaveBudgetSettings} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Approved Project Budget (BAC)
                </label>
                <Input
                  type="number"
                  value={approvedBudget}
                  onChange={(e) => setApprovedBudget(Number(e.target.value))}
                  required
                  className="text-xs font-mono"
                  placeholder="e.g. 150000000"
                />
                <span className="text-[10px] text-slate-400">Total authorized baseline spend</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contingency Reserve
                </label>
                <Input
                  type="number"
                  value={contingencyReserve}
                  onChange={(e) => setContingencyReserve(Number(e.target.value))}
                  className="text-xs font-mono"
                  placeholder="e.g. 15000000"
                />
                <span className="text-[10px] text-slate-400">Buffer allocated for unforeseen project risks</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Currency Symbol
                </label>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="text-xs"
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Budget Notes & Approver Scope
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Approved CapEx & R&D budget sanctioned by Steering Board..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Budget Settings
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
