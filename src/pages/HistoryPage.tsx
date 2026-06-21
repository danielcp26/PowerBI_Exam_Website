import { History } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useExamSession } from '../hooks/useExamSession';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';

interface AttemptRow {
  id: string;
  user_id: string;
  mode?: number;
  total_questions?: number;
  score?: number;
  percentage?: number;
  passed?: boolean;
  completed_at?: string;
  created_at?: string;
}

export function HistoryPage() {
  const { selectedUser } = useExamSession();
  const { data, loading, error } = useSupabaseQuery<AttemptRow>(async () => {
    let query = supabase
      .from('exam_attempts')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(50);

    if (selectedUser) {
      query = query.eq('user_id', selectedUser.id);
    }

    const { data: rows, error: queryError } = await query;
    return { data: rows || [], error: queryError };
  });

  return (
    <section className="app-panel rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-3xl font-semibold tracking-tight">History</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {selectedUser ? `Recent attempts for ${selectedUser.display_name}.` : 'Choose a user on Home to filter attempt history.'}
      </p>

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading attempts...</p> : null}
      {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

      {!loading && data.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={History} title="No attempts yet" message="Completed exams will appear here after they are saved." />
        </div>
      ) : null}

      {data.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="px-4 py-4">{new Date(attempt.completed_at || attempt.created_at || '').toLocaleString()}</td>
                  <td className="px-4 py-4">{attempt.mode || attempt.total_questions} questions</td>
                  <td className="px-4 py-4">
                    {attempt.score}/{attempt.total_questions || attempt.mode} · {attempt.percentage}%
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${attempt.passed ? 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'}`}>
                      {attempt.passed ? 'Pass' : 'Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
