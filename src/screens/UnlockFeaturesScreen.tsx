import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { ProUpgradeCard } from '../components/ProUpgradeCard';
import { useProfile } from '../context/ProfileContext';
import { PRO_ANNUAL_LABEL, PRO_PRICE_LABEL } from '../lib/monetization';
import { purchaseMonthly, purchaseYearly } from '../lib/purchases';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'UnlockFeatures'>;

const FREE_ITEMS = [
  'Daily challenge + login streak coins',
  'Global top 100 · high score & ELO',
  'Category practice — 3 runs/day',
  'Wedge profile & 18 categories',
  'Weekly themed events',
  'Join friend parties with a code',
  'Trophy Case achievements',
  'Easy bots · text share cards',
  '40 free community packs',
  '3 free voice styles (off by default)',
];

const PRO_ITEMS = [
  'Full 1930–2026 archive',
  'No interstitial ads',
  'Unlimited category practice',
  'Ranked Quick Match + all bot tiers',
  'Picture rounds',
  'Weekly +25% season XP & premium track',
  'Host friend + live parties',
  'Create trivia packs (moderated)',
  '250+ premium voice packs',
  '80 premium community packs',
  'All Pro cosmetics',
];

export function UnlockFeaturesScreen({}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile, showProPaywall } = useProfile();
  const [showPro, setShowPro] = React.useState(false);
  const [buying, setBuying] = React.useState(false);

  const handleMonthly = async () => {
    setBuying(true);
    try {
      const ok = await purchaseMonthly();
      if (ok) Alert.alert('Subscribed!', 'Welcome to Trivia Dash Pro!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not start purchase';
      Alert.alert('Purchase error', msg);
    } finally {
      setBuying(false);
    }
  };

  const handleYearly = async () => {
    setBuying(true);
    try {
      const ok = await purchaseYearly();
      if (ok) Alert.alert('Subscribed!', 'Welcome to Trivia Dash Pro!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not start purchase';
      Alert.alert('Purchase error', msg);
    } finally {
      setBuying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Free vs Unlock everything</Text>
        <Text style={styles.price}>
          Pro: {PRO_PRICE_LABEL} · {PRO_ANNUAL_LABEL}
        </Text>

        <View style={styles.col}>
          <Text style={styles.colTitle}>Free</Text>
          {FREE_ITEMS.map((t) => (
            <Text key={t} style={styles.item}>✓ {t}</Text>
          ))}
        </View>

        <View style={[styles.col, styles.colPro]}>
          <Text style={styles.colTitle}>Unlock everything</Text>
          {PRO_ITEMS.map((t) => (
            <Text key={t} style={styles.itemPro}>★ {t}</Text>
          ))}
        </View>

        {!profile?.isPro && (
          <>
            {showPro ? (
              <ProUpgradeCard onClose={() => setShowPro(false)} />
            ) : (
              <>
                <View style={styles.planRow}>
                  <View style={styles.planOption}>
                    <Text style={styles.planLabel}>Monthly</Text>
                    <Text style={styles.planPrice}>{PRO_PRICE_LABEL}</Text>
                    <PrimaryButton
                      label="Subscribe Monthly"
                      onPress={handleMonthly}
                      disabled={buying}
                    />
                  </View>
                  <View style={styles.planOption}>
                    <Text style={styles.planLabel}>Yearly</Text>
                    <Text style={styles.planPrice}>{PRO_ANNUAL_LABEL}</Text>
                    <PrimaryButton
                      label="Subscribe Yearly"
                      variant="accent"
                      onPress={handleYearly}
                      disabled={buying}
                    />
                  </View>
                </View>
                <PrimaryButton
                  label="View all plans"
                  variant="ghost"
                  onPress={() => setShowPro(true)}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
  price: { color: colors.textMuted, textAlign: 'center' },
  col: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  colPro: { borderColor: colors.gold },
  colTitle: { color: colors.text, fontWeight: '900', marginBottom: 4 },
  item: { color: colors.textMuted, fontSize: font.small },
  itemPro: { color: colors.gold, fontSize: font.small, fontWeight: '600' },
  planRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  planOption: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    gap: spacing.sm,
  },
  planLabel: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '900',
  },
  planPrice: {
    color: colors.gold,
    fontSize: font.body,
    fontWeight: '700',
  },
  });
}
