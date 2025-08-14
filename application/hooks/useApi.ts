import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS, type ApiResponse, type SendOtpRequest, type SendOtpResponse, type VerifyOtpRequest, type VerifyOtpResponse, type Payment, type Report, type Service, type Credit, type MobileOperator, type Price, type UserProfile, type UserProfileResponse, type Branch, type Line, type BranchesResponse, type BranchResponse, type LinesDropdownResponse, type Customer, type CustomerResponse, type TransactionRequest, type TransactionResponse } from '../services/api';
import { TokenManager } from '../utils/tokenManager';

// Query keys for React Query
export const queryKeys = {
    // Auth
    auth: ['auth'] as const,

    // Payments
    payments: ['payments'] as const,
    payment: (id: string) => ['payments', id] as const,

    // Reports
    reports: ['reports'] as const,
    report: (id: string) => ['reports', id] as const,

    // Services
    services: ['services'] as const,
    service: (id: string) => ['services', id] as const,

    // Branches
    branches: ['branches'] as const,
    branch: (id: number) => ['branches', id] as const,

    // Lines
    lines: ['lines'] as const,
    linesDropdown: (branchId: number) => ['lines', 'dropdown', branchId] as const,

    // Credits
    credits: ['credits'] as const,
    credit: (id: string) => ['credits', id] as const,

    // Mobile
    mobileOperators: ['mobile', 'operators'] as const,

    // Prices
    prices: ['prices'] as const,
    price: (id: string) => ['prices', id] as const,

    // User Profile
    userProfile: ['userProfile'] as const,

    // Customer
    customer: (cardNumber: string, branchId: number) => ['customer', cardNumber, branchId] as const,
} as const;

// Authentication hooks
export const useSendOtp = () => {
    return useMutation({
        mutationFn: async (request: SendOtpRequest): Promise<SendOtpResponse> => {
            const response = await apiClient.post(API_ENDPOINTS.LOGIN_OTP, request);
            return response.data;
        },
    });
};

export const useVerifyOtp = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
            const response = await apiClient.post(API_ENDPOINTS.LOGIN_OTP_CHECK, request);
            return response.data;
        },
        onSuccess: async (data) => {
            // Store token in AsyncStorage or secure storage if login successful
            if (data.Code === 200 && data.Data?.token) {
                try {
                    await TokenManager.storeToken(data.Data.token);
                    console.log('Token stored successfully');
                } catch (error) {
                    console.error('Error storing token:', error);
                }
            }

            // Invalidate and refetch user data
            queryClient.invalidateQueries({ queryKey: queryKeys.auth });
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (): Promise<void> => {
            await apiClient.post(API_ENDPOINTS.LOGOUT);
        },
        onSuccess: async () => {
            // Clear token and user data from storage
            try {
                await TokenManager.clearAuthData();
                console.log('Authentication data cleared successfully');
            } catch (error) {
                console.error('Error clearing authentication data:', error);
            }

            // Clear all queries
            queryClient.clear();
        },
    });
};

// Payment hooks
export const usePayments = () => {
    return useQuery({
        queryKey: queryKeys.payments,
        queryFn: async (): Promise<ApiResponse<Payment[]>> => {
            const response = await apiClient.get(API_ENDPOINTS.PAYMENTS);
            return response.data;
        },
    });
};

export const usePayment = (id: string) => {
    return useQuery({
        queryKey: queryKeys.payment(id),
        queryFn: async (): Promise<ApiResponse<Payment>> => {
            const response = await apiClient.get(API_ENDPOINTS.PAYMENT_BY_ID(id));
            return response.data;
        },
        enabled: !!id,
    });
};

export const useCreatePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (paymentData: Partial<Payment>): Promise<ApiResponse<Payment>> => {
            const response = await apiClient.post(API_ENDPOINTS.CREATE_PAYMENT, paymentData);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate payments list
            queryClient.invalidateQueries({ queryKey: queryKeys.payments });
        },
    });
};

// Report hooks
export const useReports = () => {
    return useQuery({
        queryKey: queryKeys.reports,
        queryFn: async (): Promise<ApiResponse<Report[]>> => {
            const response = await apiClient.get(API_ENDPOINTS.REPORTS);
            return response.data;
        },
    });
};

export const useReport = (id: string) => {
    return useQuery({
        queryKey: queryKeys.report(id),
        queryFn: async (): Promise<ApiResponse<Report>> => {
            const response = await apiClient.get(API_ENDPOINTS.REPORT_BY_ID(id));
            return response.data;
        },
        enabled: !!id,
    });
};

// Service hooks (using branches and lines)
export const useServices = () => {
    return useQuery({
        queryKey: queryKeys.branches,
        queryFn: async (): Promise<BranchesResponse> => {
            const response = await apiClient.get(API_ENDPOINTS.BRANCHES);
            return response.data;
        },
        select: (data) => {
            // Transform branches data to extract all lines as services
            if (data.Code === 200 && data.Data?.branches) {
                const allLines: Line[] = [];
                data.Data.branches.forEach(branch => {
                    allLines.push(...branch.lines);
                });
                return {
                    ...data,
                    Data: {
                        services: allLines
                    }
                };
            }
            return data;
        },
    });
};

export const useBranches = () => {
    return useQuery({
        queryKey: queryKeys.branches,
        queryFn: async (): Promise<BranchesResponse> => {
            const response = await apiClient.get(API_ENDPOINTS.BRANCHES);
            return response.data;
        },
    });
};

export const useBranch = (id: number) => {
    return useQuery({
        queryKey: queryKeys.branch(id),
        queryFn: async (): Promise<BranchResponse> => {
            const response = await apiClient.get(API_ENDPOINTS.BRANCH_BY_ID(id));
            return response.data;
        },
        enabled: !!id,
    });
};

export const useLinesDropdown = (branchId: number) => {
    return useQuery({
        queryKey: queryKeys.linesDropdown(branchId),
        queryFn: async (): Promise<LinesDropdownResponse> => {
            const response = await apiClient.get(API_ENDPOINTS.LINES_DROPDOWN(branchId));
            return response.data;
        },
        enabled: !!branchId,
    });
};

// Credit hooks
export const useCredits = () => {
    return useQuery({
        queryKey: queryKeys.credits,
        queryFn: async (): Promise<ApiResponse<Credit[]>> => {
            const response = await apiClient.get(API_ENDPOINTS.CREDITS);
            return response.data;
        },
    });
};

export const useCredit = (id: string) => {
    return useQuery({
        queryKey: queryKeys.credit(id),
        queryFn: async (): Promise<ApiResponse<Credit>> => {
            const response = await apiClient.get(API_ENDPOINTS.CREDIT_BY_ID(id));
            return response.data;
        },
        enabled: !!id,
    });
};

// Mobile hooks
export const useMobileOperators = () => {
    return useQuery({
        queryKey: queryKeys.mobileOperators,
        queryFn: async (): Promise<ApiResponse<MobileOperator[]>> => {
            const response = await apiClient.get(API_ENDPOINTS.MOBILE_OPERATORS);
            return response.data;
        },
    });
};

export const useMobileRecharge = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (rechargeData: { operatorId: string; phoneNumber: string; amount: number }): Promise<ApiResponse<any>> => {
            const response = await apiClient.post(API_ENDPOINTS.MOBILE_RECHARGE, rechargeData);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: queryKeys.credits });
        },
    });
};

// Price hooks
export const usePrices = () => {
    return useQuery({
        queryKey: queryKeys.prices,
        queryFn: async (): Promise<ApiResponse<Price[]>> => {
            const response = await apiClient.get(API_ENDPOINTS.PRICES);
            return response.data;
        },
    });
};

export const usePrice = (id: string) => {
    return useQuery({
        queryKey: queryKeys.price(id),
        queryFn: async (): Promise<ApiResponse<Price>> => {
            const response = await apiClient.get(API_ENDPOINTS.PRICE_BY_ID(id));
            return response.data;
        },
        enabled: !!id,
    });
};

// User Profile hooks
export const useUserProfile = () => {
    return useQuery({
        queryKey: queryKeys.userProfile,
        queryFn: async (): Promise<UserProfileResponse> => {
            const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
            return response.data;
        },
    });
};

export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profileData: Partial<UserProfile>): Promise<UserProfileResponse> => {
            const response = await apiClient.put(API_ENDPOINTS.USER_PROFILE, profileData);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate user profile data
            queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
        },
    });
};

// Customer hooks
export const useCustomer = (cardNumber: string, branchId: number) => {
    return useQuery({
        queryKey: queryKeys.customer(cardNumber, branchId),
        queryFn: async (): Promise<CustomerResponse> => {
            const response = await apiClient.get(API_ENDPOINTS.CUSTOMER(cardNumber, branchId));
            return response.data;
        },
        enabled: !!cardNumber && !!branchId,
    });
};

// Transaction hooks
export const useCreateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (transactionData: TransactionRequest): Promise<TransactionResponse> => {
            const response = await apiClient.post(API_ENDPOINTS.TRANSACTION, transactionData);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: queryKeys.credits });
        },
    });
}; 