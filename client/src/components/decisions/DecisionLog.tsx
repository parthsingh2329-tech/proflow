import { useState } from 'react';
import { 
  FileCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  User, 
  FileText,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { Decision, DecisionStatus, ProjectMember } from '@/types';
import { useProjectDecisions, useCreateDecision, useUpdateDecision, useDeleteDecision } from '@/hooks/useProjectControls';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DecisionLogProps {
  projectId: string;
  members: ProjectMember[];
}

export default function DecisionLog({ projectId, members }: DecisionLogProps) {
  const { data: decisions = [], isLoading } = useProjectDecisions(projectId);
  const createDecisionMutation = useCreateDecision(projectId);
  const updateDecisionMutation = useUpdateDecision(projectId);
  const deleteDecisionMutation = useDeleteDecision(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [rationale, setRationale] = useState('');
  const [financialImpact, setFinancialImpact] = useState('');
  const [scheduleImpact, setScheduleImpact] = useState('');
  const [status, setStatus] = useState<DecisionStatus>('APPROVED');
  const [decisionDate, setDecisionDate] = useState(new Date().toISOString().split('T')[0]);
  const [approvedById, setApprovedById] = useState('');

  const openCreateDialog = () => {
    setTitle('');
    setSummary('');
    setRationale('');
    setFinancialImpact('');
    setScheduleImpact('');
    setStatus('APPROVED');
    setDecisionDate(new Date().toISOString().split('T')[0]);
    setApprovedById('');
    setEditingDecision(null);
    setIsCreateOpen(true);
  };

  const openEditDialog = (decision: Decision) => {
    setEditingDecision(decision);
    setTitle(decision.title);
    setSummary(decision.summary);
    setRationale(decision.rationale || '');
    setFinancialImpact(decision.financialImpact || '');
    setScheduleImpact(decision.scheduleImpact || '');
    setStatus(decision.status);
    setDecisionDate(decision.decisionDate ? (new Date(decision.decisionDate).toISOString().split('T')[0] || '') : '');
    setApprovedById(decision.approvedById || '');
    setIsCreateOpen(true);
  };

  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const payload = {
      title,
      summary,
      rationale,
      financialImpact,
      scheduleImpact,
      status,
      decisionDate: new Date(decisionDate || Date.now()).toISOString(),
      approvedById: approvedById || undefined,
    };

    if (editingDecision) {
      updateDecisionMutation.mutate({ decisionId: editingDecision.id, data: payload }, {
        onSuccess: () => setIsCreateOpen(false)
      });
    } else {
      createDecisionMutation.mutate(payload, {
        onSuccess: () => setIsCreateOpen(false)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <FileCheck className="h-5 w-5 text-indigo-600 mr-2" />
            Project Decision Log & Architecture Governance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Auditable institutional memory recording technical trade-offs, financial impacts, and steering committee approvals.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="h-9 text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Record New Decision
        </Button>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-4">
        {decisions.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            No decisions recorded in this project yet. Use the "Record New Decision" button to document your first architectural or procurement choice.
          </Card>
        ) : (
          decisions.map((dec) => (
            <Card
              key={dec.id}
              className="p-5 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 transition-all space-y-4"
            >
              {/* Top Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    {dec.decisionCode}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {dec.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <Badge
                    variant={
                      dec.status === 'APPROVED'
                        ? 'default'
                        : dec.status === 'PROPOSED'
                        ? 'warning'
                        : 'destructive'
                    }
                    className="text-[10px]"
                  >
                    {dec.status}
                  </Badge>

                  <span className="flex items-center text-slate-400 text-xs">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {format(new Date(dec.decisionDate), 'MMM d, yyyy')}
                  </span>

                  <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(dec)}
                      className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('Delete this decision log entry?')) {
                          deleteDecisionMutation.mutate(dec.id);
                        }
                      }}
                      className="h-7 w-7 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Summary & Rationale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                    Executive Summary:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    {dec.summary}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                    Rationale & Alternatives Considered:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    {dec.rationale || <span className="italic text-slate-400">No rationale documented</span>}
                  </p>
                </div>
              </div>

              {/* Impact Delta Chips & Approver */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {dec.financialImpact && (
                    <span className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <DollarSign className="h-3.5 w-3.5 mr-1" />
                      Financial Impact: {dec.financialImpact}
                    </span>
                  )}

                  {dec.scheduleImpact && (
                    <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Schedule Impact: {dec.scheduleImpact}
                    </span>
                  )}
                </div>

                {dec.approvedBy && (
                  <div className="flex items-center space-x-2 text-slate-500">
                    <span className="text-[11px]">Authorized by:</span>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={dec.approvedBy.avatar} />
                      <AvatarFallback className="text-[9px]">{dec.approvedBy.name?.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{dec.approvedBy.name}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create / Edit Decision Dialog Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-50 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <FileCheck className="h-5 w-5 text-indigo-600 mr-2" />
              {editingDecision ? `Edit Decision: ${editingDecision.decisionCode}` : 'Record Project Decision'}
            </h3>

            <form onSubmit={handleSaveDecision} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Decision Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Selected 800V SiC Power Module Architecture"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Decision Summary *</label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="What was decided by the committee or project manager?"
                  rows={2}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rationale & Trade-Offs Considered</label>
                <Textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Why was this option chosen over other alternatives?"
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Financial Impact</label>
                  <Input
                    value={financialImpact}
                    onChange={(e) => setFinancialImpact(e.target.value)}
                    placeholder="e.g. +₹35 Lakhs or -$20k savings"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Schedule Impact</label>
                  <Input
                    value={scheduleImpact}
                    onChange={(e) => setScheduleImpact(e.target.value)}
                    placeholder="e.g. -3 Weeks or +10 Days"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DecisionStatus)}
                    className="text-xs"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="PROPOSED">Proposed</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="SUPERSEDED">Superseded</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Decision Date</label>
                  <Input
                    type="date"
                    value={decisionDate}
                    onChange={(e) => setDecisionDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Approver</label>
                  <Select
                    value={approvedById}
                    onChange={(e) => setApprovedById(e.target.value)}
                    className="text-xs"
                  >
                    <option value="">Current User</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingDecision ? 'Update Decision' : 'Save Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
