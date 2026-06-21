import type { BreakdownItem } from '../types';

interface BreakdownListProps {
  title: string;
  items: BreakdownItem[];
}

export function BreakdownList({ title, items }: BreakdownListProps) {
  return (
    <section className="analytics-panel rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="text-slate-600 dark:text-slate-400">
                {item.correct}/{item.total} · {item.percentage}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${item.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
