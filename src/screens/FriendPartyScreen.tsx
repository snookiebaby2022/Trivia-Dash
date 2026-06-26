import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { canHostParty } from '../lib/entitlements';
import { createFriendRoom, joinFriendRoom } from '../lib/friendParty';
import { shareFriendCode } from '../lib/shareCard';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendParty'>;

export function FriendPartyScreen({navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile, showProPaywall } = useProfile();
  const [code, setCode] = useState('');
  const [hosted, setHosted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!profile) return null;

  const host = async (mode: 'party' | 'livehost') => {
    if (!canHostParty(profile.isPro)) {
      const ok = await showProPaywall();
      if (!ok) Alert.alert('Pro feature', 'Hosting friend parties requires Unlock everything.');
      return;
    }
    setBusy(true);
    const room = await createFriendRoom(profile.id, profile.username, mode);
    setHosted(room.code);
    setBusy(false);
  };

  const join = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const room = await joinFriendRoom(code.trim(), profile.id, profile.username);
    setBusy(false);
    if (!room) {
      Alert.alert('Not found', 'Invalid or full room code.');
      return;
    }
    navigation.navigate('Game', {
      mode: room.mode === 'livehost' ? 'livehost' : 'friendparty',
      questionSeed: room.questionSeed,
      friendCode: room.code,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.body}>
        <Text style={styles.title}>Friend party</Text>
        <Text style={styles.sub}>Join with a code · Pro hosts create rooms</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 6-letter code"
          placeholderTextColor={colors.textFaint}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          maxLength={6}
        />
        <PrimaryButton label={busy ? '…' : 'Join party'} onPress={() => void join()} />

        <View style={styles.divider} />
        <PrimaryButton label="Host party room 🔒 Pro" variant="ghost" onPress={() => void host('party')} />
        <PrimaryButton label="Host live game 🔒 Pro" variant="ghost" onPress={() => void host('livehost')} />

        {hosted && (
          <View style={styles.hosted}>
            <Text style={styles.code}>Code: {hosted}</Text>
            <PrimaryButton
              label="Share invite"
              variant="accent"
              onPress={() => void shareFriendCode(hosted, profile.username)}
            />
            <PrimaryButton
              label="Start as host"
              onPress={() =>
                navigation.navigate('Game', {
                  mode: 'friendparty',
                  questionSeed: Date.now(),
                  friendCode: hosted,
                })
              }
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: font.h2, fontWeight: '900' },
  sub: { color: colors.textMuted, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    padding: spacing.md,
    fontSize: font.h3,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.md },
  hosted: { marginTop: spacing.md, gap: spacing.sm, alignItems: 'center' },
  code: { color: colors.gold, fontSize: font.h2, fontWeight: '900', letterSpacing: 6 },
  });
}
