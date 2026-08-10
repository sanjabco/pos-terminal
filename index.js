/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { disableSystemRtl } from './application/utils/rtl';
import App from './App';
import { name as appName } from './app.json';

disableSystemRtl();

AppRegistry.registerComponent(appName, () => App);
