import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Category, Question } from '../types';
import { decodeHtmlEntities, filterValidQuestions, sanitizeQuestion } from './questionQuality';

const CACHE_KEY = 'bb.opentdb.v2';
const CACHE_MAX_AGE_MS = 7 * 86400000;

const CATEGORY_MAP: Record<string, Category> = {
  General: 'General',
  Science: 'Science',
  History: 'History',
  Geography: 'Geography',
  Sports: 'Sports',
  Entertainment: 'Entertainment',
  Art: 'Art',
  Politics: 'Politics',
  Animals: 'Animals',
};

interface OpenTdbResponse {
  response_code: number;
  results: {
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }[];
}

function decodeHtml(s: string): string {
  return decodeHtmlEntities(s);
}

function mapCategory(raw: string): Category {
  const name = raw.replace(/^.*:\s*/, '').trim();
  return CATEGORY_MAP[name] ?? 'General';
}

function toQuestion(r: OpenTdbResponse['results'][0], idx: number): Question | null {
  if (r.type !== 'multiple') return null;
  const correct = decodeHtml(r.correct_answer);
  const wrong = r.incorrect_answers.map(decodeHtml);
  const options = [correct, ...wrong];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const answer = options.indexOf(correct);
  if (answer < 0) return null;
  const draft: Question = {
    id: `otdb-${idx}-${Date.now().toString(36)}`,
    category: mapCategory(r.category),
    prompt: decodeHtml(r.question),
    options,
    answer,
    tier: 'free',
  };
  return sanitizeQuestion(draft);
}

export async function fetchOpenTdbQuestions(amount = 20): Promise<Question[]> {
  const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenTDB ${res.status}`);
  const json = (await res.json()) as OpenTdbResponse;
  if (json.response_code !== 0) return [];
  return filterValidQuestions(
    json.results.map((r, i) => toQuestion(r, i)).filter(Boolean) as Question[]
  );
}

export async function refreshTriviaCache(force = false): Promise<Question[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw && !force) {
      const parsed = JSON.parse(raw) as { at: number; questions: Question[] };
      if (Date.now() - parsed.at < CACHE_MAX_AGE_MS && parsed.questions.length) {
        return filterValidQuestions(parsed.questions);
      }
    }
    const questions = await fetchOpenTdbQuestions(30);
    if (questions.length) {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), questions }));
    }
    return questions;
  } catch (e) {
    console.warn('[triviaApi] refresh failed', e);
    return [];
  }
}

export async function loadCachedTriviaQuestions(): Promise<Question[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { questions: Question[] };
    return filterValidQuestions(parsed.questions ?? []);
  } catch {
    return [];
  }
}
