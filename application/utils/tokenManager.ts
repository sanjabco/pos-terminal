import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';
const BUSINESS_PROFILE_KEY = 'businessProfile';
const SELECTED_BRANCH_KEY = 'selectedBranch';

export interface UserData {
    id: string;
    phoneNumber: string;
    role: string;
}

export interface BusinessProfile {
    title: string;
    phone: string;
    email: string;
    logo: string;
    description: string;
    businessCategoryId: number;
    isVisible: boolean;
}

export interface Branch {
    id: number;
    title: string;
    lines: Array<{
        id: number;
        title: string;
    }>;
}

export class TokenManager {
    // Store authentication token
    static async storeToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
            console.log('Token stored successfully');
        } catch (error) {
            console.error('Error storing token:', error);
            throw error;
        }
    }

    // Retrieve authentication token
    static async getToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            return token;
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    // Store user data
    static async storeUserData(userData: UserData): Promise<void> {
        try {
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            console.log('User data stored successfully');
        } catch (error) {
            console.error('Error storing user data:', error);
            throw error;
        }
    }

    // Retrieve user data
    static async getUserData(): Promise<UserData | null> {
        try {
            const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
            if (userDataString) {
                return JSON.parse(userDataString);
            }
            return null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Store business profile
    static async storeBusinessProfile(profile: BusinessProfile): Promise<void> {
        try {
            await AsyncStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(profile));
            console.log('Business profile stored successfully');
        } catch (error) {
            console.error('Error storing business profile:', error);
            throw error;
        }
    }

    // Retrieve business profile
    static async getBusinessProfile(): Promise<BusinessProfile | null> {
        try {
            const profileString = await AsyncStorage.getItem(BUSINESS_PROFILE_KEY);
            if (profileString) {
                return JSON.parse(profileString);
            }
            return null;
        } catch (error) {
            console.error('Error getting business profile:', error);
            return null;
        }
    }

    // Check if user is authenticated
    static async isAuthenticated(): Promise<boolean> {
        try {
            const token = await this.getToken();
            return !!token;
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    }

    // Store selected branch
    static async storeSelectedBranch(branch: Branch): Promise<void> {
        try {
            await AsyncStorage.setItem(SELECTED_BRANCH_KEY, JSON.stringify(branch));
            console.log('Selected branch stored successfully');
        } catch (error) {
            console.error('Error storing selected branch:', error);
            throw error;
        }
    }

    // Retrieve selected branch
    static async getSelectedBranch(): Promise<Branch | null> {
        try {
            const branchString = await AsyncStorage.getItem(SELECTED_BRANCH_KEY);
            if (branchString) {
                return JSON.parse(branchString);
            }
            return null;
        } catch (error) {
            console.error('Error getting selected branch:', error);
            return null;
        }
    }

    // Clear all authentication data
    static async clearAuthData(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_DATA_KEY, BUSINESS_PROFILE_KEY, SELECTED_BRANCH_KEY]);
            console.log('Authentication data cleared successfully');
        } catch (error) {
            console.error('Error clearing authentication data:', error);
            throw error;
        }
    }

    // Get stored data for debugging
    static async getStoredData(): Promise<{ token: string | null; userData: UserData | null; businessProfile: BusinessProfile | null; selectedBranch: Branch | null }> {
        try {
            const result = await AsyncStorage.multiGet([TOKEN_KEY, USER_DATA_KEY, BUSINESS_PROFILE_KEY, SELECTED_BRANCH_KEY]);
            const token = result.find(([key]) => key === TOKEN_KEY)?.[1] || null;
            const userDataString = result.find(([key]) => key === USER_DATA_KEY)?.[1] || null;
            const businessProfileString = result.find(([key]) => key === BUSINESS_PROFILE_KEY)?.[1] || null;
            const selectedBranchString = result.find(([key]) => key === SELECTED_BRANCH_KEY)?.[1] || null;
            const userData = userDataString ? JSON.parse(userDataString) : null;
            const businessProfile = businessProfileString ? JSON.parse(businessProfileString) : null;
            const selectedBranch = selectedBranchString ? JSON.parse(selectedBranchString) : null;
            return {
                token,
                userData,
                businessProfile,
                selectedBranch,
            };
        } catch (error) {
            console.error('Error getting stored data:', error);
            return { token: null, userData: null, businessProfile: null, selectedBranch: null };
        }
    }
} 