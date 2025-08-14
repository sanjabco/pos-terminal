import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useInternetConnection = () => {
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Initial check
        checkConnection();

        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected);
            setIsChecking(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const checkConnection = async () => {
        try {
            setIsChecking(true);
            const state = await NetInfo.fetch();
            setIsConnected(state.isConnected);
        } catch (error) {
            console.error('Error checking internet connection:', error);
            setIsConnected(false);
        } finally {
            setIsChecking(false);
        }
    };

    return {
        isConnected,
        isChecking,
        checkConnection,
    };
}; 