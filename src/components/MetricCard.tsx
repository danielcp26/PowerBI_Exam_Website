interface MetricCardProps {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'good' | 'warn';
}

export function MetricCard({ label, value, tone = 'neutral' }: MetricCardProps) {
  const tones = {
    neutral: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
    good: 'border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/40',
    warn: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
  };

  return (
    <div className={`metric-card rounded-lg border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
