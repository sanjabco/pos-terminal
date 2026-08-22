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
import type { Customer, CustomerActiveDiscount, OccasionGift, ShareDiscountPreviewItem } from '../services/api';
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

const isShareClubDiscount = (d: CustomerActiveDiscount) => {
  const type = Number(d.type);
  return type === 3 || String(d.type).toLowerCase() === 'shareclub' || d.typeLabel?.includes('اشتراک');
};

const discountPercentOf = (discount: CustomerActiveDiscount) => Number(discount.percent) || 0;
const discountFixedOf = (discount: CustomerActiveDiscount) =>
  discountPercentOf(discount) > 0 ? 0 : Number(discount.fixedAmount) || 0;

const STACK_PALETTE = [
  { bg: '#F5A623', deep: '#C47C08' },
  { bg: '#E53935', deep: '#B71C1C' },
  { bg: '#2C2C2E', deep: '#1C1C1E' },
  { bg: '#6C4DFF', deep: '#4C33C9' },
  { bg: '#2F8F5B', deep: '#1F6B42' },
  { bg: '#12998C', deep: '#0B6F66' },
  { bg: '#FF6B3D', deep: '#C4471A' },
];

const STACK_CARD_HEIGHT = 156;
const STACK_PEEK = 58;
const STACK_OVERLAP = STACK_CARD_HEIGHT - STACK_PEEK;

type OccasionOption = CustomerActiveDiscount & {
  applyAs: 'discount' | 'credit' | 'item';
  kind: 'birthday' | 'anniversary';
};

const giftToOccasionOption = (
  gift: OccasionGift | null | undefined,
  kind: 'birthday' | 'anniversary',
): OccasionOption | null => {
  if (!gift) return null;
  const type = kind === 'birthday' ? 4 : 5;
  const typeLabel = kind === 'birthday' ? 'هدیه تولد' : 'هدیه سالگرد ازدواج';
  const giftType = String(gift.giftType || '').toLowerCase();
  const toDate = gift.toDate || '';

  if (giftType === 'discount' || (giftType !== 'cash' && giftType !== 'item' && Number(gift.discountPercent) > 0)) {
    const id = Number(gift.discountId) || (kind === 'birthday' ? -4 : -5);
    if (Number(gift.discountPercent) <= 0 && !gift.discountId) return null;
    return {
      id,
      percent: Number(gift.discountPercent) || 0,
      type,
      typeLabel,
      toDate,
      applyAs: 'discount',
      kind,
    };
  }

  if (giftType === 'cash' && Number(gift.amountTomans) > 0 && Number(gift.creditId) > 0) {
    return {
      id: Number(gift.creditId),
      percent: 0,
      fixedAmount: Number(gift.amountTomans) || 0,
      type,
      typeLabel,
      toDate,
      applyAs: 'credit',
      kind,
    };
  }

  if (giftType === 'item') {
    return {
      id: Number(gift.discountId) || (kind === 'birthday' ? -4 : -5),
      percent: 0,
      type,
      typeLabel: gift.itemDescription?.trim() ? `${typeLabel}: ${gift.itemDescription}` : typeLabel,
      toDate,
      applyAs: 'item',
      kind,
    };
  }

  return null;
};

const occasionCashAmountOf = (gift?: OccasionGift | null): number => {
  if (!gift || String(gift.giftType || '').toLowerCase() !== 'cash') return 0;
  return Number(gift.amountTomans) || 0;
};

const buildOccasionOptions = (
  discounts: CustomerActiveDiscount[],
  birthdayGift?: OccasionGift | null,
  anniversaryGift?: OccasionGift | null,
): OccasionOption[] => {
  const fromDiscounts = discounts.filter(isOccasionDiscount);

  const pickForKind = (
    kind: 'birthday' | 'anniversary',
    fromGift: OccasionOption | null,
  ): OccasionOption | null => {
    const fromList = fromDiscounts
      .filter((discount) => (kind === 'birthday' ? isBirthdayDiscount(discount) : isAnniversaryDiscount(discount)))
      .map((discount) => ({
        ...discount,
        applyAs: 'discount' as const,
        kind,
      }));

    if (fromGift?.applyAs && fromGift.applyAs !== 'discount') {
      return fromGift;
    }
    if (fromGift && Number(fromGift.id) > 0) {
      return fromGift;
    }
    if (fromList[0]) {
      return fromList[0];
    }
    return fromGift;
  };

  return [
    pickForKind('birthday', giftToOccasionOption(birthdayGift, 'birthday')),
    pickForKind('anniversary', giftToOccasionOption(anniversaryGift, 'anniversary')),
  ].filter((option): option is OccasionOption => option != null);
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
  const [newCustomerName, setNewCustomerName] = useState('');
  const [frontCardKey, setFrontCardKey] = useState<string | null>(null);

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
  const otherDiscounts = discounts.filter((d) => !isOccasionDiscount(d));
  const occasionOptions = useMemo(
    () => buildOccasionOptions(discounts, customerData?.birthdayGift, customerData?.anniversaryGift),
    [discounts, customerData?.birthdayGift, customerData?.anniversaryGift],
  );
  const selectedOccasion = occasionOptions.find((option) => option.id === selectedDiscountId) ?? null;
  const applyOccasionCredit = selectedOccasion?.applyAs === 'credit';
  const occasionCreditAmount = applyOccasionCredit ? Number(selectedOccasion?.fixedAmount) || 0 : 0;
  const applyWalletCredit = selectedOption === 'useCredit' && credit > 0 && !applyOccasionCredit;
  const applyCredit = applyWalletCredit || applyOccasionCredit;
  const applyDiscount =
    selectedDiscountId != null &&
    !applyWalletCredit &&
    !applyOccasionCredit &&
    selectedOccasion?.applyAs !== 'item';
  const selectedDiscount =
    (selectedOccasion?.applyAs === 'discount' ? selectedOccasion : null)
    ?? discounts.find((d) => d.id === selectedDiscountId)
    ?? null;
  const customerReady = Boolean(customerData) && isValidPhone && !customerLoading;

  const pickBestDiscountId = (list: Array<CustomerActiveDiscount | OccasionOption>): number | null => {
    if (!list.length) return null;
    const occasion = list.filter((item) => 'applyAs' in item || isOccasionDiscount(item));
    const pool = occasion.length ? occasion : list;
    const sorted = [...pool].sort((a, b) => {
      const aFixed = discountFixedOf(a);
      const bFixed = discountFixedOf(b);
      if (aFixed !== bFixed) return bFixed - aFixed;
      return discountPercentOf(b) - discountPercentOf(a);
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
        setNewCustomerName('');
        return;
      }

      if (customerResponse?.Code === 200 && customerResponse?.Data) {
        const data = customerResponse.Data;
        const totalCredit = parseAmount(data.credit);
        const reservedOccasionCash =
          occasionCashAmountOf(data.birthdayGift) + occasionCashAmountOf(data.anniversaryGift);
        const walletCredit = Math.max(0, totalCredit - reservedOccasionCash);
        const options = buildOccasionOptions(
          data.discounts || [],
          data.birthdayGift,
          data.anniversaryGift,
        );
        const bestId = pickBestDiscountId(options.length ? options : (data.discounts || []));
        setCustomerData(data);
        setCredit(walletCredit);
        setSelectedDiscountId(bestId);
        setSelectedOption(
          options.length === 0 && walletCredit > 0 ? 'useCredit' : 'saveForLater',
        );
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

  useEffect(() => {
    if (!selectedDiscount || !isShareClubDiscount(selectedDiscount) || selectedServices.length === 0) {
      return;
    }
    if (activeCashbacks.length === 0) {
      return;
    }
    const allLinesHaveCashback = selectedServices.every((service) =>
      activeCashbacks.some((cb: any) => Number(cb.lineId) === Number(service.id)),
    );
    if (allLinesHaveCashback) {
      setSelectedDiscountId(null);
    }
  }, [selectedDiscount, selectedServices, activeCashbacks]);

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
    if (
      isShareClubDiscount(selectedDiscount) &&
      activeCashbacks.some((cb: any) => Number(cb.lineId) === Number(lineId))
    ) {
      return null;
    }
    const branchOk =
      selectedDiscount.branchId == null || Number(selectedDiscount.branchId) === branchId;
    const lineOk =
      selectedDiscount.lineId == null || Number(selectedDiscount.lineId) === Number(lineId);
    return branchOk && lineOk ? selectedDiscount : null;
  };

  const linePreviews: LinePreview[] = useMemo(() => {
    const servicesWithPrices = getServicesWithPrices();
    let remainingCredit = applyOccasionCredit
      ? occasionCreditAmount
      : applyWalletCredit
        ? credit
        : 0;
    const shouldApplyDiscount = applyDiscount;
    let remainingFixedDiscount = selectedDiscount ? discountFixedOf(selectedDiscount) : 0;

    return servicesWithPrices.map((service) => {
      const price = parseAmount(service.amount);
      const lineId = parseInt(service.id, 10);
      const applicableDiscount = shouldApplyDiscount ? getApplicableDiscount(lineId) : null;
      let discountAmount = 0;
      if (applicableDiscount && price > 0) {
        const percent = discountPercentOf(applicableDiscount);
        const fixed = discountFixedOf(applicableDiscount);
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
        adjustedPrice,
        payFromCredit: Math.round(payFromCredit),
        cashPayment: Math.max(0, adjustedPrice - payFromCredit),
      };
    });
  }, [
    selectedServices,
    applyWalletCredit,
    applyOccasionCredit,
    occasionCreditAmount,
    credit,
    applyDiscount,
    selectedDiscountId,
    discounts,
    linesData,
    activeCashbacks,
    selectedDiscount,
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

  const spendableCredit = applyOccasionCredit ? occasionCreditAmount : credit;
  const usageCeiling = Math.min(spendableCredit, maxCreditUsage.totalMaxUsage || spendableCredit);

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
    const percent = discountPercentOf(discount);
    const fixed = discountFixedOf(discount);
    if (percent > 0) return `${percent}%`;
    if (fixed > 0) return `${formatNumberWithSeparator(fixed)} ${CURRENCY_LABEL}`;
    return discount.typeLabel || 'هدیه';
  };

  const formatOccasionOption = (option: OccasionOption) => {
    if (option.applyAs === 'discount') {
      return formatDiscountValue(option);
    }
    if (option.applyAs === 'credit') {
      return `${formatNumberWithSeparator(Number(option.fixedAmount) || 0)} ${CURRENCY_LABEL}`;
    }
    return option.typeLabel?.replace(/^هدیه تولد:\s*/, '').replace(/^هدیه سالگرد ازدواج:\s*/, '') || option.typeLabel;
  };

  const selectOccasionOption = (option: OccasionOption) => {
    setSelectedDiscountId(option.id);
    setSelectedOption('saveForLater');
  };

  const benefitCards = useMemo(() => {
    const cards: Array<{
      key: string;
      kind: 'credit' | 'occasion' | 'discount';
      label: string;
      amount: string;
      metaLabel: string;
      metaValue?: string;
      bg: string;
      deep: string;
      selected: boolean;
      onPress: () => void;
      onSkip: () => void;
      onDetail?: () => void;
      actionLabel: string;
    }> = [];

    if (credit > 0) {
      const selected = applyWalletCredit;
      cards.push({
        key: 'credit',
        kind: 'credit',
        label: 'اعتبار قابل استفاده',
        amount: `${formatNumberWithSeparator(credit)} ${CURRENCY_LABEL}`,
        metaLabel: 'سقف استفاده',
        metaValue: `${formatNumberWithSeparator(Math.min(credit, maxCreditUsage.totalMaxUsage || credit))} ${CURRENCY_LABEL}`,
        bg: STACK_PALETTE[0].bg,
        deep: STACK_PALETTE[0].deep,
        selected,
        onPress: () => {
          setSelectedOption('useCredit');
          setSelectedDiscountId(null);
        },
        onSkip: () => setSelectedOption('saveForLater'),
        onDetail: () => setShowMaxUsageModal(true),
        actionLabel: selected ? 'اعمال نشود' : 'اعمال',
      });
    }

    occasionOptions.forEach((option) => {
      const title = option.kind === 'birthday' ? 'هدیه تولد' : 'هدیه سالگرد ازدواج';
      const selected = selectedDiscountId === option.id;
      cards.push({
        key: `occasion-${option.kind}-${option.id}`,
        kind: 'occasion',
        label: title,
        amount: formatOccasionOption(option),
        metaLabel: option.toDate ? 'مهلت استفاده' : title,
        metaValue: option.toDate ? `تا ${option.toDate}` : undefined,
        bg: STACK_PALETTE[cards.length % STACK_PALETTE.length].bg,
        deep: STACK_PALETTE[cards.length % STACK_PALETTE.length].deep,
        selected,
        onPress: () => selectOccasionOption(option),
        onSkip: () => {
          if (selectedDiscountId === option.id) {
            setSelectedDiscountId(null);
          }
        },
        actionLabel: selected ? 'اعمال نشود' : 'اعمال',
      });
    });

    otherDiscounts.forEach((discount) => {
      const theme = STACK_PALETTE[cards.length % STACK_PALETTE.length];
      const selected = selectedDiscountId === discount.id && !applyWalletCredit;
      const metaParts = [
        discount.lineTitle,
        discount.toDate ? `تا ${discount.toDate}` : '',
      ].filter(Boolean);
      cards.push({
        key: `discount-${discount.id}`,
        kind: 'discount',
        label: discount.typeLabel || 'تخفیف',
        amount: formatDiscountValue(discount),
        metaLabel: metaParts[0] || 'تخفیف فعال',
        metaValue: metaParts[1],
        bg: theme.bg,
        deep: theme.deep,
        selected,
        onPress: () => {
          setSelectedDiscountId(discount.id);
          setSelectedOption('saveForLater');
        },
        onSkip: () => {
          if (selectedDiscountId === discount.id) {
            setSelectedDiscountId(null);
          }
        },
        actionLabel: selected ? 'اعمال نشود' : 'اعمال',
      });
    });

    return cards;
  }, [
    credit,
    maxCreditUsage.totalMaxUsage,
    applyWalletCredit,
    occasionOptions,
    otherDiscounts,
    selectedDiscountId,
  ]);

  useEffect(() => {
    if (!benefitCards.length) {
      setFrontCardKey(null);
      return;
    }
    if (frontCardKey && benefitCards.some((card) => card.key === frontCardKey)) {
      return;
    }
    const selected = benefitCards.find((card) => card.selected);
    setFrontCardKey(selected?.key || benefitCards[0].key);
  }, [benefitCards, frontCardKey]);

  const stackedCards = useMemo(() => {
    if (!benefitCards.length) {
      return { behind: [] as typeof benefitCards, front: null as (typeof benefitCards)[0] | null };
    }
    const activeKey = frontCardKey && benefitCards.some((card) => card.key === frontCardKey)
      ? frontCardKey
      : benefitCards.find((card) => card.selected)?.key || benefitCards[0].key;
    return {
      behind: benefitCards.filter((card) => card.key !== activeKey),
      front: benefitCards.find((card) => card.key === activeKey) || benefitCards[0],
    };
  }, [benefitCards, frontCardKey]);

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
    const trimmedName = newCustomerName.trim();

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
      ...(selectedDiscountId != null && selectedDiscountId > 0
        ? { discountId: selectedDiscountId }
        : {}),
      confirmNewCustomer: isNewCustomer,
      ...(isNewCustomer ? { customerName: trimmedName || 'مشتری جدید' } : {}),
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

        {customerReady && customerData && benefitCards.length > 0 && (
          <View style={styles.stack}>
            {[...stackedCards.behind, ...stackedCards.front ? [stackedCards.front] : []].map((card, index) => {
              const isFront = card.key === stackedCards.front?.key;
              return (
                <TouchableOpacity
                  key={card.key}
                  activeOpacity={0.92}
                  onPress={() => {
                    setFrontCardKey(card.key);
                    if (!card.selected) {
                      card.onPress();
                    }
                  }}
                  style={[
                    styles.stackCard,
                    index === 0 ? styles.stackCardFirst : null,
                    { backgroundColor: card.bg, zIndex: index + 1 },
                    isFront && styles.stackCardFront,
                  ]}
                >
                  <View style={styles.stackHeader}>
                    <View style={styles.stackTitleRow}>
                      {card.kind === 'credit' ? (
                        <MoneyIcon width={18} height={18} />
                      ) : (
                        <View style={styles.stackIconDot} />
                      )}
                      <Text style={styles.stackTitle} numberOfLines={1}>{card.label}</Text>
                    </View>
                    <View style={styles.stackAmountPill}>
                      <Text style={styles.stackAmountText} numberOfLines={1}>{card.amount}</Text>
                    </View>
                  </View>
                  <View style={styles.stackBody}>
                    <View style={styles.stackMetaRow}>
                      {!!card.metaValue ? (
                        <Text style={styles.stackBodyMeta}>
                          {card.metaLabel} · {card.metaValue}
                        </Text>
                      ) : (
                        <Text style={styles.stackBodyMeta}>{card.metaLabel}</Text>
                      )}
                      {!!card.onDetail && (
                        <TouchableOpacity onPress={card.onDetail} activeOpacity={0.85} hitSlop={8}>
                          <Text style={styles.stackDetailText}>جزئیات</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.stackActionBtn}
                      onPress={card.selected ? card.onSkip : card.onPress}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.stackActionText}>{card.actionLabel}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
            {/* {stackedCards.front?.selected ? (
              <TouchableOpacity
                style={styles.skipLink}
                onPress={stackedCards.front.onSkip}
                activeOpacity={0.8}
              >
                <Text style={styles.skipLinkText}>اعمال نشود</Text>
              </TouchableOpacity>
            ) : null} */}
          </View>
        )}

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
                {customerData.isNewCustomer && (
                  <TextInput
                    style={[styles.phoneInput, { marginTop: 8 }]}
                    value={newCustomerName}
                    onChangeText={setNewCustomerName}
                    placeholder="نام مشتری (اختیاری)"
                    placeholderTextColor="#999"
                    textAlign="right"
                  />
                )}
                {!!customerData.subscriptionCode && (
                  <View style={styles.row}>
                    <Text style={styles.rowValue}>{customerData.subscriptionCode}</Text>
                    <Text style={styles.rowLabel}>اشتراک</Text>
                  </View>
                )}
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
        compact
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
          <FooterButton compact label="شماره مشتری را وارد کنید" disabled />
        ) : finalAmountToPay === 0 ? (
          <FooterButton compact label="ثبت" onPress={handleSubmit} />
        ) : (
          <>
            <FooterButton compact label="کارت‌خوان" flex={1.35} onPress={handleCardPayment} />
            <FooterButton compact label="نقدی" variant="secondary" onPress={handleCashPayment} />
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
    </View >
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
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
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 4,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 15,
    backgroundColor: colors.surface,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  phoneInputError: {
    borderColor: colors.orange,
    borderWidth: 1.5,
  },
  errorMessage: {
    fontSize: 10,
    color: colors.danger,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  loadingBox: {
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  loadingText: {
    fontSize: 12,
    color: colors.inkSoft,
    fontFamily: fonts.regular,
  },
  stack: {
    marginTop: 12,
  },
  stackCard: {
    height: STACK_CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: -STACK_OVERLAP,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  stackCardFirst: {
    marginTop: 0,
  },
  stackCardFront: {
    elevation: 12,
    shadowOpacity: 0.3,
  },
  stackHeader: {
    height: STACK_PEEK,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  stackTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  stackIconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  stackTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  stackAmountPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '46%',
  },
  stackAmountText: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    textAlign: 'left',
  },
  stackBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    justifyContent: 'space-between',
  },
  stackMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  stackBodyMeta: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'right',
  },
  stackDetailText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: 'rgba(255,255,255,0.95)',
  },
  stackActionBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  stackActionText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  skipLink: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 50,
  },
  skipLinkText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.inkSoft,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 18,
  },
  amountRowFinal: {
    marginTop: 2,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  amountLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.inkSoft,
  },
  amountLabelBold: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  amountValue: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  amountValueBold: {
    fontSize: 13.5,
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
