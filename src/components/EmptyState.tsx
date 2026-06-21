import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
}

export function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <div className="analytics-panel rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <Icon className="mx-auto h-10 w-10 text-slate-400" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
}
