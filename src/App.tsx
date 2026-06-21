import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ExamSessionProvider, useExamSession } from './hooks/useExamSession';
import { useAuthUser } from './hooks/useAuthUser';
import { ExamPage } from './pages/ExamPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LoginPage } from './pages/LoginPage';
import { PracticeSetupPage } from './pages/PracticeSetupPage';
import { ResultsPage } from './pages/ResultsPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

export default function App() {
  return (
    <ExamSessionProvider>
      <AppRoutes />
    </ExamSessionProvider>
  );
}

function AppRoutes() {
  const location = useLocation();
  const { profile, loading, profileError } = useAuthUser();
  const { setAuthProfile } = useExamSession();

  useEffect(() => setAuthProfile(profile), [profile, setAuthProfile]);

  if (location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading your practice arena...</div>;
  }

  if (!profile) {
    return <Routes><Route path="*" element={<LoginPage setupError={profileError} />} /></Routes>;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/setup" element={<PracticeSetupPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
