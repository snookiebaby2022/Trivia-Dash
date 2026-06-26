import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import {
  ACCOUNT_DELETION_URL,
  openLegalUrl,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  TERMS_URL,
} from '../lib/legal';
import type { ThemeColors } from '../theme';
import { font, spacing } from '../theme';

interface Props {
  compact?: boolean;
}

export function LegalLinks({ compact }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const link = (label: string, url: string) => (
    <Pressable onPress={() => void openLegalUrl(url)} hitSlop={8}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );

  if (compact) {
    return (
      <View style={styles.row}>
        {link('Privacy', PRIVACY_POLICY_URL)}
        <Text style={styles.dot}>·</Text>
        {link('Terms', TERMS_URL)}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {link('Privacy policy', PRIVACY_POLICY_URL)}
        <Text style={styles.dot}>·</Text>
        {link('Terms', TERMS_URL)}
        <Text style={styles.dot}>·</Text>
        {link('Delete account', ACCOUNT_DELETION_URL)}
      </View>
      <Pressable onPress={() => void openLegalUrl(`mailto:${SUPPORT_EMAIL}`)}>
        <Text style={styles.muted}>{SUPPORT_EMAIL}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
    },
    link: {
      color: colors.primary,
      fontSize: font.small,
      fontWeight: '700',
    },
    dot: {
      color: colors.textFaint,
      fontSize: font.small,
    },
    muted: {
      color: colors.textFaint,
      fontSize: font.small,
    },
  });
}
