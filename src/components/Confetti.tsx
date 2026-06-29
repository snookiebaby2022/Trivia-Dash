import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props {
  count: number;
  active: boolean;
}

const PARTICLE_COLORS = ['#FFD24D', '#FF5C8A', '#7C5CFF', '#3DDC97', '#FFC44D', '#FF5470'];

interface Particle {
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  rotation: number;
  opacity: number;
}

function createParticles(count: number, width: number, height: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height * 0.4,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: Math.random() * 8 + 4,
      vx: (Math.random() - 0.5) * 8,
      vy: -(Math.random() * 10 + 6),
      rotation: Math.random() * 360,
      opacity: 1,
    });
  }
  return particles;
}

export function Confetti({ count = 30, active }: Props) {
  const { colors } = useTheme();
  const animatedValues = useRef<Animated.Value[]>([]);

  useEffect(() => {
    if (!active) return;

    const anims = Array.from({ length: count }, () => new Animated.Value(0));
    animatedValues.current = anims;

    Animated.parallel(
      anims.map((v, i) =>
        Animated.sequence([
          Animated.delay(i * 20),
          Animated.timing(v, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();

    return () => anims.forEach((v) => v.setValue(0));
  }, [active, count]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {animatedValues.current.map((anim, i) => {
        const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
        const startX = (i / count) * 100;
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: `${startX}%`,
                backgroundColor: color,
                width: 6 + (i % 4) * 2,
                height: 6 + (i % 4) * 2,
                borderRadius: (i % 3 === 0) ? 3 : 1,
                opacity: anim.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -(100 + (i % 5) * 40)],
                    }),
                  },
                  {
                    translateX: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 15)],
                    }),
                  },
                  {
                    rotate: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${360 + (i % 3) * 180}deg`],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 100,
  },
  particle: {
    position: 'absolute',
    top: '40%',
  },
});
