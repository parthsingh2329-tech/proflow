import ProfileSettings from '@/components/settings/ProfileSettings';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your account profile and workspace preferences.
        </p>
      </div>

      <ProfileSettings />
    </div>
  );
}
