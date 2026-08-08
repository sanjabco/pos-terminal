/**
 * Bootstraps OTA in the React Native app.
 * Import this once at app startup (e.g. in App.tsx: `import './ota'`).
 */
import { OTAUpdater } from '@appsonair.ir/react-native';
import { getDeploymentKey, otaConfig } from './ota-updater.config';

OTAUpdater.configure({
  deploymentKey: getDeploymentKey(__DEV__),
  installMode: otaConfig.installMode,
});
