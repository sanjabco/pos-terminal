import React from 'react';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '../config/fonts';

export function SplashScreen(): React.JSX.Element {
  const versionName = DeviceInfo.getVersion();
  const versionCode = DeviceInfo.getBuildNumber();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.versionText}>
        {versionName}-{versionCode}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 120,
  },
  versionText: {
    fontFamily: Fonts.regular,
    fontSize: Fonts.sizes.sm,
    color: '#888888',
    textAlign: 'center',
    paddingBottom: 24,
  },
});
