import { ArrowRight, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExamSession } from '../hooks/useExamSession';

export function HomePage() {
  const navigate = useNavigate();
  const { selectedUser, resetExam } = useExamSession();

  function start() {
    resetExam();
    navigate('/setup');
  }

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-semibold tracking-tight">Ready for a focused practice run?</h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
          Signed in as <span className="font-semibold text-slate-950 dark:text-white">{selectedUser?.display_name}</span>. Your results and study overview stay linked to your account.
        </p>
        <div className="mt-8 flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
          <UserRound className="h-9 w-9 text-teal-600 dark:text-teal-400" />
          <div className="flex-1"><p className="font-semibold">{selectedUser?.display_name}</p><p className="text-sm text-slate-600 dark:text-slate-400">Leaderboard alias</p></div>
          <button type="button" onClick={start} className="signal-action inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700">Start exam <ArrowRight className="h-5 w-5" /></button>
        </div>
      </section>
    </div>
  );
}
