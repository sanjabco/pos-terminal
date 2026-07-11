/**
 * Single OTA config for this app.
 * Used by:
 * - `ota.ts` → configures the in-app SDK (update check/download on devices)
 * - `ota-updater deploy` CLI → bundles & uploads releases to your server
 */
export const otaConfig = {
  serverUrl: 'https://ota.qazvinnews.ir',
  entryFile: 'index.js',
  // Optional: override auto-detected native version (Android versionName / iOS MARKETING_VERSION).
  // When omitted, `ota-updater deploy` reads from android/app/build.gradle or ios/*.xcodeproj.
  installMode: 'immediate' as const,
  deployments: {
    staging: '860d316facc2600f88630bf790db3d44',
    production: 'd0d98ec78dde3392ebee75a7c7bf5598',
  },
};

export function getDeploymentKey(isDev: boolean): string {
  return isDev ? otaConfig.deployments.staging : otaConfig.deployments.production;
}

// Default export for CLI (ota-updater deploy reads this file)
export default otaConfig;
