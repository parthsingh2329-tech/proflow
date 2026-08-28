import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useCreateTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuickAddTaskProps {
  projectId: string;
  columnId: string;
  onClose: () => void;
}

export default function QuickAddTask({ projectId, columnId, onClose }: QuickAddTaskProps) {
  const [title, setTitle] = useState('');
  const createTask = useCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate(
      {
        title: title.trim(),
        projectId,
        columnId,
      },
      {
        onSuccess: () => {
          setTitle('');
          onClose();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="p-1 space-y-2">
      <Input
        placeholder="What needs to be done? (max 200 chars)"
        maxLength={200}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-xs h-8"
        autoFocus
      />
      <div className="flex items-center space-x-1.5">
        <Button type="submit" size="sm" className="h-7 text-xs px-2.5" disabled={createTask.isPending}>
          Add
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-slate-400">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}
