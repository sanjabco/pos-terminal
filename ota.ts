/**
 * Bootstraps OTA in the React Native app.
 * Import this once at app startup (e.g. in App.tsx: `import './ota'`).
 */
import { OTAUpdater } from 'ota-updater';
import { getDeploymentKey, otaConfig } from './ota-updater.config';

OTAUpdater.configure({
  serverUrl: otaConfig.serverUrl,
  deploymentKey: getDeploymentKey(__DEV__),
  installMode: otaConfig.installMode,
});
