export const CURRENCY_LABEL = 'ریال';

export const formatNumberWithSeparator = (num: number): string => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatPrice = (num: number): string =>
  `${formatNumberWithSeparator(num)} ${CURRENCY_LABEL}`;

export const formatAmountInput = (text: string): string => {
  const cleanText = text.replace(/[^\d.]/g, '');
  const parts = cleanText.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};
