import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { useIsPro } from '../context/ProfileContext';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

/** Web — no AdMob; placeholder only. */
export function AdBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isPro = useIsPro();
  if (isPro) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.label}>AD</Text>
      <Text style={styles.text}>Ads are not shown on web · use the Android app</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderStyle: 'dashed',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginVertical: spacing.sm,
    },
    label: {
      color: colors.textFaint,
      fontSize: 10,
      fontWeight: '900',
      backgroundColor: colors.card,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    text: {
      flex: 1,
      color: colors.textMuted,
      fontSize: font.small,
    },
  });
}
