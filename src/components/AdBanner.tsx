import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ADMOB_BANNER_ID } from '../lib/monetization';
import { useIsPro } from '../context/ProfileContext';
import { colors, font, radius, spacing } from '../theme';

/** Banner ad — real unit in dev/production builds; placeholder in Expo Go. */
export function AdBanner() {
  const isPro = useIsPro();
  if (isPro) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BannerAd, BannerAdSize, TestIds } = require('react-native-google-mobile-ads');
    const unitId = __DEV__ ? TestIds.BANNER : ADMOB_BANNER_ID;
    return (
      <View style={styles.bannerWrap}>
        <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </View>
    );
  } catch {
    return (
      <View style={styles.banner}>
        <Text style={styles.label}>AD</Text>
        <Text style={styles.text}>Pro removes ads · build with dev client for live AdMob</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bannerWrap: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  label: {
    color: colors.textFaint,
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    flex: 1,
    color: colors.textMuted,
    fontSize: font.small,
  },
});
