# Publish Trivia Dash on Google Play + RevenueCat

End-to-end guide for **Trivia Dash** (`com.lizzi.triviadash`). Work top to bottom; later steps depend on earlier ones.

| Item | Value in this repo |
|------|-------------------|
| Package | `com.lizzi.triviadash` |
| RevenueCat entitlement | `pro` |
| Play subscription IDs | `monthly`, `yearly` |
| RevenueCat offering | `default` |

---

## Phase 1 — Play Console basics

1. [play.google.com/console](https://play.google.com/console) — same Google account you’ll use for Cloud.
2. **Create app** (if needed): name **Trivia Dash**, package **`com.lizzi.triviadash`** (cannot change easily later).
3. Complete **Dashboard** tasks (red/yellow items):
   - Developer identity / account details
   - **Payments profile** (bank/tax — required for subscriptions)
   - **Privacy policy** URL (host a simple page; link in store listing)
   - **App content** → content rating questionnaire
   - **Target audience**, ads declaration, data safety form

You do **not** need **Setup → API access** on newer accounts — use **Users and permissions** instead (Phase 4).

---

## Phase 2 — Upload first build (unlocks subscriptions)

Google often hides **Subscriptions** until a build is on a test track.

### Build an Android App Bundle (AAB) for Play

Play Store requires **AAB** for new apps (not APK).

```powershell
cd C:\Users\lizzi\trivia-dash
npm run build:play
```

Or manually:

```powershell
$env:EAS_NO_VCS=1
npx eas-cli build --profile production --platform android
```

Download when finished:

```powershell
$env:EAS_NO_VCS=1
npx eas-cli build:download --build-id YOUR_BUILD_ID
```

If `build:download` fails with **`TAR_BAD_ARCHIVE`**, the artifact is already a raw `.aab` (not a tar wrapper). Download it directly instead:

```powershell
# Replace URL from: npx eas-cli build:view BUILD_ID --json
Invoke-WebRequest -Uri "https://expo.dev/artifacts/eas/YOUR_ARTIFACT.aab" -OutFile "TriviaDash.aab"
```

Or open the build on [expo.dev](https://expo.dev) → **Download** on the build page.

### Upload to Internal testing

1. Play Console → **Trivia Dash** → **Test and release** → **Testing** → **Internal testing**
2. **Create new release**
3. Upload the **`.aab`** file from EAS
4. Release name e.g. `0.1.0 (1)` → **Review release** → **Start rollout**

Wait until the release shows as **available** / published.

### Play Console: “does not add or remove any app bundles”

This means the release draft has **no new AAB** attached (or you’re re-publishing the same version code already on the track).

1. **Discard** the broken draft (⋮ → Discard changes).
2. **Internal testing** → **Create new release**.
3. Under **App bundles**, click **Upload** and pick the `.aab` file — wait until Play shows **Version code** (e.g. `6`).
4. Confirm **Changes from previous release** lists your new bundle. If only the old bundle appears, you didn’t upload the new file.
5. **Review release** → **Start rollout**.

**“doesn’t allow any existing users to upgrade”** — the new bundle’s **version code must be higher** than every bundle on **any** track (internal, closed, production). Check **Test and release** → **App bundle explorer** for the highest version code. Never re-upload `v3` if `3` is already live.

**Warning: “no deobfuscation file”** — safe to ignore for first upload. Expo release builds often don’t ship a separate `mapping.txt`; Play may still accept the AAB. Click **Save** / **Publish** anyway. See [Deobfuscation warning](#deobfuscation-warning) below.

---

## Phase 3 — Subscriptions in Play Console

1. **Monetize with Play** → **Products** → **Subscriptions**
2. Create **two** subscriptions:

| Product ID | Billing |
|------------|---------|
| `monthly` | Auto-renewing, 1 month |
| `yearly` | Auto-renewing, 1 year |

For each: add benefits → **Add base plan** → set price → **Activate** base plan.

IDs must match `src/lib/revenuecat.ts` exactly.

---

## Phase 4 — Google Cloud service account (RevenueCat)

### A. Cloud project

1. [console.cloud.google.com](https://console.cloud.google.com) → **New project** e.g. `trivia-dash`
2. Enable APIs (**Enable** on each):
   - [Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)
   - [Play Developer Reporting API](https://console.cloud.google.com/apis/library/playdeveloperreporting.googleapis.com)
   - [Pub/Sub API](https://console.cloud.google.com/apis/library/pubsub.googleapis.com)

### B. Service account + JSON

1. **IAM & Admin** → **Service accounts** → **Create**
2. Name: `revenuecat` → on create, grant:
   - **Pub/Sub Editor** (use **Pub/Sub Admin** if validation fails)
   - **Monitoring Viewer**
3. **Keys** → **Add key** → **JSON** → download file

### C. Invite to Play Console

1. Play Console → **All apps** → **Users and permissions** → **Invite new users**
2. Email = `client_email` from JSON
3. **App permissions** → Trivia Dash
4. **Account permissions**:
   - View app information (read-only)
   - View financial data, orders…
   - **Manage orders and subscriptions**
5. **Invite**

---

## Phase 5 — RevenueCat dashboard

1. [app.revenuecat.com](https://app.revenuecat.com) → your project
2. **Apps** → **+ New** → **Google Play Store** (not Test Store)
3. Package: **`com.lizzi.triviadash`**
4. Upload **Service account credentials JSON** → **Save** → **Validate**
   - Fix red checks per [REVENUECAT_PLAY_STORE.md](./REVENUECAT_PLAY_STORE.md)
   - May take up to 36 hours; edit a subscription in Play and save to speed up
5. **Products** → attach Play products `monthly`, `yearly`
6. **Entitlements** → `pro` → link both products
7. **Offerings** → `default` (current) → packages `monthly`, `yearly`
8. **Paywalls** → create & publish paywall on `default`
9. **Customer Center** → enable (optional, for manage subscription UI)

---

## Phase 6 — Production API key in the app

1. RevenueCat → **API keys** → copy Android **`goog_…`** key (Play app, not Test Store)
2. [expo.dev](https://expo.dev) → **trivia-dash** → **Environment variables**
   - Profile: **production** (and **preview** if you test with preview builds)
   - Name: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
   - Value: `goog_…`
3. Rebuild production AAB:

```powershell
npm run build:play
```

---

## Fix “Resolve errors before publishing” (2 common items)

Play Console **Publishing overview** often blocks release until these are filled in. Click each **Manage** / **Start** button and paste your **public HTTPS** URLs.

### 1. Privacy policy URL

1. Play Console → **Policy** → **App content**
2. **Privacy policy** → **Manage** (or **Start**)
3. Paste URL, e.g. `https://your-site.com/privacy-policy.html`
4. **Save**

Host the ready-made page from this repo: `legal/privacy-policy.html` (edit email/domain first).

Google also requires the **same link inside the app** — Home screen footer **Privacy policy** (added in code).

### 2. Account deletion URL (Google Sign-In)

Because the app offers sign-in:

1. **Policy** → **App content** → **Account deletion** → **Manage**
2. Paste URL, e.g. `https://your-site.com/delete-account.html`
3. **Save**

Host `legal/delete-account.html`. In-app link: **Delete account** on Home.

### Host the legal pages (free options)

- [GitHub Pages](https://pages.github.com) — upload `legal/` folder to a repo, enable Pages
- [Netlify Drop](https://app.netlify.com/drop) — drag the `legal` folder
- Any web host — must be **HTTPS**, not a PDF, not login-walled

Then set URLs in `.env` and rebuild, or change defaults in `src/lib/legal.ts`.

### RevenueCat paywall buttons

In RevenueCat → **Paywalls** → edit paywall → set **Privacy policy** and **Terms** URLs to the same links.

---

## Phase 7 — Store listing (before public release)

Play Console → **Grow** → **Store presence** → **Main store listing**

- App name: **Trivia Dash**
- Short + full description
- Screenshots (phone): at least 2
- Feature graphic 1024×500
- App icon (512×512) — can export from `assets/icon.png`
- Category: Games or Trivia
- Contact email
- Privacy policy URL

---

## Phase 8 — Test real purchases

1. Play Console → **Setup** → **License testing** → add your Gmail as license tester
2. Internal testing → **Testers** tab → create email list → add yourself
3. Copy **internal test link** → open on Android phone → install from Play (not sideload)
4. Open app → try **Pro** / paywall
5. Use a **test card** or license tester account (Play billing sandbox)

Sideloaded APKs can run the app but **Play Billing + RevenueCat** work best when installed from a Play test track.

---

## Phase 9 — Production release

1. Fix all Play Console **policy** and **pre-launch report** issues
2. **Test and release** → **Production** → **Create new release**
3. Upload the same (or newer) **production AAB** signed with EAS credentials
4. Complete **country/region** distribution
5. **Review and roll out** → Google review (often 1–7 days for new apps)

### Optional: EAS Submit

```powershell
$env:EAS_NO_VCS=1
npx eas-cli submit --platform android --profile production
```

Requires Play Console API or manual upload of the AAB from EAS.

---

## Deobfuscation warning

Play Console may show:

> There is no deobfuscation file associated with this App Bundle…

| Situation | Action |
|-----------|--------|
| **First internal/production upload** | **Ignore** — it’s a warning, not an error. Continue the release. |
| Code not minified (default Expo) | No mapping file exists; nothing to upload. |
| You enabled R8 minify later | Upload `mapping.txt` via **App bundle explorer** → your version → **Downloads** → **Assets** → upload mapping. EAS may include it in build artifacts if minify is on. |

You do **not** need to fix this to publish or test subscriptions.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No Subscriptions menu | Publish build to Internal testing first |
| RevenueCat Test Store warning | Add Google Play app in RevenueCat, use `goog_` key |
| Credentials need attention | See [REVENUECAT_PLAY_STORE.md](./REVENUECAT_PLAY_STORE.md) Pub/Sub + Play permissions |
| test_ API key alert on phone | Use production key or preview build without RC configure |
| Purchases don’t work sideloaded | Install from Play internal test link |
| `npm run build:apk` git error | Use `npm run build:play` or `scripts/eas-build.ps1` |

---

## Command reference

| Command | Output |
|---------|--------|
| `npm run build:apk` | Preview APK (sideload, no Play Store) |
| `npm run build:play` | Production AAB (Google Play upload) |
| `npm start` | Metro for dev client |

---

## Related docs

- [REVENUECAT_PLAY_STORE.md](./REVENUECAT_PLAY_STORE.md) — credentials & Pub/Sub detail
- [REVENUECAT_ANDROID.md](./REVENUECAT_ANDROID.md) — SDK / native reference
- [GOOGLE_SIGNIN.md](./GOOGLE_SIGNIN.md) — Supabase Google auth
