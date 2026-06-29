/** @type {import('expo/config').ExpoConfig} */
const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

/** Load .env so prebuild / local-release pick up EXPO_PUBLIC_* without manual export. */
function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

loadDotEnv();

const playGamesAppId = (process.env.EXPO_PUBLIC_PLAY_GAMES_APP_ID ?? '').trim();
const admobAndroidAppId =
  (process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? '').trim() ||
  'ca-app-pub-3940256099942544~3347511713';
const admobIosAppId =
  (process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? '').trim() ||
  'ca-app-pub-3940256099942544~1458002511';

const plugins = appJson.expo.plugins.map((plugin) => {
  if (Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads') {
    return [
      'react-native-google-mobile-ads',
      { androidAppId: admobAndroidAppId, iosAppId: admobIosAppId },
    ];
  }
  return plugin;
});

plugins.push('./plugins/withPlayGamesAndroid');

if (playGamesAppId) {
  plugins.push([
    'expo-stores-games-services',
    { android: { projectId: playGamesAppId } },
  ]);
}

module.exports = {
  expo: {
    ...appJson.expo,
    plugins,
  },
};
