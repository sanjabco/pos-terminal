/**
 * Credit Screen - React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import ArrowRight from '../components/ArrowRight';
import MoneyIcon from '../components/MoneyIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useServiceContext } from '../providers/ServiceProvider';
import { useCreateTransaction, useLinesDropdown } from '../hooks/useApi';
import { useSnackbarContext } from '../providers/SnackbarProvider';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

interface CreditOption {
  id: string;
  title: string;
  selected: boolean;
}

function Credit({ navigation }: { navigation: any }): React.JSX.Element {
  const { showError } = useSnackbarContext();
  const [selectedOption, setSelectedOption] = useState<string>('useCredit');
  const [credit, setCredit] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [finalAmountToPay, setFinalAmountToPay] = useState<number>(0);
  const [customerData, setCustomerData] = useState<any>(null);
  const { selectedBranch } = useAuth();

  const [showMaxUsageModal, setShowMaxUsageModal] = useState<boolean>(false);

  // Get service context to access selected services and amounts
  const { selectedServices, getTotalAmount, getServicesWithPrices } = useServiceContext();

  // Fetch lines data to get maxPayAmountByCashBack
  const { data: linesData } = useLinesDropdown(selectedBranch?.id || '');

  // Transaction mutation
  const createTransactionMutation = useCreateTransaction();

  // Function to format number with thousands separator
  const formatNumberWithSeparator = (num: number): string => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const creditOptions: CreditOption[] = [
    { id: 'useCredit', title: 'استفاده از اعتبار', selected: true },
    { id: 'saveForLater', title: 'ذخیره برای بعد', selected: false },
  ];

  const selectOption = (optionId: string) => {
    setSelectedOption(optionId);
  };

  // Calculate max credit usage for each line and total
  const calculateMaxCreditUsage = () => {
    const servicesWithPrices = getServicesWithPrices();
    const lines = linesData?.Data?.lines || [];

    let totalMaxUsage = 0;
    const maxUsagePerLine: { lineId: number; lineTitle: string; maxUsage: number }[] = [];

    servicesWithPrices.forEach(service => {
      const lineId = parseInt(service.id);
      const line = lines.find((l: any) => l.id === lineId);
      const serviceAmount = parseFloat(service.amount?.replace(/,/g, '') || '0');

      if (line) {
        const maxPayAmountByCashBack = line.maxPayAmountByCashBack / 10 || 0;
        const maxUsage = Math.min(serviceAmount, maxPayAmountByCashBack);
        totalMaxUsage += maxUsage;
        maxUsagePerLine.push({
          lineId,
          lineTitle: service.title,
          maxUsage
        });
      } else {
        // If line not found, use service amount as max (no limit)
        totalMaxUsage += serviceAmount;
        maxUsagePerLine.push({
          lineId,
          lineTitle: service.title,
          maxUsage: serviceAmount
        });
      }
    });

    return { totalMaxUsage, maxUsagePerLine };
  };

  // Calculate total credit used across all services
  const calculateTotalCreditUsed = (): number => {
    if (selectedOption !== 'useCredit' || credit <= 0) {
      return 0;
    }

    const servicesWithPrices = getServicesWithPrices();
    const { maxUsagePerLine } = calculateMaxCreditUsage();
    let remainingCredit = credit;
    let totalCreditUsed = 0;

    servicesWithPrices.forEach(service => {
      const serviceAmount = parseFloat(service.amount?.replace(/,/g, '') || '0');
      const lineId = parseInt(service.id);
      const lineMaxUsage = maxUsagePerLine.find(item => item.lineId === lineId)?.maxUsage || serviceAmount;

      if (remainingCredit > 0 && serviceAmount > 0) {
        // Spend credit on this service (up to the service amount, remaining credit, or max credit usage for this line)
        const creditUsedForService = Math.min(serviceAmount, remainingCredit, lineMaxUsage);
        totalCreditUsed += creditUsedForService;
        remainingCredit -= creditUsedForService;
      }
    });

    return totalCreditUsed;
  };

  // Calculate total amount and final amount to pay
  const calculateAmounts = () => {
    const total = getTotalAmount();
    setTotalAmount(total);

    // Calculate final amount based on credit usage
    let finalAmount = total;
    if (selectedOption === 'useCredit' && credit > 0) {
      // Calculate actual credit used and deduct from total
      const actualCreditUsed = calculateTotalCreditUsed();
      finalAmount = Math.max(0, total - actualCreditUsed);
    }
    setFinalAmountToPay(finalAmount);
  };

  // Function to calculate credit spending for each service
  const calculateCreditSpending = () => {
    const servicesWithPrices = getServicesWithPrices();
    const { maxUsagePerLine } = calculateMaxCreditUsage();
    let remainingCredit = selectedOption === 'useCredit' ? credit : 0;

    return servicesWithPrices.map(service => {
      const serviceAmount = parseFloat(service.amount?.replace(/,/g, '') || '0');
      const lineId = parseInt(service.id);
      const lineMaxUsage = maxUsagePerLine.find(item => item.lineId === lineId)?.maxUsage || serviceAmount;
      let payFromCredit = 0;

      if (remainingCredit > 0 && serviceAmount > 0) {
        // Spend credit on this service (up to the service amount, remaining credit, or max credit usage for this line)
        payFromCredit = Math.min(serviceAmount, remainingCredit, lineMaxUsage);
        remainingCredit -= payFromCredit;
      }

      return {
        lineId: parseInt(service.id),
        lineTitle: service.title,
        price: (Math.round(parseFloat(service.amount?.replace(/,/g, '') || '0') * 10)).toString() || '0',
        payFromCredit: Math.round(payFromCredit * 10),
        description: '',
        PaymentMethod: 'پوز - پوز آبی'
      };
    });
  };
  console.log('customerData', calculateCreditSpending());
  console.log('Total credit used:', calculateTotalCreditUsed());
  // Function to convert Persian numbers to English
  const convertPersianToEnglish = (persianNumber: string): string => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let result = persianNumber;
    persianNumbers.forEach((persian, index) => {
      result = result.replace(new RegExp(persian, 'g'), englishNumbers[index]);
    });
    return result;
  };

  // Function to prepare transaction data
  const prepareTransactionData = async () => {
    // Get phone number from AsyncStorage
    const phoneNumber = await AsyncStorage.getItem('phoneNumber');
    if (!phoneNumber) {
      showError('شماره تلفن یافت نشد');
      return null;
    }

    // Convert Persian phone number to English
    const englishPhoneNumber = convertPersianToEnglish(phoneNumber);

    const servicesWithPrices = getServicesWithPrices();
    if (servicesWithPrices.length === 0) {
      showError('لطفاً حداقل یک سرویس با مبلغ انتخاب کنید');
      return null;
    }

    const cashBackDto = calculateCreditSpending();

    return {
      cashBackDto,
      cardNumber: englishPhoneNumber,
      shouldSendMessage: false,
      branchId: selectedBranch?.id || ''
    };
  };

  // Function to handle cash payment
  const handleCashPayment = async () => {
    const transactionData = await prepareTransactionData();
    if (!transactionData) return;

    try {
      //const response = await createTransactionMutation.mutateAsync(transactionData);

      // Transaction successful
      navigation.navigate('Success', {
        totalAmount: totalAmount,
        finalAmountToPay: finalAmountToPay,
        creditUsed: calculateTotalCreditUsed(),
        creditOption: selectedOption,
        transactionResult: transactionData,
        paymentMethod: 'cash',
        result: '',
        eventResult: ''
      });

    } catch (error: any) {
      console.error('Transaction error:', error);
      showError(error?.response?.data?.Message || 'خطا در ارتباط با سرور');
    }
  };

  // Function to handle card payment
  const handleCardPayment = async () => {
    const transactionData = await prepareTransactionData();
    if (!transactionData) return;

    if (finalAmountToPay > 0) {
      navigation.navigate('Payment', {
        totalAmount: totalAmount,
        finalAmountToPay: finalAmountToPay,
        creditUsed: calculateTotalCreditUsed(),
        creditOption: selectedOption,
        transactionResult: transactionData
      });
    } else {
      // If no amount to pay, go directly to success
      navigation.navigate('Success', {
        totalAmount: totalAmount,
        finalAmountToPay: finalAmountToPay,
        creditUsed: calculateTotalCreditUsed(),
        creditOption: selectedOption,
        transactionResult: transactionData,
        paymentMethod: 'cash',
        result: '',
        eventResult: ''
      });
    }
  };

  // Function to handle submit when total amount is zero
  const handleSubmit = async () => {
    const transactionData = await prepareTransactionData();
    if (!transactionData) return;

    try {
      const response = await createTransactionMutation.mutateAsync(transactionData);

      if (response.Code === 200) {
        // Transaction successful
        navigation.navigate('Success', {
          totalAmount: totalAmount,
          finalAmountToPay: finalAmountToPay,
          creditUsed: calculateTotalCreditUsed(),
          creditOption: selectedOption,
          transactionResult: response.Data || transactionData,
          result: '',
          eventResult: ''
        });
      } else {
        showError(response.Message || 'خطا در انجام تراکنش');
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      showError(error?.response?.data?.Message || 'خطا در ارتباط با سرور');
    }
  };
  /*  const [responseData, setResponseData] = React.useState<any>(null);
 
   const sendTransaction = async (transactionData: any) => {
     try {
       const response = await createTransactionMutation.mutateAsync(transactionData?.transactionResult);
       console.log('response', response.Data);
       setResponseData(response.Data);
     } catch (error) {
       console.error('Transaction error:', error);
       showError('خطا در ارتباط با سرور');
     }
   } */


  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const customerData = await AsyncStorage.getItem('customerData');
        const savedBranchId = await AsyncStorage.getItem('branchId');

        if (customerData) {
          const customerDataJson = JSON.parse(customerData);
          console.log('customer', customerDataJson);

          const creditAmount = Math.round(parseInt(customerDataJson.credit.replace(/,/g, '')) / 10);
          setCredit(creditAmount);
          setCustomerData(customerDataJson);

          // If credit is 0, automatically set option to saveForLater
          if (creditAmount === 0) {
            setSelectedOption('saveForLater');
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, []);

  // Calculate amounts when selected services or credit option changes
  useEffect(() => {
    calculateAmounts();
  }, [selectedServices, selectedOption, credit]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>اعتبار</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowRight height={34} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.contentArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Credit Card */}
        <View style={styles.creditCard}>
          <View style={styles.creditIconContainer}>
            <MoneyIcon height={42} />
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.creditLabel}>کل اعتبار: </Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencyText}>تومان</Text>
              <Text style={styles.amountText}>{formatNumberWithSeparator(credit)}</Text>
            </View>
          </View>
          {selectedOption === 'useCredit' && selectedServices.length > 0 && finalAmountToPay > 0 && (() => {
            const { totalMaxUsage, maxUsagePerLine } = calculateMaxCreditUsage();
            return totalMaxUsage > 0 ? (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={styles.maxUsageRow}>
                  <Text style={[styles.creditLabel, { fontSize: 12 }]}>حداکثر اعتبار قابل استفاده: </Text>
                  <TouchableOpacity
                    onPress={() => setShowMaxUsageModal(true)}
                    style={styles.infoIconButton}
                  >
                    <Text style={styles.infoIcon}>ℹ️</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={[styles.currencyText, { fontSize: 12 }]}>تومان</Text>
                  <Text style={[styles.amountText, { fontSize: 12 }]}>{formatNumberWithSeparator(totalMaxUsage)}</Text>
                </View>
              </View>
            ) : null;
          })()}
        </View>

        {/* Option Buttons - Only show if credit > 0 */}
        {credit > 0 ? (
          <View style={styles.optionsContainer}>
            {creditOptions.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected ? styles.optionButtonSelected : styles.optionButtonUnselected
                  ]}
                  onPress={() => selectOption(option.id)}
                >
                  <Text style={styles.optionText}>{option.title}</Text>
                  <View style={[
                    styles.radioButton,
                    isSelected ? styles.radioButtonSelected : styles.radioButtonUnselected
                  ]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <></>
        )}

        {/* Credit Usage Summary */}

      </ScrollView>

      {/* Amount Display Bar */}
      <View style={styles.amountBar}>
        {selectedOption === 'useCredit' && credit > 0 && totalAmount > 0 && (
          <View style={styles.amountInfo}>
            <Text style={styles.amountBarValue}> {formatNumberWithSeparator(totalAmount)} تومان </Text>
            <Text style={styles.amountBarLabel}> مبلغ کل </Text>
          </View>
        )}
        <View style={styles.amountInfo}>
          <Text style={styles.amountBarValue}>
            {formatNumberWithSeparator(finalAmountToPay)} تومان
          </Text>
          <Text style={styles.amountBarLabel}>مبلغ قابل پرداخت</Text>
        </View>
        {selectedOption === 'useCredit' && credit > 0 && totalAmount > 0 && (
          <View style={styles.creditInfo}>
            <Text style={styles.originalAmountText}>
              {formatNumberWithSeparator(calculateTotalCreditUsed())} تومان
            </Text>
            <Text style={styles.creditDeductionText}>
              اعتبار استفاده شده
            </Text>
          </View>
        )}
      </View>

      {/* Payment Buttons */}
      {finalAmountToPay === 0 ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <Text style={styles.buttonText}>ثبت</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleCashPayment}
            style={styles.cardButton}
          >
            <Text style={styles.buttonText}>نقدی</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCardPayment}
            style={styles.cashButton}
          >
            <Text style={styles.buttonText}>کارت خوان</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Max Usage Bottom Sheet */}
      <Modal
        visible={showMaxUsageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMaxUsageModal(false)}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={() => setShowMaxUsageModal(false)}
        >
          <View style={styles.bottomSheetContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.bottomSheetHandle} />
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>حداکثر استفاده از اعتبار به تفکیک سرویس</Text>
                <TouchableOpacity
                  onPress={() => setShowMaxUsageModal(false)}
                  style={styles.bottomSheetCloseButton}
                >
                  <Text style={styles.bottomSheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.bottomSheetBody}>
                {(() => {
                  const { maxUsagePerLine } = calculateMaxCreditUsage();
                  return maxUsagePerLine.map((item, index) => (
                    <View key={index} style={styles.bottomSheetLineItem}>
                      <Text style={styles.bottomSheetLineTitle}>{item.lineTitle}</Text>
                      <Text style={styles.bottomSheetLineValue}>
                        {formatNumberWithSeparator(item.maxUsage)} تومان
                      </Text>
                    </View>
                  ));
                })()}
              </ScrollView>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  backButton: {

    paddingVertical: 16
  },
  backArrow: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'center',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#EFF2F3',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 120,
  },
  creditCard: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    minHeight: 150,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  creditIconContainer: {
    marginBottom: 15,
  },
  creditIcon: {
    fontSize: 40,
    fontFamily: 'IRANSansWebFaNum',
  },
  creditLabel: {
    fontSize: 15,
    color: '#000',
    marginBottom: 0,
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  amountText: {
    fontSize: 22,
    fontFamily: 'IRANSansWebFaNum-Bold',
    color: '#000',
    marginRight: 10,
  },
  currencyText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  maxUsageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconButton: {
    padding: 4,
  },
  infoIcon: {
    fontSize: 16,
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontFamily: 'IRANSansWebFaNum-Bold',
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  bottomSheetCloseButton: {
    padding: 4,
    marginLeft: 10,
  },
  bottomSheetCloseText: {
    fontSize: 24,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum',
  },
  bottomSheetBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: height * 0.6,
  },
  bottomSheetLineItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bottomSheetLineTitle: {
    fontSize: 16,
    fontFamily: 'IRANSansWebFaNum-Medium',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  bottomSheetLineValue: {
    fontSize: 16,
    fontFamily: 'IRANSansWebFaNum-Bold',
    color: '#000',
    marginLeft: 12,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,

  },
  optionButtonSelected: {
    borderColor: '#FF6B35',
    borderWidth: 1,
  },
  optionButtonUnselected: {
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  radioButtonUnselected: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: 'white',
  },
  radioButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'IRANSansWebFaNum-Medium',
    flex: 1,
    textAlign: 'right',
  },
  amountBar: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  amountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D0D0D0',
  },
  amountBarLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  amountBarValue: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  originalAmountText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  creditDeductionText: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  creditSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  finalAmountRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 8,
  },
  finalAmountLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
  finalAmountValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF2F3',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cashButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 0,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 0,
    marginLeft: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    flex: 1,
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
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'center',
  },
  noCreditMessage: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noCreditText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum-Medium',
    textAlign: 'center',
  },
});

export default Credit;
