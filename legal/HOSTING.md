# Host legal pages with no website (free, ~10 minutes)

Google Play **cannot** waive the privacy policy URL if you have ads or subscriptions. You do **not** need to buy a domain.

## Option A — Google Sites (easiest)

1. Go to [sites.google.com](https://sites.google.com) (same Google account as Play Console).
2. **Blank** → name site **Trivia Dash Legal**.
3. Create **3 pages** (or one page with 3 sections):
   - Copy text from `privacy-policy.html` into a **Privacy** page.
   - Copy text from `delete-account.html` into **Delete account** page.
   - Copy text from `terms.html` into **Terms** page.
4. **Publish** → set visibility to **Public** → publish.
5. Copy each page URL (looks like `https://sites.google.com/view/triviadash-legal/privacy`).

Paste those URLs into Play Console → **Policy** → **App content**.

## Option B — Netlify (triviadashlegal.netlify.app)

**Update an existing site (recommended):**

1. [app.netlify.com](https://app.netlify.com) → site **triviadashlegal** → **Deploys**
2. **Deploy manually** → drag the whole `legal` folder (must include `_redirects`)
3. Live URLs (no `.html`):
   - `https://triviadashlegal.netlify.app/privacy-policy`
   - `https://triviadashlegal.netlify.app/terms`
   - `https://triviadashlegal.netlify.app/delete-account`

**CLI (repeatable):**

```powershell
cd legal
npx netlify-cli login
npx netlify-cli link --name triviadashlegal
.\deploy.ps1
```

## Option C — GitHub Pages

1. Create a public GitHub repo, upload `legal/` files.
2. Settings → Pages → deploy from `main` / `/legal` or root.
3. URL: `https://YOURUSER.github.io/REPO/privacy-policy.html`

## After you have URLs

**Play Console**
- Policy → App content → Privacy policy → **Manage** → paste privacy URL
- Policy → App content → Account deletion → **Manage** → paste delete URL

**App `.env`** (then `npm run build:play`):

```env
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://triviadashlegal.netlify.app/privacy-policy
EXPO_PUBLIC_TERMS_URL=https://triviadashlegal.netlify.app/terms
EXPO_PUBLIC_ACCOUNT_DELETION_URL=https://triviadashlegal.netlify.app/delete-account
```

**RevenueCat paywall** → same privacy + terms URLs on buttons.

## Reduce requirements (optional)

| Feature | Play requirement |
|---------|------------------|
| Subscriptions + AdMob | Privacy policy URL **required** — cannot bypass |
| Google Sign-In | Account deletion URL **required** |
| No sign-in (guest only) | May skip account deletion URL only |

To drop the **account deletion** error only: hide Google Sign-In until you have a delete URL (privacy policy still required).
