import React, { useState } from 'react';
import { 
  GitPullRequest, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  FileText,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ChangeRequest, ECOStatus, ProjectMember } from '@/types';
import { 
  useChangeRequests, 
  useCreateChangeRequest, 
  useReviewChangeRequest, 
  useDeleteChangeRequest 
} from '@/hooks/useChangeManagement';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/components/financials/EVMPerformanceDashboard';

interface ChangeManagementViewProps {
  projectId: string;
  members: ProjectMember[];
}

const ECO_STATUS_CONFIG: Record<ECOStatus, { label: string; variant: 'default' | 'outline' | 'warning' | 'destructive' }> = {
  SUBMITTED: { label: 'Submitted (Pending CCB)', variant: 'outline' },
  IN_REVIEW: { label: 'In CCB Review', variant: 'warning' },
  APPROVED: { label: 'CCB Approved', variant: 'default' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  IMPLEMENTED: { label: 'Implemented & Closed', variant: 'default' },
};

export default function ChangeManagementView({ projectId, members }: ChangeManagementViewProps) {
  const { data: changes = [], isLoading } = useChangeRequests(projectId);
  const createChangeMutation = useCreateChangeRequest(projectId);
  const reviewChangeMutation = useReviewChangeRequest(projectId);
  const deleteChangeMutation = useDeleteChangeRequest(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [ecoCode, setEcoCode] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [costImpact, setCostImpact] = useState<number>(0);
  const [scheduleImpactDays, setScheduleImpactDays] = useState<number>(0);
  const [riskImpact, setRiskImpact] = useState('');

  const openCreateDialog = () => {
    setTitle('');
    setEcoCode(`ECO-${String(101 + changes.length).padStart(4, '0')}`);
    setDescription('');
    setReason('');
    setCostImpact(0);
    setScheduleImpactDays(0);
    setRiskImpact('');
    setIsCreateOpen(true);
  };

  const handleCreateECO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    const trimmedEco = (ecoCode || '').trim().toUpperCase();
    if (trimmedEco) {
      const conflict = changes.find((c) => c.ecoCode.toUpperCase() === trimmedEco);
      if (conflict) {
        toast.error(`Change Order number "${trimmedEco}" is already assigned to "${conflict.title}". Please specify a unique ECO identifier.`);
        return;
      }
    }

    createChangeMutation.mutate(
      {
        title: title.trim(),
        ecoCode: trimmedEco || undefined,
        description: description.trim(),
        reason: reason.trim(),
        costImpact: Number(costImpact) || 0,
        scheduleImpactDays: Number(scheduleImpactDays) || 0,
        riskImpact: riskImpact || undefined,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          toast.success('Change order submitted to CCB');
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to submit change order');
        },
      }
    );
  };

  const handleReview = (ecoId: string, status: ECOStatus) => {
    reviewChangeMutation.mutate({ ecoId, status });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <GitPullRequest className="h-5 w-5 text-indigo-600 mr-2" />
            Engineering Change Orders (ECO) & Change Control Board (CCB)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluate triple-constraint impact (Δ Cost, Δ Schedule, Δ Technical Risk) and approve engineering changes.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="h-9 text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Submit Change Order (ECO)
        </Button>
      </div>

      {/* ECO Cards List */}
      <div className="space-y-4">
        {changes.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400">
            No Engineering Change Orders submitted for this project.
          </Card>
        ) : (
          changes.map((eco) => {
            const statusConfig = ECO_STATUS_CONFIG[eco.status] || { label: eco.status, variant: 'outline' };
            const isApproved = eco.status === 'APPROVED' || eco.status === 'IMPLEMENTED';
            const isRejected = eco.status === 'REJECTED';

            return (
              <Card
                key={eco.id}
                className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {eco.ecoCode}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {eco.title}
                        </h4>
                        <Badge variant={statusConfig.variant} className="text-[10px]">
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {eco.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {eco.status === 'SUBMITTED' || eco.status === 'IN_REVIEW' ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleReview(eco.id, 'APPROVED')}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white space-x-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve ECO</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(eco.id, 'REJECTED')}
                            className="h-8 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900 space-x-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </>
                      ) : eco.status === 'APPROVED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(eco.id, 'IMPLEMENTED')}
                          className="h-8 text-xs border-emerald-300 text-emerald-600"
                        >
                          Mark as Implemented
                        </Button>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm(`Delete ${eco.ecoCode}?`)) {
                            deleteChangeMutation.mutate(eco.id);
                          }
                        }}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Impact Analysis Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Cost Impact (Δ ₹)</span>
                      <div className={`font-mono text-xs font-bold ${eco.costImpact > 0 ? 'text-rose-600 dark:text-rose-400' : eco.costImpact < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700'}`}>
                        {eco.costImpact > 0 ? '+' : ''}{formatCurrency(eco.costImpact, 'INR')}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Schedule Impact (Δ Days)</span>
                      <div className={`font-mono text-xs font-bold ${eco.scheduleImpactDays > 0 ? 'text-amber-600 dark:text-amber-400' : eco.scheduleImpactDays < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700'}`}>
                        {eco.scheduleImpactDays > 0 ? '+' : ''}{eco.scheduleImpactDays} Days {eco.scheduleImpactDays > 0 ? '(Slippage)' : eco.scheduleImpactDays < 0 ? '(Accelerated)' : ''}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Technical Risk Impact</span>
                      <div className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {eco.riskImpact || 'Nominal risk profile'}
                      </div>
                    </div>
                  </div>

                  {/* Footer Audit Trail */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center space-x-2">
                      <span>Requested by: <span className="font-semibold text-slate-700 dark:text-slate-300">{eco.requestedBy?.name || 'Engineer'}</span></span>
                      <span>•</span>
                      <span>{format(new Date(eco.createdAt), 'MMM d, yyyy')}</span>
                    </div>

                    {eco.approvedBy && (
                      <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>CCB Authorized by {eco.approvedBy.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Submit ECO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-50 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <GitPullRequest className="h-5 w-5 text-indigo-600 mr-2" />
              Submit Engineering Change Order (ECO)
            </h3>

            <form onSubmit={handleCreateECO} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ECO Code (Optional)</label>
                  <Input
                    value={ecoCode}
                    onChange={(e) => setEcoCode(e.target.value)}
                    placeholder="e.g. ECO-0107"
                    className="text-xs font-mono"
                  />
                  {ecoCode.trim() && changes.find((c) => c.ecoCode.toUpperCase() === ecoCode.trim().toUpperCase()) && (
                    <span className="text-[10px] text-rose-500 font-semibold block">
                      ⚠️ Code already assigned to "{changes.find((c) => c.ecoCode.toUpperCase() === ecoCode.trim().toUpperCase())?.title}"
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Change Title *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Upgrade Inverter to 800V SiC"
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description of Change *</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed engineering scope of what is changing in CAD, hardware or firmware..."
                  rows={3}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason for Change</label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Benchmarking, thermal safety, regulatory compliance"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cost Impact (₹)</label>
                  <Input
                    type="number"
                    value={costImpact}
                    onChange={(e) => setCostImpact(Number(e.target.value))}
                    placeholder="e.g. +3500000 or -1000000"
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Schedule Impact (Days)</label>
                  <Input
                    type="number"
                    value={scheduleImpactDays}
                    onChange={(e) => setScheduleImpactDays(Number(e.target.value))}
                    placeholder="e.g. +14 or -5"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Technical Risk Impact</label>
                <Input
                  value={riskImpact}
                  onChange={(e) => setRiskImpact(e.target.value)}
                  placeholder="e.g. Potential supply chain lead time risk"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Submit to CCB
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
