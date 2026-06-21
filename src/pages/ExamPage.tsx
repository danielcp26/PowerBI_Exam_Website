import { Bookmark, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { useExamSession } from '../hooks/useExamSession';
import { calculateResults, formatDuration } from '../lib/exam';

export function ExamPage() {
  const navigate = useNavigate();
  const { session, setSession, setResults } = useExamSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!session) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session]);

  if (!session) {
    return <Navigate to="/setup" replace />;
  }

  const activeSession = session;
  const question = activeSession.questions[currentIndex];
  const answer = activeSession.answers[question.id];
  const answeredCount = activeSession.questions.filter((item) => activeSession.answers[item.id]?.selectedAnswerIds.length > 0).length;

  function updateAnswer(selectedAnswerIds: string[]) {
    setSession({
      ...activeSession,
      answers: {
        ...activeSession.answers,
        [question.id]: { ...answer, selectedAnswerIds },
      },
    });
  }

  function toggleMark() {
    setSession({
      ...activeSession,
      answers: {
        ...activeSession.answers,
        [question.id]: { ...answer, isMarked: !answer.isMarked },
      },
    });
  }

  function submitExam() {
    const submittedSession = { ...activeSession, submittedAt: new Date().toISOString() };
    setSession(submittedSession);
    setResults(calculateResults(submittedSession));
    navigate('/results');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Question {currentIndex + 1} of {activeSession.questions.length}</p>
            <p className="text-lg font-semibold">{answeredCount} answered</p>
          </div>
          <div className="text-3xl font-semibold tabular-nums">{formatDuration(elapsedSeconds)}</div>
        </div>

        <QuestionCard question={question} answer={answer} onChange={updateAnswer} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          <button
            type="button"
            onClick={toggleMark}
            className="inline-flex items-center gap-2 rounded-md border border-amber-300 px-4 py-3 font-semibold text-amber-800 transition hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30"
          >
            <Bookmark className={`h-5 w-5 ${answer.isMarked ? 'fill-current' : ''}`} />
            Mark for review
          </button>

          {currentIndex < activeSession.questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.min(activeSession.questions.length - 1, index + 1))}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitExam}
              className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700"
            >
              <Send className="h-5 w-5" />
              Submit exam
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <QuestionNavigator questions={activeSession.questions} answers={activeSession.answers} currentIndex={currentIndex} onJump={setCurrentIndex} />
        <button
          type="button"
          onClick={submitExam}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700"
        >
          <Send className="h-5 w-5" />
          Submit exam
        </button>
      </div>
    </div>
  );
}
