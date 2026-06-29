import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

interface Props {
  line: string;
  emoji: string;
  emphasis: 'normal' | 'excited' | 'hype' | 'whisper';
  visible: boolean;
  onComplete?: () => void;
}

export function DynamicHost({ line, emoji, emphasis, visible, onComplete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const slideX = useRef(new Animated.Value(-400)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (visible) {
      slideX.setValue(-400);
      scale.setValue(1);
      opacity.setValue(emphasis === 'whisper' ? 0.7 : 1);
      glowOpacity.setValue(0);
      shakeX.setValue(0);

      const slideIn = Animated.spring(slideX, {
        toValue: 0,
        useNativeDriver: true,
        damping: emphasis === 'whisper' ? 20 : 12,
        stiffness: emphasis === 'hype' ? 200 : 120,
        mass: emphasis === 'hype' ? 0.8 : 1,
      });

      const extras: Animated.CompositeAnimation[] = [];

      if (emphasis === 'excited') {
        extras.push(
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.15, duration: 200, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
          ])
        );
      }

      if (emphasis === 'hype') {
        extras.push(
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(glowOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
            { iterations: 3 }
          )
        );
        extras.push(
          Animated.sequence([
            Animated.timing(shakeX, { toValue: 4, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -4, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 3, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -3, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
          ])
        );
      }

      if (emphasis === 'normal') {
        extras.push(
          Animated.loop(
            Animated.sequence([
              Animated.timing(scale, { toValue: 1.04, duration: 800, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
            ]),
            { iterations: 2 }
          )
        );
      }

      if (extras.length) {
        Animated.parallel([slideIn, ...extras]).start();
      } else {
        slideIn.start();
      }

      timerRef.current = setTimeout(() => {
        Animated.timing(slideX, {
          toValue: -400,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onComplete?.());
      }, 3000);
    } else {
      Animated.timing(slideX, {
        toValue: -400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, emphasis]);

  const bgByEmphasis: Record<string, string> = {
    normal: colors.card,
    excited: 'rgba(124, 92, 255, 0.20)',
    hype: 'rgba(255, 210, 77, 0.20)',
    whisper: colors.bgElevated,
  };

  const borderColorByEmphasis: Record<string, string> = {
    normal: colors.cardBorder,
    excited: colors.primary,
    hype: colors.gold,
    whisper: colors.cardBorder,
  };

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: bgByEmphasis[emphasis],
          borderColor: borderColorByEmphasis[emphasis],
          transform: [{ translateX: slideX }, { scale }, { translateX: shakeX }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      {emphasis === 'hype' && (
        <Animated.View
          style={[
            styles.glow,
            {
              borderColor: colors.gold,
              opacity: glowOpacity,
            },
          ]}
        />
      )}
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.line} numberOfLines={1}>
        {line}
      </Text>
    </Animated.View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      position: 'absolute',
      top: 0,
      left: spacing.md,
      right: spacing.md,
      height: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      zIndex: 100,
      overflow: 'hidden',
    },
    glow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: radius.md,
      borderWidth: 2,
    },
    emoji: {
      fontSize: 22,
    },
    line: {
      color: colors.text,
      fontSize: font.small,
      fontWeight: '700',
      flex: 1,
    },
  });
}
