# Google Sign-In — Trivia Dash

The app uses **Supabase Auth** + **Google OAuth** via `expo-auth-session` (browser flow). Works in dev/production builds, not Expo Go.

## Supabase setup

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Providers** → **Google** → Enable
2. Create a [Google Cloud OAuth client](https://console.cloud.google.com/apis/credentials):
   - Type: **Web application**
   - Authorized redirect URIs: add your Supabase callback URL  
     (shown in Supabase Google provider settings, e.g. `https://<project>.supabase.co/auth/v1/callback`)
3. Paste **Client ID** and **Client Secret** into Supabase Google provider settings
4. **Authentication** → **URL Configuration** → add redirect URL:
   ```
   triviadash://auth/callback
   ```

## App `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

After editing `.env`, restart Metro with a clean cache and restart the dev build on your device:

```powershell
npx expo start --dev-client -c
```

Force-close the installed dev client, then reopen it and reconnect. `EXPO_PUBLIC_*` values are embedded at bundle time — a hot reload is not enough.

## Rebuild after config changes

```powershell
npx expo prebuild --platform android
npm run build:dev:android
```

## What happens on sign-in

1. User taps **Continue with Google** on Home
2. Browser opens Google account picker
3. Redirects back to `triviadash://auth/callback`
4. App links profile to Supabase user ID
5. Stats sync to `profiles` table + RevenueCat `logIn`

## Sign out

Clears Supabase session. Local progress stays on device; online party/ranked need sign-in again.
