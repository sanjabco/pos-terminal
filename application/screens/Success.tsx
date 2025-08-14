/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  BackHandler,
} from 'react-native';
import ArrowRight from '../components/ArrowRight';
import SuccessIcon from '../components/SuccessIcon';
import { useServiceContext } from '../providers/ServiceProvider';
import { ScrollView } from 'react-native-gesture-handler';
import { useCreateTransaction } from '../hooks/useApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSnackbarContext } from '../providers/SnackbarProvider';

const { width, height } = Dimensions.get('window');

// Function to format number with thousands separator
const formatNumberWithSeparator = (num: number): string => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

function Success({ navigation, route }: { navigation: any; route: any }): React.JSX.Element {
  // Get service context to clear services after transaction
  const { clearServices } = useServiceContext();
  const createTransactionMutation = useCreateTransaction();
  const { showError } = useSnackbarContext();
  // Get transaction data from navigation params
  const transactionData = route?.params;
  console.log('transactionData', transactionData);

  // State to store response data
  const [responseData, setResponseData] = React.useState<any>(null);

  // Extract values from response data or fallback to route params
  const resultData = responseData?.result?.[0] || {};
  const totalAmount = transactionData?.totalAmount || 0;
  const finalAmountToPay = transactionData?.finalAmountToPay || 0;
  const creditUsed = transactionData?.creditUsed || 0;
  const payBackAmount = resultData?.payBackAmount || 0;
  const result = transactionData?.result || '';
  const eventResult = transactionData?.eventResult || '';

  // Clear services and customer data when component mounts (after successful transaction)
  useEffect(() => {
    const sendTransaction = async () => {
      try {
        const response = await createTransactionMutation.mutateAsync(transactionData?.transactionResult);
        console.log('response', response.Data);
        setResponseData(response.Data);
      } catch (error) {
        console.error('Transaction error:', error);
        showError('خطا در ارتباط با سرور');
      }
    }

    const clearCustomerData = async () => {
      try {
        // Clear customer-related data from AsyncStorage (keep branchId as it's for POS owner)
        await AsyncStorage.multiRemove(['customerData', 'phoneNumber']);
        console.log('Customer data cleared successfully');
      } catch (error) {
        console.error('Error clearing customer data:', error);
      }
    };

    sendTransaction();
    clearServices();
    clearCustomerData();
  }, []);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      // Clear customer data when back button is pressed (keep branchId as it's for POS owner)
      AsyncStorage.multiRemove(['customerData', 'phoneNumber'])
        .then(() => {
          console.log('Customer data cleared on back button press');
        })
        .catch((error) => {
          console.error('Error clearing customer data on back button:', error);
        });

      clearServices();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Service' }],
      });
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation, clearServices]);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B00" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>نتیجه تراکنش</Text>
          <TouchableOpacity onPress={async () => {
            try {
              // Clear customer data when navigating back (keep branchId as it's for POS owner)
              await AsyncStorage.multiRemove(['customerData', 'phoneNumber']);
              console.log('Customer data cleared on header back button');
            } catch (error) {
              console.error('Error clearing customer data on header back button:', error);
            }

            navigation.reset({
              index: 0,
              routes: [{ name: 'Service' }],
            });
          }} style={styles.backButton}>
            <ArrowRight height={34} />
          </TouchableOpacity>


        </View>
      </View>
      <ScrollView>
        {/* Main Content Card */}
        <View style={styles.contentCard}>
          {/* White Box Container */}

          <View style={styles.whiteBox}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.moneyIcon}>
                <SuccessIcon height={90} />
              </View>
            </View>

            {/* Success Message */}
            <Text style={styles.successMessage}>پرداخت موفق</Text>
            {/* 
            <Text>{result}</Text>
            <Text>{eventResult}</Text> */}


            {/* Cashback Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>کش بک جدید</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencyText}>تومان</Text>
                <Text style={styles.amountText}>{formatNumberWithSeparator(payBackAmount)}</Text>
              </View>
            </View>

            {/* Total Amount Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>مبلغ کل</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencyText}>تومان</Text>
                <Text style={styles.amountText}>{formatNumberWithSeparator(totalAmount)}</Text>
              </View>
            </View>

            {/* Final Amount Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>مبلغ قابل پرداخت</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencyText}>تومان</Text>
                <Text style={styles.amountText}>{formatNumberWithSeparator(finalAmountToPay)}</Text>
              </View>
            </View>

            {/* Credit Used Section */}
            {creditUsed > 0 && (
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>اعتبار استفاده شده</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencyText}>تومان</Text>
                  <Text style={styles.amountText}>{formatNumberWithSeparator(creditUsed)}</Text>
                </View>
              </View>
            )}

          </View>

        </View>
      </ScrollView>
      {/* Footer Buttons */}
      <View style={styles.footerButtons}>
        <TouchableOpacity
          onPress={async () => {
            try {
              // Clear customer data when starting new purchase (keep branchId as it's for POS owner)
              await AsyncStorage.multiRemove(['customerData', 'phoneNumber']);
              console.log('Customer data cleared for new purchase');
            } catch (error) {
              console.error('Error clearing customer data for new purchase:', error);
            }

            // Clear services and navigate to Service screen
            clearServices();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Service' }],
            });
          }}
          style={styles.leftButton}
        >
          <Text style={styles.buttonText}>ثبت خرید جدید</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => navigation.reset({
          index: 0,
          routes: [{ name: 'Report' }],
        })} style={styles.rightButton}>
          <Text style={styles.buttonText}>گزارش فروش</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B00',
  },
  header: {
    height: 80,
    backgroundColor: '#FF6B00',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',


  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'center',


  },
  backButton: {

    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#EFF2F3',
    marginTop: -10,
    marginHorizontal: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 40,
    paddingHorizontal: 25,
  },
  whiteBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  moneyIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moneyIconText: {
    fontSize: 60,
    fontFamily: 'IRANSansWebFaNum',
  },
  successCheckmark: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00B894',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
  successMessage: {
    color: '#00B894',
    fontSize: 22,
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#00B894',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoSection: {
    marginBottom: 15,
  },
  infoLabel: {
    color: '#000',
    fontSize: 20,
    fontFamily: 'IRANSansWebFaNum-Medium',
    marginBottom: 8,
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    color: '#000',
    fontSize: 28,
    fontFamily: 'IRANSansWebFaNum-Bold',
    marginRight: 8,
  },
  currencyText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'IRANSansWebFaNum',
  },
  footerButtons: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'transparent',
  },
  leftButton: {
    flex: 1,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 25,
  },
  rightButton: {
    flex: 1,
    backgroundColor: '#00B894',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomRightRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
});

export default Success;
