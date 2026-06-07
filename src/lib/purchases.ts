import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import {
  PRO_ENTITLEMENT_DISPLAY_NAME,
  PRO_ENTITLEMENT_ID,
  RC_PACKAGE_MONTHLY,
  RC_PACKAGE_YEARLY,
  RC_PRODUCT_MONTHLY,
  RC_PRODUCT_YEARLY,
} from './revenuecat';
import { saveProStatus } from './monetization';

type PurchasesModule = typeof import('react-native-purchases');
type PaywallModule = typeof import('react-native-purchases-ui');

const REVENUECAT_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ??
  (Constants.expoConfig?.extra as { revenueCatAndroidKey?: string } | undefined)
    ?.revenueCatAndroidKey ??
  '';
const REVENUECAT_API_KEY_IOS =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ??
  (Constants.expoConfig?.extra as { revenueCatIosKey?: string } | undefined)?.revenueCatIosKey ??
  '';

let configured = false;
let customerInfoListener: ((info: CustomerInfo) => void) | null = null;

export type PurchaseErrorCode =
  | 'not_configured'
  | 'cancelled'
  | 'unavailable'
  | 'failed'
  | 'network';

export class PurchaseError extends Error {
  code: PurchaseErrorCode;
  constructor(code: PurchaseErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function getPurchasesModule(): PurchasesModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-purchases') as PurchasesModule;
  } catch {
    return null;
  }
}

function getPaywallModule(): PaywallModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-purchases-ui') as PaywallModule;
  } catch {
    return null;
  }
}

function getApiKey(): string {
  return Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
}

export function isProEntitled(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

export function purchasesConfigured(): boolean {
  return Boolean(getApiKey() && getPurchasesModule());
}

export async function initPurchases(
  userId?: string,
  onCustomerInfoUpdated?: (info: CustomerInfo) => void
): Promise<void> {
  if (configured) return;
  const mod = getPurchasesModule();
  const apiKey = getApiKey();
  if (!mod || !apiKey) {
    configured = true;
    return;
  }

  try {
    if (__DEV__) {
      mod.default.setLogLevel(mod.LOG_LEVEL.DEBUG);
    }

    mod.default.configure({ apiKey, appUserID: userId });

    if (onCustomerInfoUpdated) {
      customerInfoListener = onCustomerInfoUpdated;
      mod.default.addCustomerInfoUpdateListener(onCustomerInfoUpdated);
    }

    configured = true;
  } catch (e) {
    console.warn('[RevenueCat] configure failed', e);
    configured = true;
  }
}

export function removePurchasesListener(): void {
  const mod = getPurchasesModule();
  if (mod && customerInfoListener) {
    mod.default.removeCustomerInfoUpdateListener(customerInfoListener);
    customerInfoListener = null;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  const mod = getPurchasesModule();
  if (!mod || !purchasesConfigured()) return null;
  try {
    return await mod.default.getCustomerInfo();
  } catch (e) {
    console.warn('[RevenueCat] getCustomerInfo failed', e);
    return null;
  }
}

export async function syncProFromStore(): Promise<boolean> {
  const info = await getCustomerInfo();
  if (!info) return false;
  const active = isProEntitled(info);
  await saveProStatus(active);
  return active;
}

function findPackage(
  packages: PurchasesPackage[] | undefined,
  type: 'monthly' | 'annual'
): PurchasesPackage | undefined {
  if (!packages?.length) return undefined;

  const byIdentifier = packages.find(
    (p) =>
      p.identifier === (type === 'monthly' ? RC_PACKAGE_MONTHLY : RC_PACKAGE_YEARLY) ||
      p.packageType === (type === 'monthly' ? 'MONTHLY' : 'ANNUAL')
  );
  if (byIdentifier) return byIdentifier;

  const productId = type === 'monthly' ? RC_PRODUCT_MONTHLY : RC_PRODUCT_YEARLY;
  return packages.find((p) => p.product.identifier === productId);
}

async function devUnlockFallback(): Promise<boolean> {
  if (!__DEV__) return false;
  return new Promise((resolve) => {
    Alert.alert(
      `${PRO_ENTITLEMENT_DISPLAY_NAME} (dev)`,
      'RevenueCat needs a dev build (not Expo Go). Unlock Pro locally for testing?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Unlock',
          onPress: async () => {
            await saveProStatus(true);
            resolve(true);
          },
        },
      ]
    );
  });
}

function handlePurchaseError(e: unknown): never {
  const err = e as { userCancelled?: boolean; code?: string; message?: string };
  if (err?.userCancelled) {
    throw new PurchaseError('cancelled', 'Purchase cancelled');
  }
  if (err?.code === 'NETWORK_ERROR') {
    throw new PurchaseError('network', 'Network error — check your connection');
  }
  throw new PurchaseError('failed', err?.message ?? 'Purchase failed');
}

export async function purchaseMonthly(): Promise<boolean> {
  const mod = getPurchasesModule();
  if (!mod || !purchasesConfigured()) return devUnlockFallback();

  try {
    const offerings = await mod.default.getOfferings();
    const pkg = findPackage(offerings.current?.availablePackages, 'monthly');
    if (!pkg) {
      throw new PurchaseError('unavailable', 'Monthly subscription not available');
    }
    const { customerInfo } = await mod.default.purchasePackage(pkg);
    const active = isProEntitled(customerInfo);
    if (active) await saveProStatus(true);
    return active;
  } catch (e) {
    if (e instanceof PurchaseError) throw e;
    handlePurchaseError(e);
  }
}

export async function purchaseYearly(): Promise<boolean> {
  const mod = getPurchasesModule();
  if (!mod || !purchasesConfigured()) return devUnlockFallback();

  try {
    const offerings = await mod.default.getOfferings();
    const pkg = findPackage(offerings.current?.availablePackages, 'annual');
    if (!pkg) {
      throw new PurchaseError('unavailable', 'Yearly subscription not available');
    }
    const { customerInfo } = await mod.default.purchasePackage(pkg);
    const active = isProEntitled(customerInfo);
    if (active) await saveProStatus(true);
    return active;
  } catch (e) {
    if (e instanceof PurchaseError) throw e;
    handlePurchaseError(e);
  }
}

/** Default purchase path — monthly from current offering. */
export async function purchaseProSubscription(): Promise<boolean> {
  try {
    return await purchaseMonthly();
  } catch (e) {
    if (e instanceof PurchaseError) {
      if (e.code === 'cancelled') return false;
      if (__DEV__) return devUnlockFallback();
      Alert.alert('Purchase failed', e.message);
      return false;
    }
    if (__DEV__) return devUnlockFallback();
    Alert.alert('Purchase failed', 'Could not complete purchase.');
    return false;
  }
}

export async function restoreProSubscription(): Promise<boolean> {
  const mod = getPurchasesModule();
  if (!mod || !purchasesConfigured()) {
    if (__DEV__) return devUnlockFallback();
    Alert.alert('Restore', 'Purchases are not configured on this build.');
    return false;
  }

  try {
    const customerInfo = await mod.default.restorePurchases();
    const active = isProEntitled(customerInfo);
    if (active) {
      await saveProStatus(true);
      return true;
    }
    Alert.alert('Restore', `No active ${PRO_ENTITLEMENT_DISPLAY_NAME} subscription found.`);
    return false;
  } catch (e) {
    console.warn('[RevenueCat] restore failed', e);
    Alert.alert('Restore failed', 'Could not restore purchases. Try again later.');
    return false;
  }
}

export async function presentProPaywall(): Promise<boolean> {
  const ui = getPaywallModule();
  if (!ui || !purchasesConfigured()) return devUnlockFallback();

  try {
    const result = await ui.default.presentPaywall({ displayCloseButton: true });

    switch (result) {
      case ui.PAYWALL_RESULT.PURCHASED:
      case ui.PAYWALL_RESULT.RESTORED:
        return syncProFromStore();
      default:
        return false;
    }
  } catch (e) {
    console.warn('[RevenueCat] paywall failed', e);
    if (__DEV__) return devUnlockFallback();
    return false;
  }
}

export async function presentProPaywallIfNeeded(): Promise<boolean> {
  const ui = getPaywallModule();
  if (!ui || !purchasesConfigured()) return false;

  try {
    const result = await ui.default.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
      displayCloseButton: true,
    });

    switch (result) {
      case ui.PAYWALL_RESULT.PURCHASED:
      case ui.PAYWALL_RESULT.RESTORED:
        return syncProFromStore();
      default: {
        const info = await getCustomerInfo();
        return info ? isProEntitled(info) : false;
      }
    }
  } catch (e) {
    console.warn('[RevenueCat] paywallIfNeeded failed', e);
    return false;
  }
}

export async function presentCustomerCenter(): Promise<void> {
  const ui = getPaywallModule();
  if (!ui || !purchasesConfigured()) {
    Alert.alert(
      'Customer Center',
      'Subscription management requires a dev/production build with RevenueCat.'
    );
    return;
  }

  try {
    await ui.default.presentCustomerCenter();
    await syncProFromStore();
  } catch (e) {
    console.warn('[RevenueCat] customer center failed', e);
    Alert.alert('Unavailable', 'Could not open subscription management.');
  }
}

export async function loginRevenueCatUser(appUserId: string): Promise<void> {
  const mod = getPurchasesModule();
  if (!mod || !purchasesConfigured()) return;
  try {
    await mod.default.logIn(appUserId);
  } catch (e) {
    console.warn('[RevenueCat] logIn failed', e);
  }
}

export {
  PRO_ENTITLEMENT_ID,
  PRO_ENTITLEMENT_DISPLAY_NAME,
  RC_PRODUCT_MONTHLY,
  RC_PRODUCT_YEARLY,
};
