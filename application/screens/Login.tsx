import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Platform,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
} from 'react-native';
import { useSendOtp, useVerifyOtp } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { AuthGuard } from '../components/AuthGuard';
import { useSnackbarContext } from '../providers/SnackbarProvider';
import { apiClient, API_ENDPOINTS, getApiErrorMessage } from '../services/api';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { colors, fonts } from '../theme/colors';
import { FooterBar, FooterButton } from '../components/FooterBar';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 5;
const OTP_BOX_SIZE = Math.min(52, (width - 50 - (OTP_LENGTH - 1) * 8) / OTP_LENGTH);

const createEmptyOtp = () => Array(OTP_LENGTH).fill('');

const convertPersianToEnglish = (value: string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return value.replace(/[۰-۹]/g, digit => String(persianDigits.indexOf(digit)));
};

function Login({ navigation, route }: { navigation: any; route: any }): React.JSX.Element {
    const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
    const [mobile, setMobile] = useState('');

    const sendOtpMutation = useSendOtp();
    const verifyOtpMutation = useVerifyOtp();
    const { login, setBusinessProfile } = useAuth();

    return (
        <AuthGuard navigation={navigation} route={route} requireAuth={false}>
            <LoginContent
                navigation={navigation}
                step={step}
                setStep={setStep}
                mobile={mobile}
                setMobile={setMobile}
                sendOtpMutation={sendOtpMutation}
                verifyOtpMutation={verifyOtpMutation}
                login={login}
                setBusinessProfile={setBusinessProfile}
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
    sendOtpMutation,
    verifyOtpMutation,
    login,
    setBusinessProfile
}: any): React.JSX.Element {
    const { showError } = useSnackbarContext();
    const [isCompletingLogin, setIsCompletingLogin] = useState(false);
    const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtp);
    const otpInputRefs = useRef<(TextInput | null)[]>([]);
    const hasSubmittedOtpRef = useRef(false);

    const otp = otpDigits.join('');
    const isSendingOtp = sendOtpMutation.isPending;
    const isVerifyingOtp = verifyOtpMutation.isPending || isCompletingLogin;

    const clearOtp = useCallback(() => {
        setOtpDigits(createEmptyOtp());
        hasSubmittedOtpRef.current = false;
    }, []);

    const resetOtpInput = useCallback(() => {
        clearOtp();
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }, [clearOtp]);

    // Function to fetch and store business info
    const fetchAndStoreBusinessInfo = async () => {
        try {
            const response = await apiClient.get(API_ENDPOINTS.BUSINESS);
            const businessData = response.data;

            if (businessData.Code === 200 && businessData.Message === 'SUCCESS') {
                await setBusinessProfile(businessData.Data);
                console.log('Business info stored successfully:', businessData.Data);
            } else {
                console.warn('Business info fetch failed:', businessData.Message);
            }
        } catch (error) {
            console.error('Error fetching business info:', error);
            // Don't show error to user as this is not critical for login
        }
    };

    const handleSendOtp = () => {
        const phoneNumber = convertPersianToEnglish(mobile);
        sendOtpMutation.mutate(
            { phoneNumber },
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
                    showError(getApiErrorMessage(error, 'خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.'));
                },
            }
        );
    };

    const handleEditNumber = () => {
        clearOtp();
        setStep('mobile');
    };

    const handleVerifyOtp = useCallback((code?: string) => {
        const otpCode = code ?? otpDigits.join('');
        if (otpCode.length !== OTP_LENGTH || isVerifyingOtp) {
            return;
        }

        const phoneNumber = convertPersianToEnglish(mobile);
        verifyOtpMutation.mutate(
            { phoneNumber, code: otpCode },
            {
                onSuccess: async (data: any) => {
                    console.log('Login successful:', data);
                    if (data.Code === 200 && data.Message === 'SUCCESS') {
                        setIsCompletingLogin(true);
                        try {
                            const success = await login(data.Data.token);
                            if (success) {
                                console.log('Login successful and token stored');

                                await fetchAndStoreBusinessInfo();

                                navigation.replace('BranchSelection');
                            } else {
                                showError('خطا در ذخیره اطلاعات ورود.');
                                resetOtpInput();
                            }
                        } catch (error) {
                            console.error('Error during login:', error);
                            showError('خطا در ذخیره اطلاعات ورود.');
                            resetOtpInput();
                        } finally {
                            setIsCompletingLogin(false);
                        }
                    } else {
                        showError(data.Message || 'کد وارد شده صحیح نیست.');
                        resetOtpInput();
                    }
                },
                onError: (error: any) => {
                    console.error('Login failed:', error);
                    showError(getApiErrorMessage(error, 'کد وارد شده صحیح نیست. لطفاً دوباره تلاش کنید.'));
                    resetOtpInput();
                },
            }
        );
    }, [
        isVerifyingOtp,
        login,
        mobile,
        navigation,
        otpDigits,
        resetOtpInput,
        showError,
        verifyOtpMutation,
    ]);

    const handleOtpChange = (text: string, index: number) => {
        const normalized = convertPersianToEnglish(text).replace(/\D/g, '');

        if (!normalized) {
            const cleared = [...otpDigits];
            cleared[index] = '';
            setOtpDigits(cleared);
            hasSubmittedOtpRef.current = false;
            return;
        }

        if (normalized.length > 1) {
            const chars = normalized.slice(0, OTP_LENGTH).split('');
            const nextDigits = [...otpDigits];
            chars.forEach((char, offset) => {
                if (index + offset < OTP_LENGTH) {
                    nextDigits[index + offset] = char;
                }
            });
            setOtpDigits(nextDigits);
            hasSubmittedOtpRef.current = false;

            const focusIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
            otpInputRefs.current[focusIndex]?.focus();
            return;
        }

        const nextDigits = [...otpDigits];
        nextDigits[index] = normalized;
        setOtpDigits(nextDigits);
        hasSubmittedOtpRef.current = false;

        if (index < OTP_LENGTH - 1) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (
        event: NativeSyntheticEvent<TextInputKeyPressEventData>,
        index: number,
    ) => {
        if (event.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
            const nextDigits = [...otpDigits];
            nextDigits[index - 1] = '';
            setOtpDigits(nextDigits);
            hasSubmittedOtpRef.current = false;
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    useEffect(() => {
        if (step === 'otp') {
            const timer = setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
            return () => clearTimeout(timer);
        }

        clearOtp();
    }, [step, clearOtp]);

    useEffect(() => {
        if (
            step === 'otp' &&
            otp.length === OTP_LENGTH &&
            !isVerifyingOtp &&
            !hasSubmittedOtpRef.current
        ) {
            hasSubmittedOtpRef.current = true;
            handleVerifyOtp(otp);
        }
    }, [step, otp, isVerifyingOtp, handleVerifyOtp]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
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
                                    placeholderTextColor={colors.inkSoft}
                                    editable={!isSendingOtp}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.instructionText}>
                                کد تایید ارسال شده به شماره{' '}
                                <Text style={styles.instructionPhoneNumber}>{mobile}</Text>
                                {' '}را وارد کنید
                            </Text>
                            <TouchableOpacity
                                onPress={handleEditNumber}
                                disabled={isVerifyingOtp}
                                style={[
                                    styles.editNumberRow,
                                    isVerifyingOtp && styles.disabledEditButton,
                                ]}
                            >
                                <Text style={styles.editNumberText}>ویرایش شماره</Text>
                            </TouchableOpacity>
                            <View style={styles.otpContainer}>
                                {otpDigits.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={ref => {
                                            otpInputRefs.current[index] = ref;
                                        }}
                                        style={[
                                            styles.otpInput,
                                            { width: OTP_BOX_SIZE, height: OTP_BOX_SIZE },
                                            digit ? styles.otpInputFilled : null,
                                            isVerifyingOtp && styles.otpInputDisabled,
                                        ]}
                                        value={digit}
                                        onChangeText={text => handleOtpChange(text, index)}
                                        onKeyPress={event => handleOtpKeyPress(event, index)}
                                        keyboardType="number-pad"
                                        maxLength={OTP_LENGTH}
                                        selectTextOnFocus
                                        editable={!isVerifyingOtp}
                                        textAlign="center"
                                        textContentType="oneTimeCode"
                                        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                                    />
                                ))}
                            </View>
                        </>
                    )}
                </View>
                {step === 'mobile' ? (
                    <FooterBar>
                        <FooterButton
                            label={isSendingOtp ? 'در حال ارسال کد...' : 'ارسال کد'}
                            onPress={handleSendOtp}
                            disabled={mobile.length !== 11 || isSendingOtp}
                            loading={isSendingOtp}
                        />
                    </FooterBar>
                ) : isVerifyingOtp ? (
                    <FooterBar>
                        <FooterButton label="در حال ورود..." disabled loading />
                    </FooterBar>
                ) : null}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        paddingTop: 48,
        paddingBottom: 16,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 18,
    },
    headerContent: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    headerTitle: {
        color: colors.ink,
        fontSize: 18,
        fontFamily: fonts.bold,
        textAlign: 'right',
    },
    contentCard: {
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: 40,
        paddingHorizontal: 22,
    },
    instructionText: {
        fontSize: 14,
        color: colors.ink,
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: fonts.medium,
        lineHeight: 26,
        writingDirection: 'rtl',
    },
    instructionPhoneNumber: {
        fontFamily: fonts.bold,
        color: colors.orangeDeep,
        writingDirection: 'ltr',
    },
    editNumberRow: {
        alignSelf: 'flex-end',
        marginBottom: 24,
        paddingVertical: 4,
    },
    editNumberText: {
        fontSize: 13,
        color: colors.orangeDeep,
        fontFamily: fonts.bold,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    disabledEditButton: {
        opacity: 0.5,
    },
    inputContainer: {
        marginBottom: 40,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 40,
        writingDirection: 'ltr',
    },
    otpInput: {
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 14,
        fontSize: 20,
        backgroundColor: colors.surface,
        fontFamily: fonts.bold,
        color: colors.ink,
        padding: 0,
    },
    otpInputFilled: {
        borderColor: colors.orange,
    },
    otpInputDisabled: {
        opacity: 0.6,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontSize: 17,
        backgroundColor: colors.surface,
        textAlign: 'center',
        fontFamily: fonts.regular,
        color: colors.ink,
    },
});

export default Login;
