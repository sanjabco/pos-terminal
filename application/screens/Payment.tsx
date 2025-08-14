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
import { POS_TYPE } from '@env'; // Or from 'react-native-dotenv' if not using moduleName option

import { useSnackbarContext } from '../providers/SnackbarProvider';

const { width, height } = Dimensions.get('window');
const { PaymentModule, PaymentSepehrModule } = NativeModules;
const paymentEvents = new NativeEventEmitter(PaymentModule);
const paymentSepehrEvents = new NativeEventEmitter(PaymentSepehrModule);

function Payment({ navigation, route }: { navigation: any, route: any }): React.JSX.Element {
  const { totalAmount, finalAmountToPay, creditUsed, creditOption, transactionResult } = route.params;
  const { showError } = useSnackbarContext();
  console.log('transactionResult', transactionResult);
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

  useEffect(() => {
    setTimeout(() => {
      if (POS_TYPE == 'sepehr') {
        callSepehr('purchase', (finalAmountToPay * 10).toString(), "1")
      } else {
        call('purchaseWithId', (finalAmountToPay * 10).toString(), (Math.random() * 1000000).toString(), true, true)
      }
    }, 1000)
  }, []);

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
