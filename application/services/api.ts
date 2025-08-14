import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with default configuration
export const apiClient = axios.create({
    baseURL: 'https://api.sanjab.app/api', // Replace with your actual backend URL
    //baseURL: 'https://api.sanjab.barazman.dev/api', // Replace with your actual backend URL
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    async (config) => {
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
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common errors here
        if (error.response?.status === 401) {
            // Handle unauthorized access
            console.log('Unauthorized access');
        }
        return Promise.reject(error);
    }
);

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

    // Customer endpoints
    CUSTOMER: (cardNumber: string, branchId: number) => `/Customer/credit?cardNumber=${cardNumber}&branchId=${branchId}`,

    // Transaction endpoints
    TRANSACTION: '/Transaction',
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

export interface CustomerResponse {
    Message: string;
    Code: number;
    Data: Customer;
}

export interface Customer {
    credit: string;
    userPhoneNumber: string;
    subscriptionCode: string;
    name: string;
}

export interface CashBackDto {
    lineId: number;
    lineTitle: string;
    price: string;
    payFromCredit: number;
    description: string;
    PaymentMethod: string;
}

export interface TransactionRequest {
    cashBackDto: CashBackDto[];
    cardNumber: string;
    shouldSendMessage: boolean;
    branchId: number;
}

export interface TransactionResult {
    payFromCredit: number;
    payBackAmount: number;
    totalPrice: number;
    totalPriceWithoutCreditPayment: number;
}

export interface TransactionResponse {
    Message: string;
    Code: number;
    Data: {
        result: TransactionResult[];
    };
} 