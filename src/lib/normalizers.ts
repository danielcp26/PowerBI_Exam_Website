import type { AppUser, Question, QuestionOption, QuestionType } from '../types';
import { studySourcesForSkill } from './studySources';

type Row = Record<string, unknown>;

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function value(row: Row, keys: string[]) {
  return keys.map((key) => row[key]).find((item) => item !== undefined && item !== null);
}

function textValue(row: Row, keys: string[], fallback = '') {
  const found = value(row, keys);
  return found === undefined || found === null ? fallback : String(found);
}

function arrayValue(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String);
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      return raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return raw === undefined || raw === null ? [] : [String(raw)];
}

function normalizeOptions(raw: unknown): QuestionOption[] {
  const parsed = typeof raw === 'string' ? safeJson(raw) : raw;

  if (Array.isArray(parsed)) {
    return parsed.map((option, index) => {
      if (typeof option === 'string') {
        const label = letters[index] ?? String(index + 1);
        return { id: label, label, text: option };
      }

      const item = option as Row;
      const label = textValue(item, ['label', 'key', 'option_label'], letters[index] ?? String(index + 1));
      return {
        id: textValue(item, ['id', 'value', 'key', 'label', 'option_id'], label),
        label,
        text: textValue(item, ['text', 'answer', 'option_text', 'value'], label),
      };
    });
  }

  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed as Record<string, unknown>).map(([key, option], index) => ({
      id: key,
      label: key.length <= 3 ? key : letters[index] ?? key,
      text: String(option),
    }));
  }

  return [];
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function normalizeQuestionType(raw: string): QuestionType {
  if (raw === 'multiple_choice' || raw === 'true_false' || raw === 'scenario') {
    return raw;
  }

  return 'single_choice';
}

export function normalizeUser(row: Row): AppUser {
  return {
    id: textValue(row, ['id', 'user_id']),
    display_name: textValue(row, ['alias', 'display_name', 'name', 'username'], 'User'),
    alias: textValue(row, ['alias', 'display_name'], ''),
    email: textValue(row, ['email'], ''),
    auth_user_id: textValue(row, ['auth_user_id'], ''),
    role: textValue(row, ['role'], ''),
  };
}

export function normalizeQuestion(row: Row): Question {
  const options = normalizeOptions(value(row, ['options', 'answer_options', 'choices', 'answers']));
  const correctAnswers = arrayValue(value(row, ['correct_answer_ids', 'correct_answers', 'correct_answer', 'answer_key']));
  const questionType = normalizeQuestionType(textValue(row, ['question_type', 'type'], 'single_choice'));

  return {
    id: textValue(row, ['id', 'question_id']),
    questionType,
    prompt: textValue(row, ['prompt', 'question', 'question_text', 'stem']),
    scenario: textValue(row, ['scenario', 'case_study', 'scenario_text'], ''),
    options,
    correctAnswerIds: questionType === 'true_false' && correctAnswers.length === 0 ? ['true'] : correctAnswers,
    explanation: textValue(row, ['explanation', 'rationale', 'answer_explanation'], ''),
    studySources: studySourcesForSkill(
      textValue(row, ['skill', 'skill_name', 'subtopic'], 'General'),
      arrayValue(value(row, ['study_sources', 'source_urls', 'sources', 'reference_urls', 'reference_url'])),
    ),
    domain: textValue(row, ['domain', 'domain_name', 'topic'], 'Uncategorized'),
    skill: textValue(row, ['skill', 'skill_name', 'subtopic'], 'General'),
    difficulty: textValue(row, ['difficulty', 'difficulty_level'], 'medium'),
  };
}
