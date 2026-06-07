import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useProfile } from '../context/ProfileContext';
import { APP_NAME_PRO } from '../lib/brand';
import { PRO_ANNUAL_LABEL, PRO_PRICE_LABEL, proFeaturesLabel } from '../lib/monetization';
import { colors, font, radius, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  onClose?: () => void;
}

export function ProUpgradeCard({ onClose }: Props) {
  const { profile, showProPaywall, restorePurchases } = useProfile();
  const [loading, setLoading] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);

  if (!profile || profile.isPro) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🎉 {APP_NAME_PRO}</Text>
      <Text style={styles.price}>
        {PRO_PRICE_LABEL} · {PRO_ANNUAL_LABEL}
      </Text>
      <Text style={styles.features}>{proFeaturesLabel()}</Text>
      <View style={styles.perks}>
        <Text style={styles.perk}>✓ No interstitial ads</Text>
        <Text style={styles.perk}>✓ 1930–2026 question archive</Text>
        <Text style={styles.perk}>✓ Announcer, Coach & Robot voices</Text>
        <Text style={styles.perk}>✓ Gold, Neon & Star frames</Text>
      </View>
      <PrimaryButton
        label={loading ? 'Opening…' : 'View plans'}
        loading={loading}
        onPress={async () => {
          setLoading(true);
          const ok = await showProPaywall();
          setLoading(false);
          if (ok) onClose?.();
        }}
      />
      <Pressable
        onPress={async () => {
          setRestoring(true);
          const ok = await restorePurchases();
          setRestoring(false);
          if (ok) onClose?.();
        }}
        style={styles.restore}
      >
        <Text style={styles.restoreText}>{restoring ? 'Restoring…' : 'Restore purchases'}</Text>
      </Pressable>
      <Pressable onPress={onClose} style={styles.dismiss}>
        <Text style={styles.dismissText}>Maybe later</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.gold,
    fontSize: font.h2,
    fontWeight: '900',
  },
  price: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '800',
  },
  features: {
    color: colors.textMuted,
    fontSize: font.body,
  },
  perks: {
    gap: 4,
    marginVertical: spacing.xs,
  },
  perk: {
    color: colors.primary,
    fontSize: font.small,
    fontWeight: '700',
  },
  restore: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  restoreText: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '700',
  },
  dismiss: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  dismissText: {
    color: colors.textFaint,
    fontSize: font.small,
  },
});
