# RevenueCat — connect real Google Play (production)

RevenueCat shows **"connected to the Test Store"** until you add a real **Google Play** app configuration. Test Store + `test_…` API keys are for sandbox only. Release APKs need a **Play Store app** + **`goog_…` production API key**.

## Checklist

### 1. Google Play Console

#### Why “Subscriptions” is missing

Google often **hides** subscription setup until:

1. The app exists in Play Console with package **`com.lizzi.triviadash`**
2. **Payments profile** is set up (Play Console → **Setup → Payments profile**)
3. At least **one release is published** to a test track (Internal / Closed testing) — draft-only apps may not show subscription tools
4. Your Google account has **Admin / Finance** permissions on the app

If you only sideload an APK and never uploaded to Play, you will **not** see subscription creation.

#### Where to click (current Play Console)

1. [play.google.com/console](https://play.google.com/console) → select **Trivia Dash** (your app)
2. Left sidebar → **Monetize with Play** (or **Monetize**)
3. **Products** → **Subscriptions**

   Direct pattern: `Monetize with Play` → `Products` → `Subscriptions`

   If you don’t see **Monetize with Play**, finish **Dashboard** tasks (developer account, app identity, content rating, privacy policy).

#### Create two subscriptions (matches this app)

Create **two separate** subscription products (not one product with two plans):

| Step | Product ID (exact) | Display name example | Base plan |
|------|-------------------|----------------------|-----------|
| 1 | **`monthly`** | Trivia Dash Pro Monthly | Auto-renewing, billed every **1 month**, UK price **£3.49** |
| 2 | **`yearly`** | Trivia Dash Pro Yearly | Auto-renewing, billed every **1 year**, UK price **£19.99** |

For each subscription:

1. **Create subscription** → enter **Product ID** (`monthly` or `yearly`) → **Create**
2. Add **benefits** (short bullet list) → **Save**
3. **Add base plan** → choose **Auto-renewing** → set billing period → set **price** → **Activate** the base plan
4. Back on the subscription list, ensure status is **Active** (not Draft)

Product IDs **cannot be renamed** after create — use `monthly` and `yearly` exactly (matches `src/lib/revenuecat.ts`).

#### Upload a build first (if Subscriptions page is empty)

1. **Test and release** → **Testing** → **Internal testing** (or Closed testing)
2. **Create new release** → upload your `.apk` or `.aab` from EAS
3. **Review release** → **Start rollout to Internal testing**
4. Wait until the release shows **Available** / published, then return to **Subscriptions**

### 2. Service Account Credentials JSON (RevenueCat)

RevenueCat needs a **JSON key file** so its servers can talk to Google Play on your behalf. Full guide: [RevenueCat Play credentials](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials).

#### A. Google Cloud — create the JSON file

1. [Google Cloud Console](https://console.cloud.google.com) → pick the project linked to your Play app (or create one).
2. Enable APIs on your Cloud project (each → **Enable**):
   - [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)
   - [Google Play Developer Reporting API](https://console.cloud.google.com/apis/library/playdeveloperreporting.googleapis.com)
   - **[Cloud Pub/Sub API](https://console.cloud.google.com/apis/library/pubsub.googleapis.com)** ← required for RevenueCat
3. **IAM & Admin** → **Service Accounts** → **Create service account**
   - Name e.g. `revenuecat-play`
   - **Grant roles** on the project:
     - **Pub/Sub Editor** (use **Pub/Sub Admin** if validation still fails)
     - **Monitoring Viewer**
   - Already created without roles? **IAM** → edit the service account email → add those roles
4. Open the service account → **Keys** tab → **Add key** → **Create new key** → **JSON** → **Create**
5. A `.json` file downloads — **keep it secret**. This is what you upload to RevenueCat.

#### B. Google Play Console — invite that service account

1. Play Console → **Users and permissions** → **Invite new users**
2. Email = the service account email from the JSON (`client_email`, looks like `revenuecat-play@your-project.iam.gserviceaccount.com`)
3. **App permissions** → add **Trivia Dash** (`com.lizzi.triviadash`)
4. **Account permissions** — enable at minimum:
   - **View app information and download bulk reports** (read-only)
   - **View financial data, orders, and cancellation survey responses**
   - **Manage orders and subscriptions**
5. **Invite user** → status should show **Active**

Alternative path: **Setup** → **API access** → link Cloud project → **Create service account** (jumps to Cloud Console), then return to API access to grant Play Console access.

#### C. RevenueCat — upload the JSON

1. [RevenueCat](https://app.revenuecat.com) → your project
2. Select your **Google Play** app (not Test Store) → **App settings** / **Service account credentials**
3. Drag the **JSON file** into **Service Account Credentials JSON** → **Save**
4. Click **Validate** if shown — all checks green may take **up to 36 hours** (Google propagation)

**Faster validation trick:** In Play Console, edit any subscription description and save — sometimes activates credentials sooner.

**Do not** commit the JSON to git or share it publicly.

#### Pub/Sub error in RevenueCat

If RevenueCat says *"credentials do not have permissions to access the Google Cloud Pub/Sub API"*:

1. [Enable Pub/Sub API](https://console.cloud.google.com/apis/library/pubsub.googleapis.com) on the **same** Cloud project as the service account
2. **IAM & Admin** → **IAM** → find `client_email` from your JSON → **Edit** → add **Pub/Sub Editor** (or **Pub/Sub Admin**)
3. **Keys** → create a **new JSON key** (optional but recommended after role changes)
4. Re-upload JSON to RevenueCat → **Save** → **Validate**
5. In RevenueCat app settings, configure **Google Real-Time Developer Notifications** (Pub/Sub topic) if prompted

Validation can take up to 36 hours after changes.

### 3. RevenueCat dashboard

1. [RevenueCat](https://app.revenuecat.com) → your project → **Apps**.
2. **+ New** → **Google Play Store** (not Test Store).
3. Package name: **`com.lizzi.triviadash`**
4. Upload the **Google Play service credentials JSON**.
5. **Products** → import or add:
   - `monthly` → Google Play subscription `monthly`
   - `yearly` → Google Play subscription `yearly`
6. **Entitlements** → ensure entitlement **`pro`** is linked to both products.
7. **Offerings** → offering **`default`** (current) with packages **`monthly`** and **`yearly`**.
8. **Paywalls** → publish a paywall on offering `default` (optional but needed for in-app paywall UI).

### 4. Production API key in the app

1. RevenueCat → **Project settings → API keys**.
2. Copy the **Android** key for your **Google Play app** — starts with **`goog_`** (not `test_`).
3. Set it for release builds:

**EAS (recommended for APK builds):**

```text
expo.dev → trivia-dash → Environment variables → preview (or production)
Name:  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
Value: goog_xxxxxxxxxxxxxxxx
```

**Local `.env` (debug / Metro only):**

```env
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxx
```

Keep `test_…` only for local debug if you want sandbox; never ship `test_` in a release APK (the app skips RevenueCat in that case).

4. Rebuild:

```powershell
npm run build:apk
```

### 5. Test real purchases

1. Upload the new APK/AAB to Play **Internal testing**.
2. Add your Google account as a **license tester** (Play Console → Setup → License testing).
3. Install from the Play internal test link (not sideloaded APK) for billing to work end-to-end.
4. Or use sideloaded APK + production `goog_` key — purchases still need Play Billing and a published subscription in a test track.

## Identifiers in this repo (must match dashboard)

| Item | Value |
|------|-------|
| Package | `com.lizzi.triviadash` |
| Entitlement | `pro` |
| Play product IDs | `monthly`, `yearly` |
| Offering | `default` |
| Package IDs | `monthly`, `yearly` |

See `src/lib/revenuecat.ts`.

## Until Play Store is connected

- **Sideloaded preview APK**: app runs; Pro uses local/demo unlock (RevenueCat disabled without `goog_` key).
- **Test Store + `test_` key**: works only in **debug** dev builds, not release APKs.

## Links

- [RevenueCat: Google Play setup](https://www.revenuecat.com/docs/getting-started/installation/android)
- [RevenueCat: Offerings & entitlements](https://www.revenuecat.com/docs/getting-started/entitlements)
- [EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
