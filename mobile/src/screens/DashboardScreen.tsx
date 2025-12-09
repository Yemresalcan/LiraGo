import React, { useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, TabParamList, Stats } from '../types';
import { useReceipts } from '../contexts/ReceiptContext';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import ExpensesChart from '../components/ExpensesChart';
import UtilityStories from '../components/UtilityStories';
import InsightCarousel from '../components/InsightCarousel';
import AiSuggestions from '../components/AiSuggestions';
import { useTheme } from '../contexts/ThemeContext';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BillType } from '../types';

type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  StackNavigationProp<AppStackParamList>
>;

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { receipts, loading } = useReceipts();
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const [bills, setBills] = React.useState<{ id: string; type: BillType; amount: number; date: Date; createdAt: Date; category: string; description?: string; items?: string }[]>([]);

  // Fetch bills from all categories
  React.useEffect(() => {
    if (!user) {
      setBills([]);
      return;
    }

    const billTypes: BillType[] = ['electricity', 'water', 'naturalGas', 'gas', 'internet', 'other'];
    const unsubscribes: (() => void)[] = [];

    billTypes.forEach((type) => {
      const q = query(collection(db, `${type}_bills`), where('userId', '==', user.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newBills = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: type,
            amount: data.cost,
            date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
            category: type === 'other' ? t('dashboard.otherBills') : (t(`dashboard.${type}`) || type.charAt(0).toUpperCase() + type.slice(1)),
            description: data.description,
            items: data.items,
          };
        });

        setBills((prev) => {
          // Remove existing bills of this type and add new ones
          const otherBills = prev.filter((b) => b.type !== type);
          return [...otherBills, ...newBills];
        });
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user]);

  const allTransactions = useMemo(() => {
    const receiptTransactions = receipts.map((r) => ({
      id: r.id,
      type: 'receipt',
      title: r.merchant || r.title || 'Unknown',
      amount: r.amount,
      date: new Date(r.date),
      createdAt: new Date(r.createdAt),
      category: r.category,
      originalType: 'other',
    }));

    const billTransactions = bills.map((b) => ({
      id: b.id,
      type: 'bill',
      title: b.type === 'other' ? (b.items || b.description || t('dashboard.otherBills')) : (t(`dashboard.${b.type}`) || b.category),
      amount: b.amount,
      date: b.date,
      createdAt: b.createdAt,
      category: t(`dashboard.${b.type}`) || b.category,
      originalType: b.type,
    }));

    return [...receiptTransactions, ...billTransactions].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [receipts, bills, t]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const stats: Stats = useMemo(() => {
    const totalExpenses = allTransactions.reduce((sum, t) => sum + t.amount, 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = allTransactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryMap: { [key: string]: { amount: number; originalType: string } } = {};
    allTransactions.forEach((t) => {
      if (categoryMap[t.category]) {
        categoryMap[t.category].amount += t.amount;
      } else {
        categoryMap[t.category] = { amount: t.amount, originalType: t.originalType };
      }
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      color: colors.billColors[data.originalType as keyof typeof colors.billColors] || colors.billColors.other,
    }));

    return {
      totalExpenses,
      monthlyExpenses,
      receiptCount: allTransactions.length,
      categoryBreakdown,
    };
  }, [allTransactions]);

  const recentActivity = useMemo(() => {
    return allTransactions.slice(0, 5);
  }, [allTransactions]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh since onSnapshot handles real-time updates
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>LiraGo</Text>
          </View>

          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Insight Carousel */}
        <InsightCarousel />

        {/* Main Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.primary }]}>
          <View style={styles.mainCardTop}>
            <Text style={styles.brandName}>LiraGo</Text>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceAmount}>₺{stats.monthlyExpenses.toFixed(2)}</Text>
              <Text style={styles.balanceLabel}>{t('dashboard.thisMonth')}</Text>
            </View>
          </View>

          <View style={styles.mainCardActions}>
            <View style={styles.mainCardButtons}>
              <TouchableOpacity
                style={styles.cardActionButton}
                onPress={() => navigation.navigate('BillUpload')}
              >
                <Text style={styles.cardActionText}>{t('dashboard.addReceipt')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardActionButton}
                onPress={() => navigation.navigate('BillHistory')}
              >
                <Text style={styles.cardActionText}>{t('dashboard.table')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardActionButton}
                onPress={() => navigation.navigate('BillHistory', { initialCategory: 'other' })}
              >
                <Text style={styles.cardActionText}>{t('dashboard.otherBills')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cardMenuButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#0a0909ff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stories / Quick Access */}
        <UtilityStories />

        {/* Activity Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.activity')}</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={20} color="#74daf3ff" />
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <View key={item.id} style={[styles.activityItem, index !== recentActivity.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={[styles.activityIcon, { backgroundColor: colors.background }]}>
                    <Ionicons
                      name={item.type === 'bill' ? 'flash-outline' : 'receipt-outline'}
                      size={24}
                      color={colors.billColors[item.originalType as keyof typeof colors.billColors] || colors.text}
                    />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.activitySubtitle, { color: colors.textSecondary }]}>{item.category}</Text>
                  </View>
                  <Text style={[styles.activityAmount, { color: colors.text }]}>-₺{item.amount.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('receipts.noReceipts')}</Text>
            )}

            <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('MonthlyDashboard')}>
              <Text style={styles.seeAllText}>{t('dashboard.viewAllReceipts')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Suggestions */}
        <AiSuggestions transactions={allTransactions} />

        {/* Expense Analysis */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.expenseAnalysis')}</Text>
          <ExpensesChart data={stats.categoryBreakdown} total={stats.totalExpenses} />
        </View>

        {/* Bottom Spacer for Tab Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Pacifico',
    fontSize: 40,
    paddingBottom: 4,
  },
  insightCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightIconContainer: {
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightSubtitle: {
    fontSize: 14,
  },
  mainCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#8CE4FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  mainCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandName: {
    fontFamily: 'Pacifico',
    fontSize: 32,
    color: '#fff',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  accountNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  accountNumber: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    letterSpacing: 1,
  },
  mainCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainCardButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cardActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.97)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cardActionText: {
    color: '#f1ddddff',
    fontWeight: '600',
    fontSize: 14,
  },
  cardMenuButton: {
    padding: 4,
  },
  sectionContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  seeAllButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  seeAllText: {
    color: '#48c2e0ff',
    fontWeight: '600',
    fontSize: 16,
  },
  suggestedScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  suggestedCard: {
    width: 140,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  suggestedLabel: {
    fontSize: 14,
  },
});

export default DashboardScreen;

