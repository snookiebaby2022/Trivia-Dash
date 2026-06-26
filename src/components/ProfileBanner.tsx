import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { defaultCoverColors } from '../lib/profilePhotos';
import type { Profile } from '../types';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import { AvatarView } from './AvatarView';

interface Props {
  profile: Profile;
  rankColor: string;
  rankTitle: string;
  trophyCount: number;
  onPressCover?: () => void;
  onPressPhoto?: () => void;
  onPressTrophies?: () => void;
  editingName?: React.ReactNode;
  username: string;
  editHint?: string;
  onPressUsername?: () => void;
  onPressCard?: () => void;
}

export function ProfileBanner({
  profile,
  rankColor,
  rankTitle,
  trophyCount,
  onPressCover,
  onPressPhoto,
  onPressTrophies,
  editingName,
  username,
  editHint,
  onPressUsername,
  onPressCard,
}: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [gradStart, gradEnd] = defaultCoverColors(isDark);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPressCover}
        style={styles.coverPress}
        accessibilityLabel="Change cover photo"
      >
        {profile.coverPhotoUri ? (
          <Image source={{ uri: profile.coverPhotoUri }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={[styles.coverImage, { backgroundColor: gradEnd }]}>
            <View style={[styles.coverAccent, { backgroundColor: gradStart }]} />
          </View>
        )}
        <View style={styles.coverOverlay} />
        <Text style={styles.coverHint}>Tap to change cover</Text>
      </Pressable>

      <View style={styles.body}>
        <Pressable onPress={onPressPhoto} style={styles.photoWrap} accessibilityLabel="Change profile picture">
          <AvatarView avatar={profile.avatar} photoUri={profile.profilePhotoUri} size={72} showRing />
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </Pressable>

        <Pressable onPress={onPressCard} style={styles.info}>
          {editingName ?? (
            <Pressable onPress={onPressUsername}>
              <Text style={styles.username}>{username}</Text>
              {editHint ? <Text style={styles.editHint}>{editHint}</Text> : null}
            </Pressable>
          )}
          <View style={styles.rankRow}>
            <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
            <Text style={[styles.rankText, { color: rankColor }]}>{rankTitle}</Text>
            {profile.isPro && <Text style={styles.proBadge}>PRO</Text>}
            <Text style={styles.eloText}>{profile.elo} ELO</Text>
          </View>
        </Pressable>

        <Pressable style={styles.trophyMini} onPress={onPressTrophies}>
          <Text style={styles.trophyMiniEmoji}>🏆</Text>
          <Text style={styles.trophyMiniCount}>{trophyCount}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      marginBottom: spacing.xs,
    },
    coverPress: {
      height: 120,
      position: 'relative',
    },
    coverImage: {
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    },
    coverAccent: {
      position: 'absolute',
      left: -40,
      top: -20,
      width: '70%',
      height: '140%',
      opacity: 0.55,
      borderRadius: radius.lg,
      transform: [{ rotate: '-12deg' }],
    },
    coverOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
    coverHint: {
      position: 'absolute',
      right: spacing.sm,
      bottom: spacing.sm,
      color: 'rgba(255,255,255,0.85)',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    body: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      marginTop: -36,
      gap: spacing.md,
    },
    photoWrap: {
      position: 'relative',
    },
    cameraBadge: {
      position: 'absolute',
      right: -2,
      bottom: 2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    cameraIcon: {
      fontSize: 12,
    },
    info: {
      flex: 1,
      paddingTop: spacing.lg,
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
      marginTop: spacing.lg,
    },
    trophyMiniEmoji: { fontSize: 20 },
    trophyMiniCount: {
      color: colors.gold,
      fontSize: font.small,
      fontWeight: '900',
    },
  });
}
