/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import './ota';
import React from 'react';
import { OTAUpdateProvider } from '@appsonair.ir/react-native';
import { Fonts } from './application/config/fonts';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppBootstrap } from './application/components/AppBootstrap';
import { disableSystemRtl } from './application/utils/rtl';
import Service from './application/screens/Service';
import Payment from './application/screens/Payment';
import Report from './application/screens/Report';
import Success from './application/screens/Success';
import Credit from './application/screens/Credit';
import Mobile from './application/screens/Mobile';
import Price from './application/screens/Price';
import Checkout from './application/screens/Checkout';
import Login from './application/screens/Login';
import BranchSelection from './application/screens/BranchSelection';
import NativePaymentTest from './application/screens/NativePaymentTest';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from './application/providers/QueryProvider';
import { ServiceProvider } from './application/providers/ServiceProvider';
import { InternetProvider } from './application/providers/InternetProvider';
import { SnackbarProvider } from './application/providers/SnackbarProvider';
import { AuthProvider, useAuth } from './application/hooks/useAuth';
import { KeyboardProvider } from 'react-native-keyboard-controller';

disableSystemRtl();

// Create the stack navigator
const Stack = createStackNavigator();

function AppContent(): React.JSX.Element {
  const { isAuthenticated, selectedBranch } = useAuth();

  // Determine initial route based on authentication status
  let initialRouteName = 'Login';
  if (isAuthenticated) {
    if (selectedBranch) {
      initialRouteName = 'Service';
    } else {
      initialRouteName = 'BranchSelection';
    }
  }

  return (

    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: '#FF6B35',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: 'Login' }}
        />
        <Stack.Screen
          name="BranchSelection"
          component={BranchSelection}
          options={{ title: 'Branch Selection' }}
        />
        <Stack.Screen
          name="Service"
          component={Service}
          options={{ title: 'Service Selection' }}
        />
        <Stack.Screen
          name="Checkout"
          component={Checkout}
          options={{ title: 'Checkout' }}
        />
        <Stack.Screen
          name="Payment"
          component={Payment}
          options={{ title: 'Payment' }}
        />
        <Stack.Screen
          name="Report"
          component={Report}
          options={{ title: 'Reports' }}
        />
        <Stack.Screen
          name="Success"
          component={Success}
          options={{ title: 'Success' }}
        />
        <Stack.Screen
          name="Credit"
          component={Credit}
          options={{ title: 'Credit' }}
        />
        <Stack.Screen
          name="Mobile"
          component={Mobile}
          options={{ title: 'Mobile' }}
        />
        <Stack.Screen
          name="Price"
          component={Price}
          options={{ title: 'Price' }}
        />
        <Stack.Screen
          name="NativePaymentTest"
          component={NativePaymentTest}
          options={{ title: 'Native Payment Test' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppProviders({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <QueryProvider>
      <AuthProvider>
        <ServiceProvider>
          <InternetProvider>
            <SnackbarProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <AppBootstrap>{children}</AppBootstrap>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SnackbarProvider>
          </InternetProvider>
        </ServiceProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

function App(): React.JSX.Element {
  const app = (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );

  return (
    <OTAUpdateProvider
      autoSync
      skipInDev={false}
      fontFamily={Fonts.regular}
      messages={{
        title: 'به\u200cروزرسانی برنامه',
        checking: 'در حال بررسی به\u200cروزرسانی...',
        downloading: 'در حال دانلود به\u200cروزرسانی...',
        installing: 'در حال نصب به\u200cروزرسانی...',
        restarting: 'در حال راه\u200cاندازی مجدد...',
        error: 'خطا در به\u200cروزرسانی',
        updateAvailable: 'نسخه جدیدی در دسترس است',
        changelogTitle: 'تغییرات این نسخه',
        updateNow: 'به\u200cروزرسانی',
        skip: 'فعلاً نه',
        dismiss: 'باشه',
        appliedNextLaunch:
          'به\u200cروزرسانی نصب شد و در اجرای بعدی برنامه اعمال می\u200cشود',
        mandatoryHint: 'این به\u200cروزرسانی الزامی است',
        upToDate: 'برنامه به\u200cروز است',
      }}
    >
      {app}
    </OTAUpdateProvider>
  );
}

export default App;
