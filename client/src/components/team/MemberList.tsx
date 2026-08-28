import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, UserCog } from 'lucide-react';
import { ProjectMember } from '@/types';
import { useRemoveProjectMember, useUpdateMemberRole } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import InviteMemberDialog from './InviteMemberDialog';

interface MemberListProps {
  projectId: string;
  members: ProjectMember[];
}

export default function MemberList({ projectId, members = [] }: MemberListProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const removeMember = useRemoveProjectMember();
  const updateMemberRole = useUpdateMemberRole();

  const handleRoleChange = (memberId: string, newRole: string) => {
    updateMemberRole.mutate({ projectId, memberId, role: newRole });
  };

  const handleRemove = (memberId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from this project?`)) {
      removeMember.mutate({ projectId, memberId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Team Members ({members.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Collaborators with assigned roles and permissions
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} size="sm" className="space-x-1.5 text-xs">
          <UserPlus className="h-4 w-4" />
          <span>Invite Member</span>
        </Button>
      </div>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {members.map((member) => (
          <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={member.user?.avatar} />
                <AvatarFallback>{member.user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                  {member.user?.name}
                </h4>
                <p className="text-xs text-slate-400 font-mono">{member.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <Select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                className="text-xs h-8 w-32 font-semibold"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="MEMBER">MEMBER</option>
                <option value="VIEWER">VIEWER</option>
              </Select>

              {member.role !== 'ADMIN' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(member.id, member.user?.name || 'user')}
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                  title="Remove from project"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <InviteMemberDialog
        projectId={projectId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </div>
  );
}
