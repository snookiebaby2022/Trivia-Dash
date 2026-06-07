import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '../theme';

interface Props {
  title: string;
  subtitle: string;
  loading?: boolean;
  onWatch: () => void;
}

/** Rewarded-ad offer row — watch ad to earn bonus. */
export function RewardedOfferCard({ title, subtitle, loading, onWatch }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={onWatch}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} size="small" />
        ) : (
          <Text style={styles.btnText}>▶ Watch</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 210, 77, 0.35)',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  textWrap: { flex: 1 },
  title: {
    color: colors.gold,
    fontSize: font.body,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: 2,
  },
  btn: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    minWidth: 88,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '900',
  },
});
