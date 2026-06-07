import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { AvatarView } from '../components/AvatarView';
import { AdBanner } from '../components/AdBanner';
import { MilestoneBanner } from '../components/MilestoneBanner';
import { WedgeTracker } from '../components/WedgeTracker';
import { useProfile } from '../context/ProfileContext';
import { showInterstitialAd } from '../lib/ads';
import { playCelebration } from '../lib/audio';
import { rankTitle } from '../lib/elo';
import {
  loadTotalMatchesPlayed,
  recordMatchCompleted,
  shouldShowInterstitial,
} from '../lib/monetization';
import { shareMatchResult } from '../lib/share';
import { speakLine } from '../lib/speech';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ navigation, route }: Props) {
  const { summary } = route.params;
  const { profile } = useProfile();
  const [matchCount, setMatchCount] = useState(0);
  const celebrated = useRef(false);

  useEffect(() => {
    void recordMatchCompleted().then(setMatchCount);
  }, []);

  useEffect(() => {
    if (celebrated.current || summary.outcome !== 'win') return;
    celebrated.current = true;

    const milestones = summary.milestones ?? [];
    void playCelebration(milestones.length > 0);

    const allHighlights = [
      ...(summary.milestones ?? []),
      ...(summary.achievementUnlocks ?? []),
    ];
    if (profile?.voiceEnabled && allHighlights.length > 0) {
      const top = allHighlights[0];
      void speakLine(`${top.emoji} ${top.label}`, {
        preset: profile.voicePreset,
        enabled: true,
      });
    } else if (profile?.voiceEnabled) {
      void speakLine('Victory!', {
        preset: profile.voicePreset,
        enabled: true,
      });
    }
  }, [summary, profile]);

  const maybeShowInterstitial = useCallback(async (): Promise<void> => {
    if (!profile || profile.isPro) return;
    const total = matchCount || (await loadTotalMatchesPlayed());
    if (!shouldShowInterstitial(profile.isPro, total)) return;
    await showInterstitialAd();
  }, [profile, matchCount]);

  const navigateRematch = useCallback(async () => {
    await maybeShowInterstitial();
    if (summary.mode === 'passplay') {
      navigation.replace('PassPlaySetup');
      return;
    }
    if (summary.mode === 'quad') {
      navigation.replace('QuadSetup');
      return;
    }
    navigation.replace('Game', {
      mode:
        summary.mode === 'daily'
          ? 'daily'
          : summary.mode === 'party'
            ? 'party'
            : 'quick',
    });
  }, [maybeShowInterstitial, navigation, summary.mode]);
  const win = summary.outcome === 'win';
  const draw = summary.outcome === 'draw';
  const headline = win ? 'VICTORY' : draw ? 'DRAW' : 'DEFEAT';
  const headlineColor = win ? colors.success : draw ? colors.warning : colors.danger;
  const rank = rankTitle(summary.newElo);
  const correctCount = summary.rounds.filter((r) => r.correct).length;
  const modeLabel =
    summary.mode === 'daily'
      ? 'Daily · 10 Qs'
      : summary.mode === 'quad'
        ? '4-Player'
        : summary.mode === 'passplay'
          ? 'Pass & Play'
          : summary.mode === 'party'
          ? 'Party Night'
          : summary.mode === 'quick'
            ? 'Ranked Duel'
            : 'Solo';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.modeTag}>{modeLabel}{summary.isOnline ? ' · LIVE' : ''}</Text>
        <Text style={[styles.headline, { color: headlineColor }]}>{headline}</Text>

        {win && summary.milestones && summary.milestones.length > 0 && (
          <MilestoneBanner milestones={summary.milestones} />
        )}

        {summary.achievementUnlocks && summary.achievementUnlocks.length > 0 && (
          <MilestoneBanner milestones={summary.achievementUnlocks} title="Achievement unlocked!" />
        )}

        {summary.shareGrid && (
          <View style={styles.shareCard}>
            <Text style={styles.shareGrid}>{summary.shareGrid}</Text>
          </View>
        )}

        {summary.collectedWedges && summary.collectedWedges.length > 0 && (
          <View style={styles.wedgeCard}>
            <WedgeTracker collected={summary.collectedWedges} size="md" />
            <Text style={styles.wedgeCaption}>
              {summary.collectedWedges.length} of 7 categories locked in
            </Text>
          </View>
        )}

        {summary.standings && summary.standings.length > 0 && (
          <View style={styles.standingsCard}>
            <Text style={styles.standingsTitle}>Final standings</Text>
            {summary.standings.map((s) => (
              <View key={s.id} style={[styles.standingRow, s.isYou && styles.standingYou]}>
                <Text style={styles.standingRank}>#{s.rank}</Text>
                <AvatarView avatar={s.avatar} size={32} />
                <Text style={styles.standingName} numberOfLines={1}>
                  {s.name}
                  {s.isBot ? ' 🤖' : ''}
                </Text>
                <Text style={styles.standingScore}>{s.score}</Text>
              </View>
            ))}
          </View>
        )}

        {summary.partyRank && summary.partySize && !summary.standings && (
          <Text style={styles.partyRank}>
            🎉 Party finish: #{summary.partyRank} of {summary.partySize}
          </Text>
        )}

        <View style={styles.scoreCard}>
          <View style={styles.scoreSide}>
            <Text style={styles.sideName}>You</Text>
            <Text style={[styles.sideScore, { color: colors.primary }]}>{summary.you}</Text>
          </View>
          <Text style={styles.dash}>—</Text>
          <View style={styles.scoreSide}>
            {summary.opponentAvatar && (
              <AvatarView avatar={summary.opponentAvatar} size={36} style={{ marginBottom: 4 }} />
            )}
            <Text style={styles.sideName} numberOfLines={1}>
              {summary.opponentName}
            </Text>
            <Text style={[styles.sideScore, { color: colors.accent }]}>{summary.opponent}</Text>
          </View>
        </View>

        <View style={styles.eloCard}>
          <Text style={styles.eloLabel}>RANK</Text>
          <View style={styles.eloRow}>
            <View style={[styles.rankDot, { backgroundColor: rank.color }]} />
            <Text style={[styles.rankTitle, { color: rank.color }]}>{rank.title}</Text>
          </View>
          {summary.mode !== 'daily' && (
            <Text style={styles.eloValue}>
              {summary.newElo}{' '}
              <Text
                style={{
                  color: summary.eloDelta >= 0 ? colors.success : colors.danger,
                  fontSize: font.h3,
                }}
              >
                ({summary.eloDelta >= 0 ? '+' : ''}
                {summary.eloDelta})
              </Text>
            </Text>
          )}
          <Text style={styles.accuracy}>
            {correctCount}/{summary.rounds.length} correct
          </Text>
        </View>

        <View style={styles.recap}>
          {summary.rounds.map((r, i) => (
            <View key={r.questionId} style={styles.recapRow}>
              <Text style={styles.recapIndex}>Q{i + 1}</Text>
              <View
                style={[
                  styles.recapDot,
                  { backgroundColor: r.correct ? colors.success : colors.danger },
                ]}
              />
              <Text style={styles.recapText}>
                {r.correct ? `Correct · +${r.points}` : r.selected === null ? 'No answer' : 'Wrong'}
              </Text>
              {r.correct && <Text style={styles.recapMs}>{(r.ms / 1000).toFixed(1)}s</Text>}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <PrimaryButton label="SHARE RESULT 📣" onPress={() => void shareMatchResult(summary)} />
        <PrimaryButton
          label="REMATCH ⚔"
          onPress={() => void navigateRematch()}
          variant={win ? 'primary' : 'accent'}
        />
        <PrimaryButton label="Home" variant="ghost" onPress={() => navigation.navigate('Home')} />
      </View>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  modeTag: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  shareCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  shareGrid: {
    color: colors.text,
    fontSize: font.body,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
  wedgeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  wedgeCaption: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  partyRank: {
    color: colors.accent,
    fontSize: font.h3,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  standingsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  standingsTitle: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  standingYou: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  standingRank: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '900',
    width: 28,
  },
  standingName: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  standingScore: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '900',
  },
  headline: {
    fontSize: 44,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: spacing.lg,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.lg,
  },
  scoreSide: {
    flex: 1,
    alignItems: 'center',
  },
  sideName: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sideScore: {
    fontSize: 46,
    fontWeight: '900',
  },
  dash: {
    color: colors.textFaint,
    fontSize: font.h2,
  },
  eloCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  eloLabel: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
  },
  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rankDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rankTitle: {
    fontSize: font.h3,
    fontWeight: '800',
  },
  eloValue: {
    color: colors.text,
    fontSize: font.h1,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  accuracy: {
    color: colors.textMuted,
    fontSize: font.body,
    marginTop: spacing.xs,
  },
  recap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  recapIndex: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '800',
    width: 26,
  },
  recapDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recapText: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '600',
  },
  recapMs: {
    color: colors.textFaint,
    fontSize: font.small,
    marginLeft: 'auto',
  },
  actions: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
