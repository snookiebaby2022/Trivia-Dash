import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { formatCoins } from '../lib/coins';
import {
  SHOP_ITEMS,
  type ShopCategory,
  type ShopItem,
  canBuy,
  buyItem,
  isOwned,
  initShop,
} from '../lib/shop';
import { saveProfile } from '../lib/storage';
import { syncProfile } from '../lib/leaderboard';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CoinShop'>;

const CATEGORIES: { id: ShopCategory; label: string; emoji: string }[] = [
  { id: 'frames', label: 'Frames', emoji: '🖼' },
  { id: 'badges', label: 'Badges', emoji: '🏷' },
  { id: 'power_ups', label: 'Power-ups', emoji: '⚡' },
  { id: 'boosts', label: 'Boosts', emoji: '🚀' },
];

export function CoinShopScreen({}: Props) {
  const { colors } = useTheme();
  const { profile, update } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory>('frames');

  useEffect(() => {
    void initShop();
  }, []);

  if (!profile) return null;

  const coins = profile.coins ?? 0;
  const items = SHOP_ITEMS.filter((i) => i.category === selectedCategory);

  const handleBuy = (item: ShopItem) => {
    const result = buyItem(item, profile);
    if (result.success) {
      void update(result.profile);
      Alert.alert('Purchased!', `${item.name} added to your collection.`);
    } else if (result.error) {
      Alert.alert('Cannot purchase', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Coin Shop</Text>
          <View style={styles.coinBadge}>
            <Text style={styles.coinText}>🪙 {formatCoins(coins)}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {items.map((item) => {
            const owned = isOwned(item.id);
            const canAfford = canBuy(item, profile);
            return (
              <View key={item.id} style={[styles.itemCard, owned && styles.itemCardOwned]}>
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                {owned ? (
                  <Text style={styles.ownedBadge}>✓ Owned</Text>
                ) : (
                  <PrimaryButton
                    label={`🪙 ${item.price}`}
                    variant={canAfford ? 'primary' : 'ghost'}
                    disabled={!canAfford}
                    onPress={() => handleBuy(item)}
                    style={styles.buyButton}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    title: { color: colors.gold, fontSize: font.h2, fontWeight: '900' },
    coinBadge: {
      backgroundColor: colors.card,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.gold,
    },
    coinText: { color: colors.gold, fontSize: font.body, fontWeight: '900' },
    categoryRow: { marginBottom: spacing.md },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: spacing.xs,
    },
    categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryEmoji: { fontSize: 16 },
    categoryLabel: { color: colors.textMuted, fontWeight: '800', fontSize: font.small },
    categoryLabelActive: { color: colors.text },
    grid: { gap: spacing.sm },
    itemCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      alignItems: 'center',
    },
    itemCardOwned: { opacity: 0.6 },
    itemEmoji: { fontSize: 36, marginBottom: spacing.sm },
    itemName: { color: colors.text, fontSize: font.h3, fontWeight: '900', textAlign: 'center' },
    itemDesc: { color: colors.textMuted, fontSize: font.small, textAlign: 'center', marginTop: 4 },
    ownedBadge: { color: colors.success, fontSize: font.small, fontWeight: '800', marginTop: spacing.sm },
    buyButton: { marginTop: spacing.sm, height: 44 },
  });
}
