import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { buildWalkthroughSteps, markWalkthroughComplete, type WalkthroughStep } from '../lib/onboarding';
import { font, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  isSignedIn: boolean;
  onDone: () => void;
}

export function OnboardingWalkthrough({ visible, isSignedIn, onDone }: Props) {
  const { colors } = useTheme();
  const steps = useMemo(() => buildWalkthroughSteps(isSignedIn), [isSignedIn]);
  const [index, setIndex] = useState(0);

  const step: WalkthroughStep = steps[index] ?? steps[0];
  const isLast = index >= steps.length - 1;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const finish = async () => {
    await markWalkthroughComplete();
    setIndex(0);
    onDone();
  };

  const next = () => {
    if (isLast) {
      void finish();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => void finish()}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.progressRow}>
            {steps.map((s, i) => (
              <View
                key={s.id}
                style={[styles.progressDot, i <= index && { backgroundColor: colors.primary }]}
              />
            ))}
          </View>

          <Text style={styles.emoji}>{step.emoji}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          {step.feature && (
            <View style={styles.featureChip}>
              <Text style={styles.featureText}>
                {step.feature === 'daily' && '📅 Daily challenge on home'}
                {step.feature === 'wedges' && '🎯 Category wheel on home'}
                {step.feature === 'quick' && '⚡ Quick match on home'}
                {step.feature === 'account' && '🔐 Account section in Settings'}
                {step.feature === 'shop' && '🛒 Coin Shop on home'}
                {step.feature === 'stats' && '📈 Stats dashboard on home'}
                {step.feature === 'friends' && '👥 Friends & tournament on home'}
                {step.feature === 'tournament' && '🏆 Tournament bracket on home'}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable onPress={() => void finish()} hitSlop={12}>
              <Text style={styles.skip}>Skip tour</Text>
            </Pressable>
            <Pressable style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextText}>{isLast ? 'Start playing' : 'Next'}</Text>
            </Pressable>
          </View>

          <Text style={styles.stepCount}>
            {index + 1} / {steps.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.72)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    progressRow: {
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.cardBorder,
    },
    emoji: {
      fontSize: 48,
      textAlign: 'center',
    },
    title: {
      color: colors.text,
      fontSize: font.h2,
      fontWeight: '900',
      textAlign: 'center',
    },
    body: {
      color: colors.textMuted,
      fontSize: font.body,
      lineHeight: 24,
      textAlign: 'center',
    },
    featureChip: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.xs,
    },
    featureText: {
      color: colors.primary,
      fontSize: font.small,
      fontWeight: '700',
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.md,
    },
    skip: {
      color: colors.textFaint,
      fontSize: font.small,
      fontWeight: '700',
    },
    nextBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    nextText: {
      color: colors.text,
      fontWeight: '900',
      fontSize: font.body,
    },
    stepCount: {
      color: colors.textFaint,
      fontSize: font.small,
      textAlign: 'center',
      marginTop: spacing.xs,
      fontVariant: ['tabular-nums'],
    },
  });
}
