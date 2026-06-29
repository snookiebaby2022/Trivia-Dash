import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { loginStreakCalendar, type LoginStreakState } from '../lib/streakRewards';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  visible: boolean;
  state: LoginStreakState;
  onClaim: () => void;
  onClose: () => void;
}

export function DailyStreakModal({ visible, state, onClaim, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const days = loginStreakCalendar(state);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🔥</Text>
          <Text style={styles.title}>Daily login streak</Text>
          <Text style={styles.sub}>Day {state.streak} · claim {state.rewardCoins} coins</Text>

          <View style={styles.row}>
            {days.map((d) => (
              <View
                key={d.day}
                style={[
                  styles.day,
                  d.status === 'claimed' && styles.dayClaimed,
                  d.status === 'today' && styles.dayToday,
                ]}
              >
                <Text style={styles.dayNum}>{d.day}</Text>
                <Text style={styles.dayCoins}>{d.coins}</Text>
              </View>
            ))}
          </View>

          {state.canClaim ? (
            <PrimaryButton label={`Claim ${state.rewardCoins} coins`} onPress={onClaim} />
          ) : (
            <Text style={styles.done}>Come back tomorrow for more rewards!</Text>
          )}
          <Pressable onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.lg,
      gap: spacing.md,
      alignItems: 'center',
    },
    emoji: { fontSize: 40 },
    title: { color: colors.gold, fontSize: font.h3, fontWeight: '900' },
    sub: { color: colors.textMuted, fontSize: font.body, textAlign: 'center' },
    row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
    day: {
      width: 40,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    dayClaimed: { opacity: 0.45 },
    dayToday: { borderColor: colors.gold, backgroundColor: colors.primaryDark },
    dayNum: { color: colors.textFaint, fontSize: 10, fontWeight: '800' },
    dayCoins: { color: colors.text, fontSize: 11, fontWeight: '900' },
    done: { color: colors.textMuted, textAlign: 'center' },
    close: { padding: spacing.sm },
    closeText: { color: colors.textFaint, fontWeight: '700' },
  });
}
