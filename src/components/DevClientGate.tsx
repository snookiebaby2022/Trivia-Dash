import Constants, { ExecutionEnvironment } from 'expo-constants';
import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

const BUILD_URL =
  'https://expo.dev/accounts/snookiebaby/projects/trivia-dash/builds/b41470a9-2600-4a72-b510-ca30e418f0e7';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Blocks Expo Go — this project needs the EAS dev build (Orbit / install link). */
export function DevClientGate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!isExpoGo) return <>{children}</>;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Use the dev build</Text>
      <Text style={styles.body}>
        Trivia Dash uses RevenueCat and AdMob native modules. Expo Go cannot run this app.
      </Text>
      <Text style={styles.steps}>
        1. Install the dev build from Orbit or the EAS link{'\n'}
        2. On your PC: npm start (or npm run start:tunnel if Wi‑Fi blocks LAN){'\n'}
        3. Open Trivia Dash (not Expo Go) and connect to Metro{'\n'}
        {'\n'}Quick test in browser: npm run start:web
      </Text>
      <Text style={styles.link} onPress={() => void Linking.openURL(BUILD_URL)}>
        Open latest Android dev build
      </Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: font.h2,
      fontWeight: '900',
    },
    body: {
      color: colors.textMuted,
      fontSize: font.body,
      lineHeight: 22,
    },
    steps: {
      color: colors.text,
      fontSize: font.small,
      lineHeight: 22,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
    },
    link: {
      color: colors.primary,
      fontSize: font.body,
      fontWeight: '700',
      marginTop: spacing.sm,
    },
  });
}
