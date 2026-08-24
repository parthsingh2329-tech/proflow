import { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { Risk, RiskCategory, RiskStatus, ProjectMember } from '@/types';
import { useProjectRisks, useCreateRisk, useUpdateRisk, useDeleteRisk } from '@/hooks/useProjectControls';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RiskRegisterProps {
  projectId: string;
  members: ProjectMember[];
}

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  TECHNICAL: '#3b82f6',
  SUPPLY_CHAIN: '#f59e0b',
  REGULATORY: '#8b5cf6',
  FINANCIAL: '#10b981',
  SCHEDULE: '#ef4444',
  SAFETY: '#dc2626',
  OPERATIONAL: '#64748b',
};

const getRiskLevel = (score: number): { label: string; color: string; bg: string } => {
  if (score >= 15) return { label: 'CRITICAL', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500' };
  if (score >= 10) return { label: 'HIGH', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' };
  if (score >= 5) return { label: 'MEDIUM', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500' };
  return { label: 'LOW', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' };
};

const getMatrixCellColor = (prob: number, imp: number): string => {
  const score = prob * imp;
  if (score >= 15) return 'bg-rose-500 text-white';
  if (score >= 10) return 'bg-amber-500 text-white';
  if (score >= 5) return 'bg-yellow-400 text-slate-900';
  return 'bg-emerald-400 text-slate-900';
};

export default function RiskRegister({ projectId, members }: RiskRegisterProps) {
  const { data: risks = [], isLoading } = useProjectRisks(projectId);
  const createRiskMutation = useCreateRisk(projectId);
  const updateRiskMutation = useUpdateRisk(projectId);
  const deleteRiskMutation = useDeleteRisk(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{ prob: number; imp: number } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RiskCategory>('TECHNICAL');
  const [probability, setProbability] = useState(3);
  const [impact, setImpact] = useState(3);
  const [status, setStatus] = useState<RiskStatus>('OPEN');
  const [mitigation, setMitigation] = useState('');
  const [contingency, setContingency] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const openCreateDialog = () => {
    setTitle('');
    setDescription('');
    setCategory('TECHNICAL');
    setProbability(3);
    setImpact(3);
    setStatus('OPEN');
    setMitigation('');
    setContingency('');
    setOwnerId('');
    setDueDate('');
    setEditingRisk(null);
    setIsCreateOpen(true);
  };

  const openEditDialog = (risk: Risk) => {
    setEditingRisk(risk);
    setTitle(risk.title);
    setDescription(risk.description || '');
    setCategory(risk.category);
    setProbability(risk.probability);
    setImpact(risk.impact);
    setStatus(risk.status);
    setMitigation(risk.mitigation || '');
    setContingency(risk.contingency || '');
    setOwnerId(risk.ownerId || '');
    setDueDate(risk.dueDate ? (new Date(risk.dueDate).toISOString().split('T')[0] || '') : '');
    setIsCreateOpen(true);
  };

  const handleSaveRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      description,
      category,
      probability: Number(probability),
      impact: Number(impact),
      status,
      mitigation,
      contingency,
      ownerId: ownerId || undefined,
      dueDate: dueDate || undefined,
    };

    if (editingRisk) {
      updateRiskMutation.mutate({ riskId: editingRisk.id, data: payload }, {
        onSuccess: () => setIsCreateOpen(false)
      });
    } else {
      createRiskMutation.mutate(payload, {
        onSuccess: () => setIsCreateOpen(false)
      });
    }
  };

  // Filter risks
  const filteredRisks = risks.filter((r) => {
    if (filterCategory !== 'ALL' && r.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (selectedMatrixCell) {
      if (r.probability !== selectedMatrixCell.prob || r.impact !== selectedMatrixCell.imp) return false;
    }
    return true;
  });

  const criticalRisksCount = risks.filter((r) => r.score >= 15).length;
  const highRisksCount = risks.filter((r) => r.score >= 10 && r.score < 15).length;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <ShieldAlert className="h-5 w-5 text-rose-500 mr-2" />
              Project Risk Register & 5×5 Heatmap Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identify, assess, and control engineering, regulatory, supply chain, and safety risks.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="h-9 text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Log New Risk
        </Button>
      </div>

      {/* 5x5 Heatmap Matrix & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5x5 Heatmap Matrix */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Interactive 5×5 Probability vs. Impact Matrix
            </CardTitle>
            {selectedMatrixCell && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMatrixCell(null)}
                className="text-[11px] h-6 text-indigo-600 dark:text-indigo-400"
              >
                Clear Heatmap Filter (P{selectedMatrixCell.prob} × I{selectedMatrixCell.imp})
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-4">
            <div className="flex items-center">
              {/* Y-Axis Label */}
              <div className="writing-mode-vertical text-[10px] font-bold text-slate-400 uppercase tracking-widest -rotate-180 pr-2 select-none">
                Probability (Likelihood) →
              </div>

              <div className="flex-1">
                {/* 5x5 Grid Rows (Probability 5 down to 1) */}
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((prob) => (
                    <div key={prob} className="flex items-center space-x-1">
                      <span className="w-5 text-[10px] font-bold text-slate-400 text-right pr-1">P{prob}</span>
                      {[1, 2, 3, 4, 5].map((imp) => {
                        const cellRisks = risks.filter((r) => r.probability === prob && r.impact === imp);
                        const isSelected = selectedMatrixCell?.prob === prob && selectedMatrixCell?.imp === imp;

                        return (
                          <button
                            key={imp}
                            onClick={() =>
                              setSelectedMatrixCell(isSelected ? null : { prob, imp })
                            }
                            className={`flex-1 h-11 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all relative cursor-pointer border ${
                              isSelected
                                ? 'ring-4 ring-indigo-500 scale-105 z-10 border-white'
                                : 'border-black/5 hover:scale-102 hover:shadow-md'
                            } ${getMatrixCellColor(prob, imp)}`}
                            title={`Probability: ${prob}, Impact: ${imp} (Score: ${prob * imp})\n${cellRisks.length} Risk(s)`}
                          >
                            <span className="text-[10px] opacity-75">{prob * imp}</span>
                            {cellRisks.length > 0 && (
                              <span className="bg-black/30 text-white rounded-full px-1.5 py-0 text-[10px] mt-0.5">
                                {cellRisks.length}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* X-Axis Labels */}
                <div className="flex items-center space-x-1 mt-1 pl-6">
                  {[1, 2, 3, 4, 5].map((imp) => (
                    <span key={imp} className="flex-1 text-center text-[10px] font-bold text-slate-400">
                      I{imp}
                    </span>
                  ))}
                </div>
                <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Impact (Consequence) →
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Score Summary */}
        <div className="space-y-4">
          <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Critical Risks (Score ≥ 15)</p>
              <h4 className="text-2xl font-black text-rose-600 mt-1">{criticalRisksCount}</h4>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">High Priority Risks (10–14)</p>
              <h4 className="text-2xl font-black text-amber-600 mt-1">{highRisksCount}</h4>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Active Risks</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{risks.length}</h4>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </Card>
        </div>
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
            className="text-xs h-8 w-40"
          >
            <option value="ALL">All Categories</option>
            <option value="TECHNICAL">Technical</option>
            <option value="SUPPLY_CHAIN">Supply Chain</option>
            <option value="REGULATORY">Regulatory</option>
            <option value="FINANCIAL">Financial</option>
            <option value="SAFETY">Safety</option>
            <option value="SCHEDULE">Schedule</option>
            <option value="OPERATIONAL">Operational</option>
          </Select>

          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs h-8 w-32"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="MITIGATING">Mitigating</option>
            <option value="CLOSED">Closed</option>
            <option value="ACCEPTED">Accepted</option>
          </Select>
        </div>
      </div>

      {/* Risk Register Table */}
      <Card className="shadow-sm overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-3 pl-4">Code</th>
                <th className="p-3">Risk Title & Description</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-center">P × I = Score</th>
                <th className="p-3">Mitigation Strategy</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-slate-400">
                    No risks match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRisks.map((risk) => {
                  const level = getRiskLevel(risk.score);

                  return (
                    <tr
                      key={risk.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3 pl-4 font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {risk.riskCode}
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {risk.title}
                        </div>
                        {risk.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {risk.description}
                          </div>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                          style={{ backgroundColor: CATEGORY_COLORS[risk.category] || '#64748b' }}
                        >
                          {risk.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          <span className="font-mono text-[11px] text-slate-400">
                            {risk.probability} × {risk.impact} =
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-xs text-white ${level.bg}`}
                          >
                            {risk.score}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 max-w-xs text-[11px] text-slate-700 dark:text-slate-300">
                        {risk.mitigation || <span className="italic text-slate-400">No mitigation defined</span>}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {risk.owner ? (
                          <div className="flex items-center space-x-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={risk.owner.avatar} />
                              <AvatarFallback className="text-[9px]">{risk.owner.name?.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-slate-900 dark:text-slate-100">{risk.owner.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant={
                            risk.status === 'OPEN'
                              ? 'destructive'
                              : risk.status === 'MITIGATING'
                              ? 'warning'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {risk.status}
                        </Badge>
                      </td>

                      <td className="p-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(risk)}
                            className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (window.confirm('Delete this risk record?')) {
                                deleteRiskMutation.mutate(risk.id);
                              }
                            }}
                            className="h-7 w-7 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create / Edit Risk Dialog Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-50 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <ShieldAlert className="h-5 w-5 text-rose-500 mr-2" />
              {editingRisk ? `Edit Risk: ${editingRisk.riskCode}` : 'Log New Project Risk'}
            </h3>

            <form onSubmit={handleSaveRisk} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Risk Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SiC MOSFET supply chain shortage"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed consequence and technical failure mode..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RiskCategory)}
                    className="text-xs"
                  >
                    <option value="TECHNICAL">Technical</option>
                    <option value="SUPPLY_CHAIN">Supply Chain</option>
                    <option value="REGULATORY">Regulatory</option>
                    <option value="FINANCIAL">Financial</option>
                    <option value="SAFETY">Safety</option>
                    <option value="SCHEDULE">Schedule</option>
                    <option value="OPERATIONAL">Operational</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RiskStatus)}
                    className="text-xs"
                  >
                    <option value="OPEN">Open</option>
                    <option value="MITIGATING">Mitigating</option>
                    <option value="CLOSED">Closed</option>
                    <option value="ACCEPTED">Accepted</option>
                  </Select>
                </div>
              </div>

              {/* Probability & Impact Pickers */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Probability (1–5): {probability}
                  </label>
                  <Input
                    type="range"
                    min="1"
                    max="5"
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    className="h-6 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">1: Rare → 5: Almost Certain</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Impact (1–5): {impact}
                  </label>
                  <Input
                    type="range"
                    min="1"
                    max="5"
                    value={impact}
                    onChange={(e) => setImpact(Number(e.target.value))}
                    className="h-6 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">1: Minor → 5: Catastrophic</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mitigation Strategy</label>
                <Textarea
                  value={mitigation}
                  onChange={(e) => setMitigation(e.target.value)}
                  placeholder="Preventive actions to reduce likelihood or impact..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Risk Owner</label>
                  <Select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="text-xs"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Closure Date</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingRisk ? 'Update Risk' : 'Save Risk'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
