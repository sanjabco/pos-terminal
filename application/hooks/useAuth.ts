import { useState, useEffect } from 'react';
import { TokenManager, type UserData, type BusinessProfile, type Branch } from '../utils/tokenManager';

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    userData: UserData | null;
    businessProfile: BusinessProfile | null;
    selectedBranch: Branch | null;
    token: string | null;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        userData: null,
        businessProfile: null,
        selectedBranch: null,
        token: null,
    });

    // Check authentication status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));

            const [token, userData, businessProfile, selectedBranch] = await Promise.all([
                TokenManager.getToken(),
                TokenManager.getUserData(),
                TokenManager.getBusinessProfile(),
                TokenManager.getSelectedBranch(),
            ]);

            setAuthState({
                isAuthenticated: !!token,
                isLoading: false,
                userData,
                businessProfile,
                selectedBranch,
                token,
            });
        } catch (error) {
            console.error('Error checking auth status:', error);
            setAuthState({
                isAuthenticated: false,
                isLoading: false,
                userData: null,
                businessProfile: null,
                selectedBranch: null,
                token: null,
            });
        }
    };

    const login = async (token: string, userData?: UserData) => {
        try {
            await TokenManager.storeToken(token);
            if (userData) {
                await TokenManager.storeUserData(userData);
            }

            setAuthState({
                isAuthenticated: true,
                isLoading: false,
                userData: userData || null,
                businessProfile: null,
                selectedBranch: null,
                token,
            });

            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    };

    const setSelectedBranch = async (branch: Branch) => {
        try {
            await TokenManager.storeSelectedBranch(branch);
            setAuthState(prev => ({
                ...prev,
                selectedBranch: branch,
            }));
            return true;
        } catch (error) {
            console.error('Error setting selected branch:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await TokenManager.clearAuthData();
            setAuthState({
                isAuthenticated: false,
                isLoading: false,
                userData: null,
                businessProfile: null,
                selectedBranch: null,
                token: null,
            });
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    };

    const refreshAuth = () => {
        checkAuthStatus();
    };

    return {
        ...authState,
        login,
        logout,
        refreshAuth,
        setSelectedBranch,
    };
}; 