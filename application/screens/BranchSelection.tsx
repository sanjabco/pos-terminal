import React, { useEffect } from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { useBranches } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { AuthGuard } from '../components/AuthGuard';
import { useSnackbarContext } from '../providers/SnackbarProvider';
import { useServiceContext } from '../providers/ServiceProvider';
import { colors, fonts } from '../theme/colors';

interface BranchSelectionProps {
    navigation: any;
    route: any;
}

function BranchSelection({ navigation, route }: BranchSelectionProps): React.JSX.Element {
    const { data: branchesData, isLoading, error, refetch } = useBranches();
    const { setSelectedBranch } = useAuth();

    // Always refetch branches for the current account
    useEffect(() => {
        refetch();
    }, [refetch]);

    return (
        <AuthGuard navigation={navigation} route={route} requireAuth={true} requireBranch={false}>
            <BranchSelectionContent
                navigation={navigation}
                branchesData={branchesData}
                isLoading={isLoading}
                error={error}
                refetch={refetch}
                setSelectedBranch={setSelectedBranch}
            />
        </AuthGuard>
    );
}

function BranchSelectionContent({
    navigation,
    branchesData,
    isLoading,
    error,
    refetch,
    setSelectedBranch
}: any): React.JSX.Element {
    const { showError } = useSnackbarContext();
    const { clearServices } = useServiceContext();
    const handleBranchSelection = async (branch: any) => {
        try {
            // Clear selected services when branch changes
            clearServices();

            // Save selected branch
            await setSelectedBranch(branch);

            // Navigate to Service screen
            navigation.replace('Service');
        } catch (error) {
            console.error('Error saving branch selection:', error);
            showError('خطا در ذخیره انتخاب شعبه.');
        }
    };

    // Handle loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>انتخاب شعبه</Text>
                    </View>
                </View>
                <View style={styles.contentCard}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF6B35" />
                        <Text style={styles.loadingText}>در حال بارگذاری شعب...</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Handle error state
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>انتخاب شعبه</Text>
                    </View>
                </View>
                <View style={styles.contentCard}>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>خطا در بارگذاری شعب</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                            <Text style={styles.retryButtonText}>تلاش مجدد</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const branches = branchesData?.Data?.branches || [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>انتخاب شعبه</Text>
                </View>
            </View>
            <View style={styles.contentCard}>
                <Text style={styles.instructionText}>لطفاً شعبه مورد نظر خود را انتخاب کنید</Text>

                <FlatList
                    data={branches}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.branchItem}
                            onPress={() => handleBranchSelection(item)}
                        >
                            <Text style={styles.branchTitle}>{item.title}</Text>
                            <Text style={styles.branchSubtitle}>
                                {item.lines.length} سرویس
                            </Text>
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                />
            </View>
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
        paddingTop: 20,
        paddingBottom: 14,
        paddingHorizontal: 18,
    },
    headerContent: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    headerTitle: {
        color: colors.ink,
        fontSize: 15,
        fontFamily: fonts.bold,
        textAlign: 'right',
    },
    contentCard: {
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: 18,
        paddingHorizontal: 18,
    },
    instructionText: {
        fontSize: 12.5,
        color: colors.inkSoft,
        textAlign: 'right',
        marginBottom: 14,
        fontFamily: fonts.medium,
    },
    listContainer: {
        paddingBottom: 20,
    },
    branchItem: {
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.line,
    },
    branchTitle: {
        fontSize: 14,
        color: colors.ink,
        fontFamily: fonts.bold,
        marginBottom: 4,
        textAlign: 'right',
    },
    branchSubtitle: {
        fontSize: 11,
        color: colors.inkSoft,
        fontFamily: fonts.regular,
        textAlign: 'right',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 14,
        fontSize: 13,
        color: colors.inkSoft,
        fontFamily: fonts.regular,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 13,
        color: colors.inkSoft,
        fontFamily: fonts.regular,
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
});

export default BranchSelection;
