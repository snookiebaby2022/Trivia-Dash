import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { reportQuestion, REPORT_REASONS, type ReportReason } from '../lib/questionReports';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

interface Props {
  questionId: string;
  onReported?: () => void;
}

export function ReportQuestionButton({ questionId, onReported }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [showPicker, setShowPicker] = useState(false);

  const handleReport = (reason: ReportReason) => {
    Alert.alert(
      'Report Question',
      `Report this question as "${REPORT_REASONS.find((r) => r.id === reason)?.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            void reportQuestion(questionId, reason);
            setShowPicker(false);
            onReported?.();
            Alert.alert('Reported', 'Thanks for your feedback. We\'ll review this question.');
          },
        },
      ]
    );
  };

  if (showPicker) {
    return (
      <View style={styles.picker}>
        <Text style={styles.pickerTitle}>Why are you reporting?</Text>
        {REPORT_REASONS.map((reason) => (
          <Pressable
            key={reason.id}
            style={styles.reasonButton}
            onPress={() => handleReport(reason.id)}
          >
            <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
            <Text style={styles.reasonLabel}>{reason.label}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.cancelButton} onPress={() => setShowPicker(false)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable style={styles.button} onPress={() => setShowPicker(true)}>
      <Text style={styles.buttonText}>🚩 Report</Text>
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    buttonText: {
      color: colors.textFaint,
      fontSize: font.small,
      fontWeight: '700',
    },
    picker: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      gap: spacing.sm,
    },
    pickerTitle: {
      color: colors.text,
      fontSize: font.body,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    reasonButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgElevated,
      borderRadius: radius.sm,
      padding: spacing.md,
    },
    reasonEmoji: { fontSize: 18 },
    reasonLabel: { color: colors.text, fontSize: font.body, fontWeight: '700' },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    cancelText: {
      color: colors.textFaint,
      fontSize: font.small,
      fontWeight: '700',
    },
  });
}
