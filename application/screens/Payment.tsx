/**
 * Payment Screen - Card Swipe Interface
 * Exact replica of the payment processing screen
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Dimensions,
  NativeEventEmitter,
  NativeModules,
  ScrollView,
  Alert,
} from 'react-native';
import PaymentIcon from '../components/PaymentIcon';
import { useSnackbarContext } from '../providers/SnackbarProvider';
import { useBusinessInfo } from '../hooks/useApi';
import { validateIranianIBAN, formatIBAN, cleanIBAN } from '../utils/ibanValidator';
import { POS_TYPE } from '@env';

const { width, height } = Dimensions.get('window');
const { PaymentModule, PaymentSepehrModule } = NativeModules;
const paymentEvents = new NativeEventEmitter(PaymentModule);
const paymentSepehrEvents = new NativeEventEmitter(PaymentSepehrModule);

function Payment({ navigation, route }: { navigation: any, route: any }): React.JSX.Element {
  const { totalAmount, finalAmountToPay, creditUsed, creditOption, transactionResult } = route.params;
  const { showError } = useSnackbarContext();
  //console.log('transactionResult', transactionResult);
  const [result, setResult] = useState('');
  const [eventResult, setEventResult] = useState('');
  const [sepehrResult, setSepehrResult] = useState('');
  const [sepehrEventResult, setSepehrEventResult] = useState('');

  const callSepehr = async (fn: string, ...args: any[]) => {
    try {
      const res = await PaymentSepehrModule[fn](...args);
      setSepehrResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setSepehrResult(e.message || JSON.stringify(e));
    }
  };

  const call = async (fn: string, ...args: any[]) => {
    try {
      const res = await PaymentModule[fn](...args);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || JSON.stringify(e));
    }
  };

  useEffect(() => {
    const sub = paymentSepehrEvents.addListener('SepehrPaymentResult', (res) => {
      setSepehrEventResult(JSON.stringify(res, null, 2));
      //Alert.alert('SepehrPaymentResult Event', JSON.stringify(res, null, 2));
      if (res.resultCode2 == '00') {
        navigation.reset({
          index: 0,
          routes: [{
            name: 'Success', params: {
              totalAmount: totalAmount,
              finalAmountToPay: finalAmountToPay,
              creditUsed: creditUsed,
              creditOption: creditOption,
              transactionResult: transactionResult,
              result: sepehrResult,
              eventResult: JSON.stringify(res, null, 2)
            }
          }],
        });

      } else {
        showError('پرداخت انجام نشد');
        navigation.goBack();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = paymentEvents.addListener('PaymentResult', (res) => {
      setEventResult(JSON.stringify(res, null, 2));
      //Alert.alert('PaymentResult Event', JSON.stringify(res, null, 2));
      if (res.resultCode === 0) {
        navigation.reset({
          index: 0,
          routes: [{
            name: 'Success', params: {
              totalAmount: totalAmount,
              finalAmountToPay: finalAmountToPay,
              creditUsed: creditUsed,
              creditOption: creditOption,
              transactionResult: transactionResult,
              result: result,
              eventResult: JSON.stringify(res, null, 2)
            }
          }],
        });
        /* navigation.navigate('Success', {
          totalAmount: totalAmount,
          finalAmountToPay: finalAmountToPay,
          creditUsed: creditUsed,
          creditOption: creditOption,
          transactionResult: transactionResult,
          result: result,
          eventResult: JSON.stringify(res, null, 2)
        }) */
      } else {
        showError('پرداخت انجام نشد');
        navigation.goBack();
      }
    });
    return () => sub.remove();
  }, []);
  const businessInfo = useBusinessInfo();
  const calcTashimPercent = () => {
    if (finalAmountToPay > 3000000) {
      return 1;
    }
    else {
      return 3;
    }
    /* const myShare = finalAmountToPay * 3 / 100;
    if (myShare > 30000) {
      let r = 30000 * 100 / finalAmountToPay;
      if (r < 1) {
        return 1;
      }
      return Math.ceil(r);
    }
    else {
      return 3
    } */
  }
  const calculatedTashimPercent = calcTashimPercent()
  const [tashimPercent1, setTashimPercent1] = useState(creditOption == 'saveForLater' ? 0 : (calculatedTashimPercent));
  const [tashimPercent2, setTashimPercent2] = useState(creditOption == 'saveForLater' ? 100 : 100 - (calculatedTashimPercent));
  const [iban1, setIban1] = useState('IR430600500901007959216001');
  const [iban2, setIban2] = useState(businessInfo?.data?.Data?.email);
  const [iban2Error, setIban2Error] = useState('');
  const [isIban2Valid, setIsIban2Valid] = useState(false);

  // Function to validate IBAN2 using Iranian IBAN validation
  // Validates format, length, and mod-97 checksum according to ISO 13616 standard
  const validateIban2 = (iban: string) => {
    setIban2(iban);
    if (!iban.trim()) {
      setIban2Error('');
      setIsIban2Valid(false);
      return;
    }

    const validation = validateIranianIBAN(iban);
    if (validation.isValid) {
      setIban2Error('');
      setIsIban2Valid(true);
      // Format the IBAN for display
      const r = cleanIBAN(iban);
      setIban2(r);
    } else {
      setIban2Error(validation.error || 'شماره شبا نامعتبر است');
      setIsIban2Valid(false);
    }
  };

  // Initialize IBAN2 from business info when available
  useEffect(() => {
    if (businessInfo?.data?.Data?.email) {
      // If business email is available and looks like an IBAN, use it
      const email = businessInfo.data.Data.email;
      validateIban2(email);
    }
  }, [businessInfo]);

  // Check IBAN2 validity and navigate back if invalid
  // When business IBAN is invalid, show error toast and return to previous screen
  // Only validate if IBAN2 is actually being used (tashimPercent2 > 0)
  useEffect(() => {
    if (tashimPercent2 > 0 && iban2 && !isIban2Valid) {
      // Show error toast and navigate back
      showError('شماره شبا بیزینس اشتباه است لطفا با پشتیبانی تماس بگیرید');
      setTimeout(() => {
        navigation.goBack();
      }, 200); // Wait 2 seconds to show the toast before navigating back
    }
  }, [iban2, isIban2Valid, tashimPercent2]);

  useEffect(() => {
    console.log('tashimPercent1', tashimPercent1);
    console.log('tashimPercent2', tashimPercent2);
    console.log('iban1', iban1);
    console.log('iban2', iban2);
    console.log('iban2Error', iban2Error);
    console.log('isIban2Valid', isIban2Valid);
    setTimeout(() => {
      // Only require IBAN2 validation if it's actually being used (tashimPercent2 > 0)
      if (tashimPercent2 > 0 && (iban2 && isIban2Valid)) {
        handlePayment();
      }
    }, 1000)
  }, [iban2, isIban2Valid, tashimPercent2]);

  // Function to handle payment with IBAN validation
  const handlePayment = () => {
    // Validate IBAN2 before proceeding (only if it's being used)
    if (tashimPercent2 > 0 && iban2 && !isIban2Valid) {
      showError('لطفاً شماره شبا معتبر وارد کنید');
      return;
    }

    if (POS_TYPE === 'sepehr') {
      callSepehr('purchase', (finalAmountToPay * 10).toString(), "1");
    } else {
      console.log('POS_TYPE', POS_TYPE);
      // Use clean IBAN for payment processing
      // Pass empty string for IBAN1 if percent1 is 0 or less
      // Pass empty string for IBAN2 if percent2 is 0 or less
      const iban1ToUse = tashimPercent1 > 0 ? iban1 : "";
      const iban2ToUse = tashimPercent2 > 0 ? iban2 : "";

      call('buttonTashim', (finalAmountToPay * 10).toString(), (Math.random() * 1000000).toString(), parseInt(tashimPercent1.toString()), parseInt(tashimPercent2.toString()), iban1ToUse, iban2ToUse, true, true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>در حال انتقال</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View
        style={styles.contentArea}
      >
        {/* POS Machine and Credit Card Icon */}


        <PaymentIcon width={180} height={180} />



        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>در حال انتقال</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  header: {
    height: 60,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    paddingRight: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'center',
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF2F3',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,

  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  posMachine: {
    width: 80,
    height: 120,
    backgroundColor: '#264653',
    borderRadius: 8,
    marginRight: 20,
    padding: 8,
  },
  posScreen: {
    width: '100%',
    height: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    color: '#264653',
    fontSize: 20,
    fontWeight: 'bold',
  },
  posButtons: {
    flex: 1,
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  posButton: {
    width: 16,
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  redButton: {
    backgroundColor: '#EF4444',
  },
  creditCard: {
    width: 60,
    height: 100,
    backgroundColor: '#2A9D8F',
    borderRadius: 8,
    padding: 8,
  },
  cardChip: {
    width: 20,
    height: 15,
    backgroundColor: '#E9C46A',
    borderRadius: 2,
    marginBottom: 15,
  },
  cardDots: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  mainText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: 'IRANSansWebFaNum-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default Payment;
