import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarView } from '../components/AvatarView';
import { PrimaryButton } from '../components/PrimaryButton';
import { randomAvatar } from '../lib/avatars';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';
import type { PassPlayPlayer } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PassPlaySetup'>;

const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

export function PassPlaySetupScreen({ navigation }: Props) {
  const [players, setPlayers] = useState<PassPlayPlayer[]>(() =>
    DEFAULT_NAMES.slice(0, 2).map((name, i) => ({
      id: `local_${i}`,
      name,
      avatar: randomAvatar(),
      score: 0,
    }))
  );

  const updateName = (id: string, name: string) => {
    setPlayers((list) => list.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const rerollAvatar = (id: string) => {
    setPlayers((list) =>
      list.map((p) => (p.id === id ? { ...p, avatar: randomAvatar() } : p))
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.title}>Pass & Play</Text>
      <Text style={styles.sub}>One device · take turns · couch party mode</Text>

      <View style={styles.list}>
        {players.map((p) => (
          <View key={p.id} style={styles.row}>
            <Pressable onPress={() => rerollAvatar(p.id)}>
              <AvatarView avatar={p.avatar} size={48} />
            </Pressable>
            <TextInput
              style={styles.input}
              value={p.name}
              onChangeText={(t) => updateName(p.id, t)}
              maxLength={12}
              placeholder="Name"
              placeholderTextColor={colors.textFaint}
            />
          </View>
        ))}
      </View>

      <View style={styles.rowActions}>
        {players.length < 4 && (
          <Pressable
            style={styles.chip}
            onPress={() =>
              setPlayers((list) => [
                ...list,
                {
                  id: `local_${Date.now()}`,
                  name: `Player ${list.length + 1}`,
                  avatar: randomAvatar(),
                  score: 0,
                },
              ])
            }
          >
            <Text style={styles.chipText}>+ Add player</Text>
          </Pressable>
        )}
        {players.length > 2 && (
          <Pressable style={styles.chip} onPress={() => setPlayers((list) => list.slice(0, -1))}>
            <Text style={styles.chipText}>− Remove</Text>
          </Pressable>
        )}
      </View>

      <PrimaryButton
        label="Start couch match"
        onPress={() =>
          navigation.navigate('PassPlayGame', {
            players,
            questionSeed: Math.floor(Math.random() * 1e9),
          })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: font.h1,
    fontWeight: '900',
    textAlign: 'center',
  },
  sub: {
    color: colors.textMuted,
    fontSize: font.body,
    textAlign: 'center',
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '800',
    paddingVertical: spacing.xs,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: font.small,
  },
});
