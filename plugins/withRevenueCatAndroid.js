const { withAppBuildGradle, withProjectBuildGradle } = require('expo/config-plugins');

const RC_SDK = 'com.revenuecat.purchases:purchases:10.8.0';

/**
 * Pins RevenueCat Android SDK 10.8.0 per:
 * https://www.revenuecat.com/docs/getting-started/installation/android
 */
function withRevenueCatAndroid(config) {
  config = withAppBuildGradle(config, (mod) => {
    const dep = `implementation "${RC_SDK}"`;
    if (!mod.modResults.contents.includes(RC_SDK)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n        ${dep}`
      );
    }
    return mod;
  });

  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(RC_SDK)) {
      return mod;
    }

    mod.modResults.contents += `
allprojects {
    configurations.all {
        resolutionStrategy {
            force "${RC_SDK}"
        }
    }
}
`;
    return mod;
  });
}

module.exports = withRevenueCatAndroid;
