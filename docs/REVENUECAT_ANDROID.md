# RevenueCat — Android (Kotlin) reference for Trivia Dash

Trivia Dash is an **Expo / React Native** app. Production billing runs through `react-native-purchases` and `react-native-purchases-ui` (see `src/lib/purchases.ts`). This document is the native Android/Kotlin reference if you add custom native code or audit the Gradle layer after `npx expo prebuild`.

## 1. Gradle installation

In `android/app/build.gradle`:

```gradle
dependencies {
    implementation "com.revenuecat.purchases:purchases:10.8.0"
}
```

Expo config plugin `./plugins/withRevenueCatAndroid` injects this automatically on prebuild and forces the same version project-wide.

**Requirements**

- `minSdkVersion` 24+ (set via `expo-build-properties` in `app.json`)
- Google Play Billing Library 7+ (bundled by RevenueCat SDK 10.x)
- BILLING permission is added by the SDK

Docs: [RevenueCat Android installation](https://www.revenuecat.com/docs/getting-started/installation/android#installation)

## 2. Dashboard configuration

| Item | Value |
|------|-------|
| App package | `com.lizzi.triviadash` |
| Entitlement ID | `pro` |
| Entitlement display name | Trivia Dash Pro |
| Google Play products | `monthly`, `yearly` |
| Offering | `default` (current) |
| Packages | `monthly` → product `monthly`, `yearly` → product `yearly` |

Create matching subscriptions in [Google Play Console](https://play.google.com/console) and link them in RevenueCat → Products.

### Paywall & Customer Center

1. RevenueCat → **Paywalls** → create a paywall for offering `default` with monthly + yearly packages.
2. RevenueCat → **Customer Center** → enable and configure (manage subscription, restore, support links).
3. The React Native layer calls `RevenueCatUI.presentPaywall()` and `RevenueCatUI.presentCustomerCenter()`.

## 3. Kotlin — Application setup

```kotlin
// MyApplication.kt
import android.app.Application
import com.revenuecat.purchases.LogLevel
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            Purchases.logLevel = LogLevel.DEBUG
        }
        Purchases.configure(
            PurchasesConfiguration.Builder(this, "test_iAXldqIVnUOynJrZtrpubvDVoAx").build()
        )
    }
}
```

Register in `AndroidManifest.xml`:

```xml
<application android:name=".MyApplication" ...>
```

**Best practice:** use your **public** RevenueCat API key (test key for sandbox, production key for release). Never embed secret keys.

## 4. Entitlement check — Trivia Dash Pro

```kotlin
import com.revenuecat.purchases.CustomerInfo
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.getCustomerInfoWith

const val PRO_ENTITLEMENT_ID = "pro"

fun CustomerInfo.isTriviaDashPro(): Boolean =
    entitlements.active[PRO_ENTITLEMENT_ID]?.isActive == true

// Async (Kotlin coroutines extension)
suspend fun fetchIsPro(): Boolean {
    val info = Purchases.sharedInstance.awaitCustomerInfo()
    return info.isTriviaDashPro()
}
```

## 5. Customer info listener

```kotlin
Purchases.sharedInstance.updatedCustomerInfoListener = { customerInfo ->
    val isPro = customerInfo.isTriviaDashPro()
    // Update UI / local cache
}
```

In React Native this is `Purchases.addCustomerInfoUpdateListener()` — already wired in `ProfileContext`.

## 6. Fetch offerings & purchase

```kotlin
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchaseParams
import com.revenuecat.purchases.awaitOfferings
import com.revenuecat.purchases.awaitPurchase

suspend fun purchaseMonthly(activity: Activity): Boolean {
    val offerings = Purchases.sharedInstance.awaitOfferings()
    val pkg = offerings.current?.monthly
        ?: offerings.current?.availablePackages?.find { it.identifier == "monthly" }
        ?: return false

    val result = Purchases.sharedInstance.awaitPurchase(
        PurchaseParams.Builder(activity, pkg).build()
    )
    return result.customerInfo.isTriviaDashPro()
}

suspend fun purchaseYearly(activity: Activity): Boolean {
    val offerings = Purchases.sharedInstance.awaitOfferings()
    val pkg = offerings.current?.annual
        ?: offerings.current?.availablePackages?.find { it.identifier == "yearly" }
        ?: return false

    val result = Purchases.sharedInstance.awaitPurchase(
        PurchaseParams.Builder(activity, pkg).build()
    )
    return result.customerInfo.isTriviaDashPro()
}
```

## 7. Error handling

```kotlin
import com.revenuecat.purchases.PurchasesError
import com.revenuecat.purchases.PurchasesErrorCode

fun handlePurchaseError(error: PurchasesError): String = when (error.code) {
    PurchasesErrorCode.PurchaseCancelledError -> "Purchase cancelled"
    PurchasesErrorCode.NetworkError -> "Network error — check connection"
    PurchasesErrorCode.ProductNotAvailableForPurchaseError ->
        "Subscription not available"
    PurchasesErrorCode.PaymentPendingError ->
        "Payment pending — check Play Store"
    else -> error.message
}
```

## 8. Restore purchases

```kotlin
import com.revenuecat.purchases.awaitRestore

suspend fun restorePro(): Boolean {
    val info = Purchases.sharedInstance.awaitRestore()
    return info.isTriviaDashPro()
}
```

## 9. Paywall (native UI)

If using RevenueCat Paywalls from native Kotlin (instead of React Native UI):

```kotlin
// Requires purchases-ui artifact — in RN this is react-native-purchases-ui
import com.revenuecat.purchases.ui.revenuecatui.ExperimentalPreviewRevenueCatUIPurchasesAPI
import com.revenuecat.purchases.ui.revenuecatui.activity.PaywallActivityLauncher

@OptIn(ExperimentalPreviewRevenueCatUIPurchasesAPI::class)
fun showPaywall(activity: Activity) {
    PaywallActivityLauncher().launch(activity)
}
```

Trivia Dash uses the React Native wrapper: `RevenueCatUI.presentPaywall()`.

## 10. Customer Center

```kotlin
import com.revenuecat.purchases.ui.revenuecatui.customercenter.CustomerCenter

CustomerCenter.show(activity) // RN: RevenueCatUI.presentCustomerCenter()
```

Show Customer Center when the user is already Pro (manage/cancel). Trivia Dash exposes this on Home → **Manage subscription**.

## 11. Build & test (Expo)

RevenueCat does **not** work in Expo Go. Use a dev client:

```bash
npx expo prebuild --platform android
eas build --profile development --platform android
```

Install the dev build, sign into a Google Play test account, and purchase sandbox subscriptions.

## 12. React Native mapping

| Native concept | Trivia Dash file |
|----------------|------------------|
| `Purchases.configure` | `initPurchases()` in `src/lib/purchases.ts` |
| Entitlement `pro` | `PRO_ENTITLEMENT_ID` in `src/lib/revenuecat.ts` |
| Paywall | `presentProPaywall()` |
| Paywall if needed | `presentProPaywallIfNeeded()` |
| Customer Center | `presentCustomerCenter()` |
| Customer info sync | `syncProFromStore()`, `ProfileContext` listener |
| Products `monthly` / `yearly` | `RC_PRODUCT_MONTHLY`, `RC_PRODUCT_YEARLY` |

## Best practices

1. **Single source of truth** — gate features on `customerInfo.entitlements.active["pro"]`, not local flags alone. Local `isPro` is a cache synced from RevenueCat.
2. **Listener** — always register `addCustomerInfoUpdateListener` to handle renewals, cancellations, and family sharing.
3. **Restore** — expose restore on every paywall (required by Apple; good practice on Android).
4. **Paywall Builder** — design paywalls in the RevenueCat dashboard; avoid hard-coded prices in UI when possible.
5. **Customer Center** — use for Pro users instead of custom “cancel” flows.
6. **Test keys** — `test_…` keys only talk to sandbox; swap to production keys before release.
7. **Identify users** — call `Purchases.logIn(userId)` when your player signs in for cross-device restore.
