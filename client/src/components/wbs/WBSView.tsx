import React, { useState } from 'react';
import { 
  Network, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  Folder, 
  FileText,
  User,
  FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { WBSNode, WBSNodeType, ProjectMember } from '@/types';
import { useWBS, useCreateWBSNode, useUpdateWBSNode, useDeleteWBSNode } from '@/hooks/useWBS';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/components/financials/EVMPerformanceDashboard';
import toast from 'react-hot-toast';

interface WBSViewProps {
  projectId: string;
  members: ProjectMember[];
}

const NODE_TYPE_COLORS: Record<WBSNodeType, { label: string; bg: string; text: string }> = {
  PHASE: { label: 'Phase', bg: 'bg-indigo-600', text: 'text-white' },
  DELIVERABLE: { label: 'Deliverable', bg: 'bg-blue-500', text: 'text-white' },
  WORK_PACKAGE: { label: 'Work Package', bg: 'bg-emerald-500', text: 'text-white' },
  TASK: { label: 'Task', bg: 'bg-slate-500', text: 'text-white' },
};

export default function WBSView({ projectId, members }: WBSViewProps) {
  const { data: wbsTree = [], isLoading } = useWBS(projectId);
  const createNodeMutation = useCreateWBSNode(projectId);
  const updateNodeMutation = useUpdateWBSNode(projectId);
  const deleteNodeMutation = useDeleteWBSNode(projectId);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState<WBSNode | null>(null);
  const [editingNode, setEditingNode] = useState<WBSNode | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [wbsCode, setWbsCode] = useState('');
  const [nodeType, setNodeType] = useState<WBSNodeType>('WORK_PACKAGE');
  const [progress, setProgress] = useState<number>(0);
  const [plannedCost, setPlannedCost] = useState<number>(0);
  const [actualCost, setActualCost] = useState<number>(0);
  const [ownerId, setOwnerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const current = prev[nodeId] !== undefined ? prev[nodeId] : true;
      return { ...prev, [nodeId]: !current };
    });
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    const traverse = (nodes: WBSNode[]) => {
      nodes.forEach((n) => {
        all[n.id] = true;
        if (n.children && n.children.length > 0) traverse(n.children);
      });
    };
    traverse(wbsTree);
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    const traverse = (nodes: WBSNode[]) => {
      nodes.forEach((n) => {
        all[n.id] = false;
        if (n.children && n.children.length > 0) traverse(n.children);
      });
    };
    traverse(wbsTree);
    setExpandedNodes(all);
  };

  const openAddChildDialog = (parent: WBSNode) => {
    setSelectedParentNode(parent);
    setEditingNode(null);
    setName('');
    setWbsCode('');
    setNodeType(parent.nodeType === 'PHASE' ? 'DELIVERABLE' : 'WORK_PACKAGE');
    setProgress(0);
    setPlannedCost(0);
    setActualCost(0);
    setOwnerId('');
    setStartDate('');
    setDueDate('');
    setIsCreateOpen(true);
  };

  const openAddRootDialog = () => {
    setSelectedParentNode(null);
    setEditingNode(null);
    setName('');
    setWbsCode('');
    setNodeType('PHASE');
    setProgress(0);
    setPlannedCost(0);
    setActualCost(0);
    setOwnerId('');
    setStartDate('');
    setDueDate('');
    setIsCreateOpen(true);
  };

  const openEditDialog = (node: WBSNode) => {
    setEditingNode(node);
    setSelectedParentNode(null);
    setName(node.name);
    setWbsCode(node.wbsCode);
    setNodeType(node.nodeType);
    setProgress(node.progress);
    setPlannedCost(node.plannedCost);
    setActualCost(node.actualCost);
    setOwnerId(node.ownerId || '');
    setStartDate(node.startDate ? (new Date(node.startDate).toISOString().split('T')[0] || '') : '');
    setDueDate(node.dueDate ? (new Date(node.dueDate).toISOString().split('T')[0] || '') : '');
    setIsCreateOpen(true);
  };

  const getAllNodes = (nodes: WBSNode[]): WBSNode[] => {
    const res: WBSNode[] = [];
    const trav = (list: WBSNode[]) => {
      list.forEach((n) => {
        res.push(n);
        if (n.children) trav(n.children);
      });
    };
    trav(nodes);
    return res;
  };

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Node name is required');
      return;
    }

    const trimmedCode = wbsCode.trim();
    if (trimmedCode) {
      const allExisting = getAllNodes(wbsTree);
      const conflict = allExisting.find(
        (n) => n.wbsCode.toLowerCase() === trimmedCode.toLowerCase() && (!editingNode || n.id !== editingNode.id)
      );
      if (conflict) {
        toast.error(`WBS code "${trimmedCode}" is already assigned to "${conflict.name}". Please choose a unique code.`);
        return;
      }
    }

    const clampedProgress = Math.min(100, Math.max(0, Number(progress) || 0));
    const clampedPlanned = Math.max(0, Number(plannedCost) || 0);
    const clampedActual = Math.max(0, Number(actualCost) || 0);

    const payload = {
      name: name.trim(),
      wbsCode: trimmedCode || undefined,
      nodeType,
      parentNodeId: selectedParentNode?.id || (editingNode ? editingNode.parentNodeId : undefined),
      progress: clampedProgress,
      plannedCost: clampedPlanned,
      actualCost: clampedActual,
      ownerId: ownerId || undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
    };

    if (editingNode) {
      updateNodeMutation.mutate({ nodeId: editingNode.id, data: payload }, {
        onSuccess: () => {
          setIsCreateOpen(false);
          toast.success('WBS Node updated');
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to update WBS node');
        },
      });
    } else {
      createNodeMutation.mutate(payload, {
        onSuccess: () => {
          setIsCreateOpen(false);
          toast.success('WBS Node added to hierarchy');
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to create WBS node');
        },
      });
    }
  };

  // Recursive Table Row Renderer
  const renderRows = (nodes: WBSNode[], level = 0): React.ReactNode => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes[node.id] !== false; // Default expanded
      const typeStyle = NODE_TYPE_COLORS[node.nodeType];

      return (
        <React.Fragment key={node.id}>
          <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/80">
            {/* WBS Code & Indented Title */}
            <td className="p-3 pl-4">
              <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(node.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white mr-1.5 transition-transform"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ) : (
                  <span className="w-5 mr-1.5 inline-block" />
                )}

                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-2 shrink-0">
                  {node.wbsCode}
                </span>

                <div className="flex-1 truncate">
                  <span className={`font-semibold text-xs text-slate-900 dark:text-white ${level === 0 ? 'text-sm font-bold' : ''}`}>
                    {node.name}
                  </span>
                  {node.tasks && node.tasks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {node.tasks.map((t: any) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium"
                          title={`Kanban Card: ${t.title} | Status: ${t.status}`}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                t.status === 'DONE'
                                  ? '#10b981'
                                  : t.status === 'IN_PROGRESS'
                                  ? '#3b82f6'
                                  : t.status === 'IN_REVIEW'
                                  ? '#8b5cf6'
                                  : '#94a3b8',
                            }}
                          />
                          <span className="truncate max-w-[240px]">{t.title}</span>
                          <span className="font-mono text-[9px] uppercase font-bold text-slate-400">
                            [{t.status}]
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </td>

            {/* Type Badge */}
            <td className="p-3 whitespace-nowrap">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeStyle.bg} ${typeStyle.text}`}>
                {typeStyle.label}
              </span>
            </td>

            {/* Progress Bar & % */}
            <td className="p-3 w-40 whitespace-nowrap">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>{hasChildren ? 'Rollup:' : 'Status:'}</span>
                  <span>{node.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      node.progress === 100
                        ? 'bg-emerald-500'
                        : node.progress >= 50
                        ? 'bg-indigo-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${node.progress}%` }}
                  />
                </div>
              </div>
            </td>

            {/* Planned Cost */}
            <td className="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {formatCurrency(node.plannedCost, 'INR')}
            </td>

            {/* Actual Cost */}
            <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
              {formatCurrency(node.actualCost, 'INR')}
            </td>

            {/* Owner */}
            <td className="p-3 whitespace-nowrap">
              {node.owner ? (
                <div className="flex items-center space-x-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={node.owner.avatar || undefined} />
                    <AvatarFallback className="text-[9px]">{node.owner.name?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-slate-900 dark:text-slate-100">{node.owner.name}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Unassigned</span>
              )}
            </td>

            {/* Due Date */}
            <td className="p-3 text-xs text-slate-500 whitespace-nowrap font-mono">
              {node.dueDate ? format(new Date(node.dueDate), 'MMM d, yyyy') : '-'}
            </td>

            {/* Actions */}
            <td className="p-3 pr-4 text-right whitespace-nowrap">
              <div className="flex items-center justify-end space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openAddChildDialog(node)}
                  title="Add Sub-Item under this node"
                  className="h-7 w-7 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(node)}
                  className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm(`Delete WBS node ${node.wbsCode} and all its sub-elements?`)) {
                      deleteNodeMutation.mutate(node.id);
                    }
                  }}
                  className="h-7 w-7 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </td>
          </tr>

          {hasChildren && isExpanded && renderRows(node.children!, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <Network className="h-5 w-5 text-indigo-600 mr-2" />
            Work Breakdown Structure (WBS) Tree
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hierarchical decomposition: Phase → Deliverable → Work Package → Task with automated progress and cost rollups.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="h-8 text-xs">
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="h-8 text-xs">
            Collapse All
          </Button>
          <Button onClick={openAddRootDialog} className="h-8 text-xs font-semibold shadow-sm">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Project Phase
          </Button>
        </div>
      </div>

      {/* WBS Tree Table */}
      <Card className="shadow-sm overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-3 pl-4">WBS Code & Hierarchy Structure</th>
                <th className="p-3">Level Type</th>
                <th className="p-3">Progress % (Rollup)</th>
                <th className="p-3 text-right">Planned Budget</th>
                <th className="p-3 text-right">Actual Cost</th>
                <th className="p-3">Work Package Lead</th>
                <th className="p-3">Target Date</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {wbsTree.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-slate-400">
                    No WBS nodes defined. Click "Add Project Phase" to construct your project work breakdown structure.
                  </td>
                </tr>
              ) : (
                renderRows(wbsTree)
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Edit WBS Node Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-50 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Network className="h-5 w-5 text-indigo-600 mr-2" />
              {editingNode
                ? `Edit WBS Node: ${editingNode.wbsCode}`
                : selectedParentNode
                ? `Add Child Item under: ${selectedParentNode.wbsCode} ${selectedParentNode.name}`
                : 'Add New Project Phase (Level 1.0)'}
            </h3>

            <form onSubmit={handleSaveNode} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Node Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 800V SiC Power Stage Thermal Dyno Testing"
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">WBS Code (Auto or Custom)</label>
                  <Input
                    value={wbsCode}
                    onChange={(e) => setWbsCode(e.target.value)}
                    placeholder="e.g. 1.1.2"
                    className="text-xs font-mono"
                  />
                  {wbsCode.trim() && getAllNodes(wbsTree).find(n => n.wbsCode.toLowerCase() === wbsCode.trim().toLowerCase() && (!editingNode || n.id !== editingNode.id)) && (
                    <span className="text-[10px] text-rose-500 font-semibold block">
                      ⚠️ Code already assigned to "{getAllNodes(wbsTree).find(n => n.wbsCode.toLowerCase() === wbsCode.trim().toLowerCase())?.name}"
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Node Level</label>
                  <Select
                    value={nodeType}
                    onChange={(e) => setNodeType(e.target.value as WBSNodeType)}
                    className="text-xs"
                  >
                    <option value="PHASE">Phase (Level 1)</option>
                    <option value="DELIVERABLE">Deliverable (Level 2)</option>
                    <option value="WORK_PACKAGE">Work Package (Level 3)</option>
                    <option value="TASK">Task (Level 4)</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Progress (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                  {(progress < 0 || progress > 100) && (
                    <span className="text-[10px] text-rose-500 font-semibold block">
                      Must be 0-100%
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Planned Cost (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    value={plannedCost}
                    onChange={(e) => setPlannedCost(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                  {plannedCost < 0 && (
                    <span className="text-[10px] text-rose-500 font-semibold block">
                      Cannot be negative
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Actual Cost (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    value={actualCost}
                    onChange={(e) => setActualCost(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                  {actualCost < 0 && (
                    <span className="text-[10px] text-rose-500 font-semibold block">
                      Cannot be negative
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lead Owner</label>
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
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
                  {editingNode ? 'Update WBS Node' : 'Add to Hierarchy'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
