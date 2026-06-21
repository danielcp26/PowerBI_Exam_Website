export type ExamMode = 15 | 30 | 50;

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'scenario';

export type Difficulty = 'easy' | 'medium' | 'hard' | string;

export interface AppUser {
  id: string;
  display_name: string;
  alias?: string | null;
  email?: string | null;
  auth_user_id?: string | null;
  role?: string | null;
}

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
}

export interface Question {
  id: string;
  questionType: QuestionType;
  prompt: string;
  scenario?: string | null;
  options: QuestionOption[];
  correctAnswerIds: string[];
  explanation?: string | null;
  studySources: string[];
  domain: string;
  skill: string;
  difficulty: Difficulty;
}

export interface AnswerState {
  questionId: string;
  selectedAnswerIds: string[];
  isMarked: boolean;
}

export interface ExamSession {
  user: AppUser;
  mode: ExamMode;
  questions: Question[];
  answers: Record<string, AnswerState>;
  startedAt: string;
  submittedAt?: string;
}

export interface BreakdownItem {
  label: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface ExamResults {
  attemptId?: string;
  user: AppUser;
  mode: ExamMode;
  questions: Question[];
  answers: Record<string, AnswerState>;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  domainBreakdown: BreakdownItem[];
  skillBreakdown: BreakdownItem[];
  difficultyBreakdown: BreakdownItem[];
}

export interface LeaderboardRow {
  user_id?: string;
  display_name?: string;
  mode?: number;
  question_count?: number;
  attempts?: number;
  best_score?: number;
  best_percentage?: number;
  average_percentage?: number;
  last_attempt_at?: string;
  [key: string]: unknown;
}
