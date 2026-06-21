import type { AnswerState, BreakdownItem, ExamMode, ExamResults, ExamSession, Question } from '../types';

const desiredDifficultyMix: Record<string, number> = {
  easy: 0.25,
  medium: 0.5,
  hard: 0.25,
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function takeBalancedBy<T extends object>(items: T[], total: number, key: keyof T) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const groupKey = String(item[key] || 'other');
    groups.set(groupKey, [...(groups.get(groupKey) || []), item]);
  });

  const selected: T[] = [];
  const sortedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  while (selected.length < total && sortedGroups.some(([, group]) => group.length > 0)) {
    for (const [, group] of sortedGroups) {
      const next = group.shift();
      if (next && selected.length < total) {
        selected.push(next);
      }
    }
  }

  return selected;
}

export function buildExamQuestions(questions: Question[], requestedMode: ExamMode) {
  const availableCount = questions.length;
  const targetCount = Math.min(requestedMode, availableCount);
  const shuffled = shuffle(questions);

  const byDifficulty = new Map<string, Question[]>();
  shuffled.forEach((question) => {
    const key = String(question.difficulty || 'medium').toLowerCase();
    byDifficulty.set(key, [...(byDifficulty.get(key) || []), question]);
  });

  const selected: Question[] = [];
  Object.entries(desiredDifficultyMix).forEach(([difficulty, ratio]) => {
    const count = Math.round(targetCount * ratio);
    selected.push(...(byDifficulty.get(difficulty) || []).slice(0, count));
  });

  const selectedIds = new Set(selected.map((question) => question.id));
  const remaining = shuffled.filter((question) => !selectedIds.has(question.id));
  const balancedRemaining = takeBalancedBy(remaining, targetCount - selected.length, 'domain');

  return shuffle([...selected, ...balancedRemaining].slice(0, targetCount));
}

export function emptyAnswers(questions: Question[]): Record<string, AnswerState> {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      { questionId: question.id, selectedAnswerIds: [], isMarked: false },
    ]),
  );
}

export function isQuestionCorrect(question: Question, answer?: AnswerState) {
  const selected = [...(answer?.selectedAnswerIds || [])].sort();
  const correct = [...question.correctAnswerIds].sort();

  if (selected.length !== correct.length) {
    return false;
  }

  return selected.every((item, index) => item === correct[index]);
}

function breakdown(questions: Question[], answers: Record<string, AnswerState>, key: keyof Question): BreakdownItem[] {
  const groups = new Map<string, { correct: number; total: number }>();

  questions.forEach((question) => {
    const label = String(question[key] || 'Uncategorized');
    const current = groups.get(label) || { correct: 0, total: 0 };
    current.total += 1;
    current.correct += isQuestionCorrect(question, answers[question.id]) ? 1 : 0;
    groups.set(label, current);
  });

  return [...groups.entries()]
    .map(([label, item]) => ({
      label,
      correct: item.correct,
      total: item.total,
      percentage: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function calculateResults(session: ExamSession): ExamResults {
  const submittedAt = session.submittedAt || new Date().toISOString();
  const score = session.questions.filter((question) => isQuestionCorrect(question, session.answers[question.id])).length;
  const total = session.questions.length;
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const durationSeconds = Math.max(
    0,
    Math.round((new Date(submittedAt).getTime() - new Date(session.startedAt).getTime()) / 1000),
  );

  return {
    user: session.user,
    mode: session.mode,
    questions: session.questions,
    answers: session.answers,
    score,
    total,
    percentage,
    passed: percentage >= 70,
    startedAt: session.startedAt,
    submittedAt,
    durationSeconds,
    domainBreakdown: breakdown(session.questions, session.answers, 'domain'),
    skillBreakdown: breakdown(session.questions, session.answers, 'skill'),
    difficultyBreakdown: breakdown(session.questions, session.answers, 'difficulty'),
  };
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
