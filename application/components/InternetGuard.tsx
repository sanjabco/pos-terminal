import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useInternet } from '../providers/InternetProvider';
import NoInternet from '../screens/NoInternet';

interface InternetGuardProps {
    children: React.ReactNode;
}

const InternetGuard: React.FC<InternetGuardProps> = ({ children }) => {
    const { isConnected, isChecking, checkConnection } = useInternet();

    // Show loading while checking connection
    if (isChecking) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    // Show NoInternet screen if not connected
    if (isConnected === false) {
        return <NoInternet onRetry={checkConnection} />;
    }

    // Show app content if connected
    return <>{children}</>;
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FF6B35',
    },
});

export default InternetGuard; 