import { useState } from 'react';
import { 
  Users, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Wrench, 
  Plus, 
  Trash2, 
  Edit3, 
  Briefcase, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ResourceMember, EquipmentResource, EquipmentStatus } from '@/types';
import { 
  useProjectResources, 
  useUpdateResourceProfile,
  useEquipment,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment
} from '@/hooks/useResources';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/components/financials/EVMPerformanceDashboard';

interface ResourceCapacityViewProps {
  projectId: string;
}

const STATUS_BADGES: Record<EquipmentStatus, { label: string; variant: 'default' | 'outline' | 'warning' | 'destructive' }> = {
  AVAILABLE: { label: 'Available (Ready)', variant: 'default' },
  IN_USE: { label: 'In Test Run (Active)', variant: 'warning' },
  CALIBRATING: { label: 'Calibrating Bench', variant: 'outline' },
  MAINTENANCE: { label: 'Under Maintenance', variant: 'destructive' },
};

export default function ResourceCapacityView({ projectId }: ResourceCapacityViewProps) {
  const { data: resources = [], isLoading: loadingResources } = useProjectResources(projectId);
  const { data: equipment = [], isLoading: loadingEquipment } = useEquipment(projectId);

  const updateProfileMutation = useUpdateResourceProfile(projectId);
  const createEquipMutation = useCreateEquipment(projectId);
  const updateEquipMutation = useUpdateEquipment(projectId);
  const deleteEquipMutation = useDeleteEquipment(projectId);

  const [expandedMemberTasks, setExpandedMemberTasks] = useState<Record<string, boolean>>({});
  const [editingProfile, setEditingProfile] = useState<ResourceMember | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Profile Form state
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [weeklyCapacityHours, setWeeklyCapacityHours] = useState<number>(40);
  const [hourlyRate, setHourlyRate] = useState<number>(2500);
  const [skills, setSkills] = useState('');

  // Equipment Form state
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<EquipmentResource | null>(null);
  const [equipName, setEquipName] = useState('');
  const [equipCategory, setEquipCategory] = useState('Dyno Bench');
  const [equipLocation, setEquipLocation] = useState('');
  const [equipStatus, setEquipStatus] = useState<EquipmentStatus>('AVAILABLE');
  const [equipCostPerHour, setEquipCostPerHour] = useState<number>(15000);

  const toggleTaskAccordion = (userId: string) => {
    setExpandedMemberTasks((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const openEditProfile = (member: ResourceMember) => {
    setEditingProfile(member);
    setJobTitle(member.jobTitle);
    setDepartment(member.department);
    setWeeklyCapacityHours(member.weeklyCapacityHours);
    setHourlyRate(member.hourlyRate);
    setSkills(member.skills);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    updateProfileMutation.mutate(
      {
        userId: editingProfile.userId,
        data: {
          jobTitle,
          department,
          weeklyCapacityHours: Number(weeklyCapacityHours),
          hourlyRate: Number(hourlyRate),
          skills,
        },
      },
      {
        onSuccess: () => setIsProfileModalOpen(false),
      }
    );
  };

  const openCreateEquipment = () => {
    setEditingEquip(null);
    setEquipName('');
    setEquipCategory('Dyno Bench');
    setEquipLocation('');
    setEquipStatus('AVAILABLE');
    setEquipCostPerHour(15000);
    setIsEquipModalOpen(true);
  };

  const openEditEquipment = (item: EquipmentResource) => {
    setEditingEquip(item);
    setEquipName(item.name);
    setEquipCategory(item.category);
    setEquipLocation(item.location || '');
    setEquipStatus(item.status);
    setEquipCostPerHour(item.costPerHour);
    setIsEquipModalOpen(true);
  };

  const handleSaveEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipName.trim()) return;

    const payload = {
      name: equipName,
      category: equipCategory,
      location: equipLocation || undefined,
      status: equipStatus,
      costPerHour: Number(equipCostPerHour) || 0,
    };

    if (editingEquip) {
      updateEquipMutation.mutate(
        { equipmentId: editingEquip.id, data: payload },
        { onSuccess: () => setIsEquipModalOpen(false) }
      );
    } else {
      createEquipMutation.mutate(payload, {
        onSuccess: () => setIsEquipModalOpen(false),
      });
    }
  };

  // Summary statistics
  const totalEngineers = resources.length;
  const overloadedCount = resources.filter((r) => r.overloadStatus === 'OVERLOADED').length;
  const totalAllocatedHours = resources.reduce((acc, r) => acc + r.allocatedHours, 0);
  const totalCapacityHours = resources.reduce((acc, r) => acc + r.weeklyCapacityHours, 0);
  const teamUtilization = totalCapacityHours > 0 ? Math.round((totalAllocatedHours / totalCapacityHours) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <Users className="h-5 w-5 text-indigo-600 mr-2" />
            Resource Management & Capacity Planning
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor engineer workload allocation, prevent burn-out bottlenecks, and schedule specialized test equipment.
          </p>
        </div>

        <Button onClick={openCreateEquipment} className="h-9 text-xs font-semibold shadow-sm">
          <Wrench className="h-4 w-4 mr-1.5" /> Register Test Rig
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-400 uppercase">Team Size</span>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalEngineers} Engineers
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block">Cross-Functional EV Team</span>
        </Card>

        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-400 uppercase">Team Utilization</span>
          <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {teamUtilization}%
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalAllocatedHours}h Allocated / {totalCapacityHours}h Total Cap
          </span>
        </Card>

        <Card className={`p-4 shadow-sm border ${overloadedCount > 0 ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
          <span className="text-xs font-semibold text-slate-400 uppercase">Overload Bottlenecks</span>
          <h4 className={`text-2xl font-black mt-1 ${overloadedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
            {overloadedCount} Overloaded
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {overloadedCount > 0 ? 'Requires task load balancing' : 'All engineers within safe limits'}
          </span>
        </Card>

        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-400 uppercase">Specialized Test Rigs</span>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {equipment.length} Benches
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {equipment.filter((e) => e.status === 'IN_USE').length} currently in test runs
          </span>
        </Card>
      </div>

      {/* Section 1: Team Member Workload Cards */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          <Briefcase className="h-4 w-4 text-indigo-600 mr-2" />
          Engineering Staff Capacity & Allocation Matrix
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((member) => {
            const isOverloaded = member.overloadStatus === 'OVERLOADED';
            const isBalanced = member.overloadStatus === 'BALANCED';
            const isExpanded = expandedMemberTasks[member.userId];

            return (
              <Card
                key={member.userId}
                className={`shadow-sm border transition-all ${
                  isOverloaded
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Row: Avatar, Name, Job Title, Edit Button */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-11 w-11 border-2 border-indigo-100 dark:border-indigo-900">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback className="text-sm font-bold bg-indigo-600 text-white">
                          {member.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                          {member.name}
                        </h5>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {member.jobTitle}
                        </p>
                        <p className="text-[11px] text-slate-400">{member.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={isOverloaded ? 'destructive' : isBalanced ? 'warning' : 'default'}
                        className="text-[10px]"
                      >
                        {isOverloaded ? '🔴 OVERLOADED' : isBalanced ? '🟡 BALANCED' : '🟢 AVAILABLE'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditProfile(member)}
                        className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Weekly Workload Allocation
                      </span>
                      <span className={`font-mono font-bold ${isOverloaded ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                        {member.allocatedHours}h / {member.weeklyCapacityHours}h ({member.utilizationPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverloaded
                            ? 'bg-rose-500'
                            : isBalanced
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(member.utilizationPercent, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>Rate: ₹{member.hourlyRate.toLocaleString('en-IN')}/hr</span>
                      <span>{member.assignedTasksCount} Active Tasks Assigned</span>
                    </div>
                  </div>

                  {/* Skills Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Specialized Skills
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.split(',').map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Assigned Tasks Accordion Toggle */}
                  {member.assignedTasks.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => toggleTaskAccordion(member.userId)}
                        className="flex items-center justify-between w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>View Assigned Work Packages ({member.assignedTasks.length})</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-indigo-200 dark:border-indigo-800">
                          {member.assignedTasks.map((t) => (
                            <div
                              key={t.id}
                              className="text-xs p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                            >
                              <span className="truncate max-w-[200px] font-medium text-slate-800 dark:text-slate-200">
                                {t.title}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-slate-500">
                                {t.estimatedHours || 8} hrs
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Section 2: Specialized Test Rigs & Equipment */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          <Wrench className="h-4 w-4 text-indigo-600 mr-2" />
          Specialized Test Benches, Wind Tunnels & Hardware Rigs
        </h4>

        <Card className="shadow-sm overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-300">
                  <th className="p-3 pl-4">Equipment / Test Bench Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Location Facility</th>
                  <th className="p-3 text-right">Cost Rate / Hour</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {equipment.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-xs text-slate-400">
                      No specialized hardware test equipment registered yet.
                    </td>
                  </tr>
                ) : (
                  equipment.map((item) => {
                    const statusInfo = STATUS_BADGES[item.status] || { label: item.status, variant: 'outline' };
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-xs">
                          {item.location || 'Central Automotive Lab'}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          ₹{item.costPerHour.toLocaleString('en-IN')}/hr
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={statusInfo.variant} className="text-[10px]">
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditEquipment(item)}
                              className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (window.confirm(`Delete equipment record for ${item.name}?`)) {
                                  deleteEquipMutation.mutate(item.id);
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
      </div>

      {/* Edit Profile Modal */}
      {isProfileModalOpen && editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Users className="h-5 w-5 text-indigo-600 mr-2" />
              Edit Resource Profile: {editingProfile.name}
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job Title</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Chief EV Architect"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. High Voltage Powertrain"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Weekly Capacity (Hours)
                  </label>
                  <Input
                    type="number"
                    value={weeklyCapacityHours}
                    onChange={(e) => setWeeklyCapacityHours(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hourly Billing Rate (₹)
                  </label>
                  <Input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Skills & Certifications (Comma-separated)
                </label>
                <Input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. 800V SiC, CAN-FD, ISO 26262 ASIL-D"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsProfileModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Equipment Modal */}
      {isEquipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEquipModalOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Wrench className="h-5 w-5 text-indigo-600 mr-2" />
              {editingEquip ? 'Edit Equipment Record' : 'Register Test Rig'}
            </h3>

            <form onSubmit={handleSaveEquipment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipment Name *</label>
                <Input
                  value={equipName}
                  onChange={(e) => setEquipName(e.target.value)}
                  placeholder="e.g. 500kW Dual-Motor Dyno Rig"
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <Input
                    value={equipCategory}
                    onChange={(e) => setEquipCategory(e.target.value)}
                    placeholder="e.g. Dyno Bench"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <Select
                    value={equipStatus}
                    onChange={(e) => setEquipStatus(e.target.value as EquipmentStatus)}
                    className="text-xs"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_USE">In Use</option>
                    <option value="CALIBRATING">Calibrating</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Facility Location</label>
                  <Input
                    value={equipLocation}
                    onChange={(e) => setEquipLocation(e.target.value)}
                    placeholder="e.g. Testing Bay 4"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hourly Rate (₹)</label>
                  <Input
                    type="number"
                    value={equipCostPerHour}
                    onChange={(e) => setEquipCostPerHour(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEquipModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingEquip ? 'Update Equipment' : 'Register Equipment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
