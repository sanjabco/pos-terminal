/**
 * Single OTA config for this app.
 * Used by:
 * - `ota.ts` → configures the in-app SDK (update check/download on devices)
 * - `appsonair deploy` CLI → bundles & uploads releases to your server
 */
export const otaConfig = {
  entryFile: 'index.js',
  // immediate = restart after download; next-launch = apply on next app start
  // Mandatory releases always restart immediately.
  installMode: 'immediate' as const,
  deployments: {
    staging: '860d316facc2600f88630bf790db3d44',
    production: 'd0d98ec78dde3392ebee75a7c7bf5598',
  },
};

export function getDeploymentKey(isDev: boolean): string {
  return isDev ? otaConfig.deployments.staging : otaConfig.deployments.production;
}

// Default export for CLI (appsonair deploy reads this file)
export default otaConfig;
