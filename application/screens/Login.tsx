import React, { useState } from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSendOtp, useVerifyOtp } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { AuthGuard } from '../components/AuthGuard';
import { useSnackbarContext } from '../providers/SnackbarProvider';

const { width, height } = Dimensions.get('window');

function Login({ navigation, route }: { navigation: any; route: any }): React.JSX.Element {
    const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');

    // React Query OTP mutations
    const sendOtpMutation = useSendOtp();
    const verifyOtpMutation = useVerifyOtp();

    // Auth hook
    const { login } = useAuth();

    return (
        <AuthGuard navigation={navigation} route={route} requireAuth={false}>
            <LoginContent
                navigation={navigation}
                step={step}
                setStep={setStep}
                mobile={mobile}
                setMobile={setMobile}
                otp={otp}
                setOtp={setOtp}
                sendOtpMutation={sendOtpMutation}
                verifyOtpMutation={verifyOtpMutation}
                login={login}
            />
        </AuthGuard>
    );
}

function LoginContent({
    navigation,
    step,
    setStep,
    mobile,
    setMobile,
    otp,
    setOtp,
    sendOtpMutation,
    verifyOtpMutation,
    login
}: any): React.JSX.Element {
    const { showError } = useSnackbarContext();

    const handleSendOtp = () => {
        // Send OTP to mobile number
        sendOtpMutation.mutate(
            { phoneNumber: mobile },
            {
                onSuccess: (data: any) => {
                    console.log('OTP sent successfully:', data);
                    if (data.Code === 200 && data.Message === 'SUCCESS') {
                        setStep('otp');
                    } else {
                        showError(data.Message || 'خطا در ارسال کد تایید.');
                    }
                },
                onError: (error: any) => {
                    console.error('Failed to send OTP:', error);
                    showError('خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.');
                },
            }
        );
    };

    const handleVerifyOtp = () => {
        console.log('otp', otp);
        console.log('mobile', mobile);
        // Verify OTP and login
        verifyOtpMutation.mutate(
            { phoneNumber: mobile, code: otp },
            {
                onSuccess: async (data: any) => {
                    console.log('Login successful:', data);
                    if (data.Code === 200 && data.Message === 'SUCCESS') {
                        // Use the login function from useAuth hook
                        try {
                            const success = await login(data.Data.token);
                            if (success) {
                                console.log('Login successful and token stored');
                                // Navigate to branch selection
                                navigation.replace('BranchSelection');
                            } else {
                                showError('خطا در ذخیره اطلاعات ورود.');
                            }
                        } catch (error) {
                            console.error('Error during login:', error);
                            showError('خطا در ذخیره اطلاعات ورود.');
                        }
                    } else {
                        showError(data.Message || 'کد وارد شده صحیح نیست.');
                    }
                },
                onError: (error: any) => {
                    console.error('Login failed:', error);
                    showError('کد وارد شده صحیح نیست. لطفاً دوباره تلاش کنید.');
                },
            }
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>ورود</Text>
                    </View>
                </View>

                {/* Main Content Card */}
                <View style={styles.contentCard}>
                    {step === 'mobile' ? (
                        <>
                            <Text style={styles.instructionText}>شماره موبایل خود را وارد کنید</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={mobile}
                                    onChangeText={setMobile}
                                    keyboardType="numeric"
                                    textAlign="center"
                                    maxLength={11}
                                    placeholder="مثلاً 09123456789"
                                    placeholderTextColor="#AAA"
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.continueButton}
                                onPress={handleSendOtp}
                                disabled={mobile.length !== 11}
                            >
                                <Text style={styles.continueButtonText}>ارسال کد</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.instructionText}>کد تایید ارسال شده را وارد کنید</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="numeric"
                                    textAlign="center"
                                    maxLength={5}
                                    placeholder="کد ۵ رقمی"
                                    placeholderTextColor="#AAA"
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.continueButton,
                                    verifyOtpMutation.isPending && styles.disabledButton
                                ]}
                                onPress={handleVerifyOtp}
                                disabled={otp.length !== 5 || verifyOtpMutation.isPending}
                            >
                                <Text style={styles.continueButtonText}>
                                    {verifyOtpMutation.isPending ? 'در حال ورود...' : 'ورود'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF6B35',
    },
    header: {
        height: 155,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 20,
    },
    headerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontFamily: 'IRANSansWebFaNum-Bold',
        textAlign: 'center',
    },
    contentCard: {
        flex: 1,
        backgroundColor: '#EFF2F3',
        marginTop: -30,
        borderRadius: 25,
        paddingTop: 60,
        paddingHorizontal: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        justifyContent: 'flex-start',
    },
    instructionText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'IRANSansWebFaNum-Medium',
    },
    inputContainer: {
        marginBottom: 40,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontSize: 18,
        backgroundColor: 'white',
        textAlign: 'center',
        fontFamily: 'IRANSansWebFaNum',
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
    disabledButton: {
        opacity: 0.6,
    },
});

export default Login; 