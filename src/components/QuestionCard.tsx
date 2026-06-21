import { CheckSquare, Circle, Square } from 'lucide-react';
import type { AnswerState, Question } from '../types';

interface QuestionCardProps {
  question: Question;
  answer: AnswerState;
  showCorrect?: boolean;
  onChange?: (selectedAnswerIds: string[]) => void;
}

export function QuestionCard({ question, answer, showCorrect = false, onChange }: QuestionCardProps) {
  const multiple = question.questionType === 'multiple_choice';

  function toggle(optionId: string) {
    if (!onChange) {
      return;
    }

    if (multiple) {
      const selected = answer.selectedAnswerIds.includes(optionId)
        ? answer.selectedAnswerIds.filter((id) => id !== optionId)
        : [...answer.selectedAnswerIds, optionId];
      onChange(selected);
      return;
    }

    onChange([optionId]);
  }

  return (
    <article className="question-panel rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{question.domain}</span>
        <span>·</span>
        <span>{question.skill}</span>
        <span>·</span>
        <span>{question.difficulty}</span>
      </div>

      {question.scenario ? (
        <div className="mb-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
          {question.scenario}
        </div>
      ) : null}

      <h1 className="text-xl font-semibold leading-8">{question.prompt}</h1>

      <div className="mt-6 space-y-3">
        {question.options.map((option) => {
          const selected = answer.selectedAnswerIds.includes(option.id);
          const correct = question.correctAnswerIds.includes(option.id);
          const resultClass =
            showCorrect && correct
              ? 'border-teal-500 bg-teal-50 dark:border-teal-600 dark:bg-teal-950/40'
              : showCorrect && selected && !correct
                ? 'border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/30'
                : selected
                  ? 'border-slate-900 bg-slate-100 dark:border-white dark:bg-slate-800'
                  : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-600';

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              disabled={!onChange}
              className={`flex w-full items-start gap-3 rounded-md border p-4 text-left transition ${resultClass}`}
            >
              {multiple ? (
                selected ? <CheckSquare className="mt-0.5 h-5 w-5" /> : <Square className="mt-0.5 h-5 w-5" />
              ) : (
                <Circle className={`mt-0.5 h-5 w-5 ${selected ? 'fill-current' : ''}`} />
              )}
              <span>
                <span className="mr-2 font-semibold">{option.label}.</span>
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      {showCorrect ? (
        <div className="mt-6 rounded-md bg-slate-100 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
          <span className="font-semibold text-slate-950 dark:text-white">Explanation:</span>{' '}
          {question.explanation || 'No explanation was provided for this question.'}
        </div>
      ) : null}
    </article>
  );
}
