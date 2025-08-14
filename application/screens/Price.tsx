/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import ArrowRight from '../components/ArrowRight';
import { useServiceContext } from '../providers/ServiceProvider';

const { width, height } = Dimensions.get('window');

function Price({ navigation }: { navigation: any }): React.JSX.Element {
  const { selectedServices, updateServiceAmount, getTotalAmount, validateAllAmounts } = useServiceContext();

  // Function to format number with thousand separators
  const formatNumberWithSeparator = (text: string): string => {
    // Remove all non-digit characters except decimal point
    const cleanText = text.replace(/[^\d.]/g, '');

    // Split by decimal point
    const parts = cleanText.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    // Add thousand separators to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Combine with decimal part if exists
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  // Function to handle amount change with formatting
  const handleAmountChange = (serviceId: string, text: string) => {
    const formattedText = formatNumberWithSeparator(text);
    updateServiceAmount(serviceId, formattedText);
  };

  const handleContinue = () => {
    // Handle continue button logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ثبت خرید جدید</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerArrow}>
          <ArrowRight height={34} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Dynamic Input Sections based on selected services */}
          {selectedServices.map((service, index) => (
            <View key={`input-${service.id}`} style={styles.inputSection}>
              <Text style={styles.inputLabel}>مبلغ خرید {service.title}</Text>
              <View style={styles.inputContainer}>
                <View style={styles.currencyTag}>
                  <Text style={styles.currencyText}>تومان</Text>
                </View>
                <TextInput
                  style={styles.amountInput}
                  value={service.amount || ''}
                  onChangeText={(text) => handleAmountChange(service.id, text)}
                  editable={true}
                  placeholder="مبلغ را وارد کنید"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}

          {/* Total Amount Summary */}
          {/*  {selectedServices.length > 0 && (
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>مجموع کل:</Text>
              <View style={styles.totalContainer}>
                <View style={styles.currencyTag}>
                  <Text style={styles.currencyText}>تومان</Text>
                </View>
                <Text style={styles.totalAmount}>
                  {getTotalAmount().toLocaleString()}
                </Text>
              </View>
            </View>
          )} */}
        </ScrollView>
      </View>

      {/* Footer Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Mobile')}
        style={[
          styles.continueButton,
          !validateAllAmounts() && styles.continueButtonDisabled
        ]}
        disabled={!validateAllAmounts()}
      >
        <Text style={[
          styles.continueButtonText,
          !validateAllAmounts() && styles.continueButtonTextDisabled
        ]}>
          ادامه
        </Text>
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
    height: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',

  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'center',

  },
  headerArrow: {

    paddingVertical: 16

  },
  arrowText: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#EFF2F3',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 0,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currencyTag: {
    backgroundColor: '#FFE4D6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFD4C4',
  },
  currencyText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'IRANSansWebFaNum-Bold',
    color: '#000',
    textAlign: 'left',
    paddingVertical: 3,
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
  continueButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  continueButtonTextDisabled: {
    color: '#888',
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'IRANSansWebFaNum-Medium',
    marginBottom: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  totalAmount: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'IRANSansWebFaNum-Bold',
    color: '#000',
    textAlign: 'left',
  },
});

export default Price;
