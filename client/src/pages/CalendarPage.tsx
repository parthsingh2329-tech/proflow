import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import CalendarView from '@/components/calendar/CalendarView';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { Select } from '@/components/ui/select';
import { Task } from '@/types';

export default function CalendarPage() {
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const effectiveProjectId = selectedProjectId || (projects[0]?.id ?? '');
  const { data: tasks = [] } = useTasks(effectiveProjectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Calendar
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View all task deadlines and milestones in a unified schedule.
          </p>
        </div>

        {projects.length > 0 && (
          <div className="w-64">
            <Select
              value={effectiveProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {effectiveProjectId ? (
        <CalendarView tasks={tasks} onTaskClick={setSelectedTask} />
      ) : (
        <div className="text-center py-12 text-slate-400 text-xs">
          No projects available to display on calendar.
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          projectId={effectiveProjectId}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
