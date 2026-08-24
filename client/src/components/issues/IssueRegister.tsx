import { useState } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  User, 
  CheckCircle2, 
  Flame,
  ArrowUpRight,
  HelpCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { Issue, IssueSeverity, IssueStatus, ProjectMember } from '@/types';
import { useProjectIssues, useCreateIssue, useUpdateIssue, useDeleteIssue } from '@/hooks/useProjectControls';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface IssueRegisterProps {
  projectId: string;
  members: ProjectMember[];
}

const SEVERITY_STYLES: Record<IssueSeverity, { label: string; bg: string; text: string }> = {
  CRITICAL: { label: 'CRITICAL', bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  HIGH: { label: 'HIGH', bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  MEDIUM: { label: 'MEDIUM', bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
  LOW: { label: 'LOW', bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
};

export default function IssueRegister({ projectId, members }: IssueRegisterProps) {
  const { data: issues = [], isLoading } = useProjectIssues(projectId);
  const createIssueMutation = useCreateIssue(projectId);
  const updateIssueMutation = useUpdateIssue(projectId);
  const deleteIssueMutation = useDeleteIssue(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('HIGH');
  const [status, setStatus] = useState<IssueStatus>('OPEN');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [escalatedTo, setEscalatedTo] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const openCreateDialog = () => {
    setTitle('');
    setDescription('');
    setSeverity('HIGH');
    setStatus('OPEN');
    setRootCause('');
    setCorrectiveAction('');
    setEscalatedTo('');
    setOwnerId('');
    setDueDate('');
    setEditingIssue(null);
    setIsCreateOpen(true);
  };

  const openEditDialog = (issue: Issue) => {
    setEditingIssue(issue);
    setTitle(issue.title);
    setDescription(issue.description || '');
    setSeverity(issue.severity);
    setStatus(issue.status);
    setRootCause(issue.rootCause || '');
    setCorrectiveAction(issue.correctiveAction || '');
    setEscalatedTo(issue.escalatedTo || '');
    setOwnerId(issue.ownerId || '');
    setDueDate(issue.dueDate ? (new Date(issue.dueDate).toISOString().split('T')[0] || '') : '');
    setIsCreateOpen(true);
  };

  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      description,
      severity,
      status,
      rootCause,
      correctiveAction,
      escalatedTo,
      ownerId: ownerId || undefined,
      dueDate: dueDate || undefined,
    };

    if (editingIssue) {
      updateIssueMutation.mutate({ issueId: editingIssue.id, data: payload }, {
        onSuccess: () => setIsCreateOpen(false)
      });
    } else {
      createIssueMutation.mutate(payload, {
        onSuccess: () => setIsCreateOpen(false)
      });
    }
  };

  const filteredIssues = issues.filter((i) => {
    if (filterSeverity !== 'ALL' && i.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && i.status !== filterStatus) return false;
    return true;
  });

  const criticalIssuesCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const openIssuesCount = issues.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <AlertCircle className="h-5 w-5 text-rose-500 mr-2" />
            Project Issue Register & CAPA Log
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log live engineering blockers, root-cause analyses, and Corrective/Preventive Actions (CAPA).
          </p>
        </div>

        <Button onClick={openCreateDialog} className="h-9 text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Log New Issue
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Critical Severity Blockers</p>
            <h4 className="text-2xl font-black text-rose-600 mt-1">{criticalIssuesCount}</h4>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
            <Flame className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Open / Investigating</p>
            <h4 className="text-2xl font-black text-amber-600 mt-1">{openIssuesCount}</h4>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Logged Issues</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{issues.length}</h4>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <AlertCircle className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Filter className="h-4 w-4 text-indigo-500" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs h-8 w-36"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>

          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs h-8 w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
          </Select>
        </div>
      </div>

      {/* Issue Register Table */}
      <Card className="shadow-sm overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-3 pl-4">Code</th>
                <th className="p-3">Issue Title & Description</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Root Cause Analysis</th>
                <th className="p-3">CAPA Action Plan</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-slate-400">
                    No issues logged in this project.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => {
                  const sevStyle = SEVERITY_STYLES[issue.severity];

                  return (
                    <tr
                      key={issue.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3 pl-4 font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {issue.issueCode}
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {issue.title}
                        </div>
                        {issue.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {issue.description}
                          </div>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${sevStyle.bg}`}>
                          {issue.severity}
                        </span>
                      </td>

                      <td className="p-3 max-w-xs text-[11px] text-slate-700 dark:text-slate-300">
                        {issue.rootCause || <span className="italic text-slate-400">Under investigation</span>}
                      </td>

                      <td className="p-3 max-w-xs text-[11px] text-slate-700 dark:text-slate-300">
                        {issue.correctiveAction || <span className="italic text-slate-400">Pending CAPA plan</span>}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {issue.owner ? (
                          <div className="flex items-center space-x-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={issue.owner.avatar} />
                              <AvatarFallback className="text-[9px]">{issue.owner.name?.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-slate-900 dark:text-slate-100">{issue.owner.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant={
                            issue.status === 'ESCALATED'
                              ? 'destructive'
                              : issue.status === 'INVESTIGATING'
                              ? 'warning'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {issue.status}
                        </Badge>
                      </td>

                      <td className="p-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(issue)}
                            className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (window.confirm('Delete this issue record?')) {
                                deleteIssueMutation.mutate(issue.id);
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

      {/* Create / Edit Issue Dialog Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-50 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <AlertCircle className="h-5 w-5 text-rose-500 mr-2" />
              {editingIssue ? `Edit Issue: ${editingIssue.issueCode}` : 'Log New Project Issue'}
            </h3>

            <form onSubmit={handleSaveIssue} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Issue Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Battery pack enclosure deflection in crush test"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed failure observation and physical metrics..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Severity</label>
                  <Select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                    className="text-xs"
                  >
                    <option value="CRITICAL">🔴 Critical</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">🟢 Low</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IssueStatus)}
                    className="text-xs"
                  >
                    <option value="OPEN">Open</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="ESCALATED">Escalated</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Root Cause Analysis</label>
                <Textarea
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Underlying technical root cause (5 Whys / Ishikawa)..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Corrective Action Plan (CAPA)</label>
                <Textarea
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Engineering ECO, rework, or tooling modification..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Owner</label>
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Resolution Date</label>
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
                  {editingIssue ? 'Update Issue' : 'Save Issue'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
