import { useMemo } from 'react';

import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../theme';

/** Build StyleSheet (or style objects) from the active theme palette. */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
