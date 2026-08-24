import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  List, 
  Calendar as CalendarIcon, 
  BarChart2, 
  Users, 
  Clock, 
  ArrowLeft,
  Settings as SettingsIcon,
  Trash2
} from 'lucide-react';
import { useProject, useDeleteProject } from '@/hooks/useProjects';
import { useBoards } from '@/hooks/useBoard';
import { useTasks } from '@/hooks/useTasks';
import KanbanBoard from '@/components/boards/KanbanBoard';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import MemberList from '@/components/team/MemberList';
import TimeTracker from '@/components/time-tracking/TimeTracker';
import GanttView from '@/components/gantt/GanttView';
import CalendarView from '@/components/calendar/CalendarView';
import RiskRegister from '@/components/risks/RiskRegister';
import IssueRegister from '@/components/issues/IssueRegister';
import DecisionLog from '@/components/decisions/DecisionLog';
import BaselineManager from '@/components/baselines/BaselineManager';
import FinancialsTab from '@/components/financials/FinancialsTab';
import WBSView from '@/components/wbs/WBSView';
import ResourceCapacityView from '@/components/resources/ResourceCapacityView';
import StageGateView from '@/components/governance/StageGateView';
import ChangeManagementView from '@/components/governance/ChangeManagementView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';
import { 
  ShieldAlert, 
  AlertCircle, 
  FileCheck, 
  Bookmark,
  DollarSign,
  Network,
  Cpu,
  ShieldCheck,
  GitPullRequest 
} from 'lucide-react';

export default function ProjectDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: project, isLoading: isProjectLoading } = useProject(id);
  const { data: boards = [] } = useBoards(id);
  const { data: tasks = [] } = useTasks(id);
  const deleteProject = useDeleteProject();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const defaultBoard = boards[0] || project?.boards?.[0];

  if (isProjectLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Project not found.</p>
        <Button onClick={() => navigate('/projects')} className="mt-4">Back to Projects</Button>
      </div>
    );
  }

  const handleDeleteProject = () => {
    if (window.confirm('Are you sure you want to delete this project and all its tasks?')) {
      deleteProject.mutate(id, {
        onSuccess: () => navigate('/projects'),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/projects')}
            className="h-8 w-8 text-slate-500"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span
            className="h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: project.color || '#6366f1' }}
          />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <span>{project.name}</span>
              <Badge variant="default" className="text-[10px] ml-2">
                {project.status}
              </Badge>
            </h2>
            {project.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteProject}
          className="text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 space-x-1 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Project</span>
        </Button>
      </div>

      {/* Tabs View */}
      <Tabs defaultValue="board">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="board" className="space-x-1.5 text-xs">
            <FolderKanban className="h-4 w-4" />
            <span>Kanban Board</span>
          </TabsTrigger>
          <TabsTrigger value="gantt" className="space-x-1.5 text-xs">
            <BarChart2 className="h-4 w-4" />
            <span>Gantt Chart (CPM)</span>
          </TabsTrigger>
          <TabsTrigger value="wbs" className="space-x-1.5 text-xs">
            <Network className="h-4 w-4 text-indigo-500" />
            <span>WBS Tree</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="space-x-1.5 text-xs">
            <Cpu className="h-4 w-4 text-cyan-500" />
            <span>Resource Capacity</span>
          </TabsTrigger>
          <TabsTrigger value="financials" className="space-x-1.5 text-xs">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span>Financials & EVM</span>
          </TabsTrigger>
          <TabsTrigger value="gates" className="space-x-1.5 text-xs">
            <ShieldCheck className="h-4 w-4 text-purple-500" />
            <span>Stage Gates (APQP)</span>
          </TabsTrigger>
          <TabsTrigger value="changes" className="space-x-1.5 text-xs">
            <GitPullRequest className="h-4 w-4 text-orange-500" />
            <span>Change Orders (CCB)</span>
          </TabsTrigger>
          <TabsTrigger value="risks" className="space-x-1.5 text-xs">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span>Risks (5×5)</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="space-x-1.5 text-xs">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Issues (CAPA)</span>
          </TabsTrigger>
          <TabsTrigger value="decisions" className="space-x-1.5 text-xs">
            <FileCheck className="h-4 w-4 text-indigo-500" />
            <span>Decision Log</span>
          </TabsTrigger>
          <TabsTrigger value="baselines" className="space-x-1.5 text-xs">
            <Bookmark className="h-4 w-4 text-blue-500" />
            <span>Baselines</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="space-x-1.5 text-xs">
            <CalendarIcon className="h-4 w-4" />
            <span>Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="time" className="space-x-1.5 text-xs">
            <Clock className="h-4 w-4" />
            <span>Time Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="space-x-1.5 text-xs">
            <Users className="h-4 w-4" />
            <span>Team Members</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          {defaultBoard ? (
            <KanbanBoard
              projectId={id}
              boardId={defaultBoard.id}
              columns={defaultBoard.columns || []}
              tasks={tasks}
              onTaskClick={setSelectedTask}
            />
          ) : (
            <p className="text-slate-400 text-xs py-8 text-center">No boards configured</p>
          )}
        </TabsContent>

        <TabsContent value="gantt">
          <GanttView tasks={tasks} onTaskClick={setSelectedTask} />
        </TabsContent>

        <TabsContent value="wbs">
          <WBSView projectId={id} members={project.members || []} />
        </TabsContent>

        <TabsContent value="resources">
          <ResourceCapacityView projectId={id} />
        </TabsContent>

        <TabsContent value="risks">
          <RiskRegister projectId={id} members={project.members || []} />
        </TabsContent>

        <TabsContent value="issues">
          <IssueRegister projectId={id} members={project.members || []} />
        </TabsContent>

        <TabsContent value="decisions">
          <DecisionLog projectId={id} members={project.members || []} />
        </TabsContent>

        <TabsContent value="baselines">
          <BaselineManager projectId={id} />
        </TabsContent>

        <TabsContent value="financials">
          <FinancialsTab projectId={id} />
        </TabsContent>

        <TabsContent value="gates">
          <StageGateView projectId={id} members={project.members || []} />
        </TabsContent>

        <TabsContent value="changes">
          <ChangeManagementView projectId={id} members={project.members || []} />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView tasks={tasks} onTaskClick={setSelectedTask} />
        </TabsContent>

        <TabsContent value="time">
          <div className="max-w-md">
            <TimeTracker tasks={tasks} />
          </div>
        </TabsContent>

        <TabsContent value="team">
          <MemberList projectId={id} members={project.members || []} />
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          projectId={id}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
