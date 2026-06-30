import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import {
  getActiveEvent,
  getUpcomingEvents,
  getEventTimeRemaining,
  isEventActive,
  type SeasonalEvent as LibEvent,
} from '../lib/seasonalEvents';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SeasonalEvents'>;

type EventStatus = 'active' | 'upcoming' | 'past';

interface DisplayEvent {
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

function eventToDisplay(e: LibEvent): DisplayEvent {
  const start = new Date(e.startDate + 'T00:00:00').getTime();
  const end = new Date(e.endDate + 'T23:59:59').getTime();
  const now = Date.now();
  let status: EventStatus = 'past';
  if (isEventActive(e)) status = 'active';
  else if (start > now) status = 'upcoming';

  return {
    id: e.id,
    title: e.title,
    theme: e.subtitle,
    emoji: e.emoji,
    categories: e.categories,
    entryCost: e.entryCoins,
    status,
    startsAt: start,
    endsAt: end,
    rewardPreview: e.exclusiveReward.label,
  };
}

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
  const [now, setNow] = useState(Date.now());

  const events = useMemo(() => {
    const active = getActiveEvent();
    const upcoming = getUpcomingEvents().filter((e) => !isEventActive(e));
    const all: DisplayEvent[] = [];
    if (active) all.push({ ...eventToDisplay(active), status: 'active' });
    upcoming.forEach((e) => all.push({ ...eventToDisplay(e), status: 'upcoming' }));
    return all;
  }, []);

  useEffect(() => {
    const active = events.find((e) => e.status === 'active');
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [events]);

  const activeEvent = events.find((e) => e.status === 'active');
  const upcoming = events.filter((e) => e.status === 'upcoming');

  const enterEvent = (event: DisplayEvent) => {
    navigation.navigate('Game', {
      mode: 'solo',
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
  });
}
