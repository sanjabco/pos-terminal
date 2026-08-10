/**
 * Checkout Screen - phone + benefits + payment in one step
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { PosTopBar } from '../components/PosTopBar';
import { FooterBar, FooterButton } from '../components/FooterBar';
import MoneyIcon from '../components/MoneyIcon';
import { useAuth } from '../hooks/useAuth';
import { useCustomer, useCashbacks, useLinesDropdown, fetchShareDiscountPreview } from '../hooks/useApi';
import { useServiceContext } from '../providers/ServiceProvider';
import { useSnackbarContext } from '../providers/SnackbarProvider';
import { CURRENCY_LABEL, formatNumberWithSeparator } from '../utils/currency';
import type { Customer, CustomerActiveDiscount, ShareDiscountPreviewItem } from '../services/api';
import { colors, fonts } from '../theme/colors';
import moment from 'moment-jalaali';

interface LinePreview {
  lineId: number;
  lineTitle: string;
  price: number;
  discountAmount: number;
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
const isBirthdayDiscount = (d: CustomerActiveDiscount) =>
  Number(d.type) === 4 || d.typeLabel?.includes('تولد');

const isAnniversaryDiscount = (d: CustomerActiveDiscount) =>
  Number(d.type) === 5 || d.typeLabel?.includes('سالگرد');

const convertPersianToEnglish = (persianNumber: string): string => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = persianNumber;
  persianNumbers.forEach((persian, index) => {
    result = result.replace(new RegExp(persian, 'g'), englishNumbers[index]);
  });
  return result;
};

function Checkout({ navigation }: { navigation: any }): React.JSX.Element {
  const { showError } = useSnackbarContext();
  const { selectedBranch } = useAuth();
  const { selectedServices, getTotalAmount, getServicesWithPrices } = useServiceContext();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedOption, setSelectedOption] = useState('useCredit');
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(null);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [credit, setCredit] = useState(0);
  const [sharePreview, setSharePreview] = useState<ShareDiscountPreviewItem[]>([]);
  const [sharePreviewLoading, setSharePreviewLoading] = useState(false);
  const [sharingEnabled, setSharingEnabled] = useState(true);
  const [showMaxUsageModal, setShowMaxUsageModal] = useState(false);

  const englishPhoneNumber = convertPersianToEnglish(phoneNumber);
  const isValidPhone = englishPhoneNumber.length === 11 && englishPhoneNumber.startsWith('09');
  const branchId = Number(selectedBranch?.id) || 0;

  const { data: customerResponse, isLoading: customerLoading, refetch } = useCustomer(
    isValidPhone ? englishPhoneNumber : '',
    branchId,
  );
  const { data: cashbacksData } = useCashbacks();
  const { data: linesData } = useLinesDropdown(branchId);

  const discounts = customerData?.discounts || [];
  const hasDiscounts = discounts.length > 0;
  const applyCredit = selectedOption === 'useCredit' && credit > 0;
  const applyDiscount = selectedDiscountId != null && !applyCredit;
  const selectedDiscount = discounts.find((d) => d.id === selectedDiscountId) ?? null;
  const customerReady = Boolean(customerData) && isValidPhone && !customerLoading;

  const pickBestDiscountId = (list: CustomerActiveDiscount[]): number | null => {
    if (!list.length) return null;
    const sorted = [...list].sort((a, b) => {
      const aFixed = Number(a.fixedAmount) || 0;
      const bFixed = Number(b.fixedAmount) || 0;
      if (aFixed !== bFixed) return bFixed - aFixed;
      return Number(b.percent) - Number(a.percent);
    });
    return sorted[0]?.id ?? null;
  };

  useEffect(() => {
    if (isValidPhone) {
      refetch();
    }
  }, [englishPhoneNumber, isValidPhone, refetch]);

  useEffect(() => {
    const syncCustomer = async () => {
      if (!isValidPhone) {
        setCustomerData(null);
        setCredit(0);
        setSelectedDiscountId(null);
        return;
      }

      if (customerResponse?.Code === 200 && customerResponse?.Data) {
        const data = customerResponse.Data;
        const creditAmount = parseAmount(data.credit);
        setCustomerData(data);
        setCredit(creditAmount);
        setSelectedOption(creditAmount > 0 ? 'useCredit' : 'saveForLater');
        setSelectedDiscountId(pickBestDiscountId(data.discounts || []));
        try {
          await AsyncStorage.setItem('customerData', JSON.stringify(data));
          await AsyncStorage.setItem('phoneNumber', phoneNumber);
          await AsyncStorage.setItem('branchId', String(branchId));
        } catch (error) {
          console.error('Error saving customer data:', error);
        }
        return;
      }

      if (customerResponse && customerResponse.Code !== 200) {
        const defaultCustomer: Customer = {
          name: '',
          userPhoneNumber: englishPhoneNumber,
          credit: 0,
          subscriptionCode: null,
          discounts: [],
          isNewCustomer: true,
        };
        setCustomerData(defaultCustomer);
        setCredit(0);
        setSelectedOption('saveForLater');
        setSelectedDiscountId(null);
        try {
          await AsyncStorage.setItem('customerData', JSON.stringify(defaultCustomer));
          await AsyncStorage.setItem('phoneNumber', phoneNumber);
          await AsyncStorage.setItem('branchId', String(branchId));
        } catch (error) {
          console.error('Error saving default customer:', error);
        }
      }
    };

    syncCustomer();
  }, [customerResponse, isValidPhone, englishPhoneNumber, phoneNumber, branchId]);

  const activeCashbacks = useMemo(() => {
    if (cashbacksData?.Code !== 200 || !cashbacksData?.Data?.cashBackModel) {
      return [];
    }
    let relevant = cashbacksData.Data.cashBackModel;
    if (selectedServices.length > 0) {
      const ids = selectedServices.map((s) => parseInt(s.id, 10));
      relevant = relevant.filter((cb: any) => ids.includes(cb.lineId));
    }
    const now = moment();
    return relevant.filter((cb: any) => {
      const fromDate = moment(cb.fromDate, 'jYYYY/jMM/jDD');
      const toDate = moment(cb.toDate, 'jYYYY/jMM/jDD');
      return fromDate <= now && toDate >= now;
    });
  }, [cashbacksData, selectedServices]);

  const getLineMaxCreditRials = (lineId: number, serviceAmount: number): number => {
    const lines = linesData?.Data?.lines || [];
    const line = lines.find((l: any) => l.id === lineId);
    if (!line) return serviceAmount;
    const maxPayAmountByCashBack = Number(line.maxPayAmountByCashBack) || 0;
    return maxPayAmountByCashBack > 0
      ? Math.min(serviceAmount, maxPayAmountByCashBack)
      : serviceAmount;
  };

  const getApplicableDiscount = (lineId: number): CustomerActiveDiscount | null => {
    if (!selectedDiscount) return null;
    const branchOk =
      selectedDiscount.branchId == null || Number(selectedDiscount.branchId) === branchId;
    const lineOk =
      selectedDiscount.lineId == null || Number(selectedDiscount.lineId) === Number(lineId);
    return branchOk && lineOk ? selectedDiscount : null;
  };

  const linePreviews: LinePreview[] = useMemo(() => {
    const servicesWithPrices = getServicesWithPrices();
    let remainingCredit = applyCredit ? credit : 0;
    const shouldApplyDiscount = applyDiscount;

    return servicesWithPrices.map((service) => {
      const price = parseAmount(service.amount);
      const lineId = parseInt(service.id, 10);
      const applicableDiscount = shouldApplyDiscount ? getApplicableDiscount(lineId) : null;
      let discountAmount = 0;
      if (applicableDiscount && price > 0) {
        const fixed = Number(applicableDiscount.fixedAmount) || 0;
        discountAmount = fixed > 0
          ? Math.min(price, Math.round(fixed))
          : Math.round((price * (Number(applicableDiscount.percent) || 0)) / 100);
      }
      const adjustedPrice = Math.max(0, price - discountAmount);
      const lineMaxUsage = getLineMaxCreditRials(lineId, adjustedPrice);
      const payFromCredit = remainingCredit > 0 && adjustedPrice > 0
        ? Math.min(adjustedPrice, remainingCredit, lineMaxUsage)
        : 0;
      remainingCredit -= payFromCredit;
      return {
        lineId,
        lineTitle: service.title,
        price,
        discountAmount,
        adjustedPrice,
        payFromCredit: Math.round(payFromCredit),
        cashPayment: Math.max(0, adjustedPrice - payFromCredit),
      };
    });
  }, [
    selectedServices,
    applyCredit,
    credit,
    applyDiscount,
    selectedDiscountId,
    discounts,
    linesData,
  ]);

  const totalAmount = linePreviews.reduce((sum, p) => sum + p.price, 0) || getTotalAmount();
  const totalDiscountAmount = linePreviews.reduce((sum, p) => sum + p.discountAmount, 0);
  const creditUsed = linePreviews.reduce((sum, p) => sum + p.payFromCredit, 0);
  const finalAmountToPay = linePreviews.reduce((sum, p) => sum + p.cashPayment, 0);
  const totalAfterDiscount = linePreviews.reduce((sum, p) => sum + p.adjustedPrice, 0);

  const maxCreditUsage = useMemo(() => {
    const servicesWithPrices = getServicesWithPrices();
    const maxUsagePerLine = servicesWithPrices.map((service) => {
      const price = parseAmount(service.amount);
      const lineId = parseInt(service.id, 10);
      return {
        lineId,
        lineTitle: service.title,
        maxUsage: getLineMaxCreditRials(lineId, price),
      };
    });
    const totalMaxUsage = maxUsagePerLine.reduce((sum, item) => sum + item.maxUsage, 0);
    return { totalMaxUsage, maxUsagePerLine };
  }, [selectedServices, linesData]);

  const usageCeiling = Math.min(credit, maxCreditUsage.totalMaxUsage || credit);

  useEffect(() => {
    if (!isValidPhone || !branchId || linePreviews.length === 0) {
      setSharePreview([]);
      setSharePreviewLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSharePreviewLoading(true);
      try {
        const response = await fetchShareDiscountPreview({
          phoneNumber: englishPhoneNumber,
          branchId,
          amount: totalAfterDiscount,
          lineIds: linePreviews.map((p) => p.lineId).filter((id) => id > 0),
        });
        if (cancelled) return;
        const payload = response?.Data || (response as any)?.data || {};
        setSharingEnabled(payload.sharingEnabled !== false);
        setSharePreview(Array.isArray(payload.items) ? payload.items.slice(0, 3) : []);
      } catch (error) {
        console.error('Share discount preview failed:', error);
        if (!cancelled) setSharePreview([]);
      } finally {
        if (!cancelled) setSharePreviewLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isValidPhone, englishPhoneNumber, branchId, totalAfterDiscount, applyCredit, applyDiscount, customerData]);

  const formatDiscountValue = (discount: CustomerActiveDiscount) => {
    const fixed = Number(discount.fixedAmount) || 0;
    if (fixed > 0) return `${formatNumberWithSeparator(fixed)} ${CURRENCY_LABEL}`;
    return `${discount.percent}%`;
  };

  const prepareTransactionData = () => {
    if (!isValidPhone) {
      showError('شماره تلفن معتبر نیست');
      return null;
    }
    if (getServicesWithPrices().length === 0) {
      showError('لطفاً حداقل یک سرویس با مبلغ انتخاب کنید');
      return null;
    }

    const isNewCustomer = Boolean(customerData?.isNewCustomer);

    return {
      cashBackDto: linePreviews.map((preview) => ({
        lineId: preview.lineId,
        lineTitle: preview.lineTitle,
        price: Math.round(preview.price).toString(),
        payFromCredit: Math.round(preview.payFromCredit),
        paidByCash: Math.round(preview.cashPayment),
        description: '',
        PaymentMethod: 'پوز - پوز آبی',
      })),
      cardNumber: englishPhoneNumber,
      shouldSendMessage: true,
      branchId,
      applyCredit,
      applyDiscount,
      ...(applyDiscount && selectedDiscountId != null ? { discountId: selectedDiscountId } : {}),
      confirmNewCustomer: isNewCustomer,
    };
  };

  const goToSuccess = (transactionData: any, paymentMethod = 'cash') => {
    navigation.navigate('Success', {
      totalAmount,
      finalAmountToPay,
      creditUsed,
      discountAmount: totalDiscountAmount,
      creditOption: selectedOption,
      transactionResult: transactionData,
      paymentMethod,
      result: '',
      eventResult: '',
    });
  };

  const handleCashPayment = () => {
    const transactionData = prepareTransactionData();
    if (!transactionData) return;
    goToSuccess(transactionData, 'cash');
  };

  const handleCardPayment = () => {
    const transactionData = prepareTransactionData();
    if (!transactionData) return;
    if (finalAmountToPay > 0) {
      navigation.navigate('Payment', {
        totalAmount,
        finalAmountToPay,
        creditUsed,
        discountAmount: totalDiscountAmount,
        creditOption: selectedOption,
        transactionResult: transactionData,
      });
    } else {
      goToSuccess(transactionData, 'cash');
    }
  };

  const handleSubmit = () => {
    const transactionData = prepareTransactionData();
    if (!transactionData) return;
    goToSuccess(transactionData, 'cash');
  };

  return (
    <View style={styles.container}>
      <PosTopBar title="ثبت خرید" onBack={() => navigation.goBack()} />

      <KeyboardAwareScrollView
        style={styles.contentArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >


        <Text style={styles.sectionLabel}>شماره همراه مشتری</Text>
        <TextInput
          style={[styles.phoneInput, !isValidPhone && phoneNumber.length > 0 && styles.phoneInputError]}
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
          <Text style={styles.errorMessage}>شماره باید ۱۱ رقم و با ۰۹ شروع شود</Text>
        )}

        {customerLoading && isValidPhone && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#FF6B35" />
            <Text style={styles.loadingText}>در حال دریافت اطلاعات مشتری...</Text>
          </View>
        )}

        {customerReady && customerData && (
          <View style={styles.creditHeroCard}>
            <View style={styles.creditHeroTop}>
              <View style={styles.creditHeroLabelRow}>
                <MoneyIcon width={20} height={20} />
                <Text style={styles.creditHeroLabel}>اعتبار قابل استفاده</Text>
              </View>
              <Text style={styles.creditHeroAmount}>
                {formatNumberWithSeparator(credit)} {CURRENCY_LABEL}
              </Text>
            </View>
            <View style={styles.creditHeroBottom}>
              <View style={styles.creditCeilingBlock}>
                <Text style={styles.creditCeilingLabel}>سقف استفاده</Text>
                <Text style={styles.creditCeilingValue}>
                  {formatNumberWithSeparator(usageCeiling)} {CURRENCY_LABEL}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.creditDetailsBtn}
                onPress={() => setShowMaxUsageModal(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.creditDetailsBtnText}>جزئیات</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* <View style={styles.summaryChip}>
          <Text style={styles.summaryChipText}>
            مبلغ خرید: {formatNumberWithSeparator(totalAmount)} {CURRENCY_LABEL}
          </Text>
          <Text style={styles.summaryChipSub}>
            {activeCashbacks.length > 0
              ? 'از این خرید بازگشت اعتبار می‌گیرید'
              : 'از این خرید بازگشت اعتبار نمی‌گیرید'}
          </Text>
        </View> */}

        {customerReady && customerData && (
          <>
            {(customerData.isNewCustomer || customerData.isFirstBuyEligible || !!customerData.subscriptionCode) && (
              <View style={styles.card}>
                {(customerData.isNewCustomer || customerData.isFirstBuyEligible) && (
                  <Text style={styles.newCustomerText}>
                    {customerData.isNewCustomer
                      ? 'مشتری جدید — در صورت وجود طرح، تخفیف اولین خرید اعمال می‌شود.'
                      : 'اولین خرید این مشتری — در صورت وجود طرح، تخفیف اولین خرید اعمال می‌شود.'}
                  </Text>
                )}
                {!!customerData.subscriptionCode && (
                  <View style={styles.row}>
                    <Text style={styles.rowValue}>{customerData.subscriptionCode}</Text>
                    <Text style={styles.rowLabel}>اشتراک</Text>
                  </View>
                )}
              </View>
            )}

            {hasDiscounts && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>انتخاب تخفیف یا هدیه</Text>
                {applyCredit && (
                  <Text style={styles.hint}>
                    با استفاده از اعتبار، تخفیف اعمال نمی‌شود.
                  </Text>
                )}
                {discounts.map((discount) => {
                  const selected = selectedDiscountId === discount.id && !applyCredit;
                  const disabled = applyCredit;
                  const title = isBirthdayDiscount(discount)
                    ? 'هدیه تولد'
                    : isAnniversaryDiscount(discount)
                      ? 'هدیه سالگرد ازدواج'
                      : discount.typeLabel || 'تخفیف';
                  return (
                    <TouchableOpacity
                      key={discount.id}
                      style={[
                        styles.discountOption,
                        isBirthdayDiscount(discount) && styles.birthdayChip,
                        isAnniversaryDiscount(discount) && styles.anniversaryChip,
                        selected && styles.discountOptionSelected,
                        disabled && styles.discountOptionDisabled,
                      ]}
                      onPress={() => {
                        if (disabled) return;
                        setSelectedDiscountId(discount.id);
                      }}
                      activeOpacity={disabled ? 1 : 0.85}
                    >
                      <View style={styles.discountOptionBody}>
                        <Text style={styles.discountStrong}>{formatDiscountValue(discount)}</Text>
                        <Text style={styles.discountMeta}> {title}</Text>
                        {!!discount.lineTitle && (
                          <Text style={styles.discountMeta}> · {discount.lineTitle}</Text>
                        )}
                        <Text style={styles.discountDate}> · تا {discount.toDate}</Text>
                      </View>
                      <View style={[styles.discountRadio, selected && styles.discountRadioActive]}>
                        {selected && <View style={styles.discountRadioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[
                    styles.discountOption,
                    styles.discountNoneOption,
                    selectedDiscountId == null && !applyCredit && styles.discountOptionSelected,
                    applyCredit && styles.discountOptionDisabled,
                  ]}
                  onPress={() => {
                    if (applyCredit) return;
                    setSelectedDiscountId(null);
                  }}
                  activeOpacity={applyCredit ? 1 : 0.85}
                >
                  <Text style={styles.discountNoneText}>بدون تخفیف</Text>
                  <View
                    style={[
                      styles.discountRadio,
                      selectedDiscountId == null && !applyCredit && styles.discountRadioActive,
                    ]}
                  >
                    {selectedDiscountId == null && !applyCredit && (
                      <View style={styles.discountRadioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {credit > 0 && (
              <View style={styles.switchRow}>
                <Switch
                  value={selectedOption === 'useCredit'}
                  onValueChange={(enabled) =>
                    setSelectedOption(enabled ? 'useCredit' : 'saveForLater')
                  }
                  trackColor={{ false: '#CCCCCC', true: '#81C784' }}
                  thumbColor={selectedOption === 'useCredit' ? '#4CAF50' : '#f4f3f4'}
                />
                <Text style={styles.optionText}>استفاده از اعتبار</Text>
              </View>
            )}

            <View style={styles.shareCard}>
              <View style={styles.shareHeader}>
                <Text style={styles.shareCardTitle}>اشتراک‌گذاری هوشمند</Text>
                {sharePreviewLoading && <ActivityIndicator size="small" color="#1abc9c" />}
              </View>
              {!sharingEnabled ? (
                <Text style={styles.shareHint}>برای این فروشگاه فعال نیست.</Text>
              ) : sharePreview.length > 0 ? (
                sharePreview.map((item) => (
                  <View key={item.businessId} style={styles.shareItem}>
                    <Text style={styles.shareTitle} numberOfLines={1}>
                      {item.businessTitle}
                    </Text>
                    <Text style={styles.shareMeta}>
                      <Text style={styles.sharePercent}>
                        {formatNumberWithSeparator(Number(item.discountPercent) || 0)}٪
                      </Text>
                      {' · '}
                      {formatNumberWithSeparator(Number(item.expirationDays) || 0)} روز
                      {item.distanceKm != null
                        ? ` · ${formatNumberWithSeparator(Number(item.distanceKm))} کم`
                        : ''}
                    </Text>
                  </View>
                ))
              ) : !sharePreviewLoading ? (
                <Text style={styles.shareHint}>فروشگاهی برای پیشنهاد نیست.</Text>
              ) : null}
            </View>
          </>
        )}
      </KeyboardAwareScrollView>

      <FooterBar
        top={
          <View style={styles.amountBar}>
            <View style={styles.amountRow}>
              <Text style={styles.amountValue}>
                {formatNumberWithSeparator(totalAmount)} {CURRENCY_LABEL}
              </Text>
              <Text style={styles.amountLabel}>مبلغ اصلی</Text>
            </View>
            {totalDiscountAmount > 0 && (
              <View style={styles.amountRow}>
                <Text style={[styles.amountValue, { color: colors.live }]}>
                  {formatNumberWithSeparator(totalDiscountAmount)} {CURRENCY_LABEL}-
                </Text>
                <Text style={styles.amountLabel}>تخفیف</Text>
              </View>
            )}
            {creditUsed > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountValue}>
                  {formatNumberWithSeparator(creditUsed)} {CURRENCY_LABEL}-
                </Text>
                <Text style={styles.amountLabel}>اعتبار</Text>
              </View>
            )}
            <View style={[styles.amountRow, styles.amountRowFinal]}>
              <Text style={styles.amountValueBold}>
                {formatNumberWithSeparator(finalAmountToPay)} {CURRENCY_LABEL}
              </Text>
              <Text style={styles.amountLabelBold}>قابل پرداخت</Text>
            </View>
          </View>
        }
      >
        {!customerReady ? (
          <FooterButton label="شماره مشتری را وارد کنید" disabled />
        ) : finalAmountToPay === 0 ? (
          <FooterButton label="ثبت" onPress={handleSubmit} />
        ) : (
          <>
            <FooterButton label="کارت‌خوان" flex={1.35} onPress={handleCardPayment} />
            <FooterButton label="نقدی" variant="secondary" onPress={handleCashPayment} />
          </>
        )}
      </FooterBar>

      <Modal
        visible={showMaxUsageModal}
        transparent
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
                <Text style={styles.bottomSheetTitle}>سقف استفاده به تفکیک سرویس</Text>
                <TouchableOpacity
                  onPress={() => setShowMaxUsageModal(false)}
                  style={styles.bottomSheetCloseButton}
                >
                  <Text style={styles.bottomSheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.bottomSheetBody}>
                {maxCreditUsage.maxUsagePerLine.map((item) => (
                  <View key={item.lineId} style={styles.bottomSheetLineItem}>
                    <Text style={styles.bottomSheetLineTitle}>{item.lineTitle}</Text>
                    <Text style={styles.bottomSheetLineValue}>
                      {formatNumberWithSeparator(item.maxUsage)} {CURRENCY_LABEL}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  summaryChip: {
    backgroundColor: colors.orangeTint,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  summaryChipText: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'right',
  },
  summaryChipSub: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.inkSoft,
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 8,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    backgroundColor: colors.surface,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  phoneInputError: {
    borderColor: colors.orange,
    borderWidth: 1.5,
  },
  errorMessage: {
    fontSize: 11,
    color: colors.danger,
    textAlign: 'right',
    marginTop: 6,
    fontFamily: fonts.regular,
  },
  loadingBox: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: colors.inkSoft,
    fontFamily: fonts.regular,
  },
  creditHeroCard: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.orange,
  },
  creditHeroTop: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
  },
  creditHeroLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  creditHeroLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.92)',
  },
  creditHeroAmount: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  creditHeroBottom: {
    backgroundColor: colors.orangeDeep,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditCeilingBlock: {
    alignItems: 'flex-end',
  },
  creditCeilingLabel: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 1,
  },
  creditCeilingValue: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  creditDetailsBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  creditDetailsBtnText: {
    color: colors.orangeDeep,
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 8,
  },
  newCustomerText: {
    fontSize: 11,
    color: colors.live,
    backgroundColor: colors.liveBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontFamily: fonts.regular,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rowLabel: {
    fontSize: 12,
    color: colors.inkSoft,
    fontFamily: fonts.regular,
  },
  rowValue: {
    fontSize: 13.5,
    color: colors.ink,
    fontFamily: fonts.bold,
  },
  discountOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.liveBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  discountOptionSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeTint,
  },
  discountOptionDisabled: {
    opacity: 0.55,
  },
  discountOptionBody: {
    flex: 1,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  discountNoneOption: {
    backgroundColor: colors.bg,
  },
  discountNoneText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  discountRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  discountRadioActive: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  discountRadioDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  birthdayChip: {
    backgroundColor: colors.orangeTint,
  },
  anniversaryChip: {
    backgroundColor: '#F3E8FF',
  },
  discountStrong: {
    fontSize: 12.5,
    color: colors.live,
    fontFamily: fonts.bold,
  },
  discountMeta: {
    fontSize: 11.5,
    color: colors.live,
    fontFamily: fonts.regular,
  },
  discountDate: {
    fontSize: 11.5,
    color: colors.inkSoft,
    fontFamily: fonts.regular,
  },
  hint: {
    fontSize: 11,
    color: colors.inkSoft,
    fontFamily: fonts.regular,
    textAlign: 'right',
    marginTop: 4,
  },
  optionText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  switchRow: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.line,
  },
  shareCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  shareHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  shareCardTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'right',
  },
  shareItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.liveBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
  },
  shareTitle: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  shareMeta: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.inkSoft,
    textAlign: 'left',
  },
  sharePercent: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: colors.live,
  },
  shareHint: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.inkSoft,
    textAlign: 'right',
  },
  amountBar: {
    backgroundColor: colors.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountRowFinal: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  amountLabel: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.inkSoft,
  },
  amountLabelBold: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  amountValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  amountValueBold: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.line,
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
    flex: 1,
    textAlign: 'right',
  },
  bottomSheetCloseButton: {
    padding: 4,
    marginLeft: 10,
  },
  bottomSheetCloseText: {
    fontSize: 22,
    color: colors.inkSoft,
    fontFamily: fonts.regular,
  },
  bottomSheetBody: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 360,
  },
  bottomSheetLineItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  bottomSheetLineTitle: {
    fontSize: 13.5,
    fontFamily: fonts.medium,
    color: colors.ink,
    flex: 1,
    textAlign: 'right',
  },
  bottomSheetLineValue: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginLeft: 12,
  },
});

export default Checkout;
