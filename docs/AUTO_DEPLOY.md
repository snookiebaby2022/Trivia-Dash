# Auto-deploy setup

GitHub Actions deploys on every push to `main`:

| Workflow | What it does |
|----------|----------------|
| [ci.yml](../.github/workflows/ci.yml) | Typecheck + smoke test on PRs and pushes |
| [android-deploy.yml](../.github/workflows/android-deploy.yml) | EAS production Android AAB build |
| [legal-deploy.yml](../.github/workflows/legal-deploy.yml) | Netlify deploy when `legal/` changes |

## One-time GitHub secrets

Repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | How to get it |
|--------|----------------|
| `EXPO_TOKEN` | [expo.dev](https://expo.dev) → Account → Access tokens → Create |

### Optional: auto-submit to Play Store

1. Upload a Google Play service account JSON to EAS: `eas credentials` or Expo dashboard → Credentials.
2. Repo → **Settings** → **Variables** → add `AUTO_SUBMIT_PLAY` = `true`.

Without that variable, the workflow only builds the AAB (download from [expo.dev](https://expo.dev)).

### Optional: legal pages on Netlify

| Secret | How to get it |
|--------|----------------|
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify site → Site configuration → General → Site ID |

Or deploy legal pages manually: `powershell -File legal/deploy.ps1`

## Manual deploy (local)

```powershell
# Android AAB
npm run build:play

# Legal pages
powershell -ExecutionPolicy Bypass -File legal/deploy.ps1
```

## EAS environment variables

Production builds need env vars in [expo.dev](https://expo.dev) → Project → **Environment variables** (or EAS Secrets), not only in local `.env`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
- `EXPO_PUBLIC_PRIVACY_POLICY_URL` (and other legal URLs)

CI builds use EAS cloud secrets — local `.env` is not uploaded automatically.
