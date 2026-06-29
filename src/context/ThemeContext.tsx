import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';

import {
  type ColorScheme,
  type ThemeColors,
  darkColors,
  lightColors,
  colorBlindDarkColors,
  colorBlindLightColors,
  paletteForScheme,
} from '../theme';

const THEME_KEY = 'bb.theme.v1';
const COLORBLIND_KEY = 'bb.colorblind.v1';

type ThemePreference = ColorScheme | 'system';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: ColorScheme;
  preference: ThemePreference;
  isDark: boolean;
  colorBlind: boolean;
  setPreference: (pref: ThemePreference) => Promise<void>;
  toggleScheme: () => Promise<void>;
  toggleColorBlind: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');
  const [colorBlind, setColorBlind] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(COLORBLIND_KEY),
    ]).then(([themeRaw, cbRaw]) => {
      if (themeRaw === 'light' || themeRaw === 'dark' || themeRaw === 'system') {
        setPreferenceState(themeRaw);
      }
      if (cbRaw === 'true') setColorBlind(true);
      setLoaded(true);
    });
  }, []);

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  const colors = useMemo(() => {
    if (colorBlind) {
      return scheme === 'light' ? colorBlindLightColors : colorBlindDarkColors;
    }
    return paletteForScheme(scheme);
  }, [scheme, colorBlind]);

  const setPreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
    await AsyncStorage.setItem(THEME_KEY, pref);
  }, []);

  const toggleScheme = useCallback(async () => {
    const next: ColorScheme = scheme === 'dark' ? 'light' : 'dark';
    await setPreference(next);
  }, [scheme, setPreference]);

  const toggleColorBlind = useCallback(async () => {
    setColorBlind((prev) => {
      const next = !prev;
      void AsyncStorage.setItem(COLORBLIND_KEY, String(next));
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      scheme,
      preference,
      isDark: scheme === 'dark',
      colorBlind,
      setPreference,
      toggleScheme,
      toggleColorBlind,
    }),
    [colors, scheme, preference, colorBlind, setPreference, toggleScheme, toggleColorBlind]
  );

  if (!loaded) {
    return (
      <ThemeContext.Provider
        value={{
          colors: darkColors,
          scheme: 'dark',
          preference: 'dark',
          isDark: true,
          colorBlind: false,
          setPreference,
          toggleScheme,
          toggleColorBlind,
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
