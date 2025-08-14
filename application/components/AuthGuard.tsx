import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
    children: React.ReactNode;
    navigation: any;
    route?: any;
    requireAuth?: boolean;
    requireBranch?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    navigation,
    route,
    requireAuth = true,
    requireBranch = false
}) => {
    const { isAuthenticated, isLoading, selectedBranch } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            const currentRouteName = route?.name || navigation.getCurrentRoute?.()?.name;

            // If authentication is required but user is not authenticated
            if (requireAuth && !isAuthenticated) {
                navigation.replace('Login');
                return;
            }

            // If user is authenticated but trying to access Login screen, redirect to appropriate screen
            if (isAuthenticated && !requireAuth) {
                if (selectedBranch) {
                    navigation.replace('Service');
                } else {
                    navigation.replace('BranchSelection');
                }
                return;
            }

            // If branch selection is required but no branch is selected
            if (requireBranch && !selectedBranch) {
                navigation.replace('BranchSelection');
                return;
            }

            // If user is authenticated but no branch is selected, redirect to branch selection
            // BUT only if not already on BranchSelection screen to prevent infinite loop
            if (isAuthenticated && !selectedBranch && currentRouteName !== 'BranchSelection') {
                navigation.replace('BranchSelection');
                return;
            }
        }
    }, [isAuthenticated, isLoading, selectedBranch, navigation, requireAuth, requireBranch, route?.name]);

    // Show loading while checking authentication
    if (isLoading) {
        return null; // Let the parent component handle loading
    }

    // If authentication is required but user is not authenticated, don't render children
    if (requireAuth && !isAuthenticated) {
        return null;
    }

    // If user is authenticated but trying to access Login screen, don't render children
    if (isAuthenticated && !requireAuth) {
        return null;
    }

    // If branch selection is required but no branch is selected, don't render children
    if (requireBranch && !selectedBranch) {
        return null;
    }

    return <>{children}</>;
}; 