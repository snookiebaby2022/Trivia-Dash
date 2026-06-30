import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { AuthPanel } from '../components/AuthPanel';
import { DailyStreakModal } from '../components/DailyStreakModal';
import { OnboardingWalkthrough } from '../components/OnboardingWalkthrough';
import { LegalLinks } from '../components/LegalLinks';
import { AvatarCustomizer } from '../components/AvatarCustomizer';
import { ProfileBanner } from '../components/ProfileBanner';
import { CategoryWheel } from '../components/CategoryWheel';
import { PrimaryButton } from '../components/PrimaryButton';
import { SocialFeed } from '../components/SocialFeed';
import { StreakWidget } from '../components/StreakWidget';
import { ProUpgradeCard } from '../components/ProUpgradeCard';
import { RewardedOfferCard } from '../components/RewardedOfferCard';
import { VoicePicker } from '../components/VoicePicker';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME_UPPER, APP_TAGLINE, APP_WELCOME_LINE } from '../lib/brand';
import { formatCoins } from '../lib/coins';
import { getDailyChallenge, todayKey } from '../lib/daily';
import { rankTitle } from '../lib/elo';
import {
  canPlayDailyToday,
  canUseDailyRetryAd,
  canUseStreakShieldAd,
  consumeDailyExtraPlay,
  dailyStatusLabel,
} from '../lib/monetization';
import { canUseRankedMatch } from '../lib/entitlements';
import { isMatchmakingAvailable } from '../lib/matchmaking';
import { dismissDailyReminder, shouldShowDailyReminder } from '../lib/reminders';
import { hasCompletedWalkthrough } from '../lib/onboarding';
import { getWeeklyEvent } from '../lib/weeklyEvent';
import { getActiveEvent, getEventTimeRemaining } from '../lib/seasonalEvents';
import { getOnlineFriendsCount } from '../lib/socialFeed';
import { getPopularNichePacks } from '../lib/nichePacks';
import { speakQuestion } from '../lib/speech';
import { getLoginStreakState } from '../lib/streakRewards';
import { refreshTriviaCache } from '../lib/triviaApi';
import { countEarnedWedges, WEDGE_UNLOCK_CORRECT } from '../lib/wedges';
import { FREE_QUESTIONS, PRO_HISTORICAL_QUESTIONS, setBonusQuestions } from '../data/questions';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const {
    profile,
    loading,
    isSignedIn,
    setUsername,
    setAvatar,
    setProfilePhoto,
    setCoverPhoto,
    setVoicePreset,
    watchRewardedAd,
    manageSubscription,
    update,
    showProPaywall,
    claimLoginReward,
  } = useProfile();
  const [editing, setEditing] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showLoginStreak, setShowLoginStreak] = useState(false);
  const [draft, setDraft] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [rewardLoading, setRewardLoading] = useState<'daily' | 'shield' | 'powerups' | null>(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ReturnType<typeof getActiveEvent>>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const styles = useMemo(() => makeHomeStyles(colors), [colors]);

  useFocusEffect(
    useCallback(() => {
      if (!profile || loading) return;
      void hasCompletedWalkthrough().then((done) => {
        if (!done) setShowWalkthrough(true);
      });
      const login = getLoginStreakState(profile);
      if (login.canClaim) setShowLoginStreak(true);
      void refreshTriviaCache().then((qs) => {
        if (qs.length) setBonusQuestions(qs);
      });
      setActiveEvent(getActiveEvent());
      setOnlineCount(getOnlineFriendsCount());
    }, [profile, loading])
  );

  useEffect(() => {
    if (!profile) {
      setShowReminder(false);
      return;
    }
    void shouldShowDailyReminder(profile).then(setShowReminder);
  }, [profile]);

  if (loading || !profile) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.bg }]}>
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
  const wedgesEarned = countEarnedWedges(profile);
  const weekly = getWeeklyEvent();
  const loginStreak = getLoginStreakState(profile);
  const coins = profile.coins ?? 0;

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <OnboardingWalkthrough
        visible={showWalkthrough}
        isSignedIn={isSignedIn}
        onDone={() => setShowWalkthrough(false)}
      />
      <DailyStreakModal
        visible={showLoginStreak}
        state={loginStreak}
        onClaim={async () => {
          await claimLoginReward();
          setShowLoginStreak(false);
        }}
        onClose={() => setShowLoginStreak(false)}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable
            style={[styles.settingsBtn, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
          <Text style={[styles.brand, { color: colors.gold, textShadowColor: colors.primary }]}>{APP_NAME_UPPER}</Text>
          <Pressable
            style={[styles.coinsBtn, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
            onPress={() => setShowLoginStreak(true)}
            accessibilityLabel="Coins and daily streak"
          >
            <Text style={styles.coinsText}>🪙 {formatCoins(coins)}</Text>
          </Pressable>
        </View>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>

        <StreakWidget />

        {onlineCount > 0 && (
          <View style={styles.socialBar}>
            <Text style={styles.socialText}>🟢 {onlineCount} friend{onlineCount !== 1 ? 's' : ''} online</Text>
          </View>
        )}

        <ProfileBanner
          profile={profile}
          rankColor={rank.color}
          rankTitle={rank.title}
          trophyCount={profile.achievementState.unlocked.length}
          username={profile.username}
          editHint="tap name to rename · info to customize"
          onPressCover={() => void setCoverPhoto()}
          onPressPhoto={() => void setProfilePhoto()}
          onPressTrophies={() => navigation.navigate('Achievements')}
          onPressCard={() => setShowCustomize((v) => !v)}
          onPressUsername={() => {
            setDraft(profile.username);
            setEditing(true);
          }}
          editingName={
            editing ? (
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
            ) : undefined
          }
        />

        {showReminder && (
          <Pressable
            style={styles.reminder}
            onPress={() => {
              void dismissDailyReminder();
              setShowReminder(false);
              void startDaily();
            }}
          >
            <Text style={styles.reminderText}>📅 Daily challenge ready — tap to play</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.weekly}
          onPress={() => navigation.navigate('CategoryPractice', { category: weekly.category })}
        >
          <Text style={styles.weeklyTitle}>
            {weekly.emoji} {weekly.label}
          </Text>
          <Text style={styles.weeklySub}>
            Grind {weekly.category} · {profile.isPro ? '+25% season XP' : 'Unlock everything for bonus XP'}
          </Text>
        </Pressable>

        {activeEvent && (
          <Pressable
            style={styles.eventBanner}
            onPress={() => navigation.navigate('SeasonalEvents')}
          >
            <Text style={styles.eventEmoji}>{activeEvent.emoji}</Text>
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>{activeEvent.title}</Text>
              <Text style={styles.eventSub}>{activeEvent.subtitle}</Text>
            </View>
            <Text style={styles.eventChevron}>→</Text>
          </Pressable>
        )}

        <CategoryWheel
          profile={profile}
          onPress={() => navigation.navigate('WedgeProfile')}
        />

        <View style={styles.wedgeHint}>
          <Text style={styles.wedgeHintText}>
            {wedgesEarned} wedges earned · {WEDGE_UNLOCK_CORRECT} correct per category
          </Text>
        </View>

        {showCustomize && (
          <View style={styles.customizeBlock}>
            <AvatarCustomizer
              avatar={profile.avatar}
              photoUri={profile.profilePhotoUri}
              isPro={profile.isPro}
              cosmeticUnlocks={profile.achievementState.cosmeticUnlocks}
              onChange={(a) => void setAvatar(a)}
              onRequestPro={() => setShowPro(true)}
            />
            <VoicePicker
              preset={profile.voicePreset}
              isPro={profile.isPro}
              onPreset={(p) => void setVoicePreset(p)}
              onPreview={(p) =>
                void speakQuestion(APP_WELCOME_LINE, {
                  preset: p,
                  enabled: true,
                })
              }
              onRequestPro={() => setShowPro(true)}
            />
          </View>
        )}

        <AuthPanel />

        <View style={styles.heroSection}>
          <PrimaryButton
            label={`⚡  QUICK MATCH · Solo`}
            variant="primary"
            onPress={() => navigation.navigate('Game', { mode: 'solo' })}
          />
          <Text style={styles.heroSub}>Single-player dash — combo multipliers & power-ups</Text>

          <PrimaryButton
            label="♾️  ENDLESS DASH"
            variant="ghost"
            onPress={() => navigation.navigate('Game', { mode: 'endless' })}
          />
          <Text style={styles.heroSub}>3 strikes · keep going until you miss three</Text>

          <PrimaryButton
            label="⏱  TIMED CHALLENGE · 90s"
            variant="ghost"
            onPress={() => navigation.navigate('Game', { mode: 'timed' })}
          />
          <Text style={styles.heroSub}>Race the clock — max score in 90 seconds</Text>

          <PrimaryButton
            label={`📅  DAILY CHALLENGE · ${dailyLabel}`}
            variant={dailyReady ? 'accent' : 'ghost'}
            onPress={() => void startDaily()}
          />
          <PrimaryButton
            label={canUseRankedMatch(profile.isPro) ? '⚔  RANKED QUICK MATCH' : '⚔  Ranked match 🔒 Pro'}
            variant="ghost"
            onPress={() => {
              if (!canUseRankedMatch(profile.isPro)) void showProPaywall();
              else navigation.navigate('Game', { mode: 'ranked', botDifficulty: 'medium' });
            }}
          />
          <PrimaryButton
            label="🎯  Category practice"
            variant="ghost"
            onPress={() => navigation.navigate('CategoryPractice')}
          />
        </View>

        <View style={styles.statsRow}>
          <Stat label="Wins" value={String(profile.wins)} color={colors.success} styles={styles} />
          <Stat label="Win rate" value={`${winRate}%`} color={colors.primary} styles={styles} />
          <Stat label="Streak" value={String(profile.streak)} color={colors.accent} styles={styles} />
          <Stat label="Correct" value={String(profile.stats.totalCorrect)} color={colors.gold} styles={styles} />
        </View>

        <SocialFeed limit={5} />

        {(profile.streakShieldCount ?? (profile.streakShield ? 1 : 0)) > 0 && (
          <Text style={styles.shieldHint}>🛡 Streak shield{((profile.streakShieldCount ?? 1) > 1) ? ` ×${profile.streakShieldCount}` : ''} active</Text>
        )}

        <View style={styles.modeGrid}>
          <ModeTile
            emoji="🎲"
            title="4-Player"
            sub="Bots or friends"
            onPress={() => navigation.navigate('QuadSetup')}
            styles={styles}
          />
          <ModeTile
            emoji="🎉"
            title="Party"
            sub="Host or join"
            onPress={() => navigation.navigate('PartyLobby', { host: true })}
            styles={styles}
          />
          <ModeTile
            emoji="📊"
            title="Daily ranks"
            sub="Same 10 Qs"
            onPress={() => navigation.navigate('DailyLeaderboard')}
            styles={styles}
          />
          <ModeTile
            emoji="🏅"
            title="ELO board"
            sub="Global top 100"
            onPress={() => navigation.navigate('Leaderboard')}
            styles={styles}
          />
          <ModeTile
            emoji="🎫"
            title="Season pass"
            sub="XP rewards"
            onPress={() => navigation.navigate('SeasonPass')}
            styles={styles}
          />
          <ModeTile
            emoji="🤝"
            title="Friend party"
            sub="Code join"
            onPress={() => navigation.navigate('FriendParty')}
            styles={styles}
          />
          <ModeTile
            emoji="📦"
            title="Community"
            sub="UGC packs"
            onPress={() => navigation.navigate('UgcPacks')}
            styles={styles}
          />
          <ModeTile
            emoji="✨"
            title="What's Pro?"
            sub="Free vs Pro"
            onPress={() => navigation.navigate('UnlockFeatures')}
            styles={styles}
          />
          <ModeTile
            emoji="🛒"
            title="Coin Shop"
            sub="Spend coins"
            onPress={() => navigation.navigate('CoinShop')}
            styles={styles}
          />
          <ModeTile
            emoji="📈"
            title="My Stats"
            sub="Detailed stats"
            onPress={() => navigation.navigate('Stats')}
            styles={styles}
          />
          <ModeTile
            emoji="🏆"
            title="Tournament"
            sub="Bracket play"
            onPress={() => navigation.navigate('Tournament')}
            styles={styles}
          />
          <ModeTile
            emoji="👥"
            title="Friends"
            sub="Social"
            onPress={() => navigation.navigate('Friends')}
            styles={styles}
          />
          <ModeTile
            emoji="🎪"
            title="Events"
            sub="Weekly tournaments"
            onPress={() => navigation.navigate('SeasonalEvents')}
            styles={styles}
          />
          <ModeTile
            emoji="🔥"
            title="Fandom"
            sub="Niche packs"
            onPress={() => navigation.navigate('NichePacks')}
            styles={styles}
          />
        </View>

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

        <RewardedOfferCard
          title="Power-up pack"
          subtitle="Watch an ad for 50/50, +5s, and skip"
          loading={rewardLoading === 'powerups'}
          onWatch={async () => {
            setRewardLoading('powerups');
            await watchRewardedAd('power_up_pack');
            setRewardLoading(null);
          }}
        />

        <AdBanner />

        {showPro && <ProUpgradeCard onClose={() => setShowPro(false)} />}

        {!profile.isPro ? (
          <PrimaryButton label="✨  Unlock everything" onPress={() => navigation.navigate('UnlockFeatures')} />
        ) : (
          <PrimaryButton
            label="Manage subscription"
            variant="ghost"
            onPress={() => void manageSubscription()}
          />
        )}

        <View style={styles.partySection}>
          <Text style={styles.partyLabel}>Same room fun</Text>
          <PrimaryButton
            label="📱  PASS & PLAY"
            variant="accent"
            onPress={() => navigation.navigate('PassPlaySetup')}
          />
          <PrimaryButton
            label="🚪  JOIN PARTY"
            variant="ghost"
            onPress={() => navigation.navigate('PartyLobby', undefined)}
          />
        </View>

        {!isMatchmakingAvailable() && (
          <Text style={styles.offlineNote}>
            Online party + ranked need Supabase keys — solo & daily work offline.
          </Text>
        )}

        <LegalLinks />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  color,
  styles,
}: {
  label: string;
  value: string;
  color: string;
  styles: ReturnType<typeof makeHomeStyles>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ModeTile({
  emoji,
  title,
  sub,
  onPress,
  styles,
}: {
  emoji: string;
  title: string;
  sub: string;
  onPress: () => void;
  styles: ReturnType<typeof makeHomeStyles>;
}) {
  return (
    <Pressable style={styles.modeTile} onPress={onPress}>
      <Text style={styles.modeEmoji}>{emoji}</Text>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeSub}>{sub}</Text>
    </Pressable>
  );
}

function makeHomeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  coinsBtn: {
    minWidth: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  coinsText: {
    color: colors.gold,
    fontSize: font.small,
    fontWeight: '900',
  },
  brand: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowRadius: 8,
    flex: 1,
    textAlign: 'center',
  },
  tagline: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
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
    marginBottom: spacing.xs,
  },
  profileBody: { flex: 1 },
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
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankText: { fontSize: font.small, fontWeight: '700' },
  proBadge: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '900',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eloText: {
    color: colors.textMuted,
    fontSize: font.small,
    marginLeft: 'auto',
  },
  trophyMini: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 210, 77, 0.12)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  trophyMiniEmoji: { fontSize: 20 },
  trophyMiniCount: {
    color: colors.gold,
    fontSize: font.small,
    fontWeight: '900',
  },
  reminder: {
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  reminderText: {
    color: colors.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
  weekly: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.sm,
  },
  weeklyTitle: {
    color: colors.gold,
    fontSize: font.h3,
    fontWeight: '900',
  },
  weeklySub: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: 4,
  },
  wedgeHint: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  wedgeHintText: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '700',
  },
  customizeBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  heroSub: {
    color: colors.textFaint,
    fontSize: font.small,
    textAlign: 'center',
    marginTop: -4,
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statValue: { fontSize: font.body, fontWeight: '900' },
  statLabel: { color: colors.textFaint, fontSize: 10, marginTop: 2 },
  shieldHint: {
    color: colors.success,
    fontSize: font.small,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeTile: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    minHeight: 88,
  },
  modeEmoji: { fontSize: 22, marginBottom: 4 },
  modeTitle: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '800',
  },
  modeSub: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: 2,
  },
  partySection: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  partyLabel: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  offlineNote: {
    color: colors.textFaint,
    fontSize: font.small,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  socialBar: {
    backgroundColor: colors.success + '15',
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  socialText: {
    color: colors.success,
    fontSize: font.small,
    fontWeight: '700',
  },
  eventBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold + '15',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold + '40',
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  eventEmoji: { fontSize: 32 },
  eventBody: { flex: 1 },
  eventTitle: {
    color: colors.gold,
    fontSize: font.body,
    fontWeight: '900',
  },
  eventSub: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: 2,
  },
  eventChevron: {
    color: colors.gold,
    fontSize: font.h3,
    fontWeight: '900',
  },
  });
}
