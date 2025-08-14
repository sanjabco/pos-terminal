import { useState, useCallback } from 'react';

interface SnackbarState {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: number;
}

export const useSnackbar = () => {
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        visible: false,
        message: '',
        type: 'info',
        duration: 3000,
    });

    const showSnackbar = useCallback((
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info',
        duration: number = 3000
    ) => {
        setSnackbar({
            visible: true,
            message,
            type,
            duration,
        });
    }, []);

    const hideSnackbar = useCallback(() => {
        setSnackbar(prev => ({
            ...prev,
            visible: false,
        }));
    }, []);

    const showSuccess = useCallback((message: string, duration?: number) => {
        showSnackbar(message, 'success', duration);
    }, [showSnackbar]);

    const showError = useCallback((message: string, duration?: number) => {
        showSnackbar(message, 'error', duration);
    }, [showSnackbar]);

    const showWarning = useCallback((message: string, duration?: number) => {
        showSnackbar(message, 'warning', duration);
    }, [showSnackbar]);

    const showInfo = useCallback((message: string, duration?: number) => {
        showSnackbar(message, 'info', duration);
    }, [showSnackbar]);

    return {
        snackbar,
        showSnackbar,
        hideSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };
}; 