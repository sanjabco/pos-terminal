import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Fonts } from '../config/fonts';

const { width } = Dimensions.get('window');

interface SnackbarProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onDismiss?: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({
    visible,
    message,
    type = 'info',
    duration = 3000,
    onDismiss
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Show snackbar
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after duration
            const timer = setTimeout(() => {
                hideSnackbar();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hideSnackbar();
        }
    }, [visible, duration]);

    const hideSnackbar = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss?.();
        });
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return '#4CAF50';
            case 'error':
                return '#F44336';
            case 'warning':
                return '#FF9800';
            case 'info':
            default:
                return '#2196F3';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <View style={styles.content}>
                <Text style={styles.icon}>{getIcon()}</Text>
                <Text style={styles.message}>{message}</Text>
                <TouchableOpacity onPress={hideSnackbar} style={styles.dismissButton}>
                    <Text style={styles.dismissText}>✕</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 56,
    },
    icon: {
        fontSize: 20,
        color: 'white',
        marginRight: 12,
        fontFamily: Fonts.bold,
    },
    message: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontFamily: Fonts.medium,
        textAlign: 'right', // For Persian text
    },
    dismissButton: {
        marginLeft: 12,
        padding: 4,
    },
    dismissText: {
        color: 'white',
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
});

export default Snackbar; 