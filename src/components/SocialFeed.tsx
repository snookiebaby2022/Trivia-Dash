import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { getSocialFeed, getOnlineFriendsCount, type FeedItem } from '../lib/socialFeed';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

interface Props {
  limit?: number;
  onItemPress?: (item: FeedItem) => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

function FeedRow({ item, index }: { item: FeedItem; index: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeItemStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const { emoji, color } = item.playerAvatar;

  return (
    <Animated.View style={[styles.row, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarEmoji}>{emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.text} numberOfLines={2}>
          <Text style={styles.name}>{item.playerName}</Text>
          {' ' + item.message}
        </Text>
        <Text style={styles.time}>{relativeTime(item.timestamp)}</Text>
      </View>
      {item.actionLabel && (
        <Pressable style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionLabel}>{item.actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

export function SocialFeed({ limit = 5 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeItemStyles(colors), [colors]);
  const onlineCount = getOnlineFriendsCount();
  const data = useMemo(() => getSocialFeed(limit), [limit]);

  if (!data.length) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.sectionTitle}>Friends</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No friend activity yet — add friends to see their scores!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Friends</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{onlineCount} online</Text>
        </View>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <FeedRow item={item} index={index} />}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

function makeItemStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      maxHeight: 400,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: font.h3,
      fontWeight: '800',
    },
    badge: {
      backgroundColor: colors.success,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    badgeText: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '800',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarEmoji: {
      fontSize: 12,
    },
    body: {
      flex: 1,
    },
    text: {
      color: colors.text,
      fontSize: font.small,
      lineHeight: 18,
    },
    name: {
      fontWeight: '800',
    },
    time: {
      color: colors.textFaint,
      fontSize: 10,
      marginTop: 2,
    },
    actionBtn: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    actionLabel: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '800',
    },
    separator: {
      height: spacing.xs,
    },
    emptyWrap: {
      gap: spacing.sm,
    },
    empty: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: font.small,
      textAlign: 'center',
    },
  });
}
