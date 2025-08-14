import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import { Fonts, getFontStyle } from '../config/fonts';

const { width, height } = Dimensions.get('window');

interface LogoutModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
    visible,
    onClose,
    onConfirm,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>خروج از حساب کاربری</Text>
                        </View>

                        {/* Body */}
                        <View style={styles.body}>
                            <Text style={styles.message}>
                                آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
                            </Text>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                            >
                                <Text style={styles.cancelButtonText}>انصراف</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton]}
                                onPress={onConfirm}
                            >
                                <Text style={styles.confirmButtonText}>خروج</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.85,
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalContent: {
        padding: 0,
    },
    header: {
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    title: {
        ...getFontStyle('title', {
            textAlign: 'center',
            color: '#333',
        }),
    },
    body: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    message: {
        ...getFontStyle('subtitle', {
            textAlign: 'center',
            lineHeight: 24,
            color: '#666',
        }),
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    confirmButton: {
        backgroundColor: '#FF6B35',
    },
    cancelButtonText: {
        ...getFontStyle('button', {
            color: '#666',
        }),
    },
    confirmButtonText: {
        ...getFontStyle('button', {
            color: 'white',
        }),
    },
}); 