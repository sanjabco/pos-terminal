/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLinesDropdown } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useServiceContext } from '../providers/ServiceProvider';
import { AuthGuard } from '../components/AuthGuard';
import { LogoutModal } from '../components/LogoutModal';
import { PosTopBar } from '../components/PosTopBar';
import { FooterBar, FooterButton } from '../components/FooterBar';
import { useSnackbarContext } from '../providers/SnackbarProvider';
import { CURRENCY_LABEL, formatAmountInput, formatNumberWithSeparator } from '../utils/currency';
import { colors, fonts } from '../theme/colors';

const appLogo = require('../assets/images/logo.png');
interface ServiceOption {
    id: string;
    title: string;
    selected: boolean;
}

function Service({ navigation, route }: { navigation: any; route: any }): React.JSX.Element {
    // Use the service context to manage selected services
    const { selectedServices, addService, removeService, isServiceSelected } = useServiceContext();

    // Auth hook for logout functionality and selected branch
    const { logout, selectedBranch } = useAuth();

    // Use the selected branch to get services
    const { data: servicesData, isLoading, error, refetch } = useLinesDropdown(selectedBranch?.id || 0);
    useEffect(() => {
        if (error) {
            navigation.replace('BranchSelection');
        }
    }, [error]);
    return (
        <AuthGuard navigation={navigation} route={route} requireAuth={true} requireBranch={true}>
            <ServiceContent
                navigation={navigation}
                selectedServices={selectedServices}
                addService={addService}
                removeService={removeService}
                isServiceSelected={isServiceSelected}
                logout={logout}
                selectedBranch={selectedBranch}
                servicesData={servicesData}
                isLoading={isLoading}
                error={error}
                refetch={refetch}
            />
        </AuthGuard>
    );
}

function ServiceContent({
    navigation,
    selectedServices,
    addService,
    removeService,
    isServiceSelected,
    logout,
    selectedBranch,
    servicesData,
    isLoading,
    error,
    refetch
}: any): React.JSX.Element {
    const { showError } = useSnackbarContext();
    const { clearServices, updateServiceAmount, validateAllAmounts, getTotalAmount } = useServiceContext();

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const toggleService = (service: any) => {
        const serviceId = String(service.id);
        if (isServiceSelected(serviceId)) {
            removeService(serviceId);
        } else {
            addService({ id: serviceId, title: service.title });
        }
    };

    const handleAmountChange = (serviceId: string, text: string) => {
        updateServiceAmount(serviceId, formatAmountInput(text));
    };

    const canContinue = selectedServices.length > 0 && validateAllAmounts();

    const handleLogoutPress = () => {
        setShowLogoutModal(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            setShowLogoutModal(false);

            // Clear customer session data and selected services
            await AsyncStorage.multiRemove(['customerData', 'phoneNumber', 'branchId']);
            clearServices();

            // Clears auth storage, selected branch, and React Query cache
            await logout();

            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Error during logout:', error);
            // You can add a toast or alert here if needed
        }
    };

    const handleLogoutCancel = () => {
        setShowLogoutModal(false);
    };

    const branchLogo = (
        <Image source={appLogo} style={styles.headerLogo} resizeMode="contain" />
    );

    // Handle loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <PosTopBar title={selectedBranch?.title || 'خدمات'} leading={branchLogo} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.orange} />
                    <Text style={styles.loadingText}>در حال بارگذاری خدمات...</Text>
                </View>
            </View>
        );
    }

    // Handle error state
    if (error) {
        return (
            <View style={styles.container}>
                <PosTopBar
                    title="خدمات"
                    leading={branchLogo}
                    right={
                        <TouchableOpacity style={styles.headerAction} onPress={handleLogoutPress}>
                            <Text style={styles.headerActionText}>خروج</Text>
                        </TouchableOpacity>
                    }
                />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>خطا در بارگذاری خدمات</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>تلاش مجدد</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleBranchChangePress = () => {
        navigation.navigate('BranchSelection');
    };

    // Get services from API response (lines from the selected branch)
    const services = (servicesData?.Data as any)?.lines || [];

    return (
        <View style={styles.container}>
            <PosTopBar
                title={selectedBranch?.title || 'خدمات'}
                leading={branchLogo}
                right={
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerAction} onPress={handleBranchChangePress}>
                            <Text style={styles.headerActionText}>شعبه</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerAction} onPress={handleLogoutPress}>
                            <Text style={[styles.headerActionText, { color: colors.danger }]}>خروج</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bottomOffset={120}
            >
                <Text style={styles.instructionText}>بخش و مبلغ را انتخاب کنید</Text>

                {services.map((service: any) => {
                    const serviceId = String(service.id);
                    const isSelected = isServiceSelected(serviceId);
                    const selected = selectedServices.find((s: any) => String(s.id) === serviceId);
                    return (
                        <View
                            key={serviceId}
                            style={[
                                styles.serviceOption,
                                isSelected ? styles.serviceOptionSelected : styles.serviceOptionUnselected,
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.serviceOptionHeader}
                                onPress={() => toggleService(service)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.serviceOptionText}>{service.title}</Text>
                                <View style={[styles.checkCircle, isSelected && styles.checkCircleOn]}>
                                    {isSelected ? <Text style={styles.checkmarkText}>✓</Text> : null}
                                </View>
                            </TouchableOpacity>
                            {isSelected && (
                                <View style={styles.amountRow}>
                                    <View style={styles.currencyTag}>
                                        <Text style={styles.currencyTagText}>{CURRENCY_LABEL}</Text>
                                    </View>
                                    <TextInput
                                        style={styles.amountInput}
                                        value={selected?.amount || ''}
                                        onChangeText={(text) => handleAmountChange(serviceId, text)}
                                        placeholder="مبلغ را وارد کنید"
                                        placeholderTextColor={colors.inkSoft}
                                        keyboardType="numeric"
                                    />
                                </View>
                            )}
                        </View>
                    );
                })}
            </KeyboardAwareScrollView>

            <FooterBar
                compact
                top={
                    selectedServices.length > 0 ? (
                        <View style={styles.totalBar}>
                            <Text style={styles.totalBarLabel}>جمع</Text>
                            <Text style={styles.totalBarValue}>
                                {formatNumberWithSeparator(getTotalAmount())} {CURRENCY_LABEL}
                            </Text>
                        </View>
                    ) : undefined
                }
            >
                <FooterButton
                    compact
                    label="ادامه"
                    disabled={!canContinue}
                    onPress={() => {
                        if (selectedServices.length === 0) {
                            showError('لطفاً حداقل یک سرویس را انتخاب کنید');
                            return;
                        }
                        if (!validateAllAmounts()) {
                            showError('لطفاً مبلغ همه بخش‌های انتخاب‌شده را وارد کنید');
                            return;
                        }
                        navigation.navigate('Checkout');
                    }}
                />
            </FooterBar>

            <LogoutModal
                visible={showLogoutModal}
                onClose={handleLogoutCancel}
                onConfirm={handleLogoutConfirm}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 16,
    },
    instructionText: {
        fontSize: 12,
        color: colors.ink,
        textAlign: 'right',
        marginBottom: 8,
        fontFamily: fonts.bold,
    },
    serviceOption: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 6,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: colors.surface,
    },
    serviceOptionHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 28,
    },
    serviceOptionUnselected: {
        borderColor: colors.line,
    },
    serviceOptionSelected: {
        backgroundColor: colors.orangeTint,
        borderColor: colors.orange,
    },
    serviceOptionText: {
        fontFamily: fonts.bold,
        fontSize: 13,
        color: colors.ink,
        textAlign: 'right',
        flex: 1,
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.line,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    checkCircleOn: {
        backgroundColor: colors.orange,
        borderColor: colors.orange,
    },
    checkmarkText: {
        color: 'white',
        fontSize: 11,
        fontFamily: fonts.bold,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: colors.line,
        marginTop: 6,
    },
    currencyTag: {
        backgroundColor: colors.orangeTint,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginRight: 8,
    },
    currencyTagText: {
        color: colors.orangeDeep,
        fontSize: 10,
        fontFamily: fonts.bold,
    },
    amountInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.ink,
        textAlign: 'left',
        paddingVertical: 2,
    },
    totalBar: {
        backgroundColor: colors.bg,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.line,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalBarLabel: {
        fontSize: 11,
        fontFamily: fonts.medium,
        color: colors.inkSoft,
    },
    totalBarValue: {
        fontSize: 13.5,
        fontFamily: fonts.bold,
        color: colors.ink,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 13,
        color: colors.inkSoft,
        fontFamily: fonts.medium,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: 14,
        color: colors.inkSoft,
        fontFamily: fonts.medium,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: colors.orange,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 13,
        fontFamily: fonts.bold,
    },
    headerActions: {
        flexDirection: 'row-reverse',
        gap: 8,
    },
    headerAction: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    headerActionText: {
        color: colors.orangeDeep,
        fontSize: 12,
        fontFamily: fonts.bold,
    },
    headerLogo: {
        width: 36,
        height: 28,
    },
});

export default Service;
