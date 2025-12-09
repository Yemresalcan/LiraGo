import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: Date;
  type: string;
}

interface AiSuggestionsProps {
  transactions: Transaction[];
}

const AiSuggestions: React.FC<AiSuggestionsProps> = ({ transactions }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const suggestions = useMemo(() => {
    const suggs: { id: string; text: string; icon: string; color: string }[] = [];
    
    // Logic to generate suggestions
    // 1. Calculate total spending by category
    const categoryTotals: { [key: string]: number } = {};
    transactions.forEach(t => {
        if (t.amount > 0) {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        }
    });

    // Find highest spending category
    let maxCategory = '';
    let maxAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
        if (amount > maxAmount) {
            maxAmount = amount;
            maxCategory = cat;
        }
    });

    if (maxCategory) {
        suggs.push({
            id: '1',
            text: t('aiSuggestions.highSpending', { category: maxCategory }),
            icon: 'trending-up-outline',
            color: '#FF5252'
        });
    } else {
         suggs.push({
            id: '1',
            text: t('aiSuggestions.goodJob'),
            icon: 'thumbs-up-outline',
            color: '#4CAF50'
        });
    }

    // 2. Check for recurring/bills (simple heuristic: if type is bill)
    const bills = transactions.filter(t => t.type === 'bill');
    if (bills.length > 0) {
         suggs.push({
            id: '2',
            text: t('aiSuggestions.checkBills'),
            icon: 'calendar-outline',
            color: '#448AFF'
        });
    } else {
        suggs.push({
            id: '2',
            text: t('aiSuggestions.saveMore', { category: t('categories.utilities') }),
            icon: 'wallet-outline',
            color: '#4CAF50'
        });
    }
    
    // 3. Generic suggestion
    suggs.push({
        id: '3',
        text: t('aiSuggestions.generic'),
        icon: 'bulb-outline',
        color: '#FFC107'
    });

    return suggs.slice(0, 3);
  }, [transactions, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>{t('aiSuggestions.title')}</Text>
        </View>
      </View>
      
      <View style={styles.list}>
        {suggestions.map((item, index) => (
            <View key={item.id} style={[
                styles.item, 
                { backgroundColor: colors.background },
                index !== suggestions.length - 1 && { marginBottom: 12 }
            ]}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[styles.itemText, { color: colors.text }]}>{item.text}</Text>
            </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AiSuggestions;
