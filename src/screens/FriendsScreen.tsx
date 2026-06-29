import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import {
  initFriends,
  getFriends,
  addFriend,
  removeFriend,
  sendChallenge,
  getActivity,
  type Friend,
  type FriendActivity,
} from '../lib/friends';
import { rankTitle } from '../lib/elo';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Friends'>;

export function FriendsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activity, setActivity] = useState<FriendActivity[]>([]);
  const [tab, setTab] = useState<'friends' | 'activity' | 'add'>('friends');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    void initFriends().then(() => {
      setFriends(getFriends());
      setActivity(getActivity());
    });
  }, []);

  const refresh = () => {
    setFriends(getFriends());
    setActivity(getActivity());
  };

  const handleAddFriend = () => {
    const name = searchText.trim();
    if (!name) return;

    const newFriend = {
      id: `friend_${Date.now()}`,
      username: name,
      avatar: { emoji: '🎯', color: colors.primary, frame: 'classic' as const, badge: 'none' as const },
      elo: Math.floor(Math.random() * 400) + 800,
      wins: Math.floor(Math.random() * 20),
      lastSeen: Date.now(),
    };

    void addFriend(newFriend).then((ok) => {
      if (ok) {
        Alert.alert('Friend Added', `${name} is now your friend!`);
        setSearchText('');
        setTab('friends');
        refresh();
      }
    });
  };

  const handleChallenge = (friendId: string) => {
    void sendChallenge(friendId).then((ok) => {
      if (ok) {
        Alert.alert('Challenge Sent!', 'Your friend will be notified.');
        refresh();
      }
    });
  };

  const handleRemove = (friend: Friend) => {
    Alert.alert('Remove Friend', `Remove ${friend.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void removeFriend(friend.id);
          refresh();
        },
      },
    ]);
  };

  const tabs = [
    { id: 'friends' as const, label: 'Friends' },
    { id: 'activity' as const, label: 'Activity' },
    { id: 'add' as const, label: 'Add' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Friends</Text>

        <View style={styles.tabRow}>
          {tabs.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.tab, tab === t.id && styles.tabActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'friends' && (
          <View style={styles.section}>
            {friends.length === 0 ? (
              <Text style={styles.emptyText}>No friends yet. Add some to compete!</Text>
            ) : (
              friends.map((f) => {
                const rank = rankTitle(f.elo);
                return (
                  <View key={f.id} style={styles.friendCard}>
                    <View style={styles.friendHeader}>
                      <Text style={styles.friendEmoji}>{f.avatar.emoji}</Text>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{f.username}</Text>
                        <Text style={[styles.friendRank, { color: rank.color }]}>
                          {rank.title} · {f.elo} ELO · {f.wins} wins
                        </Text>
                      </View>
                    </View>
                    <View style={styles.friendActions}>
                      <Pressable
                        style={styles.challengeBtn}
                        onPress={() => handleChallenge(f.id)}
                      >
                        <Text style={styles.challengeText}>⚔ Challenge</Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemove(f)}>
                        <Text style={styles.removeText}>✕</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === 'activity' && (
          <View style={styles.section}>
            {activity.length === 0 ? (
              <Text style={styles.emptyText}>No activity yet.</Text>
            ) : (
              activity.slice(0, 20).map((a) => (
                <View key={a.id} style={styles.activityItem}>
                  <Text style={styles.activityMessage}>{a.message}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(a.timestamp).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'add' && (
          <View style={styles.section}>
            <Text style={styles.addHint}>Enter a friend's username to add them</Text>
            <TextInput
              style={styles.input}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Username"
              placeholderTextColor={colors.textFaint}
              onSubmitEditing={handleAddFriend}
              returnKeyType="done"
            />
            <PrimaryButton
              label="Add Friend"
              variant="primary"
              onPress={handleAddFriend}
              disabled={!searchText.trim()}
            />
          </View>
        )}

        <PrimaryButton
          label="Back to Home"
          variant="ghost"
          onPress={() => navigation.navigate('Home')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    title: { color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
    tabRow: { flexDirection: 'row', gap: spacing.sm },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { color: colors.textMuted, fontWeight: '800', fontSize: font.small },
    tabTextActive: { color: colors.text },
    section: { gap: spacing.sm },
    emptyText: { color: colors.textFaint, fontSize: font.body, textAlign: 'center', paddingVertical: spacing.xl },
    friendCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
    },
    friendHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    friendEmoji: { fontSize: 28 },
    friendInfo: { flex: 1 },
    friendName: { color: colors.text, fontSize: font.body, fontWeight: '900' },
    friendRank: { fontSize: font.small, fontWeight: '700', marginTop: 2 },
    friendActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
    challengeBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    challengeText: { color: colors.text, fontSize: font.small, fontWeight: '900' },
    removeText: { color: colors.danger, fontSize: font.body, fontWeight: '900' },
    activityItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.sm,
      padding: spacing.md,
    },
    activityMessage: { color: colors.text, fontSize: font.small, fontWeight: '700', flex: 1 },
    activityTime: { color: colors.textFaint, fontSize: font.small },
    addHint: { color: colors.textMuted, fontSize: font.body, textAlign: 'center', marginBottom: spacing.sm },
    input: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      color: colors.text,
      fontSize: font.body,
      fontWeight: '700',
    },
  });
}
