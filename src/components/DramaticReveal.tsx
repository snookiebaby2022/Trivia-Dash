import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props {
  revealed: boolean;
  correctIndex: number;
  selectedIndex: number | null;
}

export function DramaticReveal({ revealed, correctIndex, selectedIndex }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    if (!revealed) {
      scaleAnim.setValue(1);
      glowAnim.setValue(0);
      return;
    }

    if (selectedIndex === correctIndex) {
      // Correct — pulse up then settle
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.08, friction: 4, tension: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();

      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 400, useNativeDriver: true }),
      ]).start();
    } else if (selectedIndex !== null) {
      // Wrong — quick shake
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [revealed, selectedIndex, correctIndex]);

  if (!revealed) return null;

  const isCorrect = selectedIndex === correctIndex;

  return (
    <Animated.View
      style={[
        styles.glow,
        {
          opacity: glowAnim,
          backgroundColor: isCorrect ? colors.success : 'transparent',
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    zIndex: 10,
  },
});
