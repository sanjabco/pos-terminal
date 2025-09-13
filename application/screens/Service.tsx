/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Image,
    ScrollView,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { useLinesDropdown } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useServiceContext } from '../providers/ServiceProvider';
import { AuthGuard } from '../components/AuthGuard';
import { LogoutModal } from '../components/LogoutModal';
import { useSnackbarContext } from '../providers/SnackbarProvider';

const { width, height } = Dimensions.get('window');

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

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    console.log(servicesData);
    const toggleService = (service: any) => {
        if (isServiceSelected(service.id)) {
            removeService(service.id);
        } else {
            addService({ id: service.id, title: service.title });
        }
    };

    const handleLogoutPress = () => {
        setShowLogoutModal(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            setShowLogoutModal(false);
            await logout();
            // Explicitly navigate to Login screen after logout
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

    // Handle loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Image style={{ height: 70 }} resizeMode='contain' source={require('../assets/images/logo.png')} />
                    </View>
                </View>
                <View style={styles.contentCard}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF6B35" />
                        <Text style={styles.loadingText}>در حال بارگذاری خدمات...</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Handle error state
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Image style={{ height: 70 }} resizeMode='contain' source={require('../assets/images/logo.png')} />
                    </View>
                </View>
                <View style={styles.contentCard}>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>خطا در بارگذاری خدمات</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                            <Text style={styles.retryButtonText}>تلاش مجدد</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Get services from API response (lines from the selected branch)
    const services = (servicesData?.Data as any)?.lines || [];

    console.log(Dimensions.get('window').width);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Image style={{ height: 70 }} resizeMode='contain' source={require('../assets/images/logo.png')} />
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
                        <Text style={styles.logoutButtonText}>خروج</Text>
                    </TouchableOpacity>
                </View>
                {/* <View style={styles.branchInfo}>
                    <Text style={styles.branchTitle}>{selectedBranch.title}</Text>
                </View> */}
            </View>

            {/* Main Content Card */}
            <View style={styles.contentCard}>
                <Text style={styles.instructionText}>ابتدا بخش مورد نظر را انتخاب کنید</Text>
                <TouchableOpacity onPress={() => { navigation.navigate('NativePaymentTest') }}><Text>Test</Text></TouchableOpacity>
                <View style={styles.serviceOptionsContainer}>
                    <ScrollView contentContainerStyle={{ paddingBottom: 150 }} >
                        {services.map((service: any) => {
                            const isSelected = isServiceSelected(service.id);
                            return (
                                <TouchableOpacity
                                    key={service.id}
                                    style={[
                                        styles.serviceOption,
                                        isSelected ? styles.serviceOptionSelected : styles.serviceOptionUnselected
                                    ]}
                                    onPress={() => toggleService(service)}
                                >
                                    <Text style={styles.serviceOptionText}>{service.title}</Text>
                                    {isSelected && (
                                        <View style={styles.checkmark}>
                                            <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
                onPress={() => {
                    if (selectedServices.length === 0) {
                        showError('لطفاً حداقل یک سرویس را انتخاب کنید');
                        return;
                    }
                    navigation.navigate('Price');
                }}
                style={[
                    styles.continueButton,
                    selectedServices.length === 0 && styles.continueButtonDisabled
                ]}
                disabled={selectedServices.length === 0}
            >
                <Text style={[
                    styles.continueButtonText,
                    selectedServices.length === 0 && styles.continueButtonTextDisabled
                ]}>ادامه</Text>
            </TouchableOpacity>

            {/* Logout Modal */}
            <LogoutModal
                visible={showLogoutModal}
                onClose={handleLogoutCancel}
                onConfirm={handleLogoutConfirm}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF6B35',
    },
    header: {
        height: 170,
        backgroundColor: '#FF6B35',

    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: -30,
    },
    logoContainer: {
        alignItems: 'center',
        marginRight: 15,
    },
    brandText: {
        color: 'white',
        fontSize: 28,
        fontFamily: 'IRANSansWebFaNum-Bold',
        marginBottom: 5,
    },
    brandTextArabic: {
        color: 'white',
        fontSize: 24,
        fontFamily: 'IRANSansWebFaNum-Bold',
    },
    logo: {
        width: 40,
        height: 40,
        backgroundColor: 'white',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        color: '#FF6B35',
        fontSize: 20,
        fontFamily: 'IRANSansWebFaNum-Bold',
    },
    contentCard: {
        flex: 1,
        backgroundColor: '#EFF2F3',
        marginTop: -30,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingTop: 30,
        paddingHorizontal: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    instructionText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'IRANSansWebFaNum-Medium',
    },
    serviceOptionsContainer: {
        // flex: 1, // Remove or comment out this line to avoid layout issues
    },
    serviceOption: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        position: 'relative',
    },
    serviceOptionUnselected: {
        backgroundColor: 'white',
        borderColor: '#E0E0E0',
    },
    serviceOptionSelected: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FF6B35',
    },
    serviceOptionText: {
        fontFamily: 'IRANSansWebFaNum-Bold',
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: 20,
    },
    checkmarkText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'IRANSansWebFaNum-Bold',
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 18,
        borderRadius: 0,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'IRANSansWebFaNum-Bold',
        textAlign: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    continueButtonTextDisabled: {
        color: '#999999',
    },
    // Loading and error states
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#666',
        fontFamily: 'IRANSansWebFaNum-Medium',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'IRANSansWebFaNum-Medium',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'IRANSansWebFaNum-Bold',
    },
    logoutButton: {
        position: 'absolute',
        right: 20,
        top: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'IRANSansWebFaNum-Bold',
    },
    branchInfo: {
        alignItems: 'center',
        paddingBottom: 10,
    },
    branchTitle: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'IRANSansWebFaNum-Bold',
        textAlign: 'center',
    },
});

export default Service;
