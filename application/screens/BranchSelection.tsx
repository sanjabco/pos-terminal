import React, { useState } from 'react';
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

interface BranchSelectionProps {
    navigation: any;
    route: any;
}

function BranchSelection({ navigation, route }: BranchSelectionProps): React.JSX.Element {
    const { data: branchesData, isLoading, error, refetch } = useBranches();
    const { setSelectedBranch } = useAuth();

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
    const handleBranchSelection = async (branch: any) => {
        try {
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
                <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
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
                <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
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
            <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
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
        paddingTop: 40,
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
    listContainer: {
        paddingBottom: 20,
    },
    branchItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    branchTitle: {
        fontSize: 18,
        color: '#333',
        fontFamily: 'IRANSansWebFaNum-Bold',
        marginBottom: 5,
    },
    branchSubtitle: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'IRANSansWebFaNum',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        fontFamily: 'IRANSansWebFaNum',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'IRANSansWebFaNum',
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
        fontSize: 16,
        fontFamily: 'IRANSansWebFaNum-Bold',
    },
});

export default BranchSelection; 