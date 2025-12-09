import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TabParamList } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useReceipts } from '../contexts/ReceiptContext';
import { extractTextFromImage } from '../services/ocrService';
import { useTheme } from '../contexts/ThemeContext';

type AddReceiptScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'AddReceipt'>;

const AddReceiptScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AddReceiptScreenNavigationProp>();
  const { addReceipt } = useReceipts();
  const { theme, colors } = useTheme();

  const CATEGORIES = [
    t('categories.foodDining'),
    t('categories.transportation'),
    t('categories.shopping'),
    t('categories.entertainment'),
    t('categories.healthcare'),
    t('categories.utilities'),
    t('categories.other'),
  ];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState(t('categories.foodDining'));
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('addReceipt.galleryPermission'),
          t('addReceipt.galleryPermissionMessage')
        );
        return false;
      }
    }
    return true;
  };

  const processImageWithOCR = async (uri: string) => {
    setOcrLoading(true);
    try {
      const ocrResult = await extractTextFromImage(uri);

      if (ocrResult.extractedData) {
        if (ocrResult.extractedData.amount) {
          setAmount(ocrResult.extractedData.amount.toString());
        }
        if (ocrResult.extractedData.merchant) {
          setMerchant(ocrResult.extractedData.merchant);
          if (!title) {
            setTitle(`Receipt from ${ocrResult.extractedData.merchant}`);
          }
        }
        if (ocrResult.extractedData.date) {
          // Date is extracted but not currently used in the form
          // You can add a date picker if needed
        }
      }

      Alert.alert(
        t('addReceipt.ocrComplete'),
        t('addReceipt.ocrCompleteMessage'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('OCR error:', error);
      Alert.alert(
        t('addReceipt.ocrFailed'),
        t('addReceipt.ocrFailedMessage'),
        [{ text: 'OK' }]
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await processImageWithOCR(uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('addReceipt.cameraPermission'),
        t('addReceipt.cameraPermissionMessage')
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await processImageWithOCR(uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !amount) {
      Alert.alert(t('common.error'), t('addReceipt.validationError'));
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t('common.error'), t('addReceipt.invalidAmount'));
      return;
    }

    setLoading(true);
    try {
      await addReceipt({
        title,
        amount: amountNum,
        currency: 'USD',
        category,
        merchant,
        description,
        date: new Date(),
        localImageUri: imageUri || undefined,
        isSynced: true,
      });

      Alert.alert(t('common.success'), t('receipts.receiptAdded'));
      navigation.goBack();
    } catch (error) {
      console.error('Error adding receipt:', error);
      Alert.alert(t('common.error'), t('addReceipt.savedOffline'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('addReceipt.title')}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {ocrLoading && (
            <View style={[styles.ocrLoadingContainer, { backgroundColor: theme === 'dark' ? '#333' : '#e0e7ff' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.ocrLoadingText, { color: colors.primary }]}>{t('addReceipt.ocrProcessing')}</Text>
            </View>
          )}

          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <Text style={styles.removeImageText}>{t('addReceipt.remove')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
              onPress={takePhoto}
              disabled={loading}
            >
              <Text style={[styles.imageButtonText, { color: colors.primary }]}>{t('addReceipt.takePhoto')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
              onPress={pickImage}
              disabled={loading}
            >
              <Text style={[styles.imageButtonText, { color: colors.primary }]}>{t('addReceipt.chooseFromGallery')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{t('addReceipt.receiptTitle')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            placeholder={t('addReceipt.enterTitle')}
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('addReceipt.amount')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            placeholder={t('addReceipt.enterAmount')}
            placeholderTextColor={colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!loading}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('addReceipt.merchant')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            placeholder={t('addReceipt.enterMerchant')}
            placeholderTextColor={colors.textSecondary}
            value={merchant}
            onChangeText={setMerchant}
            editable={!loading}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('addReceipt.category')}</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  category === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setCategory(cat)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: colors.textSecondary },
                    category === cat && { color: '#fff', fontWeight: '600' },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{t('addReceipt.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            placeholder={t('addReceipt.enterDescription')}
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.submitButtonText, { color: theme === 'dark' ? '#000' : '#fff' }]}>{t('receipts.addReceipt')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: 'Pacifico',
    fontSize: 40,
    paddingBottom: 4,
  },
  form: {
    padding: 20,
    paddingTop: 0,
  },
  ocrLoadingContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  ocrLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  imageButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddReceiptScreen;
