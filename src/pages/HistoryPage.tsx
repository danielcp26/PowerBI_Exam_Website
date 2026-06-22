import { BarChart3, History, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { MetricCard } from '../components/MetricCard';
import { MistakeMap } from '../components/MistakeMap';
import { useExamSession } from '../hooks/useExamSession';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { sourceLabel, studySourcesForSkill } from '../lib/studySources';
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

interface AnswerRow {
  attempt_id: string;
  question_id: string;
  selected_answers: string[] | null;
  is_correct: boolean;
}

interface QuestionMeta {
  id: string;
  domain_name: string;
  skill_name: string;
}

interface FocusArea {
  domain: string;
  skill: string;
  missed: number;
}

interface HistoryAnalytics {
  uniqueResponded: number;
  notYetResponded: number;
  totalAvailable: number;
  mostMissed: FocusArea | null;
  focusAreas: FocusArea[];
}

export function HistoryPage() {
  const { selectedUser } = useExamSession();
  const [analytics, setAnalytics] = useState<HistoryAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const { data, loading, error } = useSupabaseQuery<AttemptRow>(async () => {
    let query = supabase.from('exam_attempts').select('*').order('completed_at', { ascending: false }).limit(50);
    if (selectedUser) query = query.eq('user_id', selectedUser.id);
    const { data: rows, error: queryError } = await query;
    return { data: rows || [], error: queryError };
  });

  useEffect(() => {
    let active = true;
    async function loadAnalytics() {
      if (!selectedUser) return;
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const attemptIds = data.map((attempt) => attempt.id);
      const [{ data: questions, error: questionsError }, answersResult] = await Promise.all([
        supabase.from('v_exam_ready_questions').select('id,domain_name,skill_name'),
        attemptIds.length
          ? supabase.from('attempt_answers').select('attempt_id,question_id,selected_answers,is_correct').in('attempt_id', attemptIds)
          : Promise.resolve({ data: [] as AnswerRow[], error: null }),
      ]);
      if (!active) return;
      if (questionsError || answersResult.error) {
        setAnalyticsError(questionsError?.message || answersResult.error?.message || 'Unable to load historical analytics.');
        setAnalyticsLoading(false);
        return;
      }

      const questionById = new Map((questions as QuestionMeta[]).map((question) => [question.id, question]));
      const answeredIds = new Set<string>();
      const groups = new Map<string, FocusArea>();
      (answersResult.data as AnswerRow[]).forEach((answer) => {
        if ((answer.selected_answers || []).length > 0) answeredIds.add(answer.question_id);
        if (answer.is_correct) return;
        const question = questionById.get(answer.question_id);
        if (!question) return;
        const key = `${question.domain_name}|${question.skill_name}`;
        const current = groups.get(key) || { domain: question.domain_name, skill: question.skill_name, missed: 0 };
        current.missed += 1;
        groups.set(key, current);
      });
      const focusAreas = [...groups.values()].sort((a, b) => b.missed - a.missed);
      setAnalytics({
        uniqueResponded: answeredIds.size,
        totalAvailable: (questions as QuestionMeta[]).length,
        notYetResponded: Math.max(0, (questions as QuestionMeta[]).length - answeredIds.size),
        mostMissed: focusAreas[0] || null,
        focusAreas: focusAreas.slice(0, 10),
      });
      setAnalyticsLoading(false);
    }
    void loadAnalytics();
    return () => { active = false; };
  }, [data, selectedUser]);

  const trend = useMemo(() => [...data].reverse().slice(-12), [data]);

  return (
    <section className="app-panel rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-3xl font-semibold tracking-tight">History and trends</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {selectedUser ? `Performance trends for ${selectedUser.display_name}.` : 'Choose a user on Home to view attempt history.'}
      </p>

      {analyticsLoading ? <p className="mt-6 text-sm text-slate-500">Building your analytics...</p> : null}
      {analyticsError ? <p className="mt-6 text-sm text-rose-600">{analyticsError}</p> : null}
      {analytics ? (
        <div className="mt-7 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Unique questions responded" value={analytics.uniqueResponded} tone="good" />
            <MetricCard label="Not responded yet" value={analytics.notYetResponded} />
            <MetricCard label="Question pool" value={analytics.totalAvailable} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="analytics-panel rounded-lg border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center gap-2"><Target className="h-5 w-5 text-rose-500" /><h2 className="text-lg font-semibold">Most missed over time</h2></div>
              {analytics.mostMissed ? (
                <div className="mt-5 rounded-md border border-rose-400/20 bg-rose-950/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{analytics.mostMissed.domain}</p>
                  <p className="mt-1 text-xl font-semibold">{analytics.mostMissed.skill}</p>
                  <p className="mt-2 text-sm text-rose-200">Missed {analytics.mostMissed.missed} times across saved attempts.</p>
                  <a className="mt-4 inline-block text-sm font-semibold text-teal-300 hover:underline" target="_blank" rel="noreferrer" href={studySourcesForSkill(analytics.mostMissed.skill)[0]}>
                    Study with {sourceLabel(studySourcesForSkill(analytics.mostMissed.skill)[0])}
                  </a>
                </div>
              ) : <p className="mt-5 text-sm text-slate-400">Complete an exam to identify recurring focus areas.</p>}
            </div>

            <div className="analytics-panel rounded-lg border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-teal-400" /><h2 className="text-lg font-semibold">Recent performance</h2></div>
              <div className="mt-6 flex h-32 items-end gap-2">
                {trend.map((attempt) => <div key={attempt.id} className="group flex min-w-0 flex-1 flex-col justify-end"><span className="mb-2 text-center text-xs font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100">{attempt.percentage}%</span><div className="min-h-1 rounded-t bg-teal-500/80" style={{ height: `${Math.max(4, attempt.percentage || 0)}%` }} /></div>)}
              </div>
              <p className="mt-4 text-xs text-slate-500">Each bar is one completed exam, ordered from oldest to newest.</p>
            </div>
          </div>

          <MistakeMap
            areas={analytics.focusAreas}
            title="Historical mistake map"
            description="Repeated misses across all saved attempts, grouped by category and subcategory."
            emptyMessage="Complete an exam to build your historical mistake map."
          />
        </div>
      ) : null}

      {loading ? <p className="mt-8 text-sm text-slate-500">Loading attempts...</p> : null}
      {error ? <p className="mt-8 text-sm text-rose-600">{error}</p> : null}
      {!loading && data.length === 0 ? <div className="mt-8"><EmptyState icon={History} title="No attempts yet" message="Completed exams will appear here after they are saved." /></div> : null}

      {data.length > 0 ? <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-950 dark:text-slate-400"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Result</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{data.map((attempt) => <tr key={attempt.id}><td className="px-4 py-4">{new Date(attempt.completed_at || attempt.created_at || '').toLocaleString()}</td><td className="px-4 py-4">{attempt.mode || attempt.total_questions} questions</td><td className="px-4 py-4">{attempt.score}/{attempt.total_questions || attempt.mode} · {attempt.percentage}%</td><td className="px-4 py-4"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${attempt.passed ? 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'}`}>{attempt.passed ? 'Pass' : 'Review'}</span></td></tr>)}</tbody></table></div> : null}
    </section>
  );
}
