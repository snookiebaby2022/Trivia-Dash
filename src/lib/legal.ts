import { Linking } from 'react-native';

/** Public HTTPS pages — host files from /legal/ on any static host. */
export const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ??
  'https://triviadashlegal.netlify.app/privacy-policy';

export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://triviadashlegal.netlify.app/terms';

/** Required by Play if the app offers account sign-in (Google). */
export const ACCOUNT_DELETION_URL =
  process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL ??
  'https://triviadashlegal.netlify.app/delete-account';

export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@triviadash.app';

export async function openLegalUrl(url: string): Promise<void> {
  const can = await Linking.canOpenURL(url);
  if (!can) return;
  await Linking.openURL(url);
}
