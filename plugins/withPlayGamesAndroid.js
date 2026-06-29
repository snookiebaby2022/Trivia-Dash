const {
  withAppBuildGradle,
  withAndroidManifest,
  AndroidConfig,
} = require('expo/config-plugins');

const PLAY_GAMES_SDK = 'com.google.android.gms:play-services-games-v2:21.0.0';

/**
 * Ensures Play Games Services v2 SDK is in the release APK (Play Console checks for this).
 * APP_ID meta-data is required for sign-in / leaderboards.
 */
function withPlayGamesAndroid(config) {
  config = withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('play-services-games-v2')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n        implementation "${PLAY_GAMES_SDK}"`
      );
    }
    return mod;
  });

  const appId = (process.env.EXPO_PUBLIC_PLAY_GAMES_APP_ID ?? '').trim();
  if (!appId) {
    return config;
  }

  return withAndroidManifest(config, (mod) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'com.google.android.gms.games.APP_ID',
      appId
    );
    return mod;
  });
}

module.exports = withPlayGamesAndroid;
