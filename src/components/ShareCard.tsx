import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { useTheme } from '../context/ThemeContext';
import type { MatchSummary } from '../types';
import { track } from '../lib/analytics';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

interface Props {
  summary: MatchSummary;
}

export function ShareCard({ summary }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const cardRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your result',
          });
          track({ type: 'share_card_shared', timestamp: Date.now() });
        }
      }
    } catch (e) {
      console.warn('Share failed', e);
    }
  };

  const grid = summary.shareGrid ?? '';
  const outcomeEmoji = summary.outcome === 'win' ? '🏆' : summary.outcome === 'draw' ? '🤝' : '😔';
  const outcomeText = summary.outcome === 'win' ? 'VICTORY' : summary.outcome === 'draw' ? 'DRAW' : 'DEFEAT';

  return (
    <View style={styles.wrapper}>
      <View ref={cardRef} style={styles.card}>
        <Text style={styles.brand}>TRIVIA DASH</Text>
        <Text style={styles.outcome}>
          {outcomeEmoji} {outcomeText}
        </Text>
        <Text style={styles.score}>
          {summary.you} — {summary.opponent}
        </Text>
        <Text style={styles.opponent}>vs {summary.opponentName}</Text>
        <View style={styles.gridContainer}>
          {grid.split('').map((ch, i) => {
            let bg = colors.cardBorder;
            if (ch === '🟩') bg = colors.success;
            else if (ch === '🟨') bg = colors.warning;
            else if (ch === '🟥') bg = colors.danger;
            return (
              <View key={i} style={[styles.gridCell, { backgroundColor: bg }]}>
                <Text style={styles.gridText}>{ch}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.elo}>ELO {summary.newElo} ({summary.eloDelta >= 0 ? '+' : ''}{summary.eloDelta})</Text>
      </View>
      <Pressable style={styles.shareButton} onPress={() => void handleShare()}>
        <Text style={styles.shareText}>📤 Share Result</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: { alignItems: 'center' },
    card: {
      backgroundColor: colors.bg,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.gold,
      padding: spacing.lg,
      alignItems: 'center',
      width: 280,
      gap: spacing.sm,
    },
    brand: {
      color: colors.gold,
      fontSize: font.small,
      fontWeight: '900',
      letterSpacing: 3,
    },
    outcome: {
      color: colors.text,
      fontSize: font.h2,
      fontWeight: '900',
    },
    score: {
      color: colors.text,
      fontSize: font.h1,
      fontWeight: '900',
    },
    opponent: {
      color: colors.textMuted,
      fontSize: font.body,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 4,
      maxWidth: 200,
    },
    gridCell: {
      width: 28,
      height: 28,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridText: {
      fontSize: 14,
    },
    elo: {
      color: colors.textMuted,
      fontSize: font.small,
      fontWeight: '700',
    },
    shareButton: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    shareText: {
      color: colors.text,
      fontSize: font.body,
      fontWeight: '900',
    },
  });
}
