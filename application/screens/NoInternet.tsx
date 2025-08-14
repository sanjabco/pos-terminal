import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { Fonts } from '../config/fonts';

const { width, height } = Dimensions.get('window');

interface NoInternetProps {
    onRetry: () => void;
}

const NoInternet: React.FC<NoInternetProps> = ({ onRetry }) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Icon placeholder - you can replace with an actual icon */}
                <View style={styles.iconContainer}>
                    <Text style={styles.iconText}>📶</Text>
                </View>

                <Text style={styles.title}>اتصال اینترنت برقرار نیست</Text>
                <Text style={styles.subtitle}>
                    لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید
                </Text>

                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryButtonText}>تلاش مجدد</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    iconText: {
        fontSize: 60,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: 24,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 15,
    },
    subtitle: {
        fontFamily: Fonts.medium,
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        opacity: 0.9,
    },
    retryButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        minWidth: 150,
    },
    retryButtonText: {
        fontFamily: Fonts.medium,
        color: '#FF6B35',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default NoInternet; 