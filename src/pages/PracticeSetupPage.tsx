import { AlertTriangle, Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useExamSession } from '../hooks/useExamSession';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { buildExamQuestions, emptyAnswers } from '../lib/exam';
import { normalizeQuestion } from '../lib/normalizers';
import { supabase } from '../lib/supabase';
import type { ExamMode, Question } from '../types';

const modes: ExamMode[] = [15, 30, 50];

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const { selectedUser, setSession, setResults } = useExamSession();
  const [mode, setMode] = useState<ExamMode>(15);
  const { data: questions, loading, error } = useSupabaseQuery<Question>(async () => {
    const { data, error: queryError } = await supabase.from('v_exam_ready_questions').select('*');
    return { data: (data || []).map(normalizeQuestion), error: queryError };
  });

  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();

    questions.forEach((question) => {
      const topic = question.domain || 'Uncategorized';
      counts.set(topic, (counts.get(topic) || 0) + 1);
    });

    return [...counts.entries()]
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }, [questions]);

  const examQuestions = useMemo(() => buildExamQuestions(questions, mode), [mode, questions]);
  const notEnough = questions.length > 0 && questions.length < mode;

  if (!selectedUser) {
    return <Navigate to="/" replace />;
  }

  function startExam() {
    if (!selectedUser || examQuestions.length === 0) {
      return;
    }

    setResults(null);
    setSession({
      user: selectedUser,
      mode,
      questions: examQuestions,
      answers: emptyAnswers(examQuestions),
      startedAt: new Date().toISOString(),
    });
    navigate('/exam');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="app-panel rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-semibold tracking-tight">Practice setup</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Choose an exam length, then the arena will balance by topic and difficulty.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {modes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={[
                'rounded-lg border p-5 text-left transition',
                mode === item
                  ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                  : 'border-slate-200 bg-slate-50 hover:border-teal-400 dark:border-slate-800 dark:bg-slate-950/40',
              ].join(' ')}
            >
              <span className="text-3xl font-semibold">{item}</span>
              <span className="mt-1 block text-sm opacity-80">questions</span>
            </button>
          ))}
        </div>

        {notEnough ? (
          <div className="mt-6 flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              Only {questions.length} ready questions are available for a {mode}-question exam. You can still start with all available questions for testing.
            </span>
          </div>
        ) : null}

        {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

        <button
          type="button"
          onClick={startExam}
          disabled={loading || examQuestions.length === 0}
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-teal-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Play className="h-5 w-5" />
          Start exam
        </button>
      </section>

      <aside className="app-panel rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Question pool</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-600 dark:text-slate-400">Ready questions</dt>
            <dd className="font-semibold">{loading ? '...' : questions.length}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-600 dark:text-slate-400">Selected length</dt>
            <dd className="font-semibold">{mode}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-600 dark:text-slate-400">Will use</dt>
            <dd className="font-semibold">{examQuestions.length}</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">By topic</h3>
          <div className="mt-3 space-y-2">
            {loading ? (
              <p className="text-slate-500 dark:text-slate-400">Loading topic counts…</p>
            ) : topicCounts.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No topics available yet.</p>
            ) : (
              topicCounts.map((topic) => (
                <div key={topic.label} className="flex items-center justify-between gap-3">
                  <span className="truncate text-slate-600 dark:text-slate-300">{topic.label}</span>
                  <span className="font-semibold text-slate-950 dark:text-slate-100">{topic.total}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
