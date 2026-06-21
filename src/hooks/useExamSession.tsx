import { createContext, useContext, useMemo, useState } from 'react';
import type { AppUser, ExamResults, ExamSession } from '../types';

interface ExamContextValue {
  selectedUser: AppUser | null;
  session: ExamSession | null;
  results: ExamResults | null;
  setSelectedUser: (user: AppUser | null) => void;
  setSession: (session: ExamSession | null) => void;
  setResults: (results: ExamResults | null) => void;
  setAuthProfile: (user: AppUser | null) => void;
  resetExam: () => void;
}

const ExamContext = createContext<ExamContextValue | null>(null);

export function ExamSessionProvider({ children }: { children: React.ReactNode }) {
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [results, setResults] = useState<ExamResults | null>(null);

  const value = useMemo<ExamContextValue>(
    () => ({
      selectedUser,
      session,
      results,
      setSelectedUser,
      setAuthProfile: setSelectedUser,
      setSession,
      setResults,
      resetExam: () => {
        setSession(null);
        setResults(null);
      },
    }),
    [results, selectedUser, session],
  );

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExamSession() {
  const context = useContext(ExamContext);

  if (!context) {
    throw new Error('useExamSession must be used inside ExamSessionProvider');
  }

  return context;
}
