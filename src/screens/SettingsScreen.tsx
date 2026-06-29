import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPanel } from '../components/AuthPanel';
import { LegalLinks } from '../components/LegalLinks';
import { SoundPackPicker } from '../components/SoundPackPicker';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { requestAppRating } from '../lib/rateApp';
import { resetWalkthrough } from '../lib/onboarding';
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  requestNotificationPermission,
  setupNotificationsForProfile,
  type NotificationPreferences,
} from '../lib/notifications';
import type { RootStackParamList } from '../navigation';
import type { ColorScheme } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { colors, scheme, preference, colorBlind, setPreference, toggleScheme, toggleColorBlind } = useTheme();
  const { profile, setVoiceEnabled, setSfxEnabled, setProfilePhoto, setCoverPhoto, removeProfilePhoto, removeCoverPhoto } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    void loadNotificationPrefs().then(setNotifPrefs);
  }, []);

  const updateNotifPref = async (patch: Partial<NotificationPreferences>) => {
    if (!notifPrefs) return;
    const next = { ...notifPrefs, ...patch };
    setNotifPrefs(next);
    await saveNotificationPrefs(next);

    if (next.enabled && patch.enabled !== false) {
      const granted = await requestNotificationPermission();
      if (granted && profile) {
        await setupNotificationsForProfile(profile);
      }
    }
  };

  const themeOptions: { id: ColorScheme | 'system'; label: string }[] = [
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'system', label: 'System' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title="Appearance" colors={colors}>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const active = preference === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.themeChip, active && styles.themeChipActive]}
                  onPress={() => void setPreference(opt.id)}
                >
                  <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Row
            colors={colors}
            label="Quick toggle"
            hint={`Currently ${scheme} mode`}
            right={
              <Switch
                value={scheme === 'light'}
                onValueChange={() => void toggleScheme()}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={colors.text}
              />
            }
          />
          <Row
            colors={colors}
            label="Color-blind mode"
            hint="Adjusts colors for easier distinguishing"
            right={
              <Switch
                value={colorBlind}
                onValueChange={() => void toggleColorBlind()}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={colors.text}
              />
            }
          />
        </Section>

        <Section title="Notifications" colors={colors}>
          <Row
            colors={colors}
            label="Enable notifications"
            hint="Daily reminders and streak alerts"
            right={
              <Switch
                value={notifPrefs?.enabled ?? false}
                onValueChange={(v) => void updateNotifPref({ enabled: v })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={colors.text}
              />
            }
          />
          {notifPrefs?.enabled && (
            <>
              <Row
                colors={colors}
                label="Daily challenge reminder"
                hint="Get reminded to play daily"
                right={
                  <Switch
                    value={notifPrefs?.dailyReminder ?? true}
                    onValueChange={(v) => void updateNotifPref({ dailyReminder: v })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor={colors.text}
                  />
                }
              />
              <Row
                colors={colors}
                label="Streak alert"
                hint="Alert at 8pm if streak at risk"
                right={
                  <Switch
                    value={notifPrefs?.streakAlert ?? true}
                    onValueChange={(v) => void updateNotifPref({ streakAlert: v })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor={colors.text}
                  />
                }
              />
            </>
          )}
        </Section>

        <Section title="Profile" colors={colors}>
          <Pressable style={styles.actionRow} onPress={() => void setProfilePhoto()}>
            <Text style={styles.actionLabel}>Change profile picture</Text>
            <Text style={styles.actionChevron}>📷</Text>
          </Pressable>
          {profile?.profilePhotoUri ? (
            <Pressable style={styles.actionRow} onPress={() => void removeProfilePhoto()}>
              <Text style={[styles.actionLabel, { color: colors.danger }]}>Remove profile picture</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.actionRow} onPress={() => void setCoverPhoto()}>
            <Text style={styles.actionLabel}>Change cover photo</Text>
            <Text style={styles.actionChevron}>🖼</Text>
          </Pressable>
          {profile?.coverPhotoUri ? (
            <Pressable style={styles.actionRow} onPress={() => void removeCoverPhoto()}>
              <Text style={[styles.actionLabel, { color: colors.danger }]}>Remove cover photo</Text>
            </Pressable>
          ) : null}
        </Section>

        <Section title="Gameplay" colors={colors}>
          <Row
            colors={colors}
            label="Host voiceover"
            hint="Hear the host read questions and countdown"
            right={
              <Switch
                value={profile?.voiceEnabled ?? false}
                onValueChange={(v) => void setVoiceEnabled(v)}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={colors.text}
              />
            }
          />
          <Row
            colors={colors}
            label="Sound effects"
            hint="Music in Entertainment/Music rounds, celebration sounds"
            right={
              <Switch
                value={profile?.sfxEnabled ?? false}
                onValueChange={(v) => void setSfxEnabled(v)}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={colors.text}
              />
            }
          />
          <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
            <Text style={{ color: colors.text, fontSize: font.body, fontWeight: '800', marginBottom: spacing.sm }}>Sound pack</Text>
            <SoundPackPicker />
          </View>
          <Pressable
            style={styles.actionRow}
            onPress={() => {
              void resetWalkthrough();
              navigation.navigate('Home');
            }}
          >
            <Text style={styles.actionLabel}>Replay welcome tour</Text>
            <Text style={styles.actionChevron}>→</Text>
          </Pressable>
        </Section>

        <Section title="Account" colors={colors}>
          <AuthPanel compact />
        </Section>

        <Section title="App" colors={colors}>
          <Pressable style={styles.actionRow} onPress={() => void requestAppRating()}>
            <View>
              <Text style={styles.actionLabel}>Rate Trivia Dash</Text>
              <Text style={styles.actionHint}>Enjoying the game? Leave a review</Text>
            </View>
            <Text style={styles.actionChevron}>★</Text>
          </Pressable>
        </Section>

        <LegalLinks />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ReturnType<typeof useTheme>['colors'];
  children: React.ReactNode;
}) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  colors,
  label,
  hint,
  right,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  label: string;
  hint?: string;
  right: React.ReactNode;
}) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: font.small,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sectionBody: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
    },
    themeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    themeChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
    },
    themeChipActive: {
      backgroundColor: colors.primary,
    },
    themeChipText: {
      color: colors.textMuted,
      fontWeight: '800',
      fontSize: font.small,
    },
    themeChipTextActive: {
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    rowBody: {
      flex: 1,
    },
    rowLabel: {
      color: colors.text,
      fontSize: font.body,
      fontWeight: '700',
    },
    rowHint: {
      color: colors.textFaint,
      fontSize: font.small,
      marginTop: 2,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      gap: spacing.md,
    },
    actionLabel: {
      color: colors.text,
      fontSize: font.body,
      fontWeight: '800',
    },
    actionHint: {
      color: colors.textFaint,
      fontSize: font.small,
      marginTop: 2,
    },
    actionChevron: {
      color: colors.gold,
      fontSize: font.h3,
      fontWeight: '900',
    },
  });
}
