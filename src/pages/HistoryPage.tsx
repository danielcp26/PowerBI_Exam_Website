import { AlertCircle, BarChart3, BookOpen, CheckCircle2, History, Search, Target, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { MetricCard } from '../components/MetricCard';
import { MistakeMap } from '../components/MistakeMap';
import { useExamSession } from '../hooks/useExamSession';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { normalizeQuestion } from '../lib/normalizers';
import { sourceLabel, studyGuideForQuestion } from '../lib/studySources';
import { supabase } from '../lib/supabase';
import type { Question, QuestionOption } from '../types';

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
  correct_answers: string[] | null;
  is_correct: boolean;
}

interface FocusArea {
  domain: string;
  skill: string;
  missed: number;
}

interface TopicReadiness {
  domain: string;
  skill: string;
  poolTotal: number;
  uniqueSeen: number;
  answered: number;
  correct: number;
  missed: number;
  accuracy: number;
  coverage: number;
  readiness: number;
  status: string;
}

interface MissedQuestion {
  id: string;
  prompt: string;
  scenario: string;
  options: QuestionOption[];
  domain: string;
  skill: string;
  difficulty: string;
  explanation: string;
  selectedIds: string[];
  correctIds: string[];
  selectedText: string;
  correctText: string;
  timesMissed: number;
  lastMissedAt: string;
  recovered: boolean;
  guidePath: string;
  concept: string;
  correction: string;
  keywords: string[];
  sources: string[];
}

interface HistoryAnalytics {
  uniqueResponded: number;
  notYetResponded: number;
  totalAvailable: number;
  readiness: number;
  passRate: number;
  averageScore: number;
  trendLabel: string;
  mostMissed: FocusArea | null;
  focusAreas: FocusArea[];
  topicReadiness: TopicReadiness[];
  missedQuestions: MissedQuestion[];
  conceptAreas: Array<{ skill: string; domain: string; missed: number; concept: string; correction: string; sources: string[] }>;
}

function optionText(question: Question, ids: string[]) {
  if (!ids.length) return 'No answer selected';
  return ids
    .map((id) => {
      const option = question.options.find((item) => item.id === id);
      return option ? `${option.label}. ${option.text}` : id;
    })
    .join('; ');
}

function readinessStatus(score: number, answered: number) {
  if (!answered) return 'Unseen';
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Developing';
  if (score >= 50) return 'Weak point';
  return 'Critical gap';
}

function statusClass(status: string) {
  if (status === 'Strong') return 'bg-teal-500/15 text-teal-200';
  if (status === 'Developing') return 'bg-sky-500/15 text-sky-200';
  if (status === 'Weak point') return 'bg-amber-500/15 text-amber-200';
  if (status === 'Critical gap') return 'bg-rose-500/15 text-rose-200';
  return 'bg-slate-700/50 text-slate-300';
}

export function HistoryPage() {
  const { selectedUser } = useExamSession();
  const [analytics, setAnalytics] = useState<HistoryAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [missFilter, setMissFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const { data, loading, error } = useSupabaseQuery<AttemptRow>(async () => {
    let query = supabase.from('exam_attempts').select('*').order('completed_at', { ascending: false }).limit(100);
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
      const attemptById = new Map(data.map((attempt) => [attempt.id, attempt]));
      const [{ data: questionRows, error: questionsError }, answersResult] = await Promise.all([
        supabase.from('v_exam_ready_questions').select('*'),
        attemptIds.length
          ? supabase.from('attempt_answers').select('attempt_id,question_id,selected_answers,correct_answers,is_correct').in('attempt_id', attemptIds)
          : Promise.resolve({ data: [] as AnswerRow[], error: null }),
      ]);
      if (!active) return;
      if (questionsError || answersResult.error) {
        setAnalyticsError(questionsError?.message || answersResult.error?.message || 'Unable to load historical analytics.');
        setAnalyticsLoading(false);
        return;
      }

      const questions = (questionRows || []).map(normalizeQuestion);
      const questionById = new Map(questions.map((question) => [question.id, question]));
      const answers = (answersResult.data as AnswerRow[]).sort((a, b) => {
        const left = attemptById.get(a.attempt_id)?.completed_at || attemptById.get(a.attempt_id)?.created_at || '';
        const right = attemptById.get(b.attempt_id)?.completed_at || attemptById.get(b.attempt_id)?.created_at || '';
        return left.localeCompare(right);
      });

      const answeredIds = new Set<string>();
      const focusGroups = new Map<string, FocusArea>();
      const topicGroups = new Map<string, TopicReadiness & { seenIds: Set<string> }>();
      const missedByQuestion = new Map<string, MissedQuestion>();

      questions.forEach((question) => {
        const key = `${question.domain}|${question.skill}`;
        const current = topicGroups.get(key) || {
          domain: question.domain,
          skill: question.skill,
          poolTotal: 0,
          uniqueSeen: 0,
          answered: 0,
          correct: 0,
          missed: 0,
          accuracy: 0,
          coverage: 0,
          readiness: 0,
          status: 'Unseen',
          seenIds: new Set<string>(),
        };
        current.poolTotal += 1;
        topicGroups.set(key, current);
      });

      answers.forEach((answer) => {
        const question = questionById.get(answer.question_id);
        if (!question) return;
        const selected = answer.selected_answers || [];
        if (selected.length > 0) answeredIds.add(answer.question_id);

        const key = `${question.domain}|${question.skill}`;
        const topic = topicGroups.get(key);
        if (topic) {
          topic.seenIds.add(question.id);
          topic.answered += selected.length > 0 ? 1 : 0;
          topic.correct += answer.is_correct ? 1 : 0;
          topic.missed += answer.is_correct ? 0 : 1;
        }

        if (answer.is_correct) {
          const existing = missedByQuestion.get(question.id);
          if (existing) existing.recovered = true;
          return;
        }

        const current = focusGroups.get(key) || { domain: question.domain, skill: question.skill, missed: 0 };
        current.missed += 1;
        focusGroups.set(key, current);

        const attemptDate = attemptById.get(answer.attempt_id)?.completed_at || attemptById.get(answer.attempt_id)?.created_at || '';
        const guide = studyGuideForQuestion(question.skill, question.prompt, question.explanation || '');
        const existing = missedByQuestion.get(question.id);
        missedByQuestion.set(question.id, {
          id: question.id,
          prompt: question.prompt,
          scenario: question.scenario || '',
          options: question.options,
          domain: question.domain,
          skill: question.skill,
          difficulty: String(question.difficulty),
          explanation: question.explanation || 'No explanation was provided for this question.',
          selectedIds: selected,
          correctIds: answer.correct_answers || question.correctAnswerIds,
          selectedText: optionText(question, selected),
          correctText: optionText(question, answer.correct_answers || question.correctAnswerIds),
          timesMissed: (existing?.timesMissed || 0) + 1,
          lastMissedAt: attemptDate,
          recovered: existing?.recovered || false,
          guidePath: guide.guidePath,
          concept: guide.concept,
          correction: guide.correction,
          keywords: guide.keywords,
          sources: guide.sources,
        });
      });

      const topicReadiness = [...topicGroups.values()]
        .map((topic) => {
          const accuracy = topic.answered ? Math.round((topic.correct / topic.answered) * 100) : 0;
          const coverage = topic.poolTotal ? Math.round((topic.seenIds.size / topic.poolTotal) * 100) : 0;
          const readiness = topic.answered ? Math.round((accuracy * 0.75) + (coverage * 0.25)) : 0;
          return { ...topic, uniqueSeen: topic.seenIds.size, accuracy, coverage, readiness, status: readinessStatus(readiness, topic.answered) };
        })
        .sort((a, b) => a.readiness - b.readiness || b.missed - a.missed);

      const focusAreas = [...focusGroups.values()].sort((a, b) => b.missed - a.missed);
      const attemptsWithScores = data.filter((attempt) => typeof attempt.percentage === 'number');
      const recent = [...attemptsWithScores].reverse();
      const firstHalf = recent.slice(0, Math.max(1, Math.floor(recent.length / 2)));
      const secondHalf = recent.slice(Math.max(1, Math.floor(recent.length / 2)));
      const avg = (rows: AttemptRow[]) => rows.length ? rows.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / rows.length : 0;
      const delta = avg(secondHalf) - avg(firstHalf);
      const missedQuestions = [...missedByQuestion.values()].sort((a, b) => b.timesMissed - a.timesMissed || b.lastMissedAt.localeCompare(a.lastMissedAt));
      const conceptAreas = focusAreas.slice(0, 6).map((area) => {
        const guide = studyGuideForQuestion(area.skill);
        return { ...area, concept: guide.concept, correction: guide.correction, sources: guide.sources };
      });

      setAnalytics({
        uniqueResponded: answeredIds.size,
        totalAvailable: questions.length,
        notYetResponded: Math.max(0, questions.length - answeredIds.size),
        readiness: topicReadiness.length ? Math.round(topicReadiness.reduce((sum, topic) => sum + topic.readiness, 0) / topicReadiness.length) : 0,
        passRate: data.length ? Math.round((data.filter((attempt) => attempt.passed).length / data.length) * 100) : 0,
        averageScore: attemptsWithScores.length ? Math.round(avg(attemptsWithScores)) : 0,
        trendLabel: Math.abs(delta) < 3 ? 'Stable' : delta > 0 ? 'Improving' : 'Declining',
        mostMissed: focusAreas[0] || null,
        focusAreas: focusAreas.slice(0, 12),
        topicReadiness,
        missedQuestions,
        conceptAreas,
      });
      setAnalyticsLoading(false);
    }
    void loadAnalytics();
    return () => { active = false; };
  }, [data, selectedUser]);

  const trend = useMemo(() => [...data].reverse().slice(-12), [data]);
  const missedTopics = useMemo(() => {
    if (!analytics) return [];
    return [...new Set(analytics.missedQuestions.map((question) => question.domain))].sort((a, b) => a.localeCompare(b));
  }, [analytics]);
  const missedDifficulties = useMemo(() => {
    if (!analytics) return [];
    return [...new Set(analytics.missedQuestions.map((question) => question.difficulty))].sort((a, b) => a.localeCompare(b));
  }, [analytics]);
  const filteredMisses = useMemo(() => {
    if (!analytics) return [];
    const query = missFilter.trim().toLowerCase();
    return analytics.missedQuestions.filter((question) => {
      const matchesSearch = !query || `${question.prompt} ${question.scenario} ${question.domain} ${question.skill} ${question.difficulty} ${question.keywords.join(' ')}`.toLowerCase().includes(query);
      const matchesTopic = topicFilter === 'all' || question.domain === topicFilter;
      const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
      return matchesSearch && matchesTopic && matchesDifficulty;
    });
  }, [analytics, difficultyFilter, missFilter, topicFilter]);

  return (
    <section className="space-y-8">
      <div className="app-panel rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-semibold tracking-tight">Exam readiness dashboard</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {selectedUser ? `Long-term weak points, missed questions, and study guidance for ${selectedUser.display_name}.` : 'Choose a user on Home to view attempt history.'}
        </p>
        {analyticsLoading ? <p className="mt-6 text-sm text-slate-500">Building your analytics...</p> : null}
        {analyticsError ? <p className="mt-6 text-sm text-rose-600">{analyticsError}</p> : null}
      </div>

      {analytics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Readiness" value={`${analytics.readiness}%`} tone={analytics.readiness >= 70 ? 'good' : 'warn'} />
            <MetricCard label="Pass consistency" value={`${analytics.passRate}%`} tone={analytics.passRate >= 70 ? 'good' : 'warn'} />
            <MetricCard label="Average score" value={`${analytics.averageScore}%`} />
            <MetricCard label="Questions seen" value={`${analytics.uniqueResponded}/${analytics.totalAvailable}`} tone="good" />
            <MetricCard label="Trend" value={analytics.trendLabel} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="analytics-panel rounded-lg border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-teal-400" /><h2 className="text-lg font-semibold">Recent performance</h2></div>
              <div className="mt-6 flex h-32 items-end gap-2">
                {trend.map((attempt) => <div key={attempt.id} className="group flex min-w-0 flex-1 flex-col justify-end"><span className="mb-2 text-center text-xs font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100">{attempt.percentage}%</span><div className="min-h-1 rounded-t bg-teal-500/80" style={{ height: `${Math.max(4, attempt.percentage || 0)}%` }} /></div>)}
              </div>
              <p className="mt-4 text-xs text-slate-500">Each bar is one completed exam, ordered from oldest to newest.</p>
            </div>

            <div className="analytics-panel rounded-lg border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-rose-400" /><h2 className="text-lg font-semibold">Weakest point</h2></div>
              {analytics.mostMissed ? (
                <div className="mt-5 rounded-md border border-rose-400/20 bg-rose-950/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{analytics.mostMissed.domain}</p>
                  <p className="mt-1 text-xl font-semibold">{analytics.mostMissed.skill}</p>
                  <p className="mt-2 text-sm text-rose-200">Missed {analytics.mostMissed.missed} times across saved attempts.</p>
                </div>
              ) : <p className="mt-5 text-sm text-slate-400">Complete an exam to identify recurring focus areas.</p>}
            </div>
          </div>

          <MistakeMap
            areas={analytics.focusAreas}
            title="Historical mistake map"
            description="Repeated misses across all saved attempts, grouped by category and subcategory."
            emptyMessage="Complete an exam to build your historical mistake map."
          />

          <section className="analytics-panel rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-teal-400" /><h2 className="text-xl font-semibold">Topic preparedness</h2></div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Readiness combines accuracy and question-pool coverage so unseen areas still count as risk.</p>
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                  <tr><th className="px-4 py-3">Topic</th><th className="px-4 py-3">Accuracy</th><th className="px-4 py-3">Coverage</th><th className="px-4 py-3">Readiness</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {analytics.topicReadiness.map((topic) => (
                    <tr key={`${topic.domain}-${topic.skill}`}>
                      <td className="px-4 py-4"><p className="font-semibold">{topic.skill}</p><p className="mt-1 text-xs text-slate-500">{topic.domain}</p></td>
                      <td className="px-4 py-4">{topic.correct}/{topic.answered} · {topic.accuracy}%</td>
                      <td className="px-4 py-4">{topic.uniqueSeen}/{topic.poolTotal} · {topic.coverage}%</td>
                      <td className="px-4 py-4"><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-teal-500" style={{ width: `${topic.readiness}%` }} /></div><span className="mt-1 block text-xs text-slate-400">{topic.readiness}%</span></td>
                      <td className="px-4 py-4"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(topic.status)}`}>{topic.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {analytics.conceptAreas.map((area) => (
              <article key={`${area.domain}-${area.skill}`} className="analytics-panel rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{area.domain}</p><h3 className="mt-1 text-lg font-semibold">{area.skill}</h3></div>
                  <span className="rounded-md bg-rose-500/15 px-3 py-1 text-sm font-semibold text-rose-200">{area.missed} missed</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{area.concept}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{area.correction}</p>
                <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:underline" href={area.sources[0]} target="_blank" rel="noreferrer"><BookOpen className="h-4 w-4" /> Study this concept</a>
              </article>
            ))}
          </section>

          <section className="analytics-panel rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-xl font-semibold">Missed question study library</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Every missed question, with the exact PL-300 guide area and Microsoft Learn links to review.</p></div>
              <label className="relative block sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input value={missFilter} onChange={(event) => setMissFilter(event.target.value)} placeholder="Search misses..." className="w-full rounded-md border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-3 text-sm outline-none focus:border-teal-400" />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_240px_180px]">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topic</span>
                <select
                  value={topicFilter}
                  onChange={(event) => setTopicFilter(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-100 outline-none focus:border-teal-400"
                >
                  <option value="all">All topics ({analytics.missedQuestions.length})</option>
                  {missedTopics.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</span>
                <select
                  value={difficultyFilter}
                  onChange={(event) => setDifficultyFilter(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-100 outline-none focus:border-teal-400"
                >
                  <option value="all">All difficulties</option>
                  {missedDifficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </label>
              <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Showing</p>
                <p className="mt-1 text-2xl font-semibold">{filteredMisses.length}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {filteredMisses.map((question) => (
                <article key={question.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>{question.domain}</span><span>·</span><span>{question.skill}</span><span>·</span><span>{question.difficulty}</span>
                    <span className="ml-auto rounded-md bg-rose-500/15 px-2 py-1 text-rose-200">{question.timesMissed} missed</span>
                    {question.recovered ? <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/15 px-2 py-1 text-teal-200"><CheckCircle2 className="h-3 w-3" /> Later corrected</span> : null}
                  </div>
                  {question.scenario ? (
                    <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/60 p-4 text-sm leading-6 text-slate-300">
                      {question.scenario}
                    </div>
                  ) : null}
                  <h3 className="mt-4 text-lg font-semibold leading-7">{question.prompt}</h3>
                  {question.options.length ? (
                    <div className="mt-4 space-y-2">
                      {question.options.map((option) => {
                        const selected = question.selectedIds.includes(option.id);
                        const correct = question.correctIds.includes(option.id);
                        const optionClass = correct
                          ? 'border-teal-500/40 bg-teal-950/20 text-teal-100'
                          : selected
                            ? 'border-rose-500/40 bg-rose-950/20 text-rose-100'
                            : 'border-slate-800 bg-slate-950/40 text-slate-300';

                        return (
                          <div key={option.id} className={`rounded-md border p-3 text-sm ${optionClass}`}>
                            <div className="flex items-start gap-3">
                              <span className="shrink-0 font-semibold">{option.label}.</span>
                              <span className="leading-6">{option.text}</span>
                              <span className="ml-auto shrink-0 text-xs font-semibold uppercase tracking-wide">
                                {correct ? 'Correct' : selected ? 'Selected' : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-md bg-rose-950/20 p-3 text-sm"><p className="font-semibold text-rose-200">Your last missed answer</p><p className="mt-1 text-slate-300">{question.selectedText}</p></div>
                    <div className="rounded-md bg-teal-950/20 p-3 text-sm"><p className="font-semibold text-teal-200">Correct answer</p><p className="mt-1 text-slate-300">{question.correctText}</p></div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">{question.explanation}</p>
                  <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-sm font-semibold text-slate-200">{question.guidePath}</p>
                    <p className="mt-2 text-sm text-slate-400">{question.concept}</p>
                    <p className="mt-2 text-sm text-slate-400">{question.correction}</p>
                    <div className="mt-3 flex flex-wrap gap-2">{question.keywords.map((keyword) => <span key={keyword} className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">{keyword}</span>)}</div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {question.sources.map((source) => <a key={source} href={source} target="_blank" rel="noreferrer" className="text-sm font-semibold text-teal-300 hover:underline">{sourceLabel(source)}</a>)}
                    </div>
                  </div>
                </article>
              ))}
              {!filteredMisses.length ? <p className="rounded-md bg-teal-950/20 p-4 text-sm text-teal-100">No missed questions match these filters.</p> : null}
            </div>
          </section>
        </>
      ) : null}

      {loading ? <p className="mt-8 text-sm text-slate-500">Loading attempts...</p> : null}
      {error ? <p className="mt-8 text-sm text-rose-600">{error}</p> : null}
      {!loading && data.length === 0 ? <EmptyState icon={History} title="No attempts yet" message="Completed exams will appear here after they are saved." /> : null}

      {data.length > 0 ? <div className="app-panel overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"><table className="w-full text-left text-sm"><thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Result</th></tr></thead><tbody className="divide-y divide-slate-800">{data.map((attempt) => <tr key={attempt.id}><td className="px-4 py-4">{new Date(attempt.completed_at || attempt.created_at || '').toLocaleString()}</td><td className="px-4 py-4">{attempt.mode || attempt.total_questions} questions</td><td className="px-4 py-4">{attempt.score}/{attempt.total_questions || attempt.mode} · {attempt.percentage}%</td><td className="px-4 py-4"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${attempt.passed ? 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'}`}>{attempt.passed ? 'Pass' : 'Review'}</span></td></tr>)}</tbody></table></div> : null}
    </section>
  );
}
