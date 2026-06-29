import type { Question } from '../types';

/** Decode HTML entities from OpenTDB and similar APIs. */
export function decodeHtmlEntities(text: string): string {
  let s = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');

  s = s.replace(/&#(\d+);/g, (_, code) => {
    const n = Number(code);
    return Number.isFinite(n) ? String.fromCharCode(n) : _;
  });
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return s.replace(/\s+/g, ' ').trim();
}

const BROKEN_ENTITY = /&(?:[a-z]+|#\d+|#x[0-9a-f]+);/i;

export function isValidQuestion(q: Question): boolean {
  const prompt = decodeHtmlEntities(q.prompt);
  if (prompt.length < 8 || BROKEN_ENTITY.test(prompt)) return false;
  if (!q.options || q.options.length < 2) return false;

  const options = q.options.map(decodeHtmlEntities).filter((o) => o.length > 0);
  if (options.length !== q.options.length) return false;
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return false;
  if (options.some((o) => BROKEN_ENTITY.test(o))) return false;
  if (q.answer < 0 || q.answer >= options.length) return false;

  return true;
}

export function sanitizeQuestion(q: Question): Question | null {
  if (!isValidQuestion(q)) return null;
  const options = q.options.map(decodeHtmlEntities);
  const prompt = decodeHtmlEntities(q.prompt);
  const correctText = decodeHtmlEntities(q.options[q.answer]);
  const answer = options.findIndex((o) => o === correctText);
  if (answer < 0) return null;
  return { ...q, prompt, options, answer };
}

export function filterValidQuestions(questions: Question[]): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    const clean = sanitizeQuestion(q);
    if (!clean) continue;
    const key = `${clean.prompt.toLowerCase()}|${clean.options.join('|').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}
