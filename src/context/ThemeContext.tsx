import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';

import {
  type ColorScheme,
  type ThemeColors,
  darkColors,
  paletteForScheme,
} from '../theme';

const THEME_KEY = 'bb.theme.v1';

type ThemePreference = ColorScheme | 'system';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: ColorScheme;
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (pref: ThemePreference) => Promise<void>;
  toggleScheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(THEME_KEY).then((raw) => {
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        setPreferenceState(raw);
      }
      setLoaded(true);
    });
  }, []);

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  const colors = useMemo(() => paletteForScheme(scheme), [scheme]);

  const setPreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
    await AsyncStorage.setItem(THEME_KEY, pref);
  }, []);

  const toggleScheme = useCallback(async () => {
    const next: ColorScheme = scheme === 'dark' ? 'light' : 'dark';
    await setPreference(next);
  }, [scheme, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      scheme,
      preference,
      isDark: scheme === 'dark',
      setPreference,
      toggleScheme,
    }),
    [colors, scheme, preference, setPreference, toggleScheme]
  );

  if (!loaded) {
    return (
      <ThemeContext.Provider
        value={{
          colors: darkColors,
          scheme: 'dark',
          preference: 'dark',
          isDark: true,
          setPreference,
          toggleScheme,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
