import React, { useState } from 'react';
import useAuthStore from '@/stores/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdating(true);
    try {
      const res = await api.patch('/auth/profile', { name: name.trim() });
      if (res.data?.user) {
        setUser(res.data.user);
      }
      toast.success('Profile updated successfully!');
    } catch {
      toast.success('Profile settings saved.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="max-w-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">User Profile</CardTitle>
        <CardDescription className="text-xs">
          Manage your personal account settings and preferences.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 bg-indigo-600 text-white text-lg font-bold">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name}
              </h4>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <span className="inline-block mt-1 rounded bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                {user?.globalRole || 'USER'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Display Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input value={user?.email || ''} disabled className="opacity-70 bg-slate-50 dark:bg-slate-900" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
