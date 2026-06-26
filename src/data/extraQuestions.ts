import type { Question } from '../types';

/** Additional free questions — thicker pool per category. */
const RAW: Omit<Question, 'tier'>[] = [
  { id: 'ex1', category: 'Science', prompt: 'What is H2O commonly known as?', options: ['Salt', 'Water', 'Oxygen', 'Hydrogen'], answer: 1 },
  { id: 'ex2', category: 'Science', prompt: 'Which organ pumps blood?', options: ['Liver', 'Heart', 'Lungs', 'Kidney'], answer: 1 },
  { id: 'ex3', category: 'History', prompt: 'Who discovered gravity (legend)?', options: ['Einstein', 'Newton', 'Galileo', 'Tesla'], answer: 1 },
  { id: 'ex4', category: 'Geography', prompt: 'Capital of France?', options: ['Lyon', 'Paris', 'Nice', 'Marseille'], answer: 1 },
  { id: 'ex5', category: 'Sports', prompt: 'NBA stands for…', options: ['National Basketball Association', 'North Ball Association', 'New Basketball Alliance', 'National Ball Academy'], answer: 0 },
  { id: 'ex6', category: 'General', prompt: 'How many days in a leap year?', options: ['365', '366', '364', '367'], answer: 1 },
  { id: 'ex7', category: 'Entertainment', prompt: 'Studio behind Mario?', options: ['Sega', 'Nintendo', 'Sony', 'Microsoft'], answer: 1 },
  { id: 'ex8', category: 'Pop Culture', prompt: 'Twitter rebranded to…', options: ['Threads', 'X', 'Blue', 'Sky'], answer: 1 },
  { id: 'ex9', category: 'Art', prompt: 'Mona Lisa artist?', options: ['Van Gogh', 'Da Vinci', 'Monet', 'Picasso'], answer: 1 },
  { id: 'ex10', category: 'Literature', prompt: 'Who wrote "1984"?', options: ['Orwell', 'Huxley', 'Bradbury', 'Asimov'], answer: 0 },
  { id: 'ex11', category: 'Technology', prompt: 'HTML stands for…', options: ['HyperText Markup Language', 'High Transfer Machine Language', 'Home Tool Markup Language', 'Hyperlink Text Mode Language'], answer: 0 },
  { id: 'ex12', category: 'Nature', prompt: 'Largest ocean?', options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], answer: 1 },
  { id: 'ex13', category: 'Music', prompt: 'Composer of "Für Elise"?', options: ['Mozart', 'Beethoven', 'Bach', 'Chopin'], answer: 1 },
  { id: 'ex14', category: 'Science', prompt: 'Boiling point of water (°C)?', options: ['90', '100', '110', '120'], answer: 1 },
  { id: 'ex15', category: 'History', prompt: 'First man on the Moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'John Glenn'], answer: 1 },
  { id: 'ex16', category: 'Geography', prompt: 'Sahara is on which continent?', options: ['Asia', 'Africa', 'Australia', 'South America'], answer: 1 },
  { id: 'ex17', category: 'Sports', prompt: 'Wimbledon sport?', options: ['Golf', 'Tennis', 'Cricket', 'Rugby'], answer: 1 },
  { id: 'ex18', category: 'Pop Culture', prompt: 'K-pop group BTS country?', options: ['Japan', 'South Korea', 'China', 'Thailand'], answer: 1 },
  { id: 'ex19', category: 'Art', prompt: 'Cubism pioneer?', options: ['Picasso', 'Monet', 'Warhol', 'Banksy'], answer: 0 },
  { id: 'ex20', category: 'Technology', prompt: 'Founder of Microsoft?', options: ['Jobs', 'Gates', 'Zuckerberg', 'Musk'], answer: 1 },
];

export const EXTRA_FREE_QUESTIONS: Question[] = RAW.map((q) => ({ ...q, tier: 'free' as const }));
