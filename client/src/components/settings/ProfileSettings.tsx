import React, { useState } from 'react';
import useAuthStore from '@/stores/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Camera, Check, Lock, Sparkles, User as UserIcon } from 'lucide-react';

const AVATAR_PRESETS = [
  { label: 'Executive', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { label: 'Tech Lead', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Battery Lead', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { label: 'Autonomy', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { label: 'Manufacturing', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { label: 'Quality', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
];

export default function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdating(true);
    try {
      const payload: { name: string; avatar: string; password?: string } = {
        name: name.trim(),
        avatar: avatar.trim(),
      };
      if (password) {
        payload.password = password;
      }

      const res = await api.patch('/auth/profile', payload);
      if (res.data?.user) {
        setUser(res.data.user);
      }
      setPassword('');
      setConfirmPassword('');
      toast.success('Profile and photo updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserIcon className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-base font-semibold">User Profile & Photo</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Manage your display name, profile avatar photo, and account security.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-6">
            {/* Avatar Preview & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="relative group">
                <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-slate-800 shadow-md bg-indigo-600 text-white text-xl font-bold">
                  <AvatarImage src={avatar || user?.avatar} alt={name} />
                  <AvatarFallback>{name?.slice(0, 2) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  {name || user?.name}
                </h4>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="inline-block rounded-md bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    {user?.globalRole || 'ADMIN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Avatar Custom URL */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Camera className="h-3.5 w-3.5 text-slate-500" />
                <span>Profile Photo Image URL</span>
              </label>
              <Input
                placeholder="https://example.com/your-photo.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500">
                Paste any direct image link (JPEG, PNG, Unsplash, Gravatar, etc.)
              </p>
            </div>

            {/* Quick Avatar Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Or Choose a Preset Avatar:</span>
              </label>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setAvatar(preset.url)}
                    className={`relative rounded-full ring-2 transition-all ${
                      avatar === preset.url
                        ? 'ring-indigo-600 scale-105 shadow-sm'
                        : 'ring-transparent hover:ring-slate-300 dark:hover:ring-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    {avatar === preset.url && (
                      <div className="absolute inset-0 rounded-full bg-indigo-600/40 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* Display Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
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
                <Input
                  value={user?.email || ''}
                  disabled
                  className="opacity-70 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* Change Password (Optional) */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <span>Change Password (Optional)</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
            <Button type="submit" disabled={isUpdating} className="space-x-1.5">
              <span>{isUpdating ? 'Saving Changes...' : 'Save Profile & Photo'}</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
