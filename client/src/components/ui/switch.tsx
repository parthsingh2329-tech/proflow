import * as React from 'react';

interface SwitchProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
      } ${className}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export default Switch;
