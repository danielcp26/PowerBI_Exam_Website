import type { AnswerState, Question } from '../types';

interface QuestionNavigatorProps {
  questions: Question[];
  answers: Record<string, AnswerState>;
  currentIndex: number;
  onJump: (index: number) => void;
}

export function QuestionNavigator({ questions, answers, currentIndex, onJump }: QuestionNavigatorProps) {
  return (
    <aside className="navigator-panel rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Questions</h2>
      <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-4">
        {questions.map((question, index) => {
          const answer = answers[question.id];
          const answered = answer?.selectedAnswerIds.length > 0;
          const marked = answer?.isMarked;

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onJump(index)}
              className={[
                'relative rounded-md border px-2 py-2 text-sm font-semibold transition',
                currentIndex === index
                  ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                  : answered
                    ? 'border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
              ].join(' ')}
            >
              {index + 1}
              {marked ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" /> : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
