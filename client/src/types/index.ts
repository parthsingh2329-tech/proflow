export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  globalRole: GlobalRole;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  color?: string;
  startDate?: string;
  endDate?: string;
  ownerId: string;
  createdAt: string;
  memberCount?: number;
  taskCount?: number;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: User;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  type: string;
  columns: Column[];
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
  color?: string;
  taskLimit?: number;
  tasks: Task[];
}

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface TaskDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lagDays: number;
  createdAt?: string;
  predecessor?: Partial<Task>;
  successor?: Partial<Task>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  order: number;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  completedAt?: string;
  projectId: string;
  columnId: string;
  assigneeId?: string;
  reporterId: string;
  parentTaskId?: string;
  milestoneId?: string;
  isMilestone?: boolean;
  createdAt: string;
  assignee?: User;
  reporter?: User;
  milestone?: Milestone;
  labels?: Label[];
  comments?: Comment[];
  attachments?: Attachment[];
  subtasks?: Task[];
  subtaskCount?: number;
  completedSubtaskCount?: number;
  dependenciesAsSuccessor?: TaskDependency[];
  dependenciesAsPredecessor?: TaskDependency[];
  isCritical?: boolean;
  earlyStart?: Date;
  earlyFinish?: Date;
  lateStart?: Date;
  lateFinish?: Date;
  slack?: number;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: MilestoneStatus;
  taskCount?: number;
  completedTaskCount?: number;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  createdAt: string;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user?: User;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  completedThisWeek: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export enum Priority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  NONE = 'NONE'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE'
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum ProjectRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum GlobalRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum MilestoneStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  PROJECT_INVITE = 'PROJECT_INVITE',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM'
}

export type RiskCategory = 'TECHNICAL' | 'SUPPLY_CHAIN' | 'REGULATORY' | 'FINANCIAL' | 'SCHEDULE' | 'SAFETY' | 'OPERATIONAL';
export type RiskStatus = 'OPEN' | 'MITIGATING' | 'CLOSED' | 'ACCEPTED';
export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';
export type DecisionStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';

export interface Risk {
  id: string;
  projectId: string;
  riskCode: string;
  title: string;
  description?: string;
  category: RiskCategory;
  probability: number;
  impact: number;
  score: number;
  status: RiskStatus;
  mitigation?: string;
  contingency?: string;
  trigger?: string;
  ownerId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  owner?: User;
}

export interface Issue {
  id: string;
  projectId: string;
  issueCode: string;
  title: string;
  description?: string;
  severity: IssueSeverity;
  status: IssueStatus;
  rootCause?: string;
  correctiveAction?: string;
  escalatedTo?: string;
  ownerId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  owner?: User;
}

export interface Decision {
  id: string;
  projectId: string;
  decisionCode: string;
  title: string;
  decisionDate: string;
  summary: string;
  rationale?: string;
  financialImpact?: string;
  scheduleImpact?: string;
  status: DecisionStatus;
  approvedById?: string;
  createdAt: string;
  updatedAt?: string;
  approvedBy?: User;
}

export interface TaskBaseline {
  id: string;
  baselineId: string;
  taskId: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  task?: Task;
}

export interface ProjectBaseline {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdById?: string;
  createdAt: string;
  createdBy?: User;
  tasks: TaskBaseline[];
}

export type CostCategory = 
  | 'TOOLING_AND_DIES'
  | 'PROTOTYPE_BOM'
  | 'ENGINEERING_MANPOWER'
  | 'TESTING_AND_CERTIFICATION'
  | 'RAW_MATERIALS'
  | 'SOFTWARE_AND_LICENSES'
  | 'CONTINGENCY';

export type CostStatus = 'PLANNED' | 'COMMITTED' | 'PAID' | 'CANCELLED';

export interface BudgetCostItem {
  id: string;
  budgetId: string;
  name: string;
  category: CostCategory;
  plannedAmount: number;
  committedAmount: number;
  actualAmount: number;
  vendor?: string;
  purchaseOrderNo?: string;
  invoiceNo?: string;
  status: CostStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EVMSnapshot {
  id: string;
  budgetId: string;
  periodDate: string;
  pv: number;
  ev: number;
  ac: number;
  cpi: number;
  spi: number;
  eac: number;
  vac: number;
  createdAt: string;
}

export interface EVMAnalytics {
  totalPlannedCost: number;
  totalCommittedCost: number;
  totalActualCost: number;
  remainingBudget: number;
  projectPercentComplete: number;
  BAC: number;
  PV: number;
  EV: number;
  AC: number;
  CPI: number;
  SPI: number;
  EAC: number;
  ETC: number;
  VAC: number;
  CV: number;
  SV: number;
}

export interface ProjectBudget {
  id: string;
  projectId: string;
  currency: string;
  approvedBudget: number;
  contingencyReserve: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  costItems: BudgetCostItem[];
  evmSnapshots: EVMSnapshot[];
  analytics?: EVMAnalytics;
}

export type WBSNodeType = 'PHASE' | 'DELIVERABLE' | 'WORK_PACKAGE' | 'TASK';

export interface WBSNode {
  id: string;
  projectId: string;
  parentNodeId?: string | null;
  wbsCode: string;
  name: string;
  nodeType: WBSNodeType;
  order: number;
  progress: number;
  plannedCost: number;
  actualCost: number;
  ownerId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  owner?: { id: string; name: string; avatar?: string | null } | null;
  children?: WBSNode[];
}

export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CALIBRATING';

export interface EquipmentResource {
  id: string;
  projectId: string;
  name: string;
  category: string;
  location?: string | null;
  status: EquipmentStatus;
  costPerHour: number;
  assignedTaskId?: string | null;
  assignedTask?: { id: string; title: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ResourceMember {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  jobTitle: string;
  department: string;
  weeklyCapacityHours: number;
  hourlyRate: number;
  skills: string;
  allocatedHours: number;
  utilizationPercent: number;
  overloadStatus: 'OVERLOADED' | 'BALANCED' | 'AVAILABLE';
  assignedTasksCount: number;
  assignedTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    estimatedHours?: number | null;
    dueDate?: string | null;
  }>;
}

export type GateStatus = 'UPCOMING' | 'IN_REVIEW' | 'APPROVED' | 'CONDITIONAL_PASS' | 'REJECTED';

export interface GateCriteria {
  id: string;
  gateId: string;
  description: string;
  isMandatory: boolean;
  isMet: boolean;
  evidenceNotes?: string | null;
  createdAt: string;
}

export interface PhaseGate {
  id: string;
  projectId: string;
  gateCode: string;
  name: string;
  targetDate: string;
  status: GateStatus;
  reviewSummary?: string | null;
  signOffById?: string | null;
  signOffDate?: string | null;
  signOffBy?: { id: string; name: string; avatar?: string | null } | null;
  criteria: GateCriteria[];
  createdAt: string;
  updatedAt?: string;
}

export type ECOStatus = 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

export interface ChangeRequest {
  id: string;
  projectId: string;
  ecoCode: string;
  title: string;
  description: string;
  reason: string;
  costImpact: number;
  scheduleImpactDays: number;
  riskImpact?: string | null;
  status: ECOStatus;
  requestedById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  requestedBy?: { id: string; name: string; avatar?: string | null } | null;
  approvedBy?: { id: string; name: string; avatar?: string | null } | null;
  createdAt: string;
  updatedAt?: string;
}



