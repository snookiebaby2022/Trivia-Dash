import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NichePacks'>;

type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

interface NichePack {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  category: string;
  difficulty: Difficulty;
  playerCount: number;
  avgScore: number;
  tier: 'free' | 'pro';
  isPopular: boolean;
  isNew: boolean;
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#3DDC97',
  medium: '#FFC44D',
  hard: '#FF5470',
  mixed: '#8A8AA8',
};

const CATEGORIES = ['All', 'Anime', 'K-Pop', 'Marvel', 'Star Wars', 'Harry Potter', 'Gaming', 'Disney', 'Taylor Swift', 'NFL', 'NBA', 'True Crime'];

const MOCK_PACKS: NichePack[] = [
  { id: 'pk1', title: 'Dragon Ball Legends', subtitle: 'Test your Saiyan knowledge', emoji: '\u{1F4AB}', category: 'Anime', difficulty: 'hard', playerCount: 3420, avgScore: 68, tier: 'free', isPopular: true, isNew: false },
  { id: 'pk2', title: 'BTS Deep Cuts', subtitle: 'Only true ARMYs will ace this', emoji: '\u{1F49C}', category: 'K-Pop', difficulty: 'medium', playerCount: 2840, avgScore: 72, tier: 'free', isPopular: true, isNew: false },
  { id: 'pk3', title: 'MCU Phase 4-5', subtitle: 'Multiverse saga mastery', emoji: '\u{1F9E9}', category: 'Marvel', difficulty: 'hard', playerCount: 5100, avgScore: 61, tier: 'free', isPopular: true, isNew: false },
  { id: 'pk4', title: 'Sith Lords', subtitle: 'The dark side of the Force', emoji: '\u{2694}\u{FE0F}', category: 'Star Wars', difficulty: 'medium', playerCount: 1980, avgScore: 74, tier: 'pro', isPopular: false, isNew: false },
  { id: 'pk5', title: 'Hogwarts Houses', subtitle: 'Which traits do you know?', emoji: '\u{1F9F9}', category: 'Harry Potter', difficulty: 'easy', playerCount: 4200, avgScore: 81, tier: 'free', isPopular: true, isNew: false },
  { id: 'pk6', title: 'Speedrun Trivia', subtitle: 'Gaming history at lightspeed', emoji: '\u{1F3AE}', category: 'Gaming', difficulty: 'mixed', playerCount: 1560, avgScore: 65, tier: 'free', isPopular: false, isNew: true },
  { id: 'pk7', title: 'Disney Villains', subtitle: 'Know your antagonists', emoji: '\u{1F47E}', category: 'Disney', difficulty: 'medium', playerCount: 2200, avgScore: 70, tier: 'pro', isPopular: false, isNew: false },
  { id: 'pk8', title: 'Eras Tour Quiz', subtitle: 'Swiftie status: verified?', emoji: '\u{2728}', category: 'Taylor Swift', difficulty: 'hard', playerCount: 3800, avgScore: 66, tier: 'pro', isPopular: true, isNew: false },
  { id: 'pk9', title: 'NFL Legends', subtitle: 'Gridiron greatness', emoji: '\u{1F3C8}', category: 'NFL', difficulty: 'medium', playerCount: 1740, avgScore: 71, tier: 'free', isPopular: false, isNew: true },
  { id: 'pk10', title: 'NBA Dynasties', subtitle: 'Championship legacies', emoji: '\u{1F3C0}', category: 'NBA', difficulty: 'hard', playerCount: 1320, avgScore: 59, tier: 'free', isPopular: false, isNew: true },
  { id: 'pk11', title: 'Cold Case Files', subtitle: 'Crack the unsolved', emoji: '\u{1F50D}', category: 'True Crime', difficulty: 'hard', playerCount: 2680, avgScore: 54, tier: 'pro', isPopular: false, isNew: false },
  { id: 'pk12', title: 'One Piece Odyssey', subtitle: 'Grand Line knowledge test', emoji: '\u{1F3F4}\u{200D}\u{2620}\u{FE0F}', category: 'Anime', difficulty: 'mixed', playerCount: 980, avgScore: 63, tier: 'pro', isPopular: false, isNew: true },
];

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
  const [packs] = useState<NichePack[]>(MOCK_PACKS);

  const filteredPacks = useMemo(() => {
    let result = packs;
    if (filter === 'free') result = result.filter((p) => p.tier === 'free');
    if (filter === 'popular') result = result.filter((p) => p.isPopular);
    if (filter === 'new') result = result.filter((p) => p.isNew);
    if (selectedCategory !== 'All') result = result.filter((p) => p.category === selectedCategory);
    return result;
  }, [packs, filter, selectedCategory]);

  const playPack = (pack: NichePack) => {
    if (pack.tier === 'pro' && !profile?.isPro) {
      void showProPaywall();
      return;
    }
    navigation.navigate('Game', {
      mode: 'solo',
      category: pack.category as any,
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
          {CATEGORIES.map((cat) => (
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
