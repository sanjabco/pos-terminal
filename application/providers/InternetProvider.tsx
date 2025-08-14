import React, { createContext, useContext, ReactNode } from 'react';
import { useInternetConnection } from '../hooks/useInternetConnection';

interface InternetContextType {
    isConnected: boolean | null;
    isChecking: boolean;
    checkConnection: () => Promise<void>;
}

const InternetContext = createContext<InternetContextType | undefined>(undefined);

interface InternetProviderProps {
    children: ReactNode;
}

export const InternetProvider: React.FC<InternetProviderProps> = ({ children }) => {
    const { isConnected, isChecking, checkConnection } = useInternetConnection();

    return (
        <InternetContext.Provider
            value={{
                isConnected,
                isChecking,
                checkConnection,
            }}
        >
            {children}
        </InternetContext.Provider>
    );
};

export const useInternet = (): InternetContextType => {
    const context = useContext(InternetContext);
    if (context === undefined) {
        throw new Error('useInternet must be used within an InternetProvider');
    }
    return context;
}; 