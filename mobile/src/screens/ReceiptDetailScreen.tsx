import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../types';
import { useReceipts } from '../contexts/ReceiptContext';
import { useTheme } from '../contexts/ThemeContext';

type ReceiptDetailRouteProp = RouteProp<AppStackParamList, 'ReceiptDetail'>;
type ReceiptDetailNavigationProp = StackNavigationProp<AppStackParamList, 'ReceiptDetail'>;

const ReceiptDetailScreen = () => {
  const route = useRoute<ReceiptDetailRouteProp>();
  const navigation = useNavigation<ReceiptDetailNavigationProp>();
  const { receipts, deleteReceipt } = useReceipts();
  const { receiptId } = route.params;
  const { theme, colors } = useTheme();

  const receipt = receipts.find((r) => r.id === receiptId);

  if (!receipt) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Receipt not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReceipt(receipt.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  };

  const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {(receipt.imageUrl || receipt.localImageUri) && (
        <Image
          source={{ uri: receipt.imageUrl || receipt.localImageUri }}
          style={styles.image}
        />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{receipt.title}</Text>
          <Text style={[styles.amount, { color: colors.primary }]}>${receipt.amount.toFixed(2)}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <InfoRow label="Date" value={new Date(receipt.date).toLocaleDateString()} />
          <InfoRow label="Category" value={receipt.category} />
          {receipt.merchant && <InfoRow label="Merchant" value={receipt.merchant} />}
          {receipt.paymentMethod && (
            <InfoRow
              label="Payment Method"
              value={receipt.paymentMethod.replace('_', ' ')}
            />
          )}
        </View>

        {receipt.description && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{receipt.description}</Text>
          </View>
        )}

        {receipt.tags && receipt.tags.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {receipt.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: theme === 'dark' ? '#333' : '#e0e7ff' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Receipt</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ReceiptDetailScreen;
