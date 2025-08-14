/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Import existing screen components
import Service from './application/screens/Service';
import Payment from './application/screens/Payment';
import Report from './application/screens/Report';
import Success from './application/screens/Success';
import Credit from './application/screens/Credit';
import Mobile from './application/screens/Mobile';
import Price from './application/screens/Price';
import Login from './application/screens/Login';
import BranchSelection from './application/screens/BranchSelection';
import NativePaymentTest from './application/screens/NativePaymentTest';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import React Query provider and auth hook
import { QueryProvider } from './application/providers/QueryProvider';
import { ServiceProvider } from './application/providers/ServiceProvider';
import { InternetProvider } from './application/providers/InternetProvider';
import { SnackbarProvider } from './application/providers/SnackbarProvider';
import InternetGuard from './application/components/InternetGuard';
import { useAuth } from './application/hooks/useAuth';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Create the stack navigator
const Stack = createStackNavigator();

function AppContent(): React.JSX.Element {
  const { isAuthenticated, isLoading, selectedBranch } = useAuth();

  // Show loading screen while checking authentication status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

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

function App(): React.JSX.Element {
  return (
    <QueryProvider>
      <ServiceProvider>
        <InternetProvider>
          <SnackbarProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <InternetGuard>
                  <AppContent />
                </InternetGuard>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SnackbarProvider>
        </InternetProvider>
      </ServiceProvider>
    </QueryProvider>

  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
  },
});

export default App;
