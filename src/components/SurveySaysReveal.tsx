import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { font, radius, spacing } from '../theme';

interface SurveyAnswer {
  label: string;
  percentage: number;
}

interface Props {
  answers: SurveyAnswer[];
  revealedCount: number;
  revealed: boolean;
}

export function SurveySaysReveal({ answers, revealedCount, revealed }: Props) {
  const { colors } = useTheme();
  const barAnims = useRef(answers.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!revealed) return;

    Animated.stagger(
      200,
      barAnims.slice(0, revealedCount).map((anim, i) =>
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.spring(anim, {
            toValue: answers[i].percentage,
            friction: 6,
            tension: 40,
            useNativeDriver: false,
          }),
        ])
      )
    ).start();
  }, [revealed, revealedCount]);

  if (!revealed) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.gold }]}>SURVEY SAYS</Text>
      {answers.slice(0, revealedCount).map((answer, i) => {
        const anim = barAnims[i];
        const width = anim.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
        });
        return (
          <View key={i} style={styles.row}>
            <Text style={[styles.rank, { color: colors.textMuted }]}>#{i + 1}</Text>
            <View style={[styles.barBg, { backgroundColor: colors.bgElevated }]}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    width,
                    backgroundColor: i === 0 ? colors.gold : colors.primary,
                  },
                ]}
              />
              <Text style={[styles.barLabel, { color: colors.text }]}>{answer.label}</Text>
            </View>
            <Text style={[styles.pct, { color: colors.gold }]}>{answer.percentage}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  title: {
    fontSize: font.h2,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: { fontSize: font.small, fontWeight: '900', width: 24 },
  barBg: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.sm,
    opacity: 0.3,
  },
  barLabel: {
    fontSize: font.body,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
  },
  pct: { fontSize: font.body, fontWeight: '900', width: 42, textAlign: 'right' },
});
