import type { Question } from '../types';

// Pro archive: historical & decade-spanning trivia (1930–2026).
// Unlocked with Trivia Dash Pro subscription.
export const PRO_HISTORICAL_QUESTIONS: Question[] = [
  // 1930s
  { id: 'p1930-1', category: 'History', year: 1933, tier: 'pro', prompt: 'Which US president began the New Deal in 1933?', options: ['Hoover', 'Roosevelt', 'Truman', 'Wilson'], answer: 1 },
  { id: 'p1930-2', category: 'History', year: 1936, tier: 'pro', prompt: 'Jesse Owens won four gold medals at which Olympics?', options: ['1932 LA', '1936 Berlin', '1948 London', '1930 Havana'], answer: 1 },
  { id: 'p1930-3', category: 'Entertainment', year: 1937, tier: 'pro', prompt: 'Disney\'s first full-length animated feature debuted in 1937. Which was it?', options: ['Bambi', 'Snow White', 'Pinocchio', 'Fantasia'], answer: 1 },
  { id: 'p1930-4', category: 'Science', year: 1938, tier: 'pro', prompt: 'Nuclear fission was first achieved in which year?', options: ['1932', '1938', '1942', '1929'], answer: 1 },
  { id: 'p1930-5', category: 'History', year: 1939, tier: 'pro', prompt: 'World War II in Europe began with the invasion of which country?', options: ['France', 'Poland', 'Belgium', 'Norway'], answer: 1 },

  // 1940s
  { id: 'p1940-1', category: 'History', year: 1941, tier: 'pro', prompt: 'Pearl Harbor was attacked on December 7 of which year?', options: ['1939', '1940', '1941', '1942'], answer: 2 },
  { id: 'p1940-2', category: 'Science', year: 1945, tier: 'pro', prompt: 'The first atomic bomb was dropped on Hiroshima in which year?', options: ['1943', '1944', '1945', '1946'], answer: 2 },
  { id: 'p1940-3', category: 'History', year: 1945, tier: 'pro', prompt: 'The United Nations was founded in which year?', options: ['1943', '1945', '1947', '1950'], answer: 1 },
  { id: 'p1940-4', category: 'Sports', year: 1947, tier: 'pro', prompt: 'Jackie Robinson broke MLB\'s color barrier with which team?', options: ['Yankees', 'Dodgers', 'Giants', 'Red Sox'], answer: 1 },
  { id: 'p1940-5', category: 'History', year: 1949, tier: 'pro', prompt: 'NATO was formed in which year?', options: ['1947', '1949', '1951', '1955'], answer: 1 },

  // 1950s
  { id: 'p1950-1', category: 'History', year: 1950, tier: 'pro', prompt: 'The Korean War began in which year?', options: ['1948', '1950', '1953', '1955'], answer: 1 },
  { id: 'p1950-2', category: 'Science', year: 1953, tier: 'pro', prompt: 'Watson and Crick described the structure of DNA in which year?', options: ['1950', '1953', '1956', '1960'], answer: 1 },
  { id: 'p1950-3', category: 'History', year: 1954, tier: 'pro', prompt: 'Brown v. Board of Education ruled school segregation unconstitutional in which year?', options: ['1952', '1954', '1956', '1960'], answer: 1 },
  { id: 'p1950-4', category: 'Entertainment', year: 1956, tier: 'pro', prompt: 'Elvis Presley appeared on Ed Sullivan in which year?', options: ['1954', '1956', '1958', '1960'], answer: 1 },
  { id: 'p1950-5', category: 'Science', year: 1957, tier: 'pro', prompt: 'Sputnik 1, the first artificial satellite, launched in which year?', options: ['1955', '1957', '1959', '1961'], answer: 1 },

  // 1960s
  { id: 'p1960-1', category: 'History', year: 1961, tier: 'pro', prompt: 'Yuri Gagarin became the first human in space in which year?', options: ['1959', '1961', '1963', '1965'], answer: 1 },
  { id: 'p1960-2', category: 'History', year: 1963, tier: 'pro', prompt: 'Martin Luther King Jr. delivered "I Have a Dream" in which year?', options: ['1961', '1963', '1965', '1968'], answer: 1 },
  { id: 'p1960-3', category: 'History', year: 1963, tier: 'pro', prompt: 'President Kennedy was assassinated in which year?', options: ['1961', '1963', '1965', '1968'], answer: 1 },
  { id: 'p1960-4', category: 'History', year: 1969, tier: 'pro', prompt: 'Apollo 11 landed on the Moon in which year?', options: ['1967', '1968', '1969', '1970'], answer: 2 },
  { id: 'p1960-5', category: 'Entertainment', year: 1969, tier: 'pro', prompt: 'Woodstock festival took place in which year?', options: ['1967', '1968', '1969', '1970'], answer: 2 },

  // 1970s
  { id: 'p1970-1', category: 'History', year: 1972, tier: 'pro', prompt: 'Watergate break-in occurred in which year?', options: ['1970', '1972', '1974', '1976'], answer: 1 },
  { id: 'p1970-2', category: 'Science', year: 1971, tier: 'pro', prompt: 'Email was first sent on ARPANET in which year?', options: ['1969', '1971', '1973', '1975'], answer: 1 },
  { id: 'p1970-3', category: 'Entertainment', year: 1977, tier: 'pro', prompt: 'Star Wars (Episode IV) premiered in which year?', options: ['1975', '1977', '1979', '1980'], answer: 1 },
  { id: 'p1970-4', category: 'Sports', year: 1972, tier: 'pro', prompt: 'The "Miracle on Ice" US hockey win was at which Olympics?', options: ['1968', '1972', '1976', '1980'], answer: 1 },
  { id: 'p1970-5', category: 'History', year: 1979, tier: 'pro', prompt: 'Margaret Thatcher became UK Prime Minister in which year?', options: ['1977', '1979', '1981', '1983'], answer: 1 },

  // 1980s
  { id: 'p1980-1', category: 'History', year: 1980, tier: 'pro', prompt: 'Solidarity movement rose in Poland starting in which year?', options: ['1978', '1980', '1982', '1984'], answer: 1 },
  { id: 'p1980-2', category: 'History', year: 1986, tier: 'pro', prompt: 'The Chernobyl disaster occurred in which year?', options: ['1984', '1986', '1988', '1990'], answer: 1 },
  { id: 'p1980-3', category: 'History', year: 1989, tier: 'pro', prompt: 'The Berlin Wall fell in which year?', options: ['1987', '1989', '1991', '1993'], answer: 1 },
  { id: 'p1980-4', category: 'Entertainment', year: 1982, tier: 'pro', prompt: 'Michael Jackson released "Thriller" in which year?', options: ['1980', '1982', '1984', '1986'], answer: 1 },
  { id: 'p1980-5', category: 'Science', year: 1989, tier: 'pro', prompt: 'The World Wide Web was proposed by Tim Berners-Lee in which year?', options: ['1985', '1987', '1989', '1991'], answer: 2 },

  // 1990s
  { id: 'p1990-1', category: 'History', year: 1991, tier: 'pro', prompt: 'The Soviet Union dissolved in which year?', options: ['1989', '1991', '1993', '1995'], answer: 1 },
  { id: 'p1990-2', category: 'Entertainment', year: 1994, tier: 'pro', prompt: 'Friends premiered on NBC in which year?', options: ['1992', '1994', '1996', '1998'], answer: 1 },
  { id: 'p1990-3', category: 'Science', year: 1990, tier: 'pro', prompt: 'The Hubble Space Telescope was launched in which year?', options: ['1988', '1990', '1992', '1994'], answer: 1 },
  { id: 'p1990-4', category: 'Sports', year: 1995, tier: 'pro', prompt: 'Rugby union turned professional in which year?', options: ['1993', '1995', '1997', '1999'], answer: 1 },
  { id: 'p1990-5', category: 'Entertainment', year: 1999, tier: 'pro', prompt: 'The Matrix was released in which year?', options: ['1997', '1998', '1999', '2000'], answer: 2 },

  // 2000s
  { id: 'p2000-1', category: 'History', year: 2001, tier: 'pro', prompt: 'The September 11 attacks occurred in which year?', options: ['1999', '2000', '2001', '2002'], answer: 2 },
  { id: 'p2000-2', category: 'Science', year: 2003, tier: 'pro', prompt: 'The Human Genome Project was completed in which year?', options: ['2001', '2003', '2005', '2007'], answer: 1 },
  { id: 'p2000-3', category: 'Entertainment', year: 2004, tier: 'pro', prompt: 'Facebook launched at Harvard in which year?', options: ['2002', '2004', '2006', '2008'], answer: 1 },
  { id: 'p2000-4', category: 'Sports', year: 2008, tier: 'pro', prompt: 'Usain Bolt broke the 100m world record at Beijing in which year?', options: ['2006', '2008', '2010', '2012'], answer: 1 },
  { id: 'p2000-5', category: 'General', year: 2007, tier: 'pro', prompt: 'Apple released the first iPhone in which year?', options: ['2005', '2006', '2007', '2008'], answer: 2 },

  // 2010s
  { id: 'p2010-1', category: 'History', year: 2011, tier: 'pro', prompt: 'Osama bin Laden was killed in which year?', options: ['2009', '2011', '2013', '2015'], answer: 1 },
  { id: 'p2010-2', category: 'Entertainment', year: 2012, tier: 'pro', prompt: 'Gangnam Style went viral in which year?', options: ['2010', '2012', '2014', '2016'], answer: 1 },
  { id: 'p2010-3', category: 'Science', year: 2012, tier: 'pro', prompt: 'The Higgs boson was confirmed at CERN in which year?', options: ['2010', '2012', '2014', '2016'], answer: 1 },
  { id: 'p2010-4', category: 'History', year: 2016, tier: 'pro', prompt: 'Brexit referendum was held in the UK in which year?', options: ['2014', '2015', '2016', '2017'], answer: 2 },
  { id: 'p2010-5', category: 'Entertainment', year: 2019, tier: 'pro', prompt: 'Avengers: Endgame was released in which year?', options: ['2017', '2018', '2019', '2020'], answer: 2 },

  // 2020s
  { id: 'p2020-1', category: 'History', year: 2020, tier: 'pro', prompt: 'COVID-19 was declared a pandemic by WHO in which year?', options: ['2019', '2020', '2021', '2022'], answer: 1 },
  { id: 'p2020-2', category: 'Sports', year: 2020, tier: 'pro', prompt: 'The Tokyo Olympics were postponed to 2021 from which year?', options: ['2018', '2019', '2020', '2022'], answer: 2 },
  { id: 'p2020-3', category: 'Science', year: 2021, tier: 'pro', prompt: 'NASA\'s Perseverance rover landed on Mars in which year?', options: ['2019', '2020', '2021', '2022'], answer: 2 },
  { id: 'p2020-4', category: 'Entertainment', year: 2023, tier: 'pro', prompt: 'Barbie became the highest-grossing film of 2023. Which year?', options: ['2021', '2022', '2023', '2024'], answer: 2 },
  { id: 'p2020-5', category: 'Pop Culture', year: 2024, tier: 'pro', prompt: 'Taylor Swift\'s Eras Tour film broke box office records in which year?', options: ['2022', '2023', '2024', '2025'], answer: 2 },
  { id: 'p2020-6', category: 'Sports', year: 2022, tier: 'pro', prompt: 'Argentina won the FIFA World Cup in Qatar in which year?', options: ['2020', '2021', '2022', '2023'], answer: 2 },
  { id: 'p2020-7', category: 'Science', year: 2025, tier: 'pro', prompt: 'The James Webb Space Telescope launched in which year?', options: ['2020', '2021', '2022', '2023'], answer: 1 },
  { id: 'p2020-8', category: 'General', year: 2026, tier: 'pro', prompt: 'Trivia Dash Pro archive spans trivia from 1930 to which year?', options: ['2024', '2025', '2026', '2030'], answer: 2 },

  // Extra decade-deep cuts
  { id: 'px-1', category: 'History', year: 1930, tier: 'pro', prompt: 'The Great Depression is generally dated from the US stock crash of which year?', options: ['1927', '1929', '1931', '1933'], answer: 1 },
  { id: 'px-2', category: 'Geography', year: 1947, tier: 'pro', prompt: 'India gained independence from Britain in which year?', options: ['1945', '1947', '1949', '1952'], answer: 1 },
  { id: 'px-3', category: 'History', year: 1955, tier: 'pro', prompt: 'Rosa Parks refused to give up her bus seat in which year?', options: ['1953', '1955', '1957', '1959'], answer: 1 },
  { id: 'px-4', category: 'Entertainment', year: 1964, tier: 'pro', prompt: 'The Beatles appeared on Ed Sullivan in which year?', options: ['1962', '1964', '1966', '1968'], answer: 1 },
  { id: 'px-5', category: 'History', year: 1975, tier: 'pro', prompt: 'Saigon fell, ending the Vietnam War, in which year?', options: ['1973', '1975', '1977', '1979'], answer: 1 },
  { id: 'px-6', category: 'Sports', year: 1980, tier: 'pro', prompt: 'The US "Miracle on Ice" hockey win was at the Lake Placid Olympics in which year?', options: ['1976', '1980', '1984', '1988'], answer: 1 },
  { id: 'px-7', category: 'History', year: 1990, tier: 'pro', prompt: 'Germany reunified in which year?', options: ['1988', '1990', '1992', '1994'], answer: 1 },
  { id: 'px-8', category: 'Entertainment', year: 2008, tier: 'pro', prompt: 'Breaking Bad premiered on AMC in which year?', options: ['2006', '2008', '2010', '2012'], answer: 1 },
  { id: 'px-9', category: 'Science', year: 2015, tier: 'pro', prompt: 'SpaceX landed a Falcon 9 booster for the first time in which year?', options: ['2013', '2015', '2017', '2019'], answer: 1 },
  { id: 'px-10', category: 'Pop Culture', year: 2020, tier: 'pro', prompt: 'Among Us surged in popularity during lockdown in which year?', options: ['2018', '2019', '2020', '2021'], answer: 2 },
];

export const PRO_YEAR_MIN = 1930;
export const PRO_YEAR_MAX = 2026;
