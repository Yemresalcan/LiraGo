import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, TabParamList, Receipt, BillType } from '../types';
import { useReceipts } from '../contexts/ReceiptContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import Ionicons from '@expo/vector-icons/Ionicons';

type ReceiptListScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'MonthlyDashboard'>,
  StackNavigationProp<AppStackParamList>
>;

interface UnifiedTransaction {
  id: string;
  type: 'receipt' | BillType;
  title: string;
  amount: number;
  date: Date;
  category: string;
  merchant?: string;
  isSynced?: boolean;
}

const ReceiptListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ReceiptListScreenNavigationProp>();
  const { receipts, loading: receiptsLoading } = useReceipts();
  const { theme, colors } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [bills, setBills] = useState<UnifiedTransaction[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh since onSnapshot handles real-time updates
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Fetch bills from all categories
  useEffect(() => {
    if (!user) {
      setBills([]);
      setBillsLoading(false);
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
            title: data.merchant || t(`dashboard.${type}`),
            amount: data.cost,
            date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
            category: t(`dashboard.${type}`),
            merchant: data.merchant,
            isSynced: true,
          } as UnifiedTransaction;
        });

        setBills((prev) => {
          const otherBills = prev.filter((b) => b.type !== type);
          return [...otherBills, ...newBills];
        });
      });
      unsubscribes.push(unsubscribe);
    });

    setBillsLoading(false);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user]);

  const allTransactions = useMemo(() => {
    const receiptTransactions: UnifiedTransaction[] = receipts.map((r) => ({
      id: r.id,
      type: 'receipt',
      title: r.title || r.merchant || 'Unknown',
      amount: r.amount,
      date: new Date(r.date),
      category: r.category,
      merchant: r.merchant,
      isSynced: r.isSynced,
    }));

    return [...receiptTransactions, ...bills].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }, [receipts, bills]);

  const filteredTransactions = allTransactions.filter(
    (item) =>
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.merchant || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: UnifiedTransaction }) => (
    <TouchableOpacity
      style={[styles.receiptCard, { backgroundColor: colors.card, shadowColor: theme === 'dark' ? '#000' : '#000' }]}
      onPress={() => {
        if (item.type === 'receipt') {
          navigation.navigate('ReceiptDetail', { receiptId: item.id });
        } else {
          // For bills, navigate to BillHistory with the correct category
          // If it's 'other', we might want to pass that specifically
          const categoryToPass = (item.type === 'gas' ? 'naturalGas' : item.type) as BillType;
          navigation.navigate('BillHistory', { initialCategory: categoryToPass });
        }
      }}
    >
      <View style={styles.receiptHeader}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }]}>
             <Ionicons 
                name={
                    item.type === 'receipt' ? 'receipt-outline' :
                    item.type === 'electricity' ? 'flash-outline' :
                    item.type === 'water' ? 'water-outline' :
                    item.type === 'naturalGas' || item.type === 'gas' ? 'flame-outline' :
                    item.type === 'internet' ? 'wifi-outline' :
                    'document-text-outline'
                } 
                size={20} 
                color={
                  item.type === 'receipt' ? colors.text :
                  item.type === 'gas' ? colors.billColors.naturalGas :
                  colors.billColors[item.type as keyof typeof colors.billColors] || colors.text
                } 
             />
          </View>
          <Text style={[styles.receiptTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        </View>
        <Text style={[styles.receiptAmount, { color: colors.text }]}>₺{item.amount.toFixed(2)}</Text>
      </View>

      <View style={styles.receiptDetails}>
        <Text style={[styles.receiptDate, { color: colors.textSecondary }]}>
          {item.date.toLocaleDateString()}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: theme === 'dark' ? '#333' : '#f3f4f6' }]}>
          <Text style={[styles.categoryText, { color: colors.textSecondary }]}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (receiptsLoading || billsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }]} 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Dashboard');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('receipts.title')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder={t('receipts.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('receipts.noReceipts')}</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AddReceipt')}
          >
            <Text style={[styles.addButtonText, { color: theme === 'dark' ? '#000' : '#fff' }]}>{t('receipts.addReceipt')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
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
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontFamily: 'Pacifico',
    fontSize: 40,
    paddingBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  receiptCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  receiptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptDate: {
    fontSize: 14,
  },
  categoryBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
  },
  addButton: {
    borderRadius: 16,
    padding: 16,
    paddingHorizontal: 32,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReceiptListScreen;
