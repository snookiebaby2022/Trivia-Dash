import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';

const PLAY_STORE_ID = 'com.lizzi.triviadash';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000';

/** Open native in-app review when available, else store listing. */
export async function requestAppRating(): Promise<void> {
  try {
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      await StoreReview.requestReview();
      return;
    }
  } catch (e) {
    console.warn('[rate] in-app review failed', e);
  }

  const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  const can = await Linking.canOpenURL(url);
  if (can) {
    await Linking.openURL(url);
  }
}
