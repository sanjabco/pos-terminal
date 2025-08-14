# Internet Connectivity Setup

This document describes the internet connectivity checking feature that has been implemented in the SanjabPOS app.

## Features

- **Real-time internet connectivity monitoring**: The app continuously monitors internet connection status
- **No Internet Screen**: Shows a user-friendly screen when there's no internet connection
- **Retry functionality**: Users can manually retry the connection check
- **Automatic reconnection**: The app automatically detects when internet connection is restored

## Components

### 1. NoInternet Screen (`application/screens/NoInternet.tsx`)
- Displays when there's no internet connection
- Provides a "تلاش مجدد" (Try Again) button to manually check connection
- Matches the app's design theme with orange background
- Displays Persian text for better user experience

### 2. Internet Connection Hook (`application/hooks/useInternetConnection.ts`)
- Custom hook that manages internet connectivity state
- Uses `@react-native-community/netinfo` for network detection
- Provides connection status and retry functionality

### 3. Internet Provider (`application/providers/InternetProvider.tsx`)
- Context provider for global internet state management
- Makes internet connection status available throughout the app

### 4. Internet Guard (`application/components/InternetGuard.tsx`)
- Wrapper component that shows appropriate screens based on connection status
- Shows loading indicator while checking connection
- Shows NoInternet screen when disconnected
- Shows app content when connected

### 5. Network Utilities (`application/utils/networkUtils.ts`)
- Utility functions for network-related operations
- Functions to check connection type (WiFi, Cellular, etc.)

## Usage

### Basic Usage
The internet connectivity checking is automatically integrated into the app. The `InternetGuard` component wraps the main app content and handles all connection-related UI.

### Manual Connection Check
```typescript
import { useInternet } from './application/providers/InternetProvider';

const MyComponent = () => {
  const { isConnected, checkConnection } = useInternet();
  
  const handleRetry = () => {
    checkConnection();
  };
  
  return (
    // Your component JSX
  );
};
```

### Using Network Utilities
```typescript
import { 
  checkInternetConnection, 
  getConnectionType, 
  isWifiConnected 
} from './application/utils/networkUtils';

// Check if connected
const isConnected = await checkInternetConnection();

// Get connection type
const connectionType = await getConnectionType();

// Check if WiFi is connected
const isWifi = await isWifiConnected();
```

## Dependencies

- `@react-native-community/netinfo`: For network connectivity detection

## Permissions

### Android
The following permissions are already configured in `android/app/src/main/AndroidManifest.xml`:
- `android.permission.INTERNET`
- `android.permission.ACCESS_WIFI_STATE`

### iOS
Network security settings are configured in `ios/sanjabpos/Info.plist`:
- `NSAppTransportSecurity` with appropriate settings

## How It Works

1. **App Startup**: When the app starts, the `InternetProvider` initializes and begins monitoring network connectivity
2. **Connection Check**: The `useInternetConnection` hook performs an initial connection check and subscribes to network state changes
3. **UI Management**: The `InternetGuard` component shows:
   - Loading indicator while checking connection
   - NoInternet screen when disconnected
   - App content when connected
4. **Real-time Updates**: The app automatically responds to network state changes (connecting/disconnecting)

## Customization

### Styling the NoInternet Screen
You can customize the appearance of the NoInternet screen by modifying the styles in `application/screens/NoInternet.tsx`.

### Adding Connection Type Information
You can enhance the NoInternet screen to show connection type information using the utility functions in `application/utils/networkUtils.ts`.

### Custom Retry Logic
You can implement custom retry logic by modifying the `checkConnection` function in the `useInternetConnection` hook.

## Testing

To test the internet connectivity feature:

1. **Disconnect from WiFi/Cellular**: Turn off WiFi and cellular data
2. **App should show NoInternet screen**: The app should display the no internet screen
3. **Reconnect**: Turn WiFi or cellular back on
4. **App should resume**: The app should automatically return to normal operation
5. **Manual retry**: Test the "Try Again" button functionality

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the app has the necessary network permissions
2. **Not Detecting Connection Changes**: Make sure the NetInfo listener is properly set up
3. **iOS Network Security**: Check that `NSAppTransportSecurity` settings are correct

### Debug Information
The hook logs connection status changes to the console for debugging purposes. 