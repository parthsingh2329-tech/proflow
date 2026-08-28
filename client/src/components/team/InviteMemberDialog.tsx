import React, { useState } from 'react';
import { useAddProjectMember } from '@/hooks/useProjects';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface InviteMemberDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteMemberDialog({ projectId, open, onOpenChange }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const addMember = useAddProjectMember();

  const handleClose = () => {
    setErrorMessage(null);
    setEmail('');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim()) return;

    addMember.mutate(
      { projectId, email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail('');
          setErrorMessage(null);
          onOpenChange(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || 'Failed to add member to project.';
          if (msg.toLowerCase().includes('already a member')) {
            setErrorMessage(`This email (${email.trim()}) already belongs to an active member on this project.`);
          } else if (msg.toLowerCase().includes('not found')) {
            setErrorMessage(`No user registered with email "${email.trim()}". Please check the email address.`);
          } else {
            setErrorMessage(msg);
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}>
      <DialogClose onClose={handleClose} />
      <DialogHeader>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogDescription>
          Add collaborators by their registered account email address.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email Address *
          </label>
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
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
          <Button type="button" variant="outline" onClick={handleClose}>
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
