import { Trophy } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import type { ExamMode, LeaderboardRow } from '../types';

const modes: ExamMode[] = [15, 30, 50];

function numberValue(value: unknown) {
  return typeof value === 'number' ? value : Number(value || 0);
}

export function LeaderboardPage() {
  const [mode, setMode] = useState<ExamMode>(15);
  const { data, loading, error } = useSupabaseQuery<LeaderboardRow>(async () => {
    const { data: rows, error: queryError } = await supabase.from('v_leaderboard_by_mode').select('*');
    return { data: rows || [], error: queryError };
  });

  const rows = data
    .filter((row) => Number(row.mode ?? row.question_count) === mode)
    .sort((a, b) => numberValue(b.best_percentage ?? b.average_percentage) - numberValue(a.best_percentage ?? a.average_percentage));

  return (
    <section className="app-panel rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Compare best and average results by exam mode.</p>
        </div>
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
          {modes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded px-4 py-2 text-sm font-semibold transition ${mode === item ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading leaderboard...</p> : null}
      {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

      {!loading && rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Trophy} title="No leaderboard rows yet" message="Complete an exam in this mode to populate the leaderboard." />
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Best</th>
                <th className="px-4 py-3">Average</th>
                <th className="px-4 py-3">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((row, index) => (
                <tr key={`${row.user_id || row.display_name}-${index}`}>
                  <td className="px-4 py-4 font-semibold">{index + 1}</td>
                  <td className="px-4 py-4">{String(row.alias || row.display_name || 'Learner')}</td>
                  <td className="px-4 py-4">{numberValue(row.best_percentage)}%</td>
                  <td className="px-4 py-4">{numberValue(row.average_percentage).toFixed(1)}%</td>
                  <td className="px-4 py-4">{numberValue(row.attempts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
