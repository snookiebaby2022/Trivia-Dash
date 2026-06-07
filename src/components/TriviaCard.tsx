import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategoryTheme } from '../lib/categoryTheme';
import type { Category } from '../types';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  category: Category;
  prompt: string;
  questionNum: number;
  total: number;
  year?: number;
  tier?: string;
  onSpeak?: () => void;
}

/** Modern category-wedge question card — clean surface, colored wedge accent. */
export function TriviaCard({
  category,
  prompt,
  questionNum,
  total,
  year,
  tier,
  onSpeak,
}: Props) {
  const theme = getCategoryTheme(category);

  return (
    <View style={[styles.card, { shadowColor: theme.fill }]}>
      {/* Left wedge rail */}
      <View style={styles.rail}>
        <View style={[styles.railFill, { backgroundColor: theme.fill }]} />
        <View style={[styles.railSheen, { backgroundColor: theme.accent }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.categoryPill, { backgroundColor: `${theme.fill}22`, borderColor: `${theme.fill}55` }]}>
            <Text style={styles.pillIcon}>{theme.icon}</Text>
            <Text style={[styles.pillLabel, { color: theme.accent }]}>{theme.label}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>
                {questionNum}/{total}
              </Text>
            </View>
            {year != null && (
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>{year}</Text>
              </View>
            )}
            {tier === 'pro' && (
              <View style={[styles.metaChip, styles.proChip]}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
            {onSpeak && (
              <Pressable
                style={({ pressed }) => [styles.speakBtn, pressed && styles.speakBtnPressed]}
                onPress={onSpeak}
                accessibilityLabel="Read question aloud"
              >
                <Text style={styles.speakIcon}>🔊</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.fill }]} />

        <Text style={styles.prompt}>{prompt}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  rail: {
    width: 6,
    position: 'relative',
  },
  railFill: {
    ...StyleSheet.absoluteFillObject,
  },
  railSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    opacity: 0.55,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.md + 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillIcon: { fontSize: 16 },
  pillLabel: {
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  metaChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  proChip: {
    backgroundColor: 'rgba(255, 210, 77, 0.15)',
  },
  proText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  speakBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakBtnPressed: { opacity: 0.7 },
  speakIcon: { fontSize: 16 },
  divider: {
    height: 2,
    borderRadius: 1,
    marginVertical: spacing.md,
    opacity: 0.85,
  },
  prompt: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
});
