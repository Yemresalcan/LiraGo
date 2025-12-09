import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, BillType, TabParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { extractTextFromImage, detectBillType, extractBillData } from '../services/ocrService';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import TabNavigator from '../navigation/TabNavigator';
import { useTheme } from '../contexts/ThemeContext';

import CustomAlert from '../components/CustomAlert';
import DateTimePicker from '@react-native-community/datetimepicker';

type BillUploadScreenNavigationProp = StackNavigationProp<AppStackParamList, 'BillUpload'>;
type BillUploadScreenRouteProp = RouteProp<TabParamList, 'BillUpload'>;

const BillUploadScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<BillUploadScreenNavigationProp>();
    const route = useRoute<BillUploadScreenRouteProp>();
    const { user } = useAuth();
    const { theme, colors } = useTheme();

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);

    // Form State
    const [billType, setBillType] = useState<BillType | null>(null);
    const [usage, setUsage] = useState('');
    const [cost, setCost] = useState('');
    const [merchant, setMerchant] = useState('');
    const [items, setItems] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

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

    useEffect(() => {
        if (route.params?.imageUri) {
            setImageUri(route.params.imageUri);
            processImageWithOCR(route.params.imageUri);
        }
    }, [route.params?.imageUri]);

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showAlert(t('billUpload.permissionNeeded'), t('billUpload.galleryPermission'), 'error');
                return false;
            }
        }
        return true;
    };

    const processImageWithOCR = async (uri: string) => {
        setOcrLoading(true);
        try {
            const ocrResult = await extractTextFromImage(uri);

            // Use Gemini extracted data if available
            if (ocrResult.billData) {
                if (ocrResult.billData.type) {
                    const type = ocrResult.billData.type === 'gas' ? 'naturalGas' : ocrResult.billData.type;
                    setBillType(type as BillType);
                } else {
                    setBillType('other');
                }
                if (ocrResult.billData.usage) setUsage(ocrResult.billData.usage.toString());
                if (ocrResult.billData.cost) setCost(ocrResult.billData.cost.toString());
                if (ocrResult.billData.items) setItems(ocrResult.billData.items);
                if (ocrResult.billData.description) setDescription(ocrResult.billData.description);
            } else {
                // Fallback to regex detection
                const detectedType = detectBillType(ocrResult.text);
                if (detectedType) {
                    const type = detectedType === 'gas' ? 'naturalGas' : detectedType;
                    setBillType(type);

                    // Extract Data based on type
                    const extractedData = extractBillData(ocrResult.text, detectedType);
                    if (extractedData.usage) setUsage(extractedData.usage.toString());
                    if (extractedData.cost) setCost(extractedData.cost.toString());
                } else {
                    // Default to 'other' if type is not detected
                    setBillType('other');
                }
            }

            if (ocrResult.extractedData?.merchant) {
                setMerchant(ocrResult.extractedData.merchant);
            }
            if (ocrResult.extractedData?.date) {
                setDate(ocrResult.extractedData.date);
            }

        } catch (error) {
            console.error('OCR error:', error);
            showAlert(t('billUpload.error'), t('billUpload.processFailed'), 'error');
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
            showAlert(t('billUpload.permissionNeeded'), t('billUpload.cameraPermission'), 'error');
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
        if (!billType) {
            showAlert(t('billUpload.error'), t('billUpload.selectType'), 'error');
            return;
        }
        if (!cost) {
            showAlert(t('billUpload.error'), t('billUpload.enterCost'), 'error');
            return;
        }
        if (!user) {
            showAlert(t('billUpload.error'), t('billUpload.loginRequired'), 'error');
            return;
        }

        if (!date) {
            showAlert(t('billUpload.error'), t('billUpload.enterDate'), 'error');
            return;
        }

        setLoading(true);
        try {
            const collectionName = `${billType}_bills`;
            const billData = {
                userId: user.id,
                type: billType,
                usage: parseFloat(usage) || 0,
                cost: parseFloat(cost) || 0,
                merchant,
                items,
                description,
                date: Timestamp.fromDate(date!),
                createdAt: Timestamp.now(),
            };

            await addDoc(collection(db, collectionName), billData);

            showAlert(t('billUpload.success'), t('billUpload.saved'), 'success');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving bill:', error);
            showAlert(t('billUpload.error'), t('billUpload.failed'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.card }]}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('billUpload.title')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                {ocrLoading && (
                    <View style={[styles.loadingOverlay, { backgroundColor: colors.card }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('billUpload.analyzing')}</Text>
                    </View>
                )}

                {/* Image Section */}
                <View style={styles.imageSection}>
                    {imageUri ? (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.7)']}
                                style={styles.imageOverlay}
                            />
                            <TouchableOpacity style={styles.retakeButton} onPress={() => setImageUri(null)}>
                                <Ionicons name="close-circle" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.uploadButtons}>
                            <TouchableOpacity style={[styles.uploadButton, { backgroundColor: colors.card }]} onPress={takePhoto}>
                                <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#27272a' : '#F5F7FA' }]}>
                                    <Ionicons name="camera" size={28} color={colors.primary} />
                                </View>
                                <Text style={[styles.uploadButtonText, { color: colors.text }]}>{t('billUpload.takePhoto')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.uploadButton, { backgroundColor: colors.card }]} onPress={pickImage}>
                                <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#27272a' : '#F5F7FA' }]}>
                                    <Ionicons name="images" size={28} color="#B19CD9" />
                                </View>
                                <Text style={[styles.uploadButtonText, { color: colors.text }]}>{t('billUpload.gallery')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Form Section */}
                <View style={[styles.form, { backgroundColor: colors.card }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('billUpload.billType')}</Text>
                    <View style={styles.typeContainer}>
                        {(['electricity', 'water', 'naturalGas', 'other'] as BillType[]).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeChip,
                                    { backgroundColor: theme === 'dark' ? '#27272a' : '#F5F7FA' },
                                    billType === type && {
                                        backgroundColor: colors.billColors[type as keyof typeof colors.billColors] || colors.primary,
                                        borderColor: colors.billColors[type as keyof typeof colors.billColors] || colors.primary,
                                    },
                                ]}
                                onPress={() => setBillType(type)}
                            >
                                <Ionicons
                                    name={
                                        type === 'electricity' ? 'flash' :
                                        type === 'water' ? 'water' :
                                        type === 'naturalGas' ? 'flame' :
                                        'receipt'
                                    }
                                    size={20}
                                    color={billType === type ? '#fff' : colors.billColors[type as keyof typeof colors.billColors] || colors.textSecondary}
                                />
                                <Text style={[styles.typeText, { color: colors.textSecondary }, billType === type && styles.typeTextActive]}>
                                    {t(type === 'other' ? 'dashboard.otherBills' : `dashboard.${type}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('billUpload.totalCost')}</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={cost}
                            onChangeText={setCost}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {billType !== 'other' && (
                        <>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                {t('billUpload.usage')} ({billType === 'electricity' ? 'kWh' : 'm³'})
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                                <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={usage}
                                    onChangeText={setUsage}
                                    keyboardType="decimal-pad"
                                    placeholder="0"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </>
                    )}

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('billUpload.merchant')}</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <Ionicons name="business-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={merchant}
                            onChangeText={setMerchant}
                            placeholder={t('addReceipt.enterMerchant')}
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {billType === 'other' && (
                        <>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('addReceipt.description')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                                <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder={t('addReceipt.enterDescription')}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('billUpload.items')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border, alignItems: 'flex-start' }]}>
                                <Ionicons name="list-outline" size={20} color={colors.textSecondary} style={[styles.inputIcon, { marginTop: 12 }]} />
                                <TextInput
                                    style={[styles.input, { color: colors.text, height: 80, textAlignVertical: 'top' }]}
                                    value={items}
                                    onChangeText={setItems}
                                    placeholder={t('billUpload.enterItems')}
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </>
                    )}

                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {billType === 'other' ? (t('billUpload.paymentDate') || 'Ödeme Tarihi') : t('billUpload.dueDate')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <Text style={[styles.input, { color: date ? colors.text : colors.textSecondary, paddingVertical: 16 }]}>
                            {date ? date.toLocaleDateString('tr-TR') : (t('billUpload.selectDate') || 'Tarih Seçiniz')}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={date || new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                    setDate(selectedDate);
                                }
                            }}
                        />
                    )}

                    <TouchableOpacity
                        style={[
                            styles.saveButton, 
                            (!billType || !cost || !date || loading) && styles.disabledButton, 
                            { backgroundColor: theme === 'dark' ? colors.primary : '#333' }
                        ]}
                        onPress={handleSubmit}
                        disabled={!billType || !cost || !date || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={[styles.saveButtonText, { color: theme === 'dark' ? '#000' : '#fff' }]}>{t('billUpload.saveBill')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

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
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
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
    scrollContent: {
        paddingBottom: 120,
    },
    loadingOverlay: {
        padding: 20,
        alignItems: 'center',
        margin: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    loadingText: {
        marginTop: 10,
        fontWeight: '500',
    },
    imageSection: {
        padding: 20,
    },
    uploadButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    uploadButton: {
        flex: 1,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    uploadButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    previewContainer: {
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        height: 240,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#ddd',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    retakeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 4,
    },
    form: {
        padding: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        minHeight: 500,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 16,
        marginLeft: 4,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 8,
    },
    typeChip: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 6,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600',
        flexShrink: 1,
    },
    typeTextActive: {
        color: '#fff',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
    },
    saveButton: {
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginTop: 40,
        shadowColor: '#333',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BillUploadScreen;
