import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../context/ProfileContext';
import { CATEGORY_LIST, CATEGORY_WEDGES } from '../lib/categoryTheme';
import { getCategoryPlayStats } from '../lib/categoryStats';
import { shareWedgeUnlock } from '../lib/shareCard';
import { getWedgeProgress, WEDGE_UNLOCK_CORRECT } from '../lib/wedges';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type { Category } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'WedgeProfile'>;

export function WedgeProfileScreen({navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile } = useProfile();
  const focus = route.params?.category;

  if (!profile) return null;

  const list = focus ? [focus] : CATEGORY_LIST;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Wedge progress</Text>
        <Text style={styles.sub}>{WEDGE_UNLOCK_CORRECT} correct per category earns a wedge</Text>

        {list.map((cat) => {
          const theme = CATEGORY_WEDGES[cat];
          const prog = getWedgeProgress(profile, cat);
          const play = getCategoryPlayStats(profile, cat);
          const pct = prog.current / prog.target;
          return (
            <Pressable
              key={cat}
              style={[styles.card, prog.earned && styles.cardEarned]}
              onPress={() => navigation.navigate('CategoryPractice', { category: cat })}
            >
              <Text style={styles.icon}>{theme.icon}</Text>
              <View style={styles.body}>
                <Text style={styles.label}>{theme.label}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: theme.fill }]} />
                </View>
                <Text style={styles.meta}>
                  {prog.earned ? 'Wedge earned!' : `${prog.current}/${prog.target} correct`}
                  {' · '}
                  {play.plays} plays · best streak {play.bestStreak}
                </Text>
              </View>
              {prog.earned && (
                <Pressable onPress={() => void shareWedgeUnlock(cat, profile.username)}>
                  <Text style={styles.share}>Share</Text>
                </Pressable>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
  sub: { color: colors.textMuted, fontSize: font.small, textAlign: 'center', marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    alignItems: 'center',
  },
  cardEarned: { borderColor: colors.gold, backgroundColor: 'rgba(255,210,77,0.08)' },
  icon: { fontSize: 28 },
  body: { flex: 1, gap: 6 },
  label: { color: colors.text, fontWeight: '800', fontSize: font.body },
  track: { height: 8, backgroundColor: colors.bgElevated, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  meta: { color: colors.textFaint, fontSize: font.small },
  share: { color: colors.primary, fontWeight: '800', fontSize: font.small },
  });
}
