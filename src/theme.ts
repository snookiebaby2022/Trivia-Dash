export const darkColors = {
  bg: '#0B0B16',
  bgElevated: '#16162A',
  card: '#1E1E38',
  cardBorder: '#2C2C52',
  primary: '#7C5CFF',
  primaryDark: '#5B3FE0',
  accent: '#FF5C8A',
  success: '#3DDC97',
  danger: '#FF5470',
  warning: '#FFC44D',
  text: '#FFFFFF',
  textMuted: '#A0A0C0',
  textFaint: '#6C6C90',
  gold: '#FFD24D',
  silver: '#CBD3DE',
  bronze: '#E0925C',
};

export const lightColors = {
  bg: '#F4F4FA',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#D8D8EC',
  primary: '#6B4FE0',
  primaryDark: '#5B3FE0',
  accent: '#E84A7A',
  success: '#1FA86A',
  danger: '#E03E58',
  warning: '#D9A020',
  text: '#12121F',
  textMuted: '#5A5A78',
  textFaint: '#8A8AA8',
  gold: '#C99A00',
  silver: '#7A8494',
  bronze: '#B86E3A',
};

export type ThemeColors = typeof darkColors;
export type ColorScheme = 'dark' | 'light';

/** Default palette for legacy static imports (dark). Prefer useTheme() in new code. */
export const colors: ThemeColors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const font = {
  h1: 34,
  h2: 26,
  h3: 20,
  body: 16,
  small: 13,
};

export function paletteForScheme(scheme: ColorScheme): ThemeColors {
  return scheme === 'light' ? lightColors : darkColors;
}
