import { BarChart3, History, Home, LogOut, Trophy } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useExamSession } from '../hooks/useExamSession';
import { supabase } from '../lib/supabase';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/history', label: 'History', icon: History },
];

export function AppShell() {
  const navigate = useNavigate();
  const { selectedUser } = useExamSession();

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <header className="app-header border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="brand-mark"><BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" /></span>
              <span className="text-xl font-semibold tracking-tight">PL-300 Practice Arena</span>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
              Practice Lab · Power BI Data Analyst
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            <button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main mx-auto max-w-7xl px-4 py-8">
        {selectedUser ? (
          <div className="mb-6 rounded-md border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
            Active user: <span className="font-semibold text-slate-950 dark:text-white">{selectedUser.display_name}</span>
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
