import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { badgeEmoji, frameStyle } from '../lib/avatars';
import type { AvatarConfig } from '../types';

interface Props {
  avatar: AvatarConfig;
  size?: number;
  style?: ViewStyle;
  showRing?: boolean;
  /** When set, shows a photo instead of the emoji avatar. */
  photoUri?: string;
}

export function AvatarView({ avatar, size = 56, style, showRing, photoUri }: Props) {
  const frame = frameStyle(avatar.frame ?? 'classic');
  const badge = badgeEmoji(avatar.badge ?? 'none');
  const borderW = showRing ? Math.max(frame.width, 3) : frame.width;

  return (
    <View style={[styles.outer, { width: size + 8, height: size + 8 }, style]}>
      <View
        style={[
          styles.wrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: avatar.color,
            borderColor: showRing ? '#FFFFFF' : frame.border,
            borderWidth: borderW,
            overflow: 'hidden',
          },
        ]}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.emoji, { fontSize: size * 0.46 }]}>{avatar.emoji}</Text>
        )}
      </View>
      {badge && (
        <View style={[styles.badge, { width: size * 0.36, height: size * 0.36 }]}>
          <Text style={{ fontSize: size * 0.22 }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1E1E38',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD24D',
  },
});
