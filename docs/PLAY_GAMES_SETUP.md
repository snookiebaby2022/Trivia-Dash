# Google Play Games — leaderboards & achievements

Trivia Dash uses [`expo-stores-games-services`](https://github.com/felipej26/expo-stores-games-services) on **Android only**. Web and iOS keep the existing Supabase / local leaderboards.

## 1. Play Console setup

1. Open [Google Play Console](https://play.google.com/console) → your app → **Grow users** → **Play Games Services** → **Setup and management** → **Configuration**.
2. Link a Google Cloud project (or create one).
3. Copy the numeric **Application ID** (e.g. `123456789012`) — this is **not** your package name.

### Android credential (required)

Under **Credentials**:

- Package name: `com.lizzi.triviadash`
- Add **SHA-1** fingerprints for:
  - **Upload keystore** (release builds / Play internal testing)
  - **Debug keystore** (local `expo run:android` / emulator)

Get debug SHA-1:

```powershell
keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Get upload keystore SHA-1 (your release keystore):

```powershell
keytool -list -v -keystore android\upload-keystore.jks -alias upload
```

### Testers

While the game is in draft / closed testing, add Google accounts under **Play Games Services → Testers**.

## 2. Create leaderboards

In Play Console → **Play Games Services** → **Leaderboards**, create:

| Name | Suggested ID env var | Score type | Notes |
|------|----------------------|------------|--------|
| Highest Score | `EXPO_PUBLIC_GPGS_LB_HIGHEST_SCORE` | Higher is better, integer | Total match points |
| Longest Dash Streak | `EXPO_PUBLIC_GPGS_LB_DASH_STREAK` | Higher is better, integer | Best combo streak in a run |
| Weekly High Score | `EXPO_PUBLIC_GPGS_LB_WEEKLY` | Higher is better, integer, **weekly reset** | Same raw score, weekly board |

Copy each leaderboard’s **Leaderboard ID** (starts with `CgkI…`).

## 3. Create achievements (optional)

Create achievements in Play Console, then map them in `.env`:

| In-app achievement | Env var |
|--------------------|---------|
| First Win | `EXPO_PUBLIC_GPGS_ACH_FIRST_WIN` |
| 10 career wins | `EXPO_PUBLIC_GPGS_ACH_WINS_10` |
| 5-win streak | `EXPO_PUBLIC_GPGS_ACH_STREAK_5` |
| 7-day daily streak | `EXPO_PUBLIC_GPGS_ACH_DAILY_7` |
| Perfect game | `EXPO_PUBLIC_GPGS_ACH_PERFECT` |

## 4. Environment variables

Add to `.env` (see `.env.example`):

```env
EXPO_PUBLIC_PLAY_GAMES_APP_ID=123456789012
EXPO_PUBLIC_GPGS_LB_HIGHEST_SCORE=CgkI...
EXPO_PUBLIC_GPGS_LB_DASH_STREAK=CgkI...
EXPO_PUBLIC_GPGS_LB_WEEKLY=CgkI...
EXPO_PUBLIC_GPGS_ACH_FIRST_WIN=CgkI...
```

`EXPO_PUBLIC_PLAY_GAMES_APP_ID` wires the native `APP_ID` meta-data via `app.config.js`. Leaderboard / achievement IDs are read at JS bundle time.

## 5. Rebuild required

Play Games is **native code**. The release script runs `expo prebuild` so the **Play Games Services v2 SDK** is embedded in the APK (Play Console checks for this).

After setting env vars:

```powershell
npm run build:local:aab
```

This loads `.env`, prebuilds Android (SDK + `APP_ID` meta-data), then creates `TriviaDash-1.0.0-v18.aab`.

Install the new build on a device signed into a **tester** Google account. Play Games does **not** work on `localhost:8081` web.

## 6. In-app behavior

- After each match, scores submit automatically (if signed in).
- **Leaderboard** and **Daily ranks** screens show a **Google Play Games** panel (Android + configured IDs).
- Tap **Sign in with Play Games**, then open native leaderboard / achievement UIs.
- Supabase ELO board remains for cross-platform global ranks when configured.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Sign-in fails | SHA-1 mismatch, app not installed from Play/testing track, or account not a tester |
| Scores don’t appear | Leaderboard IDs wrong, or score is 0 |
| Panel hidden | Missing `EXPO_PUBLIC_PLAY_GAMES_APP_ID` or all three leaderboard IDs empty |
| Works in release, not debug | Add debug keystore SHA-1 to Play Console credentials |
| **Missing permissions** (`clientauthconfig.clients.list`, `oauthconfig.verification.get`, `resourcemanager.projects.get`, `serviceusage.quotas.get`) | See **GCP permission errors** below |

### GCP permission errors (blocked / missing permissions)

Play Console is trying to open or configure a **Google Cloud project** your account cannot access. You usually see this when clicking **View in Google Cloud** or linking the wrong project.

**Fix (recommended — stay in Play Console):**

1. Sign in with the **same Google account** that owns the Play developer account.
2. Play Console → **Grow users** → **Play Games Services** → **Setup and management** → **Configuration**.
3. Choose **Create a new Cloud project** (let Play create it). Do **not** link a random existing Firebase/Supabase project unless you own it with full access.
4. Complete **Credentials** (package `com.lizzi.triviadash` + SHA-1) and create leaderboards **entirely in Play Console**.
5. You do **not** need to open Google Cloud Console for basic leaderboards.

**If you must use an existing Cloud project** (you are the admin):

1. [Google Cloud Console](https://console.cloud.google.com) → select the project → **IAM & Admin** → **IAM**.
2. Add your Google email with role **Owner** (or **Editor** + **OAuth Config Editor**).
3. **APIs & Services** → **Library** → enable:
   - Google Play Games Services API
   - Cloud Resource Manager API
   - Service Usage API
4. Wait 2–5 minutes and retry in Play Console.

**If you use an organization / work Google account:**

- Your org may block OAuth / Cloud access even if Play Console works. Common with “organization account required” policies.
- Options: ask your **org admin** to grant the roles above, or use a **personal Google account** for Play Console + Play Games (transfer app later if needed).

**If you already have Owner but still see errors:**

- Try an incognito window and the account that created the developer account.
- Check **IAM → Deny** and **Principal Access Boundary** (org policies).
- Create a **fresh** Cloud project from Play Console instead of reusing an old one.
