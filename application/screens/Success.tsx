/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { PosTopBar } from '../components/PosTopBar';
import { FooterBar, FooterButton } from '../components/FooterBar';
import SuccessIcon from '../components/SuccessIcon';
import { useServiceContext } from '../providers/ServiceProvider';
import { useCreateTransaction } from '../hooks/useApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSnackbarContext } from '../providers/SnackbarProvider';
import { CURRENCY_LABEL, formatNumberWithSeparator } from '../utils/currency';
import { colors, fonts } from '../theme/colors';

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(true);
  const [transactionFailed, setTransactionFailed] = useState<boolean>(false);

  // Extract values from response data or fallback to route params
  const resultData = responseData?.result?.[0] || {};
  const totalAmount = transactionData?.totalAmount || 0;
  const finalAmountToPay = transactionData?.finalAmountToPay || 0;
  const creditUsed = transactionData?.creditUsed || 0;
  const discountAmount =
    resultData?.discountAmount ||
    transactionData?.discountAmount ||
    (responseData?.result || []).reduce(
      (sum: number, item: any) => sum + (Number(item?.discountAmount) || 0),
      0,
    ) ||
    0;
  const payBackAmount = resultData?.payBackAmount || 0;

  const goHome = async () => {
    try {
      await AsyncStorage.multiRemove(['customerData', 'phoneNumber']);
    } catch (error) {
      console.error('Error clearing customer data:', error);
    }
    clearServices();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Service' }],
    });
  };

  // Clear services and customer data when component mounts (after successful transaction)
  useEffect(() => {
    const sendTransaction = async () => {
      setIsSubmitting(true);
      try {
        if (transactionData?.paymentMethod === 'cash') {
          transactionData.transactionResult.cashBackDto.forEach(async (item: any) => {
            item.PaymentMethod = 'نقد';
          });
        } else {
          transactionData.transactionResult.cashBackDto.forEach(async (item: any) => {
            item.PaymentMethod = 'کارتی';
          });
        }
        const response = await createTransactionMutation.mutateAsync(transactionData?.transactionResult);
        console.log('response', response.Data);
        setResponseData(response.Data);
      } catch (error) {
        console.error('Transaction error:', error);
        setTransactionFailed(true);
        showError('خطا در ثبت تراکنش. لطفاً با پشتیبانی تماس بگیرید.');
      } finally {
        setIsSubmitting(false);
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
      goHome();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation, clearServices]);
  return (
    <View style={styles.container}>
      <PosTopBar title="نتیجه تراکنش" onBack={goHome} />
      {isSubmitting ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={styles.loadingText}>در حال ثبت تراکنش...</Text>
        </View>
      ) : transactionFailed ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.danger }]}>ثبت تراکنش ناموفق بود</Text>
          <Text style={styles.loadingText}>در صورت کسر مبلغ از کارت، با پشتیبانی تماس بگیرید.</Text>
        </View>
      ) : (
        <View style={styles.contentArea}>
          <View style={styles.contentCard}>
            <View style={styles.whiteBox}>
              <View style={styles.iconContainer}>
                <View style={styles.moneyIcon}>
                  <SuccessIcon height={90} />
                </View>
              </View>

              <Text style={styles.successMessage}>پرداخت موفق</Text>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>کش بک جدید</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencyText}>{CURRENCY_LABEL}</Text>
                  <Text style={styles.amountText}>{formatNumberWithSeparator(payBackAmount)}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>مبلغ کل</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencyText}>{CURRENCY_LABEL}</Text>
                  <Text style={styles.amountText}>{formatNumberWithSeparator(totalAmount)}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>مبلغ قابل پرداخت</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencyText}>{CURRENCY_LABEL}</Text>
                  <Text style={styles.amountText}>{formatNumberWithSeparator(finalAmountToPay)}</Text>
                </View>
              </View>

              {discountAmount > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>تخفیف اعمال‌شده</Text>
                  <View style={styles.amountContainer}>
                    <Text style={styles.currencyText}>{CURRENCY_LABEL}</Text>
                    <Text style={styles.amountText}>{formatNumberWithSeparator(discountAmount)}</Text>
                  </View>
                </View>
              )}

              {creditUsed > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>اعتبار استفاده شده</Text>
                  <View style={styles.amountContainer}>
                    <Text style={styles.currencyText}>{CURRENCY_LABEL}</Text>
                    <Text style={styles.amountText}>{formatNumberWithSeparator(creditUsed)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
      <FooterBar>
        <FooterButton label="ثبت خرید جدید" onPress={goHome} />
      </FooterBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentCard: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  whiteBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  moneyIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successMessage: {
    color: colors.live,
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 14,
  },
  infoLabel: {
    color: colors.inkSoft,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginBottom: 6,
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    color: colors.ink,
    fontSize: 24,
    fontFamily: fonts.bold,
    marginRight: 8,
  },
  currencyText: {
    color: colors.inkSoft,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 13,
    color: colors.inkSoft,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
});

export default Success;
