import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { queryClient } from '../providers/QueryProvider';
import { TokenManager, type UserData, type BusinessProfile, type Branch } from '../utils/tokenManager';

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    userData: UserData | null;
    businessProfile: BusinessProfile | null;
    selectedBranch: Branch | null;
    token: string | null;
}

interface AuthContextValue extends AuthState {
    login: (token: string, userData?: UserData) => Promise<boolean>;
    logout: () => Promise<boolean>;
    refreshAuth: () => void;
    setSelectedBranch: (branch: Branch) => Promise<boolean>;
    setBusinessProfile: (businessProfile: BusinessProfile) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialAuthState: AuthState = {
    isAuthenticated: false,
    isLoading: true,
    userData: null,
    businessProfile: null,
    selectedBranch: null,
    token: null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>(initialAuthState);

    const checkAuthStatus = useCallback(async () => {
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
                ...initialAuthState,
                isLoading: false,
            });
        }
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const login = useCallback(async (token: string, userData?: UserData) => {
        try {
            // Clear previous session cache/branch so the new account never reuses them
            queryClient.clear();
            await TokenManager.clearSelectedBranch();
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
    }, []);

    const setSelectedBranch = useCallback(async (branch: Branch) => {
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
    }, []);

    const setBusinessProfile = useCallback(async (businessProfile: BusinessProfile) => {
        try {
            await TokenManager.storeBusinessProfile(businessProfile);
            setAuthState(prev => ({
                ...prev,
                businessProfile,
            }));
            return true;
        } catch (error) {
            console.error('Error setting business profile:', error);
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await TokenManager.clearAuthData();
            queryClient.clear();
            setAuthState({
                ...initialAuthState,
                isLoading: false,
            });
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        ...authState,
        login,
        logout,
        refreshAuth: checkAuthStatus,
        setSelectedBranch,
        setBusinessProfile,
    }), [authState, login, logout, checkAuthStatus, setSelectedBranch, setBusinessProfile]);

    return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
