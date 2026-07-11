import React from 'react';
import { useInternet } from '../providers/InternetProvider';
import NoInternet from '../screens/NoInternet';
import { SplashScreen } from './SplashScreen';

interface InternetGuardProps {
    children: React.ReactNode;
}

const InternetGuard: React.FC<InternetGuardProps> = ({ children }) => {
    const { isConnected, isChecking, checkConnection } = useInternet();

    if (isChecking) {
        return <SplashScreen />;
    }

    // Show NoInternet screen if not connected
    if (isConnected === false) {
        return <NoInternet onRetry={checkConnection} />;
    }

    // Show app content if connected
    return <>{children}</>;
};

export default InternetGuard; 