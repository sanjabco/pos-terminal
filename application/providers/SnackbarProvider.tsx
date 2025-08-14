import React, { createContext, useContext } from 'react';
import { useSnackbar } from '../hooks/useSnackbar';
import Snackbar from '../components/Snackbar';

interface SnackbarContextType {
    showSnackbar: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
    hideSnackbar: () => void;
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbarContext = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbarContext must be used within a SnackbarProvider');
    }
    return context;
};

interface SnackbarProviderProps {
    children: React.ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
    const {
        snackbar,
        showSnackbar,
        hideSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    } = useSnackbar();

    const value = {
        showSnackbar,
        hideSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return (
        <SnackbarContext.Provider value={value}>
            {children}
            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type}
                duration={snackbar.duration}
                onDismiss={hideSnackbar}
            />
        </SnackbarContext.Provider>
    );
}; 