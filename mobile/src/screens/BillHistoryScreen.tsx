import React, { useState, useEffect } from 'react';
// Bill History Screen
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    StatusBar,
    Dimensions,
    Alert,
    Modal,
    TextInput,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    RefreshControl,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, BillType } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomAlert from '../components/CustomAlert';

type BillHistoryScreenNavigationProp = StackNavigationProp<AppStackParamList, 'BillHistory'>;
type BillHistoryScreenRouteProp = RouteProp<AppStackParamList, 'BillHistory'>;

interface BillDocument {
    id: string;
    type: BillType;
    usage: number;
    cost: number;
    date: Date;
    merchant?: string;
    items?: string;
    description?: string;
}

const BillHistoryScreen = () => {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation<BillHistoryScreenNavigationProp>();
    const route = useRoute<BillHistoryScreenRouteProp>();
    const { theme, colors } = useTheme();
    const { user } = useAuth();

    const [selectedCategory, setSelectedCategory] = useState<BillType>(route.params?.initialCategory || 'electricity');
    const [bills, setBills] = useState<BillDocument[]>([]);
    const [loading, setLoading] = useState(false);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingBill, setEditingBill] = useState<BillDocument | null>(null);
    const [editUsage, setEditUsage] = useState('');
    const [editCost, setEditCost] = useState('');

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
    const [alertConfirmText, setAlertConfirmText] = useState('OK');
    const [alertCancelText, setAlertCancelText] = useState('Cancel');

    const showAlert = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info',
        onConfirm?: () => void,
        confirmText?: string,
        cancelText?: string
    ) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertOnConfirm(() => onConfirm);
        setAlertConfirmText(confirmText || (onConfirm ? (t('common.yes') || 'Yes') : 'OK'));
        setAlertCancelText(cancelText || (t('common.cancel') || 'Cancel'));
        setAlertVisible(true);
    };

    const hideAlert = () => {
        setAlertVisible(false);
        setAlertOnConfirm(undefined);
    };

    const categories: { key: BillType; label: string; icon: string; color: string; bgColor: string }[] = [
        {
            key: 'electricity',
            label: t('dashboard.electricity'),
            icon: 'flash',
            color: colors.billColors.electricity,
            bgColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
        },
        {
            key: 'water',
            label: t('dashboard.water'),
            icon: 'water',
            color: colors.billColors.water,
            bgColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
        },
        {
            key: 'naturalGas' as BillType,
            label: t('dashboard.naturalGas'),
            icon: 'flame',
            color: colors.billColors.naturalGas,
            bgColor: theme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)',
        },
        {
            key: 'other' as BillType,
            label: t('dashboard.otherBills'),
            icon: 'receipt',
            color: colors.billColors.other,
            bgColor: theme === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
        },
    ];



    const [refreshing, setRefreshing] = useState(false);

    const fetchBills = React.useCallback(async (category: BillType) => {
        if (!user) return;
        setLoading(true);
        try {
            const collectionName = `${category}_bills`;
            const q = query(
                collection(db, collectionName),
                where('userId', '==', user.id)
            );

            const querySnapshot = await getDocs(q);
            const fetchedBills: BillDocument[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedBills.push({
                    id: doc.id,
                    type: data.type,
                    usage: data.usage,
                    cost: data.cost,
                    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
                    merchant: data.merchant,
                    items: data.items,
                    description: data.description,
                });
            });

            fetchedBills.sort((a, b) => b.date.getTime() - a.date.getTime());

            setBills(fetchedBills);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useFocusEffect(
        React.useCallback(() => {
            fetchBills(selectedCategory);
        }, [fetchBills, selectedCategory])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchBills(selectedCategory);
    }, [fetchBills, selectedCategory]);

    const handleDelete = (bill: BillDocument) => {
        showAlert(
            t('common.delete') || 'Delete',
            t('common.deleteConfirmation') || 'Are you sure you want to delete this bill?',
            'warning',
            async () => {
                try {
                    const collectionName = `${selectedCategory}_bills`;
                    await deleteDoc(doc(db, collectionName, bill.id));

                    // Update local state
                    setBills(prev => prev.filter(b => b.id !== bill.id));

                    // Show success alert after a small delay to allow the modal to close and reopen
                    setTimeout(() => {
                        showAlert(
                            t('common.success') || 'Success',
                            t('common.deletedSuccessfully') || 'Bill deleted successfully',
                            'success'
                        );
                    }, 300);
                } catch (error) {
                    console.error('Error deleting bill:', error);
                    setTimeout(() => {
                        showAlert(
                            t('common.error') || 'Error',
                            t('common.deleteFailed') || 'Failed to delete bill',
                            'error'
                        );
                    }, 300);
                }
            },
            t('common.delete') || 'Delete',
            t('common.cancel') || 'Cancel'
        );
    };

    const handleEdit = (bill: BillDocument) => {
        setEditingBill(bill);
        setEditUsage(bill.usage.toString());
        setEditCost(bill.cost.toString());
        setEditModalVisible(true);
    };

    const saveEdit = async () => {
        if (!editingBill) return;

        const usage = parseFloat(editUsage);
        const cost = parseFloat(editCost);

        if (isNaN(usage) || isNaN(cost)) {
            showAlert(t('common.error') || 'Error', t('common.invalidInput') || 'Please enter valid numbers', 'error');
            return;
        }

        try {
            const collectionName = `${selectedCategory}_bills`;
            await updateDoc(doc(db, collectionName, editingBill.id), {
                usage,
                cost,
            });

            // Update local state
            setBills(prev => prev.map(b => {
                if (b.id === editingBill.id) {
                    return { ...b, usage, cost };
                }
                return b;
            }));

            setEditModalVisible(false);
            setTimeout(() => {
                showAlert(
                    t('common.success') || 'Success',
                    t('common.updatedSuccessfully') || 'Bill updated successfully',
                    'success'
                );
            }, 300);
        } catch (error) {
            console.error('Error updating bill:', error);
            showAlert(t('common.error') || 'Error', t('common.updateFailed') || 'Failed to update bill', 'error');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.card }]}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('billHistory.title') || 'Bill History'}</Text>
            <View style={{ width: 40 }} />
        </View>
    );

    const renderCategorySelector = () => (
        <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.key}
                        style={styles.categoryItem}
                        onPress={() => setSelectedCategory(cat.key)}
                    >
                        <View
                            style={[
                                styles.categoryIconContainer,
                                {
                                    backgroundColor: cat.bgColor,
                                    borderColor: selectedCategory === cat.key ? colors.primary : 'transparent',
                                    borderWidth: selectedCategory === cat.key ? 2 : 0,
                                },
                            ]}
                        >
                            <Ionicons name={cat.icon as any} size={28} color={cat.color} />
                        </View>
                        <Text
                            style={[
                                styles.categoryLabel,
                                {
                                    color: selectedCategory === cat.key ? colors.text : colors.textSecondary,
                                    fontWeight: selectedCategory === cat.key ? 'bold' : 'normal',
                                },
                            ]}
                        >
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderChart = () => {
        if (loading || bills.length === 0) return null;

        // Sort bills by date ascending for the chart
        const sortedBills = [...bills].sort((a, b) => a.date.getTime() - b.date.getTime());

        // Take last 6 bills for better visibility
        const recentBills = sortedBills.slice(-6);

        const currentCategoryColor = categories.find(c => c.key === selectedCategory)?.color || colors.primary;

        const data = {
            labels: recentBills.map(bill =>
                bill.date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })
            ),
            datasets: [
                {
                    data: recentBills.map(bill => bill.usage),
                }
            ]
        };

        const chartConfig = {
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            decimalPlaces: 0,
            color: (opacity = 1) => currentCategoryColor,
            labelColor: (opacity = 1) => colors.textSecondary,
            style: {
                borderRadius: 16
            },
            barPercentage: 0.6,
            fillShadowGradient: currentCategoryColor,
            fillShadowGradientOpacity: 1,
        };

        return (
            <View style={styles.chartContainer}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>{t('dashboard.usageTrend') || 'Usage Trend'}</Text>
                <BarChart
                    data={data}
                    width={Dimensions.get("window").width - 40}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                    showValuesOnTopOfBars
                    fromZero
                />
            </View>
        );
    };

    const renderPieChart = () => {
        if (loading || bills.length === 0) return null;

        // Group bills by items
        const itemTotals: { [key: string]: number } = {};
        bills.forEach(bill => {
            // Use items as primary label, fallback to description, then merchant
            const name = bill.items || bill.description || bill.merchant || t('common.unknown') || 'Unknown';
            itemTotals[name] = (itemTotals[name] || 0) + bill.cost;
        });

        const pieData = Object.keys(itemTotals).map((name, index) => {
            const colorsList = [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40',
                '#C9CBCF',
            ];
            return {
                name,
                population: itemTotals[name],
                color: colorsList[index % colorsList.length],
                legendFontColor: colors.textSecondary,
                legendFontSize: 12,
            };
        });

        return (
            <View style={styles.chartContainer}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>{t('dashboard.expenseDistribution') || 'Expense Distribution'}</Text>
                <PieChart
                    data={pieData}
                    width={Dimensions.get("window").width - 40}
                    height={220}
                    chartConfig={{
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    center={[10, 0]}
                    absolute
                />
            </View>
        );
    };

    const renderEditModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => setEditModalVisible(false)}
        >
            <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('common.edit') || 'Edit Bill'}</Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('common.usage') || 'Usage'} ({selectedCategory === 'electricity' ? 'kWh' : 'm³'})</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                                    value={editUsage}
                                    onChangeText={setEditUsage}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('common.cost') || 'Cost'} (₺)</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                                    value={editCost}
                                    onChangeText={setEditCost}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={saveEdit}
                            >
                                <Text style={styles.saveButtonText}>{t('common.save') || 'Save'}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );



    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
            {renderHeader()}
            {renderEditModal()}

            <FlatList
                data={bills}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListHeaderComponent={
                    <View>
                        {renderCategorySelector()}
                        {selectedCategory === 'other' ? renderPieChart() : renderChart()}
                        <View style={[styles.tableHeader, { borderBottomColor: colors.border, marginHorizontal: 20, marginTop: 10 }]}>
                            <Text style={[styles.columnHeader, { color: colors.textSecondary, flex: 2 }]}>{t('common.date')}</Text>
                            {selectedCategory !== 'other' ? (
                                <Text style={[styles.columnHeader, { color: colors.textSecondary, flex: 1.5, textAlign: 'center' }]}>{t('common.usage')}</Text>
                            ) : (
                                <Text style={[styles.columnHeader, { color: colors.textSecondary, flex: 1.5, textAlign: 'center' }]}>{t('common.items') || 'Items'}</Text>
                            )}
                            <Text style={[styles.columnHeader, { color: colors.textSecondary, flex: 1.5, textAlign: 'right' }]}>{t('common.cost')}</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {t('common.noData') || 'No bills found for this category.'}
                            </Text>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 20 }]}>
                        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={[styles.iconPlaceholder, { backgroundColor: colors.background }]}>
                                <Ionicons name="calendar-clear-outline" size={16} color={colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={[styles.dateText, { color: colors.text }]}>
                                    {item.date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                                </Text>
                                {item.merchant ? (
                                    <Text style={[styles.yearText, { color: colors.textSecondary }]} numberOfLines={1}>
                                        {item.merchant}
                                    </Text>
                                ) : (
                                    <Text style={[styles.yearText, { color: colors.textSecondary }]}>
                                        {item.date.getFullYear()}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {selectedCategory !== 'other' ? (
                            <Text style={[styles.cell, { color: colors.text, flex: 1.5, textAlign: 'center', fontWeight: '500' }]}>
                                {item.usage} <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.type === 'electricity' ? 'kWh' : 'm³'}</Text>
                            </Text>
                        ) : (
                            <Text style={[styles.cell, { color: colors.text, flex: 1.5, textAlign: 'center', fontSize: 12 }]} numberOfLines={2}>
                                {item.items || item.description || '-'}
                            </Text>
                        )}

                        <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                            <Text style={[styles.costText, { color: colors.primary }]}>
                                ₺{item.cost.toFixed(2)}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                                <TouchableOpacity onPress={() => handleEdit(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            <CustomAlert
                visible={alertVisible}
                title={alertTitle}
                message={alertMessage}
                type={alertType}
                onClose={hideAlert}
                onConfirm={alertOnConfirm}
                confirmText={alertConfirmText}
                cancelText={alertCancelText}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontFamily: 'Pacifico',
        fontSize: 40,
        paddingBottom: 4,
    },
    content: {
        flex: 1,
    },
    categoryContainer: {
        marginBottom: 24,
    },
    categoryScrollContent: {
        paddingHorizontal: 20,
        gap: 20,
    },
    chartContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    categoryItem: {
        alignItems: 'center',
        gap: 8,
    },
    categoryIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    tableContainer: {
        flex: 1,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
        paddingHorizontal: 8,
    },
    columnHeader: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        alignItems: 'center',
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    cell: {
        fontSize: 14,
    },
    iconPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
    },
    yearText: {
        fontSize: 11,
    },
    costText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    emptyText: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BillHistoryScreen;
