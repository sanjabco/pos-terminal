import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://apiv2.sanjab.app/api';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }

  return headers;
};

export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT',
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method,
      headers: await getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    console.error('Network request failed:', {
      method,
      url,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // API returns business errors (e.g. 401) with JSON body — don't treat as transport failure
  validateStatus: status => status >= 200 && status < 500,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (!error.response) {
      console.error('Network request failed:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    } else if (error.response.status === 401) {
      console.log('Unauthorized access');
    }
    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.Message;
    if (typeof apiMessage === 'string' && apiMessage.length > 0) {
      return apiMessage;
    }
  }

  if (error instanceof Error) {
    if (
      error.message === 'Network Error' ||
      error.message === 'Network request failed'
    ) {
      return 'خطا در اتصال به سرور. لطفاً اتصال اینترنت دستگاه را بررسی کنید.';
    }

    if (error.message === 'Request timeout') {
      return 'زمان اتصال به سرور به پایان رسید. لطفاً دوباره تلاش کنید.';
    }
  }

  return fallback;
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN_OTP: '/otp',
  LOGIN_OTP_CHECK: '/otp/check',
  LOGOUT: '/otp/logout',

  // Payment endpoints
  PAYMENTS: '/payments',
  PAYMENT_BY_ID: (id: string) => `/payments/${id}`,
  CREATE_PAYMENT: '/payments',

  // Report endpoints
  REPORTS: '/reports',
  REPORT_BY_ID: (id: string) => `/reports/${id}`,

  // Service endpoints
  SERVICES: '/services',
  SERVICE_BY_ID: (id: string) => `/services/${id}`,

  // Branch endpoints
  BRANCHES: '/branch',
  BRANCH_BY_ID: (id: number) => `/branch/${id}`,

  // Line endpoints
  LINES_DROPDOWN: (branchId: number) => `/Line/dropdown/${branchId}`,

  // Credit endpoints
  CREDITS: '/credits',
  CREDIT_BY_ID: (id: string) => `/credits/${id}`,

  // Mobile endpoints
  MOBILE_OPERATORS: '/mobile/operators',
  MOBILE_RECHARGE: '/mobile/recharge',

  // Price endpoints
  PRICES: '/prices',
  PRICE_BY_ID: (id: string) => `/prices/${id}`,

  // User Profile endpoints
  USER_PROFILE: '/userprofile',

  // Business endpoints
  BUSINESS: '/Business',

  // Customer endpoints
  CUSTOMER: (cardNumber: string, branchId: number) =>
    `/Customer/credit?cardNumber=${cardNumber}&branchId=${branchId}`,

  // Transaction endpoints
  TRANSACTION: '/transaction',
  SHARE_DISCOUNT_PREVIEW: '/transaction/share-discount-preview',

  // Cashback endpoints
  CASHBACKS: '/cash-back',
} as const;

// Types for API responses
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface SendOtpRequest {
  phoneNumber: string;
}

export interface SendOtpResponse {
  Message: string;
  Code: number;
  Data: {
    expireDate: string;
  };
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  code: string;
}

export interface VerifyOtpResponse {
  Message: string;
  Code: number;
  Data: {
    token: string;
  };
}

export interface UserProfileResponse {
  Message: string;
  Code: number;
  Data: UserProfile;
}

export interface BranchesResponse {
  Message: string;
  Code: number;
  Data: {
    branches: Branch[];
  };
}

export interface BranchResponse {
  Message: string;
  Code: number;
  Data: {
    branch: Branch;
  };
}

export interface LinesDropdownResponse {
  Message: string;
  Code: number;
  Data: {
    lines: LineDetail[];
  };
}

export interface LineDetail {
  id: number;
  title: string;
  credit: number;
  branchSharePercentage: number;
  maxPayAmountByCashBack: number;
}

export interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  title: string;
  data: any;
  createdAt: string;
}

export interface Line {
  id: number;
  title: string;
}

export interface Branch {
  id: number;
  title: string;
  lines: Line[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface Credit {
  id: string;
  amount: number;
  balance: number;
  type: string;
}

export interface MobileOperator {
  id: string;
  name: string;
  code: string;
}

export interface Price {
  id: string;
  serviceId: string;
  amount: number;
  currency: string;
}

export interface UserProfile {
  title: string;
  phone: string;
  email: string;
  logo: string;
  description: string;
  businessCategoryId: number;
  isVisible: boolean;
}

export interface BusinessInfoResponse {
  Message: string;
  Code: number;
  Data: {
    title: string;
    phone: string;
    email: string;
    logo: string;
    description: string;
    businessCategoryId: number;
    isVisible: boolean;
  };
}

export interface CustomerResponse {
  Message: string;
  Code: number;
  Data: Customer;
}

export interface CustomerActiveDiscount {
  id: number;
  percent: number;
  fixedAmount?: number;
  type: number | string;
  typeLabel: string;
  toDate: string;
  lineId?: number;
  lineTitle?: string;
  branchId?: number;
}

export interface OccasionGift {
  giftType: string;
  amountTomans: number;
  discountPercent: number;
  itemDescription?: string | null;
  discountId?: number;
  creditId?: number;
  toDate: string;
}

export interface Customer {
  credit: string | number;
  creditInTomans?: number;
  userPhoneNumber: string;
  subscriptionCode?: string | null;
  name: string;
  discounts?: CustomerActiveDiscount[];
  isNewCustomer?: boolean;
  isFirstBuyEligible?: boolean;
  birthdayGift?: OccasionGift | null;
  anniversaryGift?: OccasionGift | null;
}

export interface CashBackDto {
  lineId: number;
  lineTitle: string;
  price: string | number;
  payFromCredit: number;
  paidByCash?: number;
  description: string;
  PaymentMethod: string;
}

export interface TransactionRequest {
  cashBackDto: CashBackDto[];
  cardNumber: string;
  shouldSendMessage: boolean;
  branchId: number;
  applyCredit?: boolean;
  applyDiscount?: boolean;
  discountId?: number;
  confirmNewCustomer?: boolean;
  customerName?: string;
}

export interface TransactionResult {
  payFromCredit: number;
  payBackAmount: number;
  totalPrice: number;
  totalPriceWithoutCreditPayment: number;
  discountAmount?: number;
}

export interface ShareDiscountPreviewItem {
  businessId: number;
  businessTitle: string;
  discountPercent: number;
  expirationDays: number;
  distanceKm?: number | null;
}

export interface ShareDiscountPreviewRequest {
  phoneNumber: string;
  branchId: number;
  amount?: number;
  lineIds?: number[];
}

export interface ShareDiscountPreviewResponse {
  Message: string;
  Code: number;
  Data: {
    sharingEnabled: boolean;
    items: ShareDiscountPreviewItem[];
  };
}

export interface TransactionResponse {
  Message: string;
  Code: number;
  Data: {
    result: TransactionResult[];
  };
}

export interface CashBack {
  id: number;
  cashBackPercentage: number;
  branchSharePercentage: number;
  maxCashBackCreditPay: string;
  fromDate: string;
  toDate: string;
  expirationInDays: number;
  lineId: number;
  lineTitle: string;
  branchId: number;
  branchTitle: string;
  businessId: number;
}

export interface CashBacksResponse {
  Message: string;
  Code: number;
  Data: {
    cashBackModel: CashBack[];
  };
}
