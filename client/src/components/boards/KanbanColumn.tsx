import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Column, Task } from '@/types';
import KanbanCard from './KanbanCard';
import QuickAddTask from './QuickAddTask';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  projectId: string;
  onTaskClick: (task: Task) => void;
}

export default function KanbanColumn({ column, tasks, projectId, onTaskClick }: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-slate-100/70 dark:bg-slate-900/50 p-3 border border-slate-200/60 dark:border-slate-800/60">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center space-x-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: column.color || '#94a3b8' }}
          />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {column.name}
          </h3>
          <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAddingTask(true)}
          className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Task List (Droppable) */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2.5 overflow-y-auto min-h-[150px] p-0.5"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {isAddingTask && (
          <div className="rounded-lg border border-indigo-200 bg-white p-2 shadow-sm dark:border-indigo-900 dark:bg-slate-900">
            <QuickAddTask
              projectId={projectId}
              columnId={column.id}
              onClose={() => setIsAddingTask(false)}
            />
          </div>
        )}
      </div>

      {/* Column Footer */}
      {!isAddingTask && (
        <button
          onClick={() => setIsAddingTask(true)}
          className="mt-2 flex w-full items-center justify-center space-x-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Task</span>
        </button>
      )}
    </div>
  );
}
