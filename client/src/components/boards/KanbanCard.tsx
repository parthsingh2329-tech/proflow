import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckSquare, MessageSquare, Diamond, Link2, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Task } from '@/types';

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const PRIORITY_STYLES: Record<string, { label: string; variant: 'destructive' | 'warning' | 'default' | 'secondary' }> = {
  CRITICAL: { label: 'Critical', variant: 'destructive' },
  HIGH: { label: 'High', variant: 'destructive' },
  MEDIUM: { label: 'Medium', variant: 'warning' },
  LOW: { label: 'Low', variant: 'default' },
  NONE: { label: 'None', variant: 'secondary' },
};

export default function KanbanCard({ task, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityInfo = (PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM)!;
  const isMilestone = task.isMilestone || !!task.milestoneId;
  const depCount = (task.dependenciesAsSuccessor?.length ?? 0) + (task.dependenciesAsPredecessor?.length ?? 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={`group relative rounded-lg border bg-white p-3.5 shadow-sm transition-all hover:border-indigo-300 hover:shadow dark:bg-slate-900 cursor-grab active:cursor-grabbing ${
        isMilestone
          ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10'
          : 'border-slate-200 dark:border-slate-800'
      } ${isDragging ? 'opacity-40 ring-2 ring-indigo-500 shadow-lg' : ''}`}
    >
      {/* Priority, Milestones & Labels */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {isMilestone && (
          <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <Diamond className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" /> Milestone
          </span>
        )}

        {task.wbsNode?.wbsCode && (
          <span className="inline-flex items-center rounded bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" title={`WBS Deliverable: ${task.wbsNode.wbsCode} ${task.wbsNode.name}`}>
            WBS: {task.wbsNode.wbsCode}
          </span>
        )}

        <Badge variant={priorityInfo.variant} className="text-[10px] px-1.5 py-0">
          {priorityInfo.label}
        </Badge>

        {depCount > 0 && (
          <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300" title={`${depCount} CPM Dependencies`}>
            <Link2 className="h-3 w-3 mr-1 text-indigo-500" /> {depCount}
          </span>
        )}

        {task.labels?.map((l: any) => (
          <span
            key={l.id || l.labelId}
            className="rounded px-1.5 py-0 text-[10px] font-medium text-white"
            style={{ backgroundColor: l.color || l.label?.color || '#6366f1' }}
          >
            {l.name || l.label?.name}
          </span>
        ))}
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-snug">
        {task.title}
      </h4>

      {/* Footer Info */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5 text-[11px] text-slate-400">
        <div className="flex items-center space-x-2.5">
          {task.dueDate && (
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-slate-400" />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}

          {task.subtaskCount ? (
            <span className="flex items-center">
              <CheckSquare className="h-3 w-3 mr-1 text-slate-400" />
              {task.completedSubtaskCount || 0}/{task.subtaskCount}
            </span>
          ) : null}

          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center">
              <MessageSquare className="h-3 w-3 mr-1 text-slate-400" />
              {task.comments.length}
            </span>
          )}
        </div>

        {task.assignee && (
          <Avatar className="h-5 w-5 border border-white dark:border-slate-800">
            <AvatarImage src={task.assignee.avatar} />
            <AvatarFallback className="text-[9px]">
              {task.assignee.name?.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
