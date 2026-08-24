import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { PhaseGate, GateStatus, GateCriteria, ProjectMember } from '@/types';
import { 
  usePhaseGates, 
  useCreatePhaseGate, 
  useToggleCriteria, 
  useSignOffGate, 
  useDeletePhaseGate 
} from '@/hooks/useGovernance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StageGateViewProps {
  projectId: string;
  members: ProjectMember[];
}

const GATE_STATUS_CONFIG: Record<GateStatus, { label: string; color: string; bg: string; icon: any }> = {
  APPROVED: { label: 'Approved (Gate Passed)', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
  IN_REVIEW: { label: 'Active Gate Review', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800', icon: Clock },
  UPCOMING: { label: 'Upcoming Target', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800', icon: Calendar },
  CONDITIONAL_PASS: { label: 'Conditional Pass', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/60 border-yellow-300 dark:border-yellow-800', icon: AlertCircle },
  REJECTED: { label: 'Gate Rejected', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800', icon: AlertCircle },
};

export default function StageGateView({ projectId, members }: StageGateViewProps) {
  const { data: gates = [], isLoading } = usePhaseGates(projectId);
  const createGateMutation = useCreatePhaseGate(projectId);
  const toggleCriteriaMutation = useToggleCriteria(projectId);
  const signOffGateMutation = useSignOffGate(projectId);
  const deleteGateMutation = useDeletePhaseGate(projectId);

  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [signingOffGate, setSigningOffGate] = useState<PhaseGate | null>(null);
  const [signOffStatus, setSignOffStatus] = useState<GateStatus>('APPROVED');
  const [reviewSummary, setReviewSummary] = useState('');

  // Create gate form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [gateCode, setGateCode] = useState('G0');
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [criteriaInput, setCriteriaInput] = useState('');

  // Default active gate to the first IN_REVIEW gate or first gate
  const activeGate = gates.find((g) => g.id === selectedGateId) || gates.find((g) => g.status === 'IN_REVIEW') || gates[0];

  const handleToggleCriteria = (criteria: GateCriteria) => {
    toggleCriteriaMutation.mutate({
      criteriaId: criteria.id,
      isMet: !criteria.isMet,
    });
  };

  const openSignOffModal = (gate: PhaseGate) => {
    setSigningOffGate(gate);
    setSignOffStatus(gate.status === 'APPROVED' ? 'APPROVED' : 'APPROVED');
    setReviewSummary(gate.reviewSummary || '');
    setIsSignOffModalOpen(true);
  };

  const handleSaveSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingOffGate) return;

    signOffGateMutation.mutate(
      {
        gateId: signingOffGate.id,
        status: signOffStatus,
        reviewSummary,
      },
      {
        onSuccess: () => setIsSignOffModalOpen(false),
      }
    );
  };

  const handleCreateGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetDate) return;

    const criteriaList = criteriaInput
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
      .map((description) => ({ description, isMandatory: true, isMet: false }));

    createGateMutation.mutate(
      {
        gateCode,
        name,
        targetDate: new Date(targetDate).toISOString(),
        criteria: criteriaList as any,
      },
      {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          setName('');
          setTargetDate('');
          setCriteriaInput('');
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <ShieldCheck className="h-5 w-5 text-indigo-600 mr-2" />
            Stage-Gate Governance & Quality Gatekeeper (APQP)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Formal phase reviews: Concept Feasibility → Design Freeze → Tooling Release → Homologation → SOP.
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="h-9 text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Define Stage Gate
        </Button>
      </div>

      {/* Visual APQP Gate Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {gates.map((gate, index) => {
          const config = GATE_STATUS_CONFIG[gate.status] || GATE_STATUS_CONFIG.UPCOMING;
          const Icon = config.icon;
          const isSelected = activeGate?.id === gate.id;
          const passedCriteria = gate.criteria.filter((c) => c.isMet).length;
          const totalCriteria = gate.criteria.length;

          return (
            <div
              key={gate.id}
              onClick={() => setSelectedGateId(gate.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-indigo-600 shadow-md bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {gate.gateCode}
                </span>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>

              <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-2 line-clamp-2 leading-snug">
                {gate.name}
              </h5>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>{format(new Date(gate.targetDate), 'MMM yyyy')}</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {passedCriteria}/{totalCriteria} Passed
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Gate Detail Card & Entry/Exit Checklist */}
      {activeGate && (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-indigo-600 text-white">
                  {activeGate.gateCode}
                </span>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  {activeGate.name}
                </CardTitle>
                <Badge
                  variant={activeGate.status === 'APPROVED' ? 'default' : activeGate.status === 'IN_REVIEW' ? 'warning' : 'outline'}
                  className="text-[10px]"
                >
                  {GATE_STATUS_CONFIG[activeGate.status]?.label || activeGate.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Target Review Date: {format(new Date(activeGate.targetDate), 'MMMM d, yyyy')}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSignOffModal(activeGate)}
                className="h-8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
              >
                <UserCheck className="h-4 w-4 mr-1.5" /> Formal Executive Sign-Off
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm(`Delete Stage Gate ${activeGate.gateCode}?`)) {
                    deleteGateMutation.mutate(activeGate.id);
                  }
                }}
                className="h-8 w-8 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-6">
            {/* Formal Sign-Off Audit Banner if signed off */}
            {activeGate.signOffDate && activeGate.signOffBy && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-full bg-emerald-600 text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Formal Gate Sign-Off Executed
                    </h5>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Approved by <span className="font-semibold">{activeGate.signOffBy.name}</span> on{' '}
                      {format(new Date(activeGate.signOffDate), 'MMMM d, yyyy')}
                    </p>
                    {activeGate.reviewSummary && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-1.5 bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-emerald-100 dark:border-emerald-900">
                        "{activeGate.reviewSummary}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Entry / Exit Criteria Checklist */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Gate Entry & Exit Compliance Checklist ({activeGate.criteria.filter((c) => c.isMet).length}/{activeGate.criteria.length} Met)
              </h5>

              <div className="space-y-2">
                {activeGate.criteria.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No checklist criteria defined for this gate.</p>
                ) : (
                  activeGate.criteria.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleCriteria(item)}
                      className={`p-3 rounded-lg border flex items-start justify-between cursor-pointer transition-all ${
                        item.isMet
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={item.isMet}
                          onChange={() => {}} // Handled by parent div
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <p className={`text-xs font-semibold ${item.isMet ? 'text-slate-900 dark:text-white line-through opacity-80' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.description}
                          </p>
                          {item.evidenceNotes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                              Evidence: {item.evidenceNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.isMet ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {item.isMet ? 'PASSED' : 'PENDING'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formal Sign-Off Modal */}
      {isSignOffModalOpen && signingOffGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSignOffModalOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Award className="h-5 w-5 text-indigo-600 mr-2" />
              Executive Stage-Gate Sign-Off: {signingOffGate.gateCode}
            </h3>

            <form onSubmit={handleSaveSignOff} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gate Decision *</label>
                <Select
                  value={signOffStatus}
                  onChange={(e) => setSignOffStatus(e.target.value as GateStatus)}
                  className="text-xs"
                >
                  <option value="APPROVED">Approved (Gate Pass Authorized)</option>
                  <option value="CONDITIONAL_PASS">Conditional Pass (Requires Specific Action Items)</option>
                  <option value="REJECTED">Rejected (Remediation Required Before Proceeding)</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Steering Board Review Summary & Conditions
                </label>
                <Textarea
                  value={reviewSummary}
                  onChange={(e) => setReviewSummary(e.target.value)}
                  placeholder="e.g. Steering Committee approved 800V SiC prototype release with condition that thermal sensor bench is calibrated by next milestone..."
                  rows={4}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsSignOffModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Record Formal Sign-Off
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Stage Gate Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <ShieldCheck className="h-5 w-5 text-indigo-600 mr-2" />
              Define New Stage Gate
            </h3>

            <form onSubmit={handleCreateGate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gate Code *</label>
                  <Input
                    value={gateCode}
                    onChange={(e) => setGateCode(e.target.value)}
                    placeholder="e.g. G2"
                    required
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Date *</label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gate Title *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tooling Release & Prototype Rig Assembly"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Checklist Criteria (One per line)
                </label>
                <Textarea
                  value={criteriaInput}
                  onChange={(e) => setCriteriaInput(e.target.value)}
                  placeholder="Target range ≥ 550 km WLTP simulation validated&#10;Inverter thermal CFD simulation converged&#10;ISO 26262 audit passed"
                  rows={4}
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create Stage Gate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
