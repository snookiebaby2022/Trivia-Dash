import type { Question } from '../types';

/** Visual trivia — Wikimedia thumbnails (stable HTTPS). */
const RAW: Omit<Question, 'tier'>[] = [
  {
    id: 'img_ent_1',
    category: 'Entertainment',
    prompt: 'Which film franchise features this golden arch villain logo theme park?',
    options: ['Jurassic Park', 'Westworld', 'Disneyland', 'Universal Studios'],
    answer: 0,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Jurassic_Park_logo.svg/320px-Jurassic_Park_logo.svg.png',
  },
  {
    id: 'img_ent_2',
    category: 'Entertainment',
    year: 1977,
    prompt: 'This poster style is iconic for which space-opera film (1977)?',
    options: ['Star Trek', 'Star Wars', 'Alien', '2001: A Space Odyssey'],
    answer: 1,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Star_Wars_Logo.svg/320px-Star_Wars_Logo.svg.png',
  },
  {
    id: 'img_mov_1',
    category: 'Movies',
    prompt: 'Which superhero wears this shield?',
    options: ['Iron Man', 'Captain America', 'Thor', 'Black Panther'],
    answer: 1,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Captain_america_shield.svg/320px-Captain_america_shield.svg.png',
  },
  {
    id: 'img_mov_2',
    category: 'Movies',
    prompt: 'This mask is worn by which Batman villain?',
    options: ['Riddler', 'Joker', 'Bane', 'Penguin'],
    answer: 1,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Joker_%28DC_Comics_character%29_logo.svg/320px-Joker_%28DC_Comics_character%29_logo.svg.png',
  },
  {
    id: 'img_mus_1',
    category: 'Music',
    prompt: 'How many strings does this instrument typically have?',
    options: ['4', '5', '6', '7'],
    answer: 2,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/GuitareClassique5.png/320px-GuitareClassique5.png',
  },
  {
    id: 'img_mus_2',
    category: 'Music',
    prompt: 'This is the standard concert version of which instrument family?',
    options: ['Violin', 'Piano', 'Trumpet', 'Drums'],
    answer: 1,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Steinway_Vienna_002.JPG/320px-Steinway_Vienna_002.JPG',
  },
  {
    id: 'img_pop_1',
    category: 'Pop Culture',
    prompt: 'This bird logo belongs to which social network?',
    options: ['Facebook', 'Twitter / X', 'Threads', 'Bluesky'],
    answer: 1,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/320px-Logo_of_Twitter.svg.png',
  },
  {
    id: 'img_ent_3',
    category: 'Entertainment',
    prompt: 'Which streaming service uses this red play-button style branding?',
    options: ['Hulu', 'Netflix', 'Prime Video', 'Disney+'],
    answer: 1,
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/320px-Netflix_2015_logo.svg.png',
  },
];

export const MEDIA_QUESTIONS: Question[] = RAW.map((q) => ({ ...q, tier: 'free' as const }));
