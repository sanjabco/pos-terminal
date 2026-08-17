/**
 * Credit Screen - React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import ArrowRight from '../components/ArrowRight';
import MoneyIcon from '../components/MoneyIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useServiceContext } from '../providers/ServiceProvider';
import { useLinesDropdown, fetchShareDiscountPreview } from '../hooks/useApi';
import { useSnackbarContext } from '../providers/SnackbarProvider';
import { useAuth } from '../hooks/useAuth';
import { CURRENCY_LABEL, formatNumberWithSeparator } from '../utils/currency';
import type { Customer, CustomerActiveDiscount, OccasionGift, ShareDiscountPreviewItem } from '../services/api';

const { height } = Dimensions.get('window');

interface CreditOption {
  id: string;
  title: string;
  selected: boolean;
}

interface LinePreview {
  lineId: number;
  lineTitle: string;
  price: number;
  discountAmount: number;
  discountLabel?: string;
  adjustedPrice: number;
  payFromCredit: number;
  cashPayment: number;
}

const parseAmount = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    return Math.round(parseFloat(value.replace(/,/g, '')) || 0);
  }
  return 0;
};

/** Backend DiscountType: Birthday=4, Anniversary=5 */
const isBirthdayDiscount = (d: CustomerActiveDiscount) => {
  const type = Number(d.type);
  return type === 4 || String(d.type).toLowerCase() === 'birthday' || d.typeLabel?.includes('تولد');
};

const isAnniversaryDiscount = (d: CustomerActiveDiscount) => {
  const type = Number(d.type);
  return type === 5 || String(d.type).toLowerCase() === 'anniversary' || d.typeLabel?.includes('سالگرد');
};

const isOccasionDiscount = (d: CustomerActiveDiscount) =>
  isBirthdayDiscount(d) || isAnniversaryDiscount(d);

const occasionCashAmountOf = (gift?: OccasionGift | null): number => {
  if (!gift || String(gift.giftType || '').toLowerCase() !== 'cash') return 0;
  return Number(gift.amountTomans) || 0;
};

function Credit({ navigation }: { navigation: any }): React.JSX.Element {
  const { showError } = useSnackbarContext();
  const [selectedOption, setSelectedOption] = useState<string>('useCredit');
  const [applyDiscount, setApplyDiscount] = useState<boolean>(true);
  const [credit, setCredit] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalDiscountAmount, setTotalDiscountAmount] = useState<number>(0);
  const [finalAmountToPay, setFinalAmountToPay] = useState<number>(0);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerNameError, setNewCustomerNameError] = useState('');
  const { selectedBranch } = useAuth();

  const [showMaxUsageModal, setShowMaxUsageModal] = useState<boolean>(false);
  const [sharePreview, setSharePreview] = useState<ShareDiscountPreviewItem[]>([]);
  const [sharePreviewLoading, setSharePreviewLoading] = useState<boolean>(false);
  const [sharingEnabled, setSharingEnabled] = useState<boolean>(true);

  const { selectedServices, getTotalAmount, getServicesWithPrices } = useServiceContext();
  const { data: linesData } = useLinesDropdown(Number(selectedBranch?.id) || 0);

  const discounts = customerData?.discounts || [];
  const occasionDiscounts = discounts.filter(isOccasionDiscount);
  const otherDiscounts = discounts.filter((d) => !isOccasionDiscount(d));
  const birthdayGift = customerData?.birthdayGift;
  const anniversaryGift = customerData?.anniversaryGift;
  const hasOccasionGift =
    occasionDiscounts.length > 0
    || (birthdayGift && birthdayGift.giftType !== 'discount')
    || (anniversaryGift && anniversaryGift.giftType !== 'discount');
  const hasDiscounts = discounts.length > 0;
  const birthdayCashAmount = occasionCashAmountOf(birthdayGift);
  const anniversaryCashAmount = occasionCashAmountOf(anniversaryGift);
  const occasionCreditAmount = birthdayCashAmount || anniversaryCashAmount;
  const occasionCreditId =
    (birthdayCashAmount > 0 ? Number(birthdayGift?.creditId) : 0)
    || (anniversaryCashAmount > 0 ? Number(anniversaryGift?.creditId) : 0)
    || 0;
  const occasionDiscountId =
    occasionDiscounts[0]?.id
    || Number(birthdayGift?.discountId)
    || Number(anniversaryGift?.discountId)
    || 0;
  const applyOccasionCredit = selectedOption !== 'useCredit' && occasionCreditAmount > 0 && occasionCreditId > 0;
  const applyWalletCredit = selectedOption === 'useCredit' && credit > 0;
  const applyCredit = applyWalletCredit || applyOccasionCredit;
  const canApplyDiscount = hasDiscounts && !applyWalletCredit && !applyOccasionCredit;

  const creditOptions: CreditOption[] = [
    { id: 'useCredit', title: 'استفاده از اعتبار (کش‌بک)', selected: true },
    { id: 'saveForLater', title: 'ذخیره برای بعد', selected: false },
  ];

  const selectOption = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const getLineMaxCreditRials = (lineId: number, serviceAmount: number): number => {
    const lines = linesData?.Data?.lines || [];
    const line = lines.find((l: any) => l.id === lineId);
    if (!line) {
      return serviceAmount;
    }
    const maxPayAmountByCashBack = Number(line.maxPayAmountByCashBack) || 0;
    return maxPayAmountByCashBack > 0
      ? Math.min(serviceAmount, maxPayAmountByCashBack)
      : serviceAmount;
  };

  const getApplicableDiscount = (lineId: number): CustomerActiveDiscount | null => {
    if (!discounts.length) {
      return null;
    }
    const branchId = Number(selectedBranch?.id);
    const matches = discounts.filter((discount) => {
      const branchOk = discount.branchId == null || Number(discount.branchId) === branchId;
      const lineOk = discount.lineId == null || Number(discount.lineId) === Number(lineId);
      return branchOk && lineOk;
    });
    return matches.sort((a, b) => {
      const aFixed = Number(a.fixedAmount) || 0;
      const bFixed = Number(b.fixedAmount) || 0;
      if (aFixed !== bFixed) return bFixed - aFixed;
      return Number(b.percent) - Number(a.percent);
    })[0] ?? null;
  };

  const buildLinePreviews = (): LinePreview[] => {
    const servicesWithPrices = getServicesWithPrices();
    let remainingCredit = applyOccasionCredit
      ? occasionCreditAmount
      : applyWalletCredit
        ? credit
        : 0;
    const shouldApplyDiscount = applyDiscount && canApplyDiscount;
    let remainingFixedDiscount = 0;
    if (shouldApplyDiscount) {
      const previewDiscount = getApplicableDiscount(
        parseInt(servicesWithPrices[0]?.id || '0', 10),
      );
      const percent = Number(previewDiscount?.percent) || 0;
      remainingFixedDiscount = percent > 0 ? 0 : Number(previewDiscount?.fixedAmount) || 0;
    }

    return servicesWithPrices.map((service) => {
      const price = parseAmount(service.amount);
      const lineId = parseInt(service.id, 10);
      const applicableDiscount = shouldApplyDiscount ? getApplicableDiscount(lineId) : null;

      let discountAmount = 0;
      if (applicableDiscount && price > 0) {
        const percent = Number(applicableDiscount.percent) || 0;
        if (percent > 0) {
          discountAmount = Math.round((price * percent) / 100);
        } else if (remainingFixedDiscount > 0) {
          discountAmount = Math.min(price, remainingFixedDiscount);
          remainingFixedDiscount -= discountAmount;
        }
      }

      const adjustedPrice = Math.max(0, price - discountAmount);
      const lineMaxUsage = applyOccasionCredit
        ? adjustedPrice
        : getLineMaxCreditRials(lineId, adjustedPrice);
      const payFromCredit = remainingCredit > 0 && adjustedPrice > 0
        ? Math.min(adjustedPrice, remainingCredit, lineMaxUsage)
        : 0;
      remainingCredit -= payFromCredit;

      return {
        lineId,
        lineTitle: service.title,
        price,
        discountAmount,
        discountLabel: applicableDiscount?.typeLabel,
        adjustedPrice,
        payFromCredit: Math.round(payFromCredit),
        cashPayment: Math.max(0, adjustedPrice - payFromCredit),
      };
    });
  };

  const calculateMaxCreditUsage = () => {
    const previews = buildLinePreviews();
    const maxUsagePerLine = previews.map((preview) => ({
      lineId: preview.lineId,
      lineTitle: preview.lineTitle,
      maxUsage: getLineMaxCreditRials(preview.lineId, preview.adjustedPrice),
    }));
    const totalMaxUsage = maxUsagePerLine.reduce((sum, item) => sum + item.maxUsage, 0);
    return { totalMaxUsage, maxUsagePerLine };
  };

  const calculateTotalCreditUsed = (): number =>
    buildLinePreviews().reduce((sum, preview) => sum + preview.payFromCredit, 0);

  const calculateAmounts = () => {
    const previews = buildLinePreviews();
    const total = previews.reduce((sum, preview) => sum + preview.price, 0);
    const discountTotal = previews.reduce((sum, preview) => sum + preview.discountAmount, 0);
    const cashTotal = previews.reduce((sum, preview) => sum + preview.cashPayment, 0);

    setTotalAmount(total || getTotalAmount());
    setTotalDiscountAmount(discountTotal);
    setFinalAmountToPay(cashTotal);
  };

  const calculateCreditSpending = () => {
    return buildLinePreviews().map((preview) => ({
      lineId: preview.lineId,
      lineTitle: preview.lineTitle,
      price: Math.round(preview.price).toString(),
      payFromCredit: Math.round(preview.payFromCredit),
      paidByCash: Math.round(preview.cashPayment),
      description: '',
      PaymentMethod: 'پوز - پوز آبی',
    }));
  };

  const convertPersianToEnglish = (persianNumber: string): string => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let result = persianNumber;
    persianNumbers.forEach((persian, index) => {
      result = result.replace(new RegExp(persian, 'g'), englishNumbers[index]);
    });
    return result;
  };

  const prepareTransactionData = async () => {
    const storedPhone = phoneNumber || (await AsyncStorage.getItem('phoneNumber'));
    if (!storedPhone) {
      showError('شماره تلفن یافت نشد');
      return null;
    }

    const englishPhoneNumber = convertPersianToEnglish(storedPhone);
    const servicesWithPrices = getServicesWithPrices();
    if (servicesWithPrices.length === 0) {
      showError('لطفاً حداقل یک سرویس با مبلغ انتخاب کنید');
      return null;
    }

    const isNewCustomer = Boolean(customerData?.isNewCustomer);
    const trimmedName = newCustomerName.trim();
    if (isNewCustomer && !trimmedName) {
      setNewCustomerNameError('نام مشتری الزامی است');
      showError('لطفا نام مشتری را وارد کنید');
      return null;
    }

    const cashBackDto = calculateCreditSpending();

    return {
      cashBackDto,
      cardNumber: englishPhoneNumber,
      shouldSendMessage: true,
      branchId: Number(selectedBranch?.id) || 0,
      applyCredit,
      applyDiscount: applyDiscount && canApplyDiscount,
      ...(applyOccasionCredit && occasionCreditId > 0
        ? { discountId: occasionCreditId }
        : applyDiscount && canApplyDiscount && occasionDiscountId > 0
          ? { discountId: occasionDiscountId }
          : {}),
      confirmNewCustomer: isNewCustomer,
      ...(isNewCustomer ? { customerName: trimmedName } : {}),
    };
  };

  const handleCashPayment = async () => {
    const transactionData = await prepareTransactionData();
    if (!transactionData) return;

    try {
      const total = calculateTotalCreditUsed();
      navigation.navigate('Success', {
        totalAmount,
        finalAmountToPay,
        creditUsed: total,
        discountAmount: totalDiscountAmount,
        creditOption: selectedOption,
        transactionResult: transactionData,
        paymentMethod: 'cash',
        result: '',
        eventResult: '',
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      showError(error?.response?.data?.Message || 'خطا در ارتباط با سرور');
    }
  };

  const handleCardPayment = async () => {
    const transactionData = await prepareTransactionData();
    if (!transactionData) return;
    const total = calculateTotalCreditUsed();
    if (finalAmountToPay > 0) {
      navigation.navigate('Payment', {
        totalAmount,
        finalAmountToPay,
        creditUsed: total,
        discountAmount: totalDiscountAmount,
        creditOption: selectedOption,
        transactionResult: transactionData,
      });
    } else {
      navigation.navigate('Success', {
        totalAmount,
        finalAmountToPay,
        creditUsed: total,
        discountAmount: totalDiscountAmount,
        creditOption: selectedOption,
        transactionResult: transactionData,
        paymentMethod: 'cash',
        result: '',
        eventResult: '',
      });
    }
  };

  const handleSubmit = async () => {
    const transactionData = await prepareTransactionData();
    if (!transactionData) return;

    try {
      const total = calculateTotalCreditUsed();
      navigation.navigate('Success', {
        totalAmount,
        finalAmountToPay,
        creditUsed: total,
        discountAmount: totalDiscountAmount,
        creditOption: selectedOption,
        transactionResult: transactionData,
        result: '',
        eventResult: '',
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      showError(error?.response?.data?.Message || 'خطا در ارتباط با سرور');
    }
  };

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const storedCustomer = await AsyncStorage.getItem('customerData');
        const storedPhone = await AsyncStorage.getItem('phoneNumber');

        if (storedPhone) {
          setPhoneNumber(storedPhone);
        }

        if (storedCustomer) {
          const customerDataJson = JSON.parse(storedCustomer) as Customer;
          const totalCredit = parseAmount(customerDataJson.credit);
          const reservedOccasionCash =
            occasionCashAmountOf(customerDataJson.birthdayGift)
            + occasionCashAmountOf(customerDataJson.anniversaryGift);
          const walletCredit = Math.max(0, totalCredit - reservedOccasionCash);
          setCredit(walletCredit);
          setCustomerData(customerDataJson);

          if (customerDataJson.isNewCustomer) {
            const existingName =
              customerDataJson.name && customerDataJson.name !== 'کاربر جدید'
                ? customerDataJson.name
                : '';
            setNewCustomerName(existingName);
          }

          const hasOccasion =
            reservedOccasionCash > 0
            || (customerDataJson.discounts || []).some(isOccasionDiscount)
            || customerDataJson.birthdayGift
            || customerDataJson.anniversaryGift;
          if (walletCredit === 0 || hasOccasion) {
            setSelectedOption('saveForLater');
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, []);

  useEffect(() => {
    calculateAmounts();
  }, [selectedServices, selectedOption, credit, applyDiscount, discounts, linesData]);

  const totalAfterDiscount = useMemo(() => {
    return buildLinePreviews().reduce((sum, preview) => sum + preview.adjustedPrice, 0);
  }, [selectedServices, selectedOption, credit, applyDiscount, discounts, linesData]);

  useEffect(() => {
    const englishPhone = convertPersianToEnglish(phoneNumber);
    const branchId = Number(selectedBranch?.id);
    const lineIds = getServicesWithPrices()
      .map((service) => parseInt(service.id, 10))
      .filter((id) => id > 0);

    if (!englishPhone || !branchId || lineIds.length === 0) {
      setSharePreview([]);
      setSharePreviewLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSharePreviewLoading(true);
      try {
        const response = await fetchShareDiscountPreview({
          phoneNumber: englishPhone,
          branchId,
          amount: totalAfterDiscount,
          lineIds,
        });
        if (cancelled) return;
        const payload = response?.Data || (response as any)?.data || {};
        setSharingEnabled(payload.sharingEnabled !== false);
        setSharePreview(Array.isArray(payload.items) ? payload.items.slice(0, 3) : []);
      } catch (error) {
        console.error('Share discount preview failed:', error);
        if (!cancelled) {
          setSharePreview([]);
        }
      } finally {
        if (!cancelled) {
          setSharePreviewLoading(false);
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    phoneNumber,
    selectedBranch?.id,
    selectedServices,
    totalAfterDiscount,
    applyCredit,
    applyDiscount,
    customerData,
  ]);

  const formatDiscountValue = (discount: CustomerActiveDiscount) => {
    const percent = Number(discount.percent) || 0;
    const fixed = percent > 0 ? 0 : Number(discount.fixedAmount) || 0;
    if (percent > 0) {
      return `${percent}%`;
    }
    if (fixed > 0) {
      return `${formatNumberWithSeparator(fixed)} ${CURRENCY_LABEL}`;
    }
    return discount.typeLabel || 'تخفیف';
  };

  const formatOccasionGift = (gift: OccasionGift, kind: 'birthday' | 'anniversary') => {
    const title = kind === 'birthday' ? 'هدیه تولد' : 'هدیه سالگرد ازدواج';
    if (gift.giftType === 'discount') {
      return `${gift.discountPercent}٪ ${title}`;
    }
    if (gift.giftType === 'cash') {
      return `${formatNumberWithSeparator(Number(gift.amountTomans) || 0)} ${CURRENCY_LABEL} ${title}`;
    }
    return gift.itemDescription?.trim()
      ? `${title}: ${gift.itemDescription}`
      : title;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>اعتبار و تخفیف</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowRight height={34} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.contentArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {customerData && (
          <View style={styles.customerCard}>
            {(customerData.isNewCustomer || customerData.isFirstBuyEligible) && (
              <View style={styles.newCustomerBanner}>
                <Text style={styles.newCustomerBannerText}>
                  {customerData.isNewCustomer
                    ? 'مشتری جدید — در صورت وجود طرح، تخفیف اولین خرید روی همین تراکنش اعمال می‌شود.'
                    : 'اولین خرید این مشتری — در صورت وجود طرح، تخفیف اولین خرید روی همین تراکنش اعمال می‌شود.'}
                </Text>
              </View>
            )}
            {customerData.isNewCustomer ? (
              <View style={styles.nameField}>
                <Text style={styles.nameFieldLabel}>
                  نام مشتری <Text style={styles.requiredMark}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.nameInput,
                    !!newCustomerNameError && styles.nameInputError,
                  ]}
                  value={newCustomerName}
                  onChangeText={async (text) => {
                    setNewCustomerName(text);
                    if (newCustomerNameError) {
                      setNewCustomerNameError('');
                    }
                    const updated = { ...customerData, name: text };
                    setCustomerData(updated);
                    try {
                      await AsyncStorage.setItem('customerData', JSON.stringify(updated));
                    } catch (error) {
                      console.error('Error saving customer name:', error);
                    }
                  }}
                  placeholder="نام مشتری را وارد کنید"
                  placeholderTextColor="#999"
                  textAlign="right"
                  autoCorrect={false}
                />
                {!!newCustomerNameError && (
                  <Text style={styles.nameErrorText}>{newCustomerNameError}</Text>
                )}
              </View>
            ) : (
              <View style={styles.customerRow}>
                <Text style={styles.customerLabel}>نام مشتری</Text>
                <Text style={styles.customerValue}>{customerData.name || '—'}</Text>
              </View>
            )}
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>شماره همراه</Text>
              <Text style={styles.customerValue}>{customerData.userPhoneNumber || phoneNumber || '—'}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>شماره اشتراک</Text>
              <Text style={styles.customerValue}>{customerData.subscriptionCode || '—'}</Text>
            </View>
          </View>
        )}

        <View style={styles.creditCard}>
          <View style={styles.creditIconContainer}>
            <MoneyIcon height={42} />
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, width: '100%' }}>
            <Text style={styles.creditLabel}>اعتبار (کش‌بک): </Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencyText}>{CURRENCY_LABEL}</Text>
              <Text style={styles.amountText}>{formatNumberWithSeparator(credit)}</Text>
            </View>
          </View>
          {applyCredit && selectedServices.length > 0 && (() => {
            const { totalMaxUsage } = calculateMaxCreditUsage();
            return totalMaxUsage > 0 ? (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
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
                  <Text style={[styles.currencyText, { fontSize: 12 }]}>{CURRENCY_LABEL}</Text>
                  <Text style={[styles.amountText, { fontSize: 12 }]}>{formatNumberWithSeparator(totalMaxUsage)}</Text>
                </View>
              </View>
            ) : null;
          })()}
        </View>

        {hasOccasionGift && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>هدیه تولد و سالگرد</Text>
            {birthdayGift && birthdayGift.giftType !== 'discount' && (
              <View style={[styles.discountChip, styles.birthdayChip]}>
                <Text style={styles.discountAmountText}>{formatOccasionGift(birthdayGift, 'birthday')}</Text>
                <Text style={styles.discountDateText}>· تا {birthdayGift.toDate}</Text>
              </View>
            )}
            {anniversaryGift && anniversaryGift.giftType !== 'discount' && (
              <View style={[styles.discountChip, styles.anniversaryChip]}>
                <Text style={styles.discountAmountText}>{formatOccasionGift(anniversaryGift, 'anniversary')}</Text>
                <Text style={styles.discountDateText}>· تا {anniversaryGift.toDate}</Text>
              </View>
            )}
            {occasionDiscounts.map((discount) => (
              <View
                key={`occasion-${discount.id}`}
                style={[
                  styles.discountChip,
                  isBirthdayDiscount(discount)
                    ? styles.birthdayChip
                    : styles.anniversaryChip,
                ]}
              >
                <Text style={styles.discountAmountText}>{formatDiscountValue(discount)}</Text>
                <Text style={styles.discountMetaText}>
                  {isBirthdayDiscount(discount) ? 'هدیه تولد' : 'هدیه سالگرد ازدواج'}
                </Text>
                {!!discount.lineTitle && (
                  <Text style={styles.discountMetaText}>· {discount.lineTitle}</Text>
                )}
                <Text style={styles.discountDateText}>· تا {discount.toDate}</Text>
              </View>
            ))}
            {applyCredit && occasionDiscounts.length > 0 && (
              <Text style={styles.hintText}>
                با استفاده از اعتبار، این تخفیف اعمال نمی‌شود.
              </Text>
            )}
          </View>
        )}

        {otherDiscounts.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>تخفیف‌های فعال</Text>
            {otherDiscounts.map((discount) => (
              <View key={discount.id} style={styles.discountChip}>
                <Text style={styles.discountAmountText}>{formatDiscountValue(discount)}</Text>
                <Text style={styles.discountMetaText}>{discount.typeLabel}</Text>
                {!!discount.lineTitle && (
                  <Text style={styles.discountMetaText}>· {discount.lineTitle}</Text>
                )}
                <Text style={styles.discountDateText}>· تا {discount.toDate}</Text>
              </View>
            ))}
            {applyCredit && (
              <Text style={styles.hintText}>
                با استفاده از اعتبار، تخفیف اعمال نمی‌شود. برای اعمال تخفیف، استفاده از اعتبار را خاموش کنید.
              </Text>
            )}
          </View>
        )}

        {credit > 0 ? (
          <View style={styles.optionsContainer}>
            {creditOptions.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected ? styles.optionButtonSelected : styles.optionButtonUnselected,
                  ]}
                  onPress={() => selectOption(option.id)}
                >
                  <Text style={styles.optionText}>{option.title}</Text>
                  <View style={[
                    styles.radioButton,
                    isSelected ? styles.radioButtonSelected : styles.radioButtonUnselected,
                  ]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {canApplyDiscount && (
          <View style={styles.discountToggleRow}>
            <Switch
              value={applyDiscount}
              onValueChange={setApplyDiscount}
              trackColor={{ false: '#CCCCCC', true: '#81C784' }}
              thumbColor={applyDiscount ? '#4CAF50' : '#f4f3f4'}
            />
            <Text style={styles.discountToggleLabel}>اعمال تخفیف</Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.shareHeader}>
            <Text style={styles.sectionTitle}>تخفیف‌های اشتراک‌گذاری احتمالی</Text>
            {sharePreviewLoading && <ActivityIndicator size="small" color="#1abc9c" />}
          </View>
          {!sharingEnabled ? (
            <Text style={styles.hintText}>اشتراک‌گذاری هوشمند برای این فروشگاه فعال نیست.</Text>
          ) : sharePreview.length > 0 ? (
            <>
              {sharePreview.map((item) => (
                <View key={item.businessId} style={styles.shareItem}>
                  <View style={styles.shareItemHeader}>
                    <Text style={styles.shareBusinessTitle}>{item.businessTitle}</Text>
                    <Text style={styles.sharePercent}>
                      {formatNumberWithSeparator(Number(item.discountPercent) || 0)}٪
                    </Text>
                  </View>
                  <Text style={styles.shareMeta}>
                    مهلت استفاده: {formatNumberWithSeparator(Number(item.expirationDays) || 0)} روز
                    {item.distanceKm != null
                      ? ` · فاصله حدودی: ${formatNumberWithSeparator(Number(item.distanceKm))} کیلومتر`
                      : ''}
                  </Text>
                </View>
              ))}
              <Text style={styles.hintText}>
                این لیست پیش‌نمایش است و پس از ثبت تراکنش نهایی می‌شود.
              </Text>
            </>
          ) : !sharePreviewLoading ? (
            <Text style={styles.hintText}>در حال حاضر فروشگاهی برای اشتراک‌گذاری پیشنهاد نمی‌شود.</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.amountBar}>
        {totalAmount > 0 && (
          <View style={styles.amountInfo}>
            <Text style={styles.amountBarValue}> {formatNumberWithSeparator(totalAmount)} {CURRENCY_LABEL} </Text>
            <Text style={styles.amountBarLabel}> مبلغ کل </Text>
          </View>
        )}
        {totalDiscountAmount > 0 && (
          <View style={styles.amountInfo}>
            <Text style={[styles.amountBarValue, { color: '#1abc9c' }]}>
              {formatNumberWithSeparator(totalDiscountAmount)} {CURRENCY_LABEL}
            </Text>
            <Text style={styles.amountBarLabel}>تخفیف</Text>
          </View>
        )}
        <View style={styles.amountInfo}>
          <Text style={styles.amountBarValue}>
            {formatNumberWithSeparator(finalAmountToPay)} {CURRENCY_LABEL}
          </Text>
          <Text style={styles.amountBarLabel}>مبلغ قابل پرداخت</Text>
        </View>
        {applyCredit && credit > 0 && totalAmount > 0 && (
          <View style={styles.creditInfo}>
            <Text style={styles.originalAmountText}>
              {formatNumberWithSeparator(calculateTotalCreditUsed())} {CURRENCY_LABEL}
            </Text>
            <Text style={styles.creditDeductionText}>
              اعتبار استفاده شده
            </Text>
          </View>
        )}
      </View>

      {finalAmountToPay === 0 ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.buttonText}>ثبت</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleCashPayment} style={styles.cardButton}>
            <Text style={styles.buttonText}>نقدی</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCardPayment} style={styles.cashButton}>
            <Text style={styles.buttonText}>کارت خوان</Text>
          </TouchableOpacity>
        </View>
      )}

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
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
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
                        {formatNumberWithSeparator(item.maxUsage)} {CURRENCY_LABEL}
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
    paddingVertical: 16,
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
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  newCustomerBanner: {
    backgroundColor: '#e8f8f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  newCustomerBannerText: {
    fontSize: 12,
    color: '#1abc9c',
    fontFamily: 'IRANSansWebFaNum',
    textAlign: 'right',
  },
  nameField: {
    marginBottom: 12,
  },
  nameFieldLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum',
    textAlign: 'right',
    marginBottom: 6,
  },
  requiredMark: {
    color: '#fd6757',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    fontFamily: 'IRANSansWebFaNum',
    color: '#2c2c2c',
  },
  nameInputError: {
    borderColor: '#fd6757',
  },
  nameErrorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#fd6757',
    fontFamily: 'IRANSansWebFaNum',
    textAlign: 'right',
  },
  customerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum',
  },
  customerValue: {
    fontSize: 14,
    color: '#2c2c2c',
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
  creditCard: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    minHeight: 150,
    padding: 25,
    alignItems: 'center',
    marginBottom: 16,
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
    gap: 4,
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
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#2c2c2c',
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  discountChip: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e8f8f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  birthdayChip: {
    backgroundColor: '#FFF3E8',
  },
  anniversaryChip: {
    backgroundColor: '#F3E8FF',
  },
  discountAmountText: {
    fontSize: 14,
    color: '#1abc9c',
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
  discountMetaText: {
    fontSize: 13,
    color: '#1abc9c',
    fontFamily: 'IRANSansWebFaNum',
  },
  discountDateText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum',
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 18,
  },
  discountToggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  discountToggleLabel: {
    fontSize: 14,
    color: '#2c2c2c',
    fontFamily: 'IRANSansWebFaNum-Medium',
  },
  shareHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  shareItem: {
    backgroundColor: '#eef9f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  shareItemHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shareBusinessTitle: {
    fontSize: 14,
    color: '#2c2c2c',
    fontFamily: 'IRANSansWebFaNum-Bold',
    flex: 1,
    textAlign: 'right',
  },
  sharePercent: {
    fontSize: 14,
    color: '#1abc9c',
    fontFamily: 'IRANSansWebFaNum-Bold',
    marginLeft: 8,
  },
  shareMeta: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'IRANSansWebFaNum',
    textAlign: 'right',
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
    marginBottom: 16,
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
});

export default Credit;
