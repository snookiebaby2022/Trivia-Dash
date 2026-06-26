# Trivia Dash ⚡

**Party trivia** for Android — race the clock, collect category wedges, battle friends live, and unlock a Pro archive spanning **1930–2026**.

## What's in v2

| Feature | Description |
|---|---|
| **Party lobbies** | Host a room, share a 4-letter code, friends join with avatars |
| **Quick match** | Supabase Realtime queue pairs you with a human (ghost fallback offline) |
| **Daily challenge** | Same 7 questions for everyone each day + shareable emoji grid |
| **Avatars** | 16 emoji avatars with custom colors — shown in lobby, game, leaderboard |
| **Pro (£3.49/mo)** | Unlocks 60+ historical questions (1930–2026), removes ads |
| **Share card** | Tap **Share Result** to viral-post your emoji grid |
| **Ads** | Banner placeholder (wire AdMob in production builds) |

## Run locally

This app uses **native modules** (RevenueCat, AdMob). It does **not** run in Expo Go.

| Where | How |
|---|---|
| **Phone (recommended)** | Install the [EAS dev build](https://expo.dev/accounts/snookiebaby/projects/trivia-dash/builds), then `npm start` and open **Trivia Dash** (not Expo Go) |
| **Phone (firewall issues)** | `npm run start:tunnel` then connect from the dev build |
| **Browser (quick test)** | `npm run start:web` — solo/daily work; party/purchases are limited |

```powershell
cd C:\Users\lizzi\trivia-dash
npm install
npm start
```

After changing `.env`, restart Metro (`npm start`) and force-close/reopen the dev build app.

### `could not connect to TCP port 5554` (local Android build)

That error means **`npm run android`** tried to reach the Android emulator, but nothing was listening. Common causes:

1. **Emulator not started** — Android Studio → **Device Manager** → ▶ start a virtual device, wait until it boots, then retry.
2. **`ANDROID_HOME` not set** — `npm run android` now uses `scripts/run-android.ps1`, which sets the default SDK path automatically.
3. **You don't need a local build** — use the cloud dev build instead (no emulator required):

```powershell
npm run build:dev:android
```

Install the APK on your phone or emulator from the EAS link, then `npm start`.

To set `ANDROID_HOME` permanently (optional): System → Environment Variables → add `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk` and append `%ANDROID_HOME%\platform-tools` to `Path`.

## Supabase (online party + ranked)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable **Realtime** for: `match_queue`, `active_matches`, `party_lobbies`, `party_players`
4. Copy `.env.example` → `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

After changing `.env`, restart Metro (`npx expo start --dev-client -c`) and restart the dev build app on your device.

Without Supabase the app still works: solo ghost matches, daily challenge, mock leaderboard.

## Publish on Google Play + RevenueCat

Full step-by-step: [docs/GOOGLE_PLAY_PUBLISH.md](docs/GOOGLE_PLAY_PUBLISH.md)

```powershell
npm run build:play   # AAB for Play Console upload
npm run build:apk    # APK for sideload / quick test
```

## Pro & ads (production)

- Pro unlock is demo-ready via **Unlock Pro** on home (local flag). Wire `expo-in-app-purchases` or RevenueCat before shipping.
- Replace `AdBanner` with `react-native-google-mobile-ads` in an EAS dev/production build (not Expo Go).

## Question tiers

- **Free:** ~30 general trivia questions
- **Pro:** 60+ decade questions tagged 1930–2026 (History, Science, Sports, Pop Culture)

## Stack

Expo 54 · React Native 0.81 · React Navigation · Supabase Realtime · AsyncStorage
