import type { Question } from '../types';
import { PRO_HISTORICAL_QUESTIONS, PRO_YEAR_MAX, PRO_YEAR_MIN } from './proQuestions';

const FREE_RAW: Omit<Question, 'tier'>[] = [
  { id: 'q1', category: 'Geography', prompt: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], answer: 2 },
  { id: 'q2', category: 'Science', prompt: 'What gas do plants primarily absorb from the atmosphere?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], answer: 1 },
  { id: 'q3', category: 'History', year: 1945, prompt: 'In which year did World War II end?', options: ['1943', '1945', '1947', '1950'], answer: 1 },
  { id: 'q4', category: 'Entertainment', year: 1993, prompt: 'Who directed the movie "Jurassic Park" (1993)?', options: ['James Cameron', 'George Lucas', 'Steven Spielberg', 'Ridley Scott'], answer: 2 },
  { id: 'q5', category: 'Sports', prompt: 'How many players are on the field per team in football (soccer)?', options: ['9', '10', '11', '12'], answer: 2 },
  { id: 'q6', category: 'Science', prompt: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { id: 'q7', category: 'Geography', prompt: 'Which is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answer: 1 },
  { id: 'q8', category: 'General', prompt: 'How many continents are there on Earth?', options: ['5', '6', '7', '8'], answer: 2 },
  { id: 'q9', category: 'Science', prompt: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
  { id: 'q10', category: 'History', prompt: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'John Adams'], answer: 2 },
  { id: 'q11', category: 'Entertainment', prompt: 'Which band released the album "Abbey Road"?', options: ['The Rolling Stones', 'The Beatles', 'Pink Floyd', 'Queen'], answer: 1 },
  { id: 'q12', category: 'Geography', prompt: 'Mount Everest lies on the border of Nepal and which country?', options: ['India', 'China', 'Bhutan', 'Pakistan'], answer: 1 },
  { id: 'q13', category: 'Science', prompt: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], answer: 2 },
  { id: 'q14', category: 'Sports', prompt: 'How often are the Summer Olympic Games held?', options: ['Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years'], answer: 2 },
  { id: 'q15', category: 'General', prompt: 'What is the largest planet in our solar system?', options: ['Saturn', 'Neptune', 'Jupiter', 'Earth'], answer: 2 },
  { id: 'q16', category: 'History', prompt: 'The Great Wall is located in which country?', options: ['Japan', 'China', 'Mongolia', 'Korea'], answer: 1 },
  { id: 'q17', category: 'Entertainment', prompt: 'In which movie does the character "Forrest Gump" appear?', options: ['Cast Away', 'Forrest Gump', 'Big', 'Philadelphia'], answer: 1 },
  { id: 'q18', category: 'Science', prompt: 'How many bones are in the adult human body?', options: ['196', '206', '216', '226'], answer: 1 },
  { id: 'q19', category: 'Geography', prompt: 'Which country has the most natural lakes?', options: ['USA', 'Russia', 'Canada', 'Finland'], answer: 2 },
  { id: 'q20', category: 'Sports', prompt: 'In tennis, what is a score of zero called?', options: ['Nil', 'Love', 'Duck', 'Blank'], answer: 1 },
  { id: 'q21', category: 'General', prompt: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], answer: 2 },
  { id: 'q22', category: 'Science', prompt: 'What is the speed of light approximately (km/s)?', options: ['150,000', '300,000', '450,000', '1,000,000'], answer: 1 },
  { id: 'q23', category: 'History', prompt: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Donatello'], answer: 2 },
  { id: 'q24', category: 'Entertainment', prompt: 'What is the name of the wizarding school in Harry Potter?', options: ['Durmstrang', 'Beauxbatons', 'Hogwarts', 'Ilvermorny'], answer: 2 },
  { id: 'q25', category: 'Geography', prompt: 'What is the smallest country in the world?', options: ['Monaco', 'Nauru', 'Vatican City', 'San Marino'], answer: 2 },
  { id: 'q26', category: 'Science', prompt: 'Which element has the atomic number 1?', options: ['Helium', 'Hydrogen', 'Oxygen', 'Carbon'], answer: 1 },
  { id: 'q27', category: 'Sports', year: 1930, prompt: 'Which country won the first FIFA World Cup in 1930?', options: ['Brazil', 'Argentina', 'Uruguay', 'Italy'], answer: 2 },
  { id: 'q28', category: 'General', prompt: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
  { id: 'q29', category: 'History', year: 1912, prompt: 'The Titanic sank in which year?', options: ['1905', '1912', '1918', '1923'], answer: 1 },
  { id: 'q30', category: 'Entertainment', prompt: 'Who is the author of "A Song of Ice and Fire"?', options: ['J.R.R. Tolkien', 'George R.R. Martin', 'Brandon Sanderson', 'Robert Jordan'], answer: 1 },
];

export const FREE_QUESTIONS: Question[] = FREE_RAW.map((q) => ({ ...q, tier: 'free' as const }));

export const QUESTIONS_PER_MATCH = 7;
export const DAILY_QUESTIONS_COUNT = 10;

export interface PickQuestionsOptions {
  isPro?: boolean;
  yearMin?: number;
  yearMax?: number;
  questionIds?: string[];
}

export function getQuestionPool(isPro: boolean): Question[] {
  if (isPro) return [...FREE_QUESTIONS, ...PRO_HISTORICAL_QUESTIONS];
  return FREE_QUESTIONS;
}

export function getQuestionById(id: string, isPro: boolean): Question | undefined {
  return getQuestionPool(isPro).find((q) => q.id === id);
}

export function pickMatchQuestions(
  count = QUESTIONS_PER_MATCH,
  seed?: number,
  options: PickQuestionsOptions = {}
): Question[] {
  const { isPro = false, yearMin = PRO_YEAR_MIN, yearMax = PRO_YEAR_MAX, questionIds } = options;

  let pool = getQuestionPool(isPro);

  if (questionIds?.length) {
    pool = questionIds
      .map((id) => pool.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));
  } else if (isPro) {
    pool = pool.filter((q) => {
      if (q.tier === 'free' && !q.year) return true;
      const y = q.year ?? 2000;
      return y >= yearMin && y <= yearMax;
    });
  }

  const random = seedRandom(seed ?? Math.floor(Math.random() * 1e9));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function seedRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function dateSeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return hash || 42;
}

export { PRO_YEAR_MIN, PRO_YEAR_MAX, PRO_HISTORICAL_QUESTIONS };
