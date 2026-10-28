import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  helperText?: string;
  icon: React.ReactNode;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  helperText,
  icon,
  badge,
}) => {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm hover:border-teal-500/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className="w-9 h-9 rounded-lg bg-teal-500/10 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-navy-700">
            {badge}
          </span>
        )}
      </div>
      {helperText && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

