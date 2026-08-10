import { I18nManager } from 'react-native';

/**
 * Disable system RTL flipping.
 * The POS UI is already designed RTL (row-reverse, textAlign right).
 */
export function disableSystemRtl(): void {
  I18nManager.allowRTL(false);
  if (I18nManager.isRTL) {
    I18nManager.forceRTL(false);
  }
}
