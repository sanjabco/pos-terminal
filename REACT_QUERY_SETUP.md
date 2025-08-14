# React Query Setup for SanjabPOS

This document explains how React Query (TanStack Query) has been integrated into your React Native project for efficient backend communication.

## What's Been Added

### 1. Dependencies
- `@tanstack/react-query`: Core React Query library
- `axios`: HTTP client for API requests
- `@react-native-async-storage/async-storage`: Secure token storage

### 2. File Structure
```
application/
├── services/
│   └── api.ts              # Axios configuration and API endpoints
├── hooks/
│   ├── useApi.ts           # React Query hooks for all API operations
│   └── useAuth.ts          # Authentication state management
├── utils/
│   └── tokenManager.ts     # Token storage and management utilities
└── providers/
    └── QueryProvider.tsx   # QueryClient provider wrapper
```

## Configuration

### API Configuration (`application/services/api.ts`)
- Base URL configuration for your backend
- Request/response interceptors for authentication
- TypeScript interfaces for all API responses
- Centralized API endpoints
- Automatic token injection in requests

### QueryClient Configuration (`application/providers/QueryProvider.tsx`)
- Global query settings (stale time, cache time, retry logic)
- Optimized for mobile (disabled window focus refetch)
- Error handling configuration

### Token Management (`application/utils/tokenManager.ts`)
- Secure token storage using AsyncStorage
- User data management
- Authentication state utilities
- Token retrieval and clearing functions

### Services Structure (Branches and Lines)
- Services are organized as branches containing lines
- `useServices()` - Returns all lines from all branches as services
- `useBranches()` - Returns all branches with their lines
- `useBranch(id)` - Returns specific branch by ID

## Available Hooks

### Authentication (OTP-based)
```typescript
import { useSendOtp, useVerifyOtp, useLogout } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

// Send OTP mutation
const sendOtpMutation = useSendOtp();
sendOtpMutation.mutate({ phoneNumber: '09123456789' });

// Verify OTP and login mutation
const verifyOtpMutation = useVerifyOtp();
verifyOtpMutation.mutate({ phoneNumber: '09123456789', code: '123456' });

// Logout mutation
const logoutMutation = useLogout();
logoutMutation.mutate();

// Authentication state management
const { isAuthenticated, isLoading, userData, login, logout } = useAuth();
```

### Data Fetching
```typescript
import { usePayments, useServices, useBranches, useReports, useUserProfile } from '../hooks/useApi';

// Fetch all payments
const { data: payments, isLoading, error } = usePayments();

// Fetch all services (lines from all branches)
const { data: services, isLoading, error } = useServices();

// Fetch all branches with their lines
const { data: branches, isLoading, error } = useBranches();

// Fetch specific branch
const { data: branch, isLoading, error } = useBranch(92);

// Fetch all reports
const { data: reports, isLoading, error } = useReports();

// Fetch user profile/business data
const { data: userProfile, isLoading, error } = useUserProfile();
```

### Individual Item Fetching
```typescript
import { usePayment, useService } from '../hooks/useApi';

// Fetch specific payment
const { data: payment, isLoading } = usePayment('payment-id');

// Fetch specific service
const { data: service, isLoading } = useService('service-id');
```

### Mutations
```typescript
import { useCreatePayment, useMobileRecharge, useUpdateUserProfile } from '../hooks/useApi';

// Create payment
const createPaymentMutation = useCreatePayment();
createPaymentMutation.mutate({
  amount: 1000,
  status: 'pending'
});

// Mobile recharge
const rechargeMutation = useMobileRecharge();
rechargeMutation.mutate({
  operatorId: 'op-1',
  phoneNumber: '09123456789',
  amount: 50000
});

// Update user profile/business data
const updateProfileMutation = useUpdateUserProfile();
updateProfileMutation.mutate({
  title: 'New Business Name',
  description: 'Updated description',
  isVisible: true
});
```

## Usage Examples

### Example 1: OTP Login Screen
```typescript
import { useSendOtp, useVerifyOtp } from '../hooks/useApi';

function LoginScreen() {
  const [step, setStep] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  
  const handleSendOtp = () => {
    sendOtpMutation.mutate({ phoneNumber: mobile }, {
      onSuccess: (data) => {
        if (data.Code === 200 && data.Message === 'SUCCESS') {
          setStep('otp');
        } else {
          Alert.alert('Error', data.Message || 'Failed to send OTP');
        }
      },
      onError: (error) => Alert.alert('Error', 'Failed to send OTP')
    });
  };
  
  const handleVerifyOtp = () => {
    verifyOtpMutation.mutate({ phoneNumber: mobile, code: otp }, {
      onSuccess: (data) => {
        if (data.Code === 200 && data.Message === 'SUCCESS') {
          // Store token if needed
          // await AsyncStorage.setItem('authToken', data.Data.token);
          navigation.navigate('Service');
        } else {
          Alert.alert('Error', data.Message);
        }
      },
      onError: (error) => Alert.alert('Error', 'Invalid OTP')
    });
  };
  
  return (
    <View>
      {step === 'mobile' ? (
        <TouchableOpacity 
          onPress={handleSendOtp}
          disabled={sendOtpMutation.isPending}
        >
          <Text>
            {sendOtpMutation.isPending ? 'Sending...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          onPress={handleVerifyOtp}
          disabled={verifyOtpMutation.isPending}
        >
          <Text>
            {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### Example 2: Services Screen (Branches and Lines)
```typescript
import { useServices, useBranches } from '../hooks/useApi';

function ServicesScreen() {
  const { data: services, isLoading, error, refetch } = useServices();
  const { data: branches } = useBranches();
  
  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }
  
  if (error) {
    return (
      <View>
        <Text>Error loading services</Text>
        <TouchableOpacity onPress={refetch}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View>
      {/* Show all services (lines) */}
      <Text style={styles.sectionTitle}>All Services</Text>
      <FlatList
        data={services?.Data?.services || []}
        renderItem={({ item }) => (
          <Text>{item.title}</Text>
        )}
        refreshing={isLoading}
        onRefresh={refetch}
      />
      
      {/* Show branches with their lines */}
      <Text style={styles.sectionTitle}>Branches</Text>
      {branches?.Data?.branches?.map(branch => (
        <View key={branch.id}>
          <Text style={styles.branchTitle}>{branch.title}</Text>
          {branch.lines.map(line => (
            <Text key={line.id} style={styles.lineTitle}>
              - {line.title}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
```

### Example 3: Payment Creation
```typescript
import { useCreatePayment } from '../hooks/useApi';

function PaymentScreen() {
  const createPaymentMutation = useCreatePayment();
  
  const handlePayment = (paymentData) => {
    createPaymentMutation.mutate(paymentData, {
      onSuccess: (data) => {
        // Payment created successfully
        navigation.navigate('Success');
      },
      onError: (error) => {
        // Handle payment error
        Alert.alert('Payment failed', error.message);
      }
    });
  };
  
  return (
    <TouchableOpacity 
      onPress={() => handlePayment({ amount: 1000 })}
      disabled={createPaymentMutation.isPending}
    >
      <Text>
        {createPaymentMutation.isPending ? 'Processing...' : 'Pay'}
      </Text>
    </TouchableOpacity>
  );
}
```

## Key Features

### 1. Automatic Caching
- Queries are automatically cached
- Stale data is refetched in background
- Cache invalidation on mutations

### 2. Loading States
- `isLoading`: True during initial fetch
- `isFetching`: True during any fetch (including background)
- `isPending`: True during mutations

### 3. Error Handling
- Automatic retry on network errors
- Custom error handling per query/mutation
- Global error interceptors

### 4. Optimistic Updates
- Can implement optimistic updates for better UX
- Automatic rollback on error

### 5. Background Refetching
- Data stays fresh automatically
- Configurable stale time and cache time

## Configuration Options

### Update Base URL
Edit `application/services/api.ts`:
```typescript
export const apiClient = axios.create({
  baseURL: 'https://your-actual-backend.com/api', // Update this
  timeout: 10000,
  // ...
});
```

### Add Authentication
Uncomment and configure in `application/services/api.ts`:
```typescript
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  // ...
);
```

### Custom Query Options
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['custom-data'],
  queryFn: fetchCustomData,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
  retry: 3,
  refetchOnWindowFocus: false,
});
```

## Best Practices

1. **Use Query Keys**: Always use consistent query keys for proper caching
2. **Handle Loading States**: Show loading indicators during data fetching
3. **Error Boundaries**: Implement error boundaries for better error handling
4. **Optimistic Updates**: Use optimistic updates for better UX
5. **Cache Management**: Invalidate relevant queries after mutations
6. **TypeScript**: Use TypeScript interfaces for better type safety

## Troubleshooting

### Common Issues

1. **Network Errors**: Check your base URL configuration
2. **Authentication Errors**: Ensure token is properly stored and sent
3. **Cache Issues**: Use `queryClient.invalidateQueries()` to clear cache
4. **TypeScript Errors**: Ensure all interfaces are properly defined

### Debug Mode
React Query provides excellent debugging capabilities. In development, you can:
- Check React Query DevTools (if installed)
- Use `console.log` to debug query states
- Monitor network requests in browser dev tools

## Next Steps

1. Update the base URL in `api.ts` to point to your actual backend
2. Implement authentication token storage (AsyncStorage or secure storage)
3. Add more specific API endpoints as needed
4. Implement error boundaries for better error handling
5. Add loading and error states to all screens
6. Consider adding React Query DevTools for development debugging 