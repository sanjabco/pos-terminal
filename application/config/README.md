# Environment Configuration

Runtime configuration is read through `react-native-config` from the installed
native app. Payment routing uses `POS_TYPE` through `application/config/env.ts`.
`.env.sepehr` selects Sepehr (`POS_TYPE=sepehr`). `.env.irankish` selects
Irankish (`POS_TYPE=irankish`), which uses the existing default payment module.
The root `.env` remains the fallback for commands without a provider.

```typescript
import ENV from '../config/env';

if (ENV.isSepehrPOS()) {
  // Use the Sepehr payment module.
} else {
  // Use the default payment module.
}
```

Android loads `.env` during the Gradle build. iOS loads it through the
`react-native-config` CocoaPod; run `cd ios && pod install` after installing
JavaScript dependencies.

Select another file with `ENVFILE=.env.production npm run android` or
`ENVFILE=.env.production npm run ios`.

Changing environment values requires a new native build and installation.
OTA JavaScript updates do not replace the compiled environment values.
Existing installations need a native update before using this configuration.

## Provider builds

| Provider | Environment | Run Android | Build release APKs |
| --- | --- | --- | --- |
| Sepehr | `.env.sepehr` | `npm run android:sepehr` | `npm run build:sepehr` |
| Irankish | `.env.irankish` | `npm run android:irankish` | `npm run build:irankish` |

Release scripts clean the Android build before assembling so switching providers
regenerates the native configuration. APKs are written to
`android/app/build/outputs/apk/release/`. Copy the APKs before building the other
provider, because the next clean build replaces that directory.

The provider files contain only payment configuration. Any shared runtime values
must be present in both files; the selected file does not merge with `.env`.
