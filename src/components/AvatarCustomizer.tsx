import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AVATAR_BADGES,
  AVATAR_COLORS,
  AVATAR_EMOJIS,
  AVATAR_FRAMES,
  normalizeAvatar,
} from '../lib/avatars';
import { isBadgeLocked, isFrameLocked } from '../lib/monetization';
import type { AchievementState, AvatarConfig } from '../types';
import { colors, font, radius, spacing } from '../theme';
import { AvatarView } from './AvatarView';

type Tab = 'face' | 'color' | 'frame' | 'badge';

interface Props {
  avatar: AvatarConfig;
  isPro: boolean;
  cosmeticUnlocks?: AchievementState['cosmeticUnlocks'];
  onChange: (avatar: AvatarConfig) => void;
  onRequestPro?: () => void;
}

export function AvatarCustomizer({
  avatar,
  isPro,
  cosmeticUnlocks,
  onChange,
  onRequestPro,
}: Props) {
  const [tab, setTab] = useState<Tab>('face');
  const current = normalizeAvatar(avatar);

  const patch = (p: Partial<AvatarConfig>) => onChange(normalizeAvatar({ ...current, ...p }));

  return (
    <View style={styles.wrap}>
      <View style={styles.previewRow}>
        <AvatarView avatar={current} size={72} showRing />
        <Text style={styles.previewHint}>Build your game-show contestant</Text>
      </View>

      <View style={styles.tabs}>
        {(['face', 'color', 'frame', 'badge'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'face' ? 'Face' : t === 'color' ? 'Color' : t === 'frame' ? 'Frame' : 'Badge'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.gridScroll} nestedScrollEnabled>
        {tab === 'face' && (
          <View style={styles.emojiGrid}>
            {AVATAR_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={[styles.emojiCell, current.emoji === emoji && styles.cellActive]}
                onPress={() => patch({ emoji })}
              >
                <Text style={styles.emojiLarge}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {tab === 'color' && (
          <View style={styles.colorGrid}>
            {AVATAR_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorCell,
                  { backgroundColor: color },
                  current.color === color && styles.colorActive,
                ]}
                onPress={() => patch({ color })}
              />
            ))}
          </View>
        )}

        {tab === 'frame' &&
          AVATAR_FRAMES.map((f) => {
            const locked = isFrameLocked(f.id, isPro, cosmeticUnlocks);
            return (
              <Pressable
                key={f.id}
                style={[styles.frameRow, current.frame === f.id && styles.frameRowActive]}
                onPress={() => {
                  if (locked) {
                    onRequestPro?.();
                    return;
                  }
                  patch({ frame: f.id });
                }}
              >
                <AvatarView avatar={{ ...current, frame: f.id }} size={44} />
                <Text style={styles.frameLabel}>
                  {f.label}
                  {locked ? ' 🔒' : ''}
                </Text>
              </Pressable>
            );
          })}

        {tab === 'badge' &&
          AVATAR_BADGES.map((b) => {
            const locked = isBadgeLocked(b.id, isPro, cosmeticUnlocks);
            return (
              <Pressable
                key={b.id}
                style={[styles.frameRow, current.badge === b.id && styles.frameRowActive]}
                onPress={() => {
                  if (locked) {
                    onRequestPro?.();
                    return;
                  }
                  patch({ badge: b.id });
                }}
              >
                <Text style={styles.badgeOption}>
                  {b.label}
                  {locked ? ' 🔒' : ''}
                </Text>
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  previewHint: {
    flex: 1,
    color: colors.textMuted,
    fontSize: font.small,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primaryDark },
  tabText: { color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
  tabTextActive: { color: colors.text },
  gridScroll: { maxHeight: 200 },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  cellActive: { borderWidth: 2, borderColor: colors.gold },
  emojiLarge: { fontSize: 24 },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorCell: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
  },
  colorActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  frameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  frameRowActive: { backgroundColor: colors.bgElevated },
  frameLabel: { color: colors.text, fontSize: font.body, fontWeight: '600' },
  badgeOption: { color: colors.text, fontSize: font.h3 },
});
