/**
 * Mobile Screen - Gift Purchase Interface
 * Exact replica of the Persian mobile app screen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import GiftIcon from '../components/GiftIcon';
import { useCustomer } from '../hooks/useApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

type RootStackParamList = {
  Mobile: undefined;
  Credit: { customerData?: any };
};

type MobileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Mobile'>;

interface MobileProps {
  navigation: MobileScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

function Mobile({ navigation }: MobileProps): React.JSX.Element {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [branchId, setBranchId] = useState(92); // Default branch ID as per your request
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);

  // Convert Persian numbers to English for API call
  const convertPersianToEnglish = (persianNumber: string): string => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let result = persianNumber;
    persianNumbers.forEach((persian, index) => {
      result = result.replace(new RegExp(persian, 'g'), englishNumbers[index]);
    });
    return result;
  };

  const englishPhoneNumber = convertPersianToEnglish(phoneNumber);

  // Use the customer API hook
  const { data: customerData, isLoading, error, refetch } = useCustomer(englishPhoneNumber, branchId);
  console.log('customerData', customerData);
  // Validate phone number and auto-fetch customer data
  useEffect(() => {
    const isValid = englishPhoneNumber.length === 11 && englishPhoneNumber.startsWith('09');
    setIsValidPhone(isValid);

    if (isValid) {
      refetch();
    }
  }, [englishPhoneNumber, refetch]);

  // Save customer data for later use
  const saveCustomerData = async () => {
    if (customerData?.Code === 200 && customerData?.Data) {
      console.log('wwww', customerData.Data);

      try {
        await AsyncStorage.setItem('customerData', JSON.stringify(customerData.Data));
        await AsyncStorage.setItem('phoneNumber', phoneNumber);
        await AsyncStorage.setItem('branchId', branchId.toString());
        setIsDataSaved(true);
        //Alert.alert('موفقیت', 'اطلاعات مشتری با موفقیت ذخیره شد'v);
      } catch (error) {
        console.error('Error saving customer data:', error);
        //Alert.alert('خطا', 'خطا در ذخیره اطلاعات');
      }
    }
  };

  // Load saved data on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedPhone = await AsyncStorage.getItem('phoneNumber');
        const savedBranchId = await AsyncStorage.getItem('branchId');
        const savedCustomerData = await AsyncStorage.getItem('customerData');

        if (savedPhone) {
          setPhoneNumber(savedPhone);
        }
        if (savedBranchId) {
          setBranchId(parseInt(savedBranchId));
        }
        if (savedCustomerData) {
          setIsDataSaved(true);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
        <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Gift Icon and Text */}
            <View style={styles.giftSection}>
              <GiftIcon height={42} />
              <Text style={styles.giftTitle}>هدیه شما از این خرید</Text>
              <Text style={styles.giftSubtitle}>۲۰٪ بازگشت اعتبار</Text>
            </View>
          </View>
        </View>

        {/* Main Content Card */}
        <ScrollView
          style={styles.contentCard}
          contentContainerStyle={styles.contentCardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.instructionText}>برای دریافت هدیه شماره همراه را وارد کنید</Text>

          {/* Phone Input */}

          <View style={styles.phoneInputContainer}>
            <TextInput
              ref={phoneInputRef}
              style={[
                styles.phoneInput,
                !isValidPhone && phoneNumber.length > 0 && styles.phoneInputError
              ]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="numeric"
              textAlign="center"
              maxLength={11}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              placeholderTextColor="#999"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {!isValidPhone && phoneNumber.length > 0 && (
              <Text style={styles.errorMessage}>شماره تلفن باید ۱۱ رقم و با ۰۹ شروع شود</Text>
            )}
          </View>



          {/* Customer Information Display */}
          {isLoading && (
            <View style={styles.customerInfoContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>در حال دریافت اطلاعات مشتری...</Text>
            </View>
          )}

          {/*   {error && (
            <View style={styles.customerInfoContainer}>
              <Text style={styles.errorText}>خطا در دریافت اطلاعات مشتری</Text>
            </View>
          )} */}

          {/*   {customerData?.Code === 200 && customerData?.Data && (
            <View style={styles.customerInfoContainer}>
              <Text style={styles.customerInfoTitle}>اطلاعات مشتری:</Text>
              <Text style={styles.customerInfoText}>نام: {customerData.Data.name}</Text>
              <Text style={styles.customerInfoText}>شماره تلفن: {customerData.Data.userPhoneNumber}</Text>
              <Text style={styles.customerInfoText}>اعتبار: {customerData.Data.credit} تومان</Text>
              {customerData.Data.subscriptionCode && (
                <Text style={styles.customerInfoText}>کد اشتراک: {customerData.Data.subscriptionCode}</Text>
              )}
            </View>
          )} */}
        </ScrollView>
      </KeyboardAwareScrollView>
      {/* Continue Button */}

      <TouchableOpacity
        onPress={() => {
          if (customerData?.Code === 200 && customerData?.Data) {
            // User found - save and navigate with existing data
            saveCustomerData();
            // @ts-ignore - Navigation type issue
            navigation.navigate('Credit', { customerData: customerData.Data });
          } else {
            // User not found - create default customer data with credit 0
            const defaultCustomerData = {
              name: 'کاربر جدید',
              userPhoneNumber: englishPhoneNumber,
              credit: 0,
              subscriptionCode: null
            };

            // Save default customer data
            const saveDefaultData = async () => {
              try {
                await AsyncStorage.setItem('customerData', JSON.stringify(defaultCustomerData));
                await AsyncStorage.setItem('phoneNumber', phoneNumber);
                await AsyncStorage.setItem('branchId', branchId.toString());
                setIsDataSaved(true);
              } catch (error) {
                console.error('Error saving default customer data:', error);
              }
            };

            saveDefaultData();
            // @ts-ignore - Navigation type issue
            navigation.navigate('Credit', { customerData: defaultCustomerData });
          }
        }}
        style={[
          styles.continueButton,
          (!isValidPhone || isLoading) && styles.continueButtonDisabled
        ]}
        disabled={!isValidPhone || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.continueButtonText}>ادامه</Text>
        )}
      </TouchableOpacity>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  header: {
    height: 250,
    backgroundColor: '#FF6B35',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -30
  },
  giftSection: {
    alignItems: 'center',
    height: 150,
    width: '100%',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#F9BF58'
  },
  giftIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  giftIconText: {
    fontSize: 30,
    fontFamily: 'IRANSansWebFaNum',
  },
  giftTitle: {
    fontSize: 14,
    fontFamily: 'IRANSansWebFaNum-Bold',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  giftSubtitle: {
    fontSize: 22,
    fontFamily: 'IRANSansWebFaNum',
    color: '#000',
    textAlign: 'center',
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#EFF2F3',
    marginTop: -30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  contentCardContent: {
    paddingTop: 30,
    paddingHorizontal: 25,
    paddingBottom: 300, // Extra padding for keyboard
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  phoneInputContainer: {
    marginBottom: 40,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 18,
    backgroundColor: 'white',
    textAlign: 'center',
    fontFamily: 'IRANSansWebFaNum',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'center',
  },
  customerInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'IRANSansWebFaNum',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  customerInfoTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'IRANSansWebFaNum-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  customerInfoText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum',
    marginBottom: 4,
    textAlign: 'center',
  },
  phoneInputError: {
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
  errorMessage: {
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'IRANSansWebFaNum',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default Mobile;
