import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  shake: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export function ScreenShake({ shake, children, style, intensity = 8 }: Props) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shake) {
      shakeAnim.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: intensity, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -intensity, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: intensity * 0.6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -intensity * 0.6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: intensity * 0.3, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shake]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
