import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  value: number;
  color: string;
  fontSize?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedScore({ value, color, fontSize = 28, prefix = '', suffix = '' }: Props) {
  const displayValue = useRef(new Animated.Value(0)).current;
  const lastValue = useRef(0);

  useEffect(() => {
    const start = lastValue.current as number;
    const diff = value - start;
    if (diff === 0) return;

    Animated.timing(displayValue, {
      toValue: value,
      duration: Math.min(800, Math.abs(diff) * 5),
      useNativeDriver: false,
    }).start();

    const listener = displayValue.addListener(({ value: v }) => {
      lastValue.current = Math.round(v as number);
    });

    return () => {
      displayValue.removeListener(listener);
    };
  }, [value]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.score,
          {
            color,
            fontSize,
            transform: [{ scale: displayValue.interpolate({
              inputRange: [Math.max(0, value - 1), value, value + 1],
              outputRange: [1, 1.15, 1],
              extrapolate: 'extend',
            }) }],
          },
        ]}
      >
        {prefix}{lastValue.current}{suffix}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  score: { fontWeight: '900', fontVariant: ['tabular-nums'] },
});
