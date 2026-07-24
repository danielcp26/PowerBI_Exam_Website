import { BookOpen, Flag, RotateCcw, Target } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BreakdownList } from '../components/BreakdownList';
import { MistakeMap } from '../components/MistakeMap';
import { MetricCard } from '../components/MetricCard';
import { QuestionCard } from '../components/QuestionCard';
import { useExamSession } from '../hooks/useExamSession';
import { isQuestionCorrect } from '../lib/exam';
import { supabase } from '../lib/supabase';
import { sourceLabel, studyGuideForQuestion } from '../lib/studySources';

const savedAttemptKeys = new Set<string>();

export function ResultsPage() {
  const navigate = useNavigate();
  const { results, setResults, resetExam } = useExamSession();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const saveAttemptRef = useRef(false);

  useEffect(() => {
    const attemptKey = results ? `${results.user.id}:${results.startedAt}` : '';
    if (!results || results.attemptId || saving || saveAttemptRef.current || savedAttemptKeys.has(attemptKey)) {
      return;
    }

    saveAttemptRef.current = true;
    savedAttemptKeys.add(attemptKey);
    setSaving(true);
    saveResults()
      .catch((error: Error) => {
        savedAttemptKeys.delete(attemptKey);
        saveAttemptRef.current = false;
        setSaveError(error.message);
      })
      .finally(() => setSaving(false));

    async function saveResults() {
      if (!results) {
        return;
      }

      const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: results.user.id,
          mode: results.mode,
          total_questions: results.total,
          score: results.score,
          percentage: results.percentage,
          passed: results.passed,
          started_at: results.startedAt,
          completed_at: results.submittedAt,
        })
        .select('id')
        .single();

      if (attemptError) {
        throw attemptError;
      }

      const attemptId = String(attempt?.id);
      const answerRows = results.questions.map((question) => ({
        attempt_id: attemptId,
        question_id: question.id,
        selected_answers: results.answers[question.id]?.selectedAnswerIds || [],
        correct_answers: question.correctAnswerIds,
        is_correct: isQuestionCorrect(question, results.answers[question.id]),
      }));

      const { error: answersError } = await supabase.from('attempt_answers').insert(answerRows);
      if (answersError) {
        await supabase.from('exam_attempts').delete().eq('id', attemptId);
        throw answersError;
      }

      setResults({ ...results, attemptId });

      const missedQuestions = results.questions
        .filter((question) => !isQuestionCorrect(question, results.answers[question.id]))
        .map((question) => ({
          prompt: question.prompt,
          domain: question.domain,
          skill: question.skill,
          explanation: question.explanation,
          studySources: question.studySources,
        }));

      const { error: emailError } = await supabase.functions.invoke('send-exam-overview', {
        body: {
          alias: results.user.display_name,
          score: results.score,
          total: results.total,
          percentage: results.percentage,
          passed: results.passed,
          domainBreakdown: results.domainBreakdown,
          missedQuestions,
        },
      });

      setEmailStatus(
        emailError
          ? 'Your result was saved. Email overview is not configured yet: deploy the send-exam-overview Edge Function and set its Resend secrets.'
          : 'A study overview has been sent to your email.',
      );
    }
  }, [results, saving, setResults]);

  if (!results) {
    return <Navigate to="/setup" replace />;
  }
  const finalResults = results;
  const focusAreas = useMemo(() => {
    const groups = new Map<string, { domain: string; skill: string; missed: number; sources: Set<string> }>();
    results.questions.forEach((question) => {
      if (isQuestionCorrect(question, results.answers[question.id])) return;
      const key = `${question.domain}|${question.skill}`;
      const current = groups.get(key) || { domain: question.domain, skill: question.skill, missed: 0, sources: new Set<string>() };
      current.missed += 1;
      question.studySources.forEach((source) => current.sources.add(source));
      groups.set(key, current);
    });
    return [...groups.values()].sort((a, b) => b.missed - a.missed);
  }, [results]);
  const missedGuidance = useMemo(() => results.questions
    .filter((question) => !isQuestionCorrect(question, results.answers[question.id]))
    .map((question) => {
      const guide = studyGuideForQuestion(question.skill, question.prompt, question.explanation || '');
      return { question, guide, sources: guide.sources };
    }), [results]);

  async function reportQuestion(questionId: string) {
    const { error } = await supabase.from('question_flags').insert({
      question_id: questionId,
      user_id: finalResults.user.id,
      attempt_id: finalResults.attemptId,
      reason: 'Reported from results review',
    });

    if (!error) {
      setFlagged((current) => ({ ...current, [questionId]: true }));
    }
  }

  function startAgain() {
    resetExam();
    navigate('/setup');
  }

  return (
    <div className="space-y-8">
      <section className="app-panel rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Exam analytics</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {results.passed ? 'Passed' : 'Needs review'}: {results.score} correct out of {results.total}. Passing threshold is 70%.
            </p>
            {saving ? <p className="mt-2 text-sm text-slate-500">Saving attempt...</p> : null}
            {saveError ? <p className="mt-2 text-sm text-rose-600">{saveError}</p> : null}
            {emailStatus ? <p className="mt-2 text-sm text-teal-700 dark:text-teal-300">{emailStatus}</p> : null}
          </div>
          <button
            type="button"
            onClick={startAgain}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-5 w-5" />
            New exam
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MetricCard label="Score" value={`${results.score}/${results.total}`} tone={results.passed ? 'good' : 'warn'} />
          <MetricCard label="Percentage" value={`${results.percentage}%`} tone={results.passed ? 'good' : 'warn'} />
          <MetricCard label="Mode" value={`${results.mode} questions`} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownList title="Domain Breakdown" items={results.domainBreakdown} />
        <BreakdownList title="Skill Breakdown" items={results.skillBreakdown} />
        <BreakdownList title="Difficulty Breakdown" items={results.difficultyBreakdown} />
      </div>

      <MistakeMap
        areas={focusAreas}
        title="Mistake map for this attempt"
        description="Category totals with the contributing subcategories below each one."
        emptyMessage="No incorrect answers in this attempt."
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="analytics-panel rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2"><Target className="h-5 w-5 text-rose-600" /><h2 className="text-xl font-semibold">Priority focus areas</h2></div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Start with the skills where the most questions were missed.</p>
          {focusAreas.length ? (
            <ol className="mt-5 space-y-3">
              {focusAreas.map((area, index) => (
                <li key={`${area.domain}-${area.skill}`} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 p-4 dark:bg-slate-950">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{area.domain}</p><p className="mt-1 font-semibold">{area.skill}</p></div>
                  <span className="shrink-0 rounded-md bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-100">{area.missed} missed</span>
                </li>
              ))}
            </ol>
          ) : <p className="mt-5 rounded-md bg-teal-50 p-4 text-sm text-teal-800 dark:bg-teal-950/30 dark:text-teal-200">No missed questions. That is a very tidy result.</p>}
        </div>

        <div className="analytics-panel rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-teal-600" /><h2 className="text-xl font-semibold">Study sources</h2></div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">References connected to your missed questions.</p>
          <div className="mt-5 space-y-3">
            {focusAreas.flatMap((area) => [...area.sources].map((source) => ({ source, label: area.skill }))).slice(0, 8).map(({ source, label }) => (
              <a key={`${label}-${source}`} href={source} target="_blank" rel="noreferrer" className="block rounded-md border border-slate-200 p-3 text-sm font-semibold text-teal-700 transition hover:border-teal-400 dark:border-slate-800 dark:text-teal-300">{label}: {sourceLabel(source)}</a>
            ))}
            {!focusAreas.some((area) => area.sources.size) ? <a href="https://learn.microsoft.com/training/browse/?products=power-bi" target="_blank" rel="noreferrer" className="block rounded-md border border-slate-200 p-4 text-sm font-semibold text-teal-700 hover:border-teal-400 dark:border-slate-800 dark:text-teal-300">Microsoft Learn: Power BI training</a> : null}
          </div>
        </div>
      </section>

      <section className="analytics-panel rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-teal-400" /><h2 className="text-xl font-semibold">What to study from this attempt</h2></div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Each missed question is mapped to the closest PL-300 study guide area and a Microsoft Learn resource.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {missedGuidance.map(({ question, guide, sources }) => (
            <article key={question.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{question.domain} · {question.skill}</p>
              <h3 className="mt-3 text-base font-semibold leading-6">{question.prompt}</h3>
              <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-sm font-semibold text-slate-200">{guide.guidePath}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{guide.concept}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{guide.correction}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {guide.keywords.map((keyword) => <span key={keyword} className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">{keyword}</span>)}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {sources.map((source) => (
                    <a key={source} href={source} target="_blank" rel="noreferrer" className="text-sm font-semibold text-teal-300 hover:underline">{sourceLabel(source)}</a>
                  ))}
                </div>
              </div>
            </article>
          ))}
          {!missedGuidance.length ? <p className="rounded-md bg-teal-950/20 p-4 text-sm text-teal-100">No missed questions in this attempt. Keep building coverage with another mode.</p> : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Review</h2>
        {results.questions.map((question, index) => {
          const answer = results.answers[question.id];
          const correct = isQuestionCorrect(question, answer);

          return (
            <div key={question.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`rounded-md px-3 py-1 text-sm font-semibold ${correct ? 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100' : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100'}`}>
                  Question {index + 1}: {correct ? 'Correct' : 'Incorrect'}
                </span>
                <button
                  type="button"
                  onClick={() => reportQuestion(question.id)}
                  disabled={flagged[question.id]}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <Flag className="h-4 w-4" />
                  {flagged[question.id] ? 'Reported' : 'Report question'}
                </button>
              </div>
              <QuestionCard question={question} answer={answer} showCorrect />
            </div>
          );
        })}
      </section>
    </div>
  );
}
