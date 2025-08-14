import NetInfo from '@react-native-community/netinfo';

export const checkInternetConnection = async (): Promise<boolean> => {
    try {
        const state = await NetInfo.fetch();
        return state.isConnected ?? false;
    } catch (error) {
        console.error('Error checking internet connection:', error);
        return false;
    }
};

export const getConnectionType = async (): Promise<string> => {
    try {
        const state = await NetInfo.fetch();
        return state.type || 'unknown';
    } catch (error) {
        console.error('Error getting connection type:', error);
        return 'unknown';
    }
};

export const isWifiConnected = async (): Promise<boolean> => {
    try {
        const state = await NetInfo.fetch();
        return state.type === 'wifi' && (state.isConnected ?? false);
    } catch (error) {
        console.error('Error checking WiFi connection:', error);
        return false;
    }
};

export const isCellularConnected = async (): Promise<boolean> => {
    try {
        const state = await NetInfo.fetch();
        return state.type === 'cellular' && (state.isConnected ?? false);
    } catch (error) {
        console.error('Error checking cellular connection:', error);
        return false;
    }
}; 