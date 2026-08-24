import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Column, Task } from '@/types';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { useMoveTask } from '@/hooks/useTasks';
import { useCreateColumn } from '@/hooks/useBoard';
import { Button } from '@/components/ui/button';

interface KanbanBoardProps {
  projectId: string;
  boardId: string;
  columns: Column[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function KanbanBoard({ projectId, boardId, columns = [], tasks = [], onTaskClick }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  const moveTask = useMoveTask();
  const createColumn = useCreateColumn();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);

    // Find the target column
    let targetColumnId = '';
    const isOverColumn = columns.some((col) => col.id === overId);

    if (isOverColumn) {
      targetColumnId = overId;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetColumnId = overTask.columnId;
      }
    }

    if (!targetColumnId) return;

    // Trigger task move
    moveTask.mutate({
      id: activeTaskId,
      columnId: targetColumnId,
      order: 0,
      projectId,
    });
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    createColumn.mutate(
      {
        boardId,
        name: newColumnName.trim(),
      },
      {
        onSuccess: () => {
          setNewColumnName('');
          setIsAddingColumn(false);
        },
      }
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-180px)] items-start space-x-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.columnId === column.id);
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              projectId={projectId}
              onTaskClick={onTaskClick}
            />
          );
        })}

        {/* Add Column Button */}
        <div className="w-80 shrink-0">
          {isAddingColumn ? (
            <form onSubmit={handleAddColumn} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <input
                type="text"
                placeholder="Column name..."
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700"
                autoFocus
              />
              <div className="mt-2 flex items-center space-x-2">
                <Button type="submit" size="sm" className="h-7 text-xs">
                  Add Column
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingColumn(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="flex w-full items-center justify-center space-x-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-4 text-xs font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Column</span>
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} onClick={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
