import type { Question } from '../types';

/** Pro-only picture rounds — Wikimedia Commons thumbnails. */
export const PICTURE_QUESTIONS: Question[] = [
  {
    id: 'pic1',
    category: 'Art',
    tier: 'pro',
    prompt: 'Who painted this portrait?',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/320px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
    options: ['Van Gogh', 'Leonardo da Vinci', 'Rembrandt', 'Raphael'],
    answer: 1,
  },
  {
    id: 'pic2',
    category: 'Nature',
    tier: 'pro',
    prompt: 'What animal is this?',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/African_Elephant_%28Loxodonta_africana%29_male_with_savanna_backdrop.jpg/320px-African_Elephant_%28Loxodonta_africana%29_male_with_savanna_backdrop.jpg',
    options: ['Rhino', 'African elephant', 'Hippo', 'Bison'],
    answer: 1,
  },
  {
    id: 'pic3',
    category: 'Pop Culture',
    tier: 'pro',
    prompt: 'This landmark appears in many films. Where is it?',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Statue_of_Liberty%2C_NY.jpg/240px-Statue_of_Liberty%2C_NY.jpg',
    options: ['Paris', 'New York', 'London', 'Sydney'],
    answer: 1,
  },
  {
    id: 'pic4',
    category: 'Geography',
    tier: 'pro',
    prompt: 'Name this mountain range.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Matterhorn_from_Dorny.jpg/320px-Matterhorn_from_Dorny.jpg',
    options: ['Andes', 'Alps', 'Rockies', 'Himalayas'],
    answer: 1,
  },
];
