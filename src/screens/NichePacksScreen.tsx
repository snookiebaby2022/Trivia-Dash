import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import {
  getAllNichePacks,
  getPopularNichePacks,
  getNewNichePacks,
  getFreeNichePacks,
  getPackCategories,
  type NichePack,
} from '../lib/nichePacks';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NichePacks'>;

type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#3DDC97',
  medium: '#FFC44D',
  hard: '#FF5470',
  mixed: '#8A8AA8',
};

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function NichePacksScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile, showProPaywall } = useProfile();

  const [filter, setFilter] = useState<'all' | 'free' | 'popular' | 'new'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const allPacks = useMemo(() => getAllNichePacks(), []);
  const popularIds = useMemo(() => new Set(getPopularNichePacks().map((p) => p.id)), []);
  const newIds = useMemo(() => new Set(getNewNichePacks().map((p) => p.id)), []);
  const categoryNames = useMemo(() => ['All', ...getPackCategories().map((c) => c.label)], []);

  const filteredPacks = useMemo(() => {
    let result = allPacks;
    if (filter === 'free') result = getFreeNichePacks();
    if (filter === 'popular') result = allPacks.filter((p) => popularIds.has(p.id));
    if (filter === 'new') result = allPacks.filter((p) => newIds.has(p.id));
    if (selectedCategory !== 'All') result = result.filter((p) => String(p.category) === selectedCategory);
    return result;
  }, [allPacks, filter, selectedCategory, popularIds, newIds]);

  const playPack = (pack: NichePack) => {
    if (pack.tier === 'pro' && !profile?.isPro) {
      void showProPaywall();
      return;
    }
    navigation.navigate('Game', {
      mode: 'solo',
      category: pack.category,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Fandom Packs</Text>
        <Text style={styles.headerSubtitle}>Trivia for the things you love</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['all', 'free', 'popular', 'new'] as const).map((f) => (
            <Pressable
              key={f}
              style={[
                styles.filterChip,
                { backgroundColor: filter === f ? colors.primary : colors.card, borderColor: filter === f ? colors.primary : colors.cardBorder },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, { color: filter === f ? colors.text : colors.textMuted }]}>
                {f === 'all' ? 'All' : f === 'free' ? 'Free' : f === 'popular' ? 'Popular' : 'New'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categoryNames.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryPill,
                { backgroundColor: selectedCategory === cat ? colors.primary + '30' : 'transparent', borderColor: selectedCategory === cat ? colors.primary : colors.cardBorder },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryPillText, { color: selectedCategory === cat ? colors.primary : colors.textMuted }]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filteredPacks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No packs found — try a different filter
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredPacks.map((pack) => {
              const locked = pack.tier === 'pro' && !profile?.isPro;
              return (
                <Pressable
                  key={pack.id}
                  style={[styles.packCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, locked && styles.packCardLocked]}
                  onPress={() => playPack(pack)}
                >
                  <Text style={styles.packEmoji}>{pack.emoji}</Text>
                  <Text style={[styles.packTitle, { color: colors.text }]} numberOfLines={1}>
                    {pack.title}
                    {locked ? ' \u{1F512}' : ''}
                  </Text>
                  <Text style={[styles.packSubtitle, { color: colors.textFaint }]} numberOfLines={1}>
                    {pack.subtitle}
                  </Text>
                  <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[pack.difficulty] + '25' }]}>
                    <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[pack.difficulty] }]}>
                      {pack.difficulty}
                    </Text>
                  </View>
                  <View style={styles.packStats}>
                    <Text style={[styles.packStat, { color: colors.textMuted }]}>{formatCount(pack.playerCount)} played</Text>
                    <Text style={[styles.packStat, { color: colors.textMuted }]}>Avg: {pack.avgScore}</Text>
                  </View>
                  {locked && (
                    <View style={styles.proBadge}>
                      <Text style={[styles.proBadgeText, { color: colors.gold }]}>Pro</Text>
                    </View>
                  )}
                  <PrimaryButton
                    label={locked ? 'Unlock' : 'Play'}
                    variant={locked ? 'ghost' : 'primary'}
                    onPress={() => playPack(pack)}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        <PrimaryButton
          label="Back to Home"
          variant="ghost"
          onPress={() => navigation.navigate('Home')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    headerTitle: { color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
    headerSubtitle: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },

    filterRow: { gap: spacing.sm },
    filterChip: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
    },
    filterChipText: { fontSize: font.small, fontWeight: '700' },

    categoryRow: { gap: spacing.xs },
    categoryPill: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
    },
    categoryPillText: { fontSize: font.small, fontWeight: '600' },

    emptyCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: { fontSize: font.body, textAlign: 'center' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    packCard: {
      width: '48%',
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.md,
      alignItems: 'center',
      gap: spacing.xs,
    },
    packCardLocked: { opacity: 0.6 },
    packEmoji: { fontSize: 32 },
    packTitle: { fontSize: font.body, fontWeight: '800', textAlign: 'center' },
    packSubtitle: { fontSize: font.small, textAlign: 'center' },
    diffBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
    diffText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    packStats: { flexDirection: 'row', gap: spacing.sm },
    packStat: { fontSize: 11, fontWeight: '600' },
    proBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm },
    proBadgeText: { fontSize: 11, fontWeight: '900' },
  });
}
