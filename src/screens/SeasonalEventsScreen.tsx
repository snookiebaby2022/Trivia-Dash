import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SeasonalEvents'>;

type EventStatus = 'active' | 'upcoming' | 'past';

interface SeasonalEvent {
  id: string;
  title: string;
  theme: string;
  emoji: string;
  categories: string[];
  entryCost: number;
  status: EventStatus;
  startsAt: number;
  endsAt: number;
  rewardPreview: string;
  playerRank?: number;
  playerScore?: number;
}

const MOCK_EVENTS: SeasonalEvent[] = [
  {
    id: 'sci_fi_week',
    title: 'Sci-Fi Week',
    theme: 'Sci-Fi Week',
    emoji: '\u{1F680}',
    categories: ['Space', 'Technology', 'Movies', 'Literature'],
    entryCost: 150,
    status: 'active',
    startsAt: Date.now() - 2 * 86400000,
    endsAt: Date.now() + 2 * 86400000 + 5 * 3600000 + 37 * 60000,
    rewardPreview: 'Galaxy Frame',
  },
  {
    id: 'kpop_kingdom',
    title: 'K-Pop Kingdom',
    theme: 'K-Pop Kingdom',
    emoji: '\u{1F451}',
    categories: ['K-Pop', 'Music', 'Entertainment'],
    entryCost: 100,
    status: 'upcoming',
    startsAt: Date.now() + 3 * 86400000,
    endsAt: Date.now() + 10 * 86400000,
    rewardPreview: 'Crown Badge',
  },
  {
    id: 'marvel_mayhem',
    title: 'Marvel Mayhem',
    theme: 'Marvel Mayhem',
    emoji: '\u{1F9E9}',
    categories: ['Marvel', 'Movies', 'Pop Culture'],
    entryCost: 200,
    status: 'upcoming',
    startsAt: Date.now() + 7 * 86400000,
    endsAt: Date.now() + 14 * 86400000,
    rewardPreview: 'Hero Icon',
  },
  {
    id: 'anime_arcade',
    title: 'Anime Arcade',
    theme: 'Anime Arcade',
    emoji: '\u{1F3AE}',
    categories: ['Anime', 'Gaming', 'Pop Culture'],
    entryCost: 125,
    status: 'past',
    startsAt: Date.now() - 14 * 86400000,
    endsAt: Date.now() - 7 * 86400000,
    rewardPreview: 'Sakura Frame',
    playerRank: 42,
    playerScore: 1850,
  },
  {
    id: 'disney_daze',
    title: 'Disney Daze',
    theme: 'Disney Daze',
    emoji: '\u{1F3F0}',
    categories: ['Disney', 'Movies', 'Art'],
    entryCost: 100,
    status: 'past',
    startsAt: Date.now() - 30 * 86400000,
    endsAt: Date.now() - 23 * 86400000,
    rewardPreview: 'Castle Badge',
    playerRank: 118,
    playerScore: 980,
  },
];

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(String(days).padStart(2, '0'));
  parts.push(String(hours).padStart(2, '0'));
  parts.push(String(minutes).padStart(2, '0'));
  return parts.join(':');
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SeasonalEventsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [events] = useState<SeasonalEvent[]>(MOCK_EVENTS);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const active = events.find((e) => e.status === 'active');
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [events]);

  const activeEvent = events.find((e) => e.status === 'active');
  const upcoming = events.filter((e) => e.status === 'upcoming');
  const past = events.filter((e) => e.status === 'past');

  const enterEvent = (event: SeasonalEvent) => {
    navigation.navigate('Game', {
      mode: 'solo',
      category: event.categories[0] as any,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Seasonal Events</Text>

        {activeEvent ? (
          <View style={[styles.heroCard, { borderColor: colors.gold }]}>
            <Text style={styles.heroEmoji}>{activeEvent.emoji}</Text>
            <Text style={styles.heroTitle}>{activeEvent.title}</Text>
            <Text style={styles.heroTheme}>{activeEvent.theme}</Text>
            <View style={styles.countdownRow}>
              {formatCountdown(Math.max(0, activeEvent.endsAt - now))
                .split(':')
                .map((segment, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Text style={[styles.countdownColon, { color: colors.gold }]}>:</Text>}
                    <View style={[styles.countdownSegment, { backgroundColor: colors.bgElevated }]}>
                      <Text style={[styles.countdownText, { color: colors.gold }]}>{segment}</Text>
                    </View>
                  </React.Fragment>
                ))}
            </View>
            <View style={styles.badgeRow}>
              {activeEvent.categories.map((cat) => (
                <View key={cat} style={[styles.badge, { backgroundColor: colors.primary + '30' }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{cat}</Text>
                </View>
              ))}
            </View>
            <PrimaryButton
              label={`Enter for ${activeEvent.entryCost} coins`}
              variant="primary"
              onPress={() => enterEvent(activeEvent)}
            />
            <View style={styles.rewardPreview}>
              <Text style={styles.rewardLabel}>Exclusive Reward:</Text>
              <Text style={[styles.rewardName, { color: colors.gold }]}>{activeEvent.rewardPreview}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={styles.emptyEmoji}>{'\u{1F389}'}</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No events running — check back soon!
            </Text>
          </View>
        )}

        {upcoming.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.gold }]}>Upcoming</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
              {upcoming.map((event) => (
                <View key={event.id} style={[styles.upcomingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Text style={styles.upcomingEmoji}>{event.emoji}</Text>
                  <Text style={[styles.upcomingTitle, { color: colors.text }]}>{event.title}</Text>
                  <Text style={[styles.upcomingDate, { color: colors.textFaint }]}>
                    {formatDate(event.startsAt)}
                  </Text>
                  <Text style={[styles.upcomingCost, { color: colors.textMuted }]}>
                    {'\u{1FA99}'} {event.entryCost}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {past.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>Past Events</Text>
            {past.map((event) => (
              <View key={event.id} style={[styles.pastCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={styles.pastEmoji}>{event.emoji}</Text>
                <View style={styles.pastBody}>
                  <Text style={[styles.pastTitle, { color: colors.textMuted }]}>{event.title}</Text>
                  <Text style={[styles.pastRank, { color: colors.textFaint }]}>
                    Final Rank: #{event.playerRank ?? '—'} · Score: {event.playerScore ?? '—'}
                  </Text>
                </View>
              </View>
            ))}
          </>
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

    heroCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 2,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
    },
    heroEmoji: { fontSize: 48 },
    heroTitle: { color: colors.text, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
    heroTheme: { color: colors.textMuted, fontSize: font.body, marginBottom: -spacing.sm },
    countdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    countdownSegment: {
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minWidth: 52,
      alignItems: 'center',
    },
    countdownText: { fontSize: font.h2, fontWeight: '900', fontVariant: ['tabular-nums'] },
    countdownColon: { fontSize: font.h2, fontWeight: '900' },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
    badge: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    badgeText: { fontSize: font.small, fontWeight: '700' },
    rewardPreview: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    rewardLabel: { color: colors.textMuted, fontSize: font.small },
    rewardName: { fontSize: font.small, fontWeight: '800' },

    emptyCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
    },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: font.body, textAlign: 'center' },

    sectionLabel: {
      fontSize: font.small,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: spacing.sm,
    },
    horizontalRow: { gap: spacing.sm },
    upcomingCard: {
      width: 150,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.md,
      alignItems: 'center',
      gap: spacing.xs,
    },
    upcomingEmoji: { fontSize: 32 },
    upcomingTitle: { fontSize: font.body, fontWeight: '800', textAlign: 'center' },
    upcomingDate: { fontSize: font.small },
    upcomingCost: { fontSize: font.small, fontWeight: '700' },

    pastCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.sm,
      opacity: 0.7,
    },
    pastEmoji: { fontSize: 28 },
    pastBody: { flex: 1 },
    pastTitle: { fontSize: font.body, fontWeight: '700' },
    pastRank: { fontSize: font.small, marginTop: 2 },
  });
}
