import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../context/ProfileContext';
import {
  ACHIEVEMENTS,
  getAchievementProgress,
  isAchievementUnlocked,
} from '../lib/achievements';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Achievements'>;

function TrophyCard({
  index,
  done,
  emoji,
  label,
  description,
  pct,
  progress,
  reward,
  styles,
}: {
  index: number;
  done: boolean;
  emoji: string;
  label: string;
  description: string;
  pct: number;
  progress: string;
  reward: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const slide = useRef(new Animated.Value(24)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 400,
        delay: index * 45,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        delay: index * 45,
        useNativeDriver: true,
      }),
      Animated.timing(barWidth, {
        toValue: pct,
        duration: 600,
        delay: index * 45 + 120,
        useNativeDriver: false,
      }),
    ]).start();
  }, [index, pct, slide, fade, barWidth]);

  const fillWidth = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        done && styles.cardDone,
        { opacity: fade, transform: [{ translateY: slide }] },
      ]}
    >
      <Text style={[styles.emoji, done && styles.emojiDone]}>{emoji}</Text>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.desc}>{description}</Text>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              done && styles.fillDone,
              { width: fillWidth },
            ]}
          />
        </View>
        <Text style={styles.progress}>
          {progress}
          {reward ? ` · ${reward}` : ''}
        </Text>
      </View>
    </Animated.View>
  );
}

export function AchievementWallScreen({}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile } = useProfile();
  if (!profile) return null;

  const unlockedCount = profile.achievementState.unlocked.length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Trophy Case</Text>
        <Text style={styles.sub}>
          {unlockedCount}/{ACHIEVEMENTS.length} unlocked · frames & badges for your avatar
        </Text>

        {ACHIEVEMENTS.map((def, index) => {
          const done = isAchievementUnlocked(def.id, profile);
          const prog = getAchievementProgress(def, profile);
          const pct = Math.min(1, prog / def.target);
          const rewardParts = [
            def.reward?.frame ? `${def.reward.frame} frame` : '',
            def.reward?.badge ? `${def.reward.badge} badge` : '',
          ].filter(Boolean);

          return (
            <TrophyCard
              key={def.id}
              index={index}
              done={done}
              emoji={def.emoji}
              label={def.label}
              description={def.description}
              pct={pct}
              progress={
                done ? 'Unlocked!' : `${Math.min(prog, def.target)}/${def.target}`
              }
              reward={rewardParts.join(' + ')}
              styles={styles}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headline: {
    color: colors.gold,
    fontSize: font.h1,
    fontWeight: '900',
    textAlign: 'center',
  },
  sub: {
    color: colors.textMuted,
    fontSize: font.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  cardDone: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 210, 77, 0.08)',
  },
  emoji: {
    fontSize: 32,
    opacity: 0.75,
  },
  emojiDone: {
    opacity: 1,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '900',
  },
  desc: {
    color: colors.textMuted,
    fontSize: font.small,
  },
  track: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  fillDone: {
    backgroundColor: colors.gold,
  },
  progress: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '700',
    marginTop: 2,
  },
  });
}
