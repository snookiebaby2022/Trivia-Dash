# Trivia Dash ⚡

**Party trivia** for Android — race the clock, collect category wedges, battle friends live, and unlock a Pro archive spanning **1930–2026**.

## What's in v2

| Feature | Description |
|---|---|
| **Party lobbies** | Host a room, share a 4-letter code, friends join with avatars |
| **Quick match** | Supabase Realtime queue pairs you with a human (ghost fallback offline) |
| **Daily challenge** | Same 7 questions for everyone each day + shareable emoji grid |
| **Avatars** | 16 emoji avatars with custom colors — shown in lobby, game, leaderboard |
| **Pro ($3.99/mo)** | Unlocks 60+ historical questions (1930–2026), removes ads |
| **Share card** | Tap **Share Result** to viral-post your emoji grid |
| **Ads** | Banner placeholder (wire AdMob in production builds) |

## Run locally

```powershell
cd C:\Users\lizzi\trivia-dash
npm install
npx expo start -c
```

Scan with **Expo Go (SDK 54)**.

## Supabase (online party + ranked)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable **Realtime** for: `match_queue`, `active_matches`, `party_lobbies`, `party_players`
4. Copy `.env.example` → `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Without Supabase the app still works: solo ghost matches, daily challenge, mock leaderboard.

## Pro & ads (production)

- Pro unlock is demo-ready via **Unlock Pro** on home (local flag). Wire `expo-in-app-purchases` or RevenueCat before shipping.
- Replace `AdBanner` with `react-native-google-mobile-ads` in an EAS dev/production build (not Expo Go).

## Question tiers

- **Free:** ~30 general trivia questions
- **Pro:** 60+ decade questions tagged 1930–2026 (History, Science, Sports, Pop Culture)

## Stack

Expo 54 · React Native 0.81 · React Navigation · Supabase Realtime · AsyncStorage
