import React, { useState } from 'react';
import { useAddProjectMember } from '@/hooks/useProjects';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface InviteMemberDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteMemberDialog({ projectId, open, onOpenChange }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const addMember = useAddProjectMember();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    addMember.mutate(
      { projectId, email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogDescription>
          Add collaborators by their registered email address.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email Address *
          </label>
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Project Role
          </label>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ADMIN">Admin (Full Control)</option>
            <option value="MANAGER">Manager (Manage Tasks & Members)</option>
            <option value="MEMBER">Member (Create & Edit Tasks)</option>
            <option value="VIEWER">Viewer (Read-Only)</option>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={addMember.isPending}>
            {addMember.isPending ? 'Inviting...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
