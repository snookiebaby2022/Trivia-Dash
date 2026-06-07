import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from '../components/AdBanner';
import { AvatarCustomizer } from '../components/AvatarCustomizer';
import { AvatarView } from '../components/AvatarView';
import { CategoryWheel } from '../components/CategoryWheel';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProUpgradeCard } from '../components/ProUpgradeCard';
import { RewardedOfferCard } from '../components/RewardedOfferCard';
import { VoicePicker } from '../components/VoicePicker';
import { useProfile } from '../context/ProfileContext';
import { APP_NAME_UPPER, APP_TAGLINE, APP_WELCOME_LINE } from '../lib/brand';
import { getDailyChallenge, todayKey } from '../lib/daily';
import { rankTitle } from '../lib/elo';
import {
  canPlayDailyToday,
  canUseDailyRetryAd,
  canUseStreakShieldAd,
  consumeDailyExtraPlay,
  dailyStatusLabel,
} from '../lib/monetization';
import { isMatchmakingAvailable } from '../lib/matchmaking';
import { isMusicEnabled, setMusicEnabled, startMenuMusic } from '../lib/audio';
import { speakQuestion } from '../lib/speech';
import { FREE_QUESTIONS, PRO_HISTORICAL_QUESTIONS } from '../data/questions';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const {
    profile,
    loading,
    setUsername,
    setAvatar,
    setVoicePreset,
    setVoiceEnabled,
    watchRewardedAd,
    manageSubscription,
    update,
  } = useProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [rewardLoading, setRewardLoading] = useState<'daily' | 'shield' | null>(null);
  const [musicOn, setMusicOn] = useState(true);

  useEffect(() => {
    void isMusicEnabled().then(setMusicOn);
  }, []);

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const rank = rankTitle(profile.elo);
  const total = profile.wins + profile.losses + profile.draws;
  const winRate = total ? Math.round((profile.wins / total) * 100) : 0;
  const daily = getDailyChallenge(profile.isPro);
  const questionCount = profile.isPro
    ? FREE_QUESTIONS.length + PRO_HISTORICAL_QUESTIONS.length
    : FREE_QUESTIONS.length;
  const dailyReady = canPlayDailyToday(profile);
  const dailyLabel = dailyStatusLabel(profile);

  const startDaily = async () => {
    if (!dailyReady) return;
    if (profile.dailyExtraPlayDate === todayKey()) {
      await update(consumeDailyExtraPlay(profile));
    }
    navigation.navigate('Game', {
      mode: 'daily',
      questionSeed: undefined,
      questionIds: daily.questionIds,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.brand}>{APP_NAME_UPPER}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        </View>

        <CategoryWheel />

        <Pressable style={styles.profileCard} onPress={() => setShowCustomize((v) => !v)}>
          <AvatarView avatar={profile.avatar} size={64} showRing />
          <View style={{ flex: 1 }}>
            {editing ? (
              <TextInput
                value={draft}
                onChangeText={setDraft}
                autoFocus
                maxLength={16}
                placeholder="Your name"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                onSubmitEditing={async () => {
                  await setUsername(draft);
                  setEditing(false);
                }}
                onBlur={async () => {
                  await setUsername(draft);
                  setEditing(false);
                }}
              />
            ) : (
              <Pressable
                onPress={() => {
                  setDraft(profile.username);
                  setEditing(true);
                }}
              >
                <Text style={styles.username}>{profile.username}</Text>
                <Text style={styles.editHint}>tap name to rename · tap card to customize</Text>
              </Pressable>
            )}
            <View style={styles.rankRow}>
              <View style={[styles.rankDot, { backgroundColor: rank.color }]} />
              <Text style={[styles.rankText, { color: rank.color }]}>{rank.title}</Text>
              {profile.isPro && <Text style={styles.proBadge}>PRO</Text>}
              <Text style={styles.eloText}>{profile.elo} ELO</Text>
            </View>
          </View>
        </Pressable>

        {showCustomize && (
          <>
            <AvatarCustomizer
              avatar={profile.avatar}
              isPro={profile.isPro}
              cosmeticUnlocks={profile.achievementState.cosmeticUnlocks}
              onChange={(a) => void setAvatar(a)}
              onRequestPro={() => setShowPro(true)}
            />
            <VoicePicker
              preset={profile.voicePreset}
              enabled={profile.voiceEnabled}
              isPro={profile.isPro}
              onPreset={(p) => void setVoicePreset(p)}
              onToggle={(e) => void setVoiceEnabled(e)}
              onPreview={(p) =>
                void speakQuestion(APP_WELCOME_LINE, {
                  preset: p,
                  enabled: true,
                })
              }
              onRequestPro={() => setShowPro(true)}
            />
            <Pressable
              style={styles.musicRow}
              onPress={async () => {
                const next = !musicOn;
                setMusicOn(next);
                await setMusicEnabled(next);
                if (next) await startMenuMusic();
              }}
            >
              <Text style={styles.musicLabel}>Party menu music</Text>
              <Text style={[styles.musicToggle, musicOn && styles.musicOn]}>
                {musicOn ? '🎵 On' : '🔇 Off'}
              </Text>
            </Pressable>
          </>
        )}

        <Pressable
          style={styles.trophyCard}
          onPress={() => navigation.navigate('Achievements')}
        >
          <Text style={styles.trophyEmoji}>🏆</Text>
          <View style={styles.trophyBody}>
            <Text style={styles.trophyTitle}>Trophy Case</Text>
            <Text style={styles.trophySub}>
              {profile.achievementState.unlocked.length} achievements unlocked
            </Text>
          </View>
          <Text style={styles.trophyChevron}>›</Text>
        </Pressable>

        <View style={styles.statsRow}>
          <Stat label="Wins" value={String(profile.wins)} color={colors.success} />
          <Stat label="Win rate" value={`${winRate}%`} color={colors.primary} />
          <Stat label="Streak" value={String(profile.streak)} color={colors.accent} />
          <Stat label="Daily" value={String(profile.dailyStreak)} color={colors.gold} />
        </View>

        {profile.streakShield && (
          <Text style={styles.shieldHint}>🛡 Streak shield active — protects your next missed day</Text>
        )}

        {!profile.isPro && canUseDailyRetryAd(profile) && (
          <RewardedOfferCard
            title="Bonus daily run"
            subtitle="Watch an ad for one extra daily challenge today"
            loading={rewardLoading === 'daily'}
            onWatch={async () => {
              setRewardLoading('daily');
              await watchRewardedAd('daily_retry');
              setRewardLoading(null);
            }}
          />
        )}

        {!profile.isPro && canUseStreakShieldAd(profile) && (
          <RewardedOfferCard
            title="Streak shield"
            subtitle="Miss a day without losing your daily streak"
            loading={rewardLoading === 'shield'}
            onWatch={async () => {
              setRewardLoading('shield');
              await watchRewardedAd('streak_shield');
              setRewardLoading(null);
            }}
          />
        )}

        <View style={styles.archiveCard}>
          <Text style={styles.archiveTitle}>Question archive</Text>
          <Text style={styles.archiveCount}>{questionCount} questions unlocked</Text>
          <Text style={styles.archiveSub}>
            {profile.isPro
              ? 'Full 1930–2026 historical party pack active'
              : 'Pro unlocks 60+ decades trivia (1930–2026)'}
          </Text>
        </View>

        <AdBanner />

        {showPro && <ProUpgradeCard onClose={() => setShowPro(false)} />}

        <View style={styles.actions}>
          <PrimaryButton
            label="📱  PASS & PLAY"
            variant="accent"
            onPress={() => navigation.navigate('PassPlaySetup')}
          />
          <PrimaryButton
            label="🎲  4-PLAYER"
            onPress={() => navigation.navigate('QuadSetup')}
          />
          <PrimaryButton
            label="🎉  HOST PARTY"
            onPress={() => navigation.navigate('PartyLobby', { host: true })}
          />
          <PrimaryButton
            label="🚪  JOIN PARTY"
            variant="ghost"
            onPress={() => navigation.navigate('PartyLobby', undefined)}
          />
          <PrimaryButton
            label="⚔  QUICK MATCH"
            onPress={() =>
              navigation.navigate('Game', {
                mode: 'quick',
              })
            }
          />
          <PrimaryButton
            label={`📅  DAILY · ${dailyLabel}`}
            variant={dailyReady ? 'primary' : 'ghost'}
            onPress={() => void startDaily()}
          />
          <PrimaryButton
            label="Leaderboard"
            variant="ghost"
            onPress={() => navigation.navigate('Leaderboard')}
          />
          {!profile.isPro ? (
            <PrimaryButton label="Unlock Pro · 1930–2026" onPress={() => setShowPro(true)} />
          ) : (
            <PrimaryButton
              label="Manage subscription"
              variant="ghost"
              onPress={() => void manageSubscription()}
            />
          )}
        </View>

        {!isMatchmakingAvailable() && (
          <Text style={styles.offlineNote}>
            Online party + ranked need Supabase keys in .env — solo & daily still work offline.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  brand: {
    color: colors.gold,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: colors.primary,
    textShadowRadius: 8,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: font.body,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.md,
  },
  username: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '800',
  },
  editHint: {
    color: colors.textFaint,
    fontSize: font.small,
  },
  input: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '800',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  rankDot: { width: 10, height: 10, borderRadius: 5 },
  rankText: { fontSize: font.body, fontWeight: '700' },
  proBadge: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eloText: {
    color: colors.textMuted,
    fontSize: font.small,
    marginLeft: 'auto',
  },
  trophyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 210, 77, 0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  trophyEmoji: {
    fontSize: 28,
  },
  trophyBody: {
    flex: 1,
  },
  trophyTitle: {
    color: colors.gold,
    fontSize: font.h3,
    fontWeight: '900',
  },
  trophySub: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '700',
  },
  trophyChevron: {
    color: colors.textFaint,
    fontSize: 28,
    fontWeight: '300',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: font.h3, fontWeight: '900' },
  statLabel: { color: colors.textFaint, fontSize: font.small, marginTop: 2 },
  shieldHint: {
    color: colors.success,
    fontSize: font.small,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  archiveCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  archiveTitle: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
  },
  archiveCount: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  archiveSub: {
    color: colors.primary,
    fontSize: font.small,
    marginTop: spacing.xs,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  musicLabel: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  musicToggle: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: '800',
  },
  musicOn: {
    color: colors.gold,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  offlineNote: {
    color: colors.textFaint,
    fontSize: font.small,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
