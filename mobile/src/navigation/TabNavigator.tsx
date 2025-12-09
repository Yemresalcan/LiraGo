import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { TabParamList } from '../types';
import DashboardScreen from '../screens/DashboardScreen';
import AddReceiptScreen from '../screens/AddReceiptScreen';
import ReceiptListScreen from '../screens/ReceiptListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddReceiptModal from '../components/AddReceiptModal';
import { useTheme } from '../contexts/ThemeContext';
import BillHistoryScreen from '../screens/BillHistoryScreen';
import BillUploadScreen from '../screens/BillUploadScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const EmptyComponent = () => null;

const AnimatedAddButton = ({ onPress }: { onPress: () => void }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const { colors } = useTheme();

    useEffect(() => {
        const pulse = Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]);

        Animated.loop(pulse).start();
    }, [scaleAnim]);

    return (
        <TouchableOpacity onPress={onPress} style={styles.addButtonContainer}>
            <Animated.View style={[styles.addButton, { backgroundColor: colors.primary, transform: [{ scale: scaleAnim }] }]}>
                <Icon name="camera" size={26} color="#fff" />
            </Animated.View>
        </TouchableOpacity>
    );
};

const TabNavigator = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const [modalVisible, setModalVisible] = useState(false);
    const { theme, colors } = useTheme();

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            // You could show another custom modal here for permissions
            alert(t('addReceipt.cameraPermissionMessage'));
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            // Navigate to BillUpload with imageUri
            navigation.navigate('BillUpload', { imageUri: result.assets[0].uri });
        }
    };

    const handleChooseFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert(t('addReceipt.galleryPermissionMessage'));
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            navigation.navigate('BillUpload', { imageUri: result.assets[0].uri });
        }
    };

    const handleAddReceipt = () => {
        handleTakePhoto();
    };

    const modalOptions = [
        {
            icon: 'camera',
            label: t('addReceipt.takePhoto') || 'Take Photo',
            onPress: handleTakePhoto,
            color: '#8CE4FF',
        },
        {
            icon: 'images',
            label: t('addReceipt.chooseFromGallery') || 'Choose from Gallery',
            onPress: handleChooseFromGallery,
            color: '#B19CD9',
        },
    ];

    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        position: 'absolute',
                        bottom: 20,
                        left: '5%',
                        right: '5%',
                        backgroundColor: colors.card,
                        borderRadius: 35,
                        height: 75,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: 8,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 15,
                        elevation: 10,
                        borderTopWidth: 0,
                        paddingBottom: 8,
                        paddingTop: 8,
                    },
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textSecondary,
                    tabBarShowLabel: true,
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '500',
                        marginTop: -2,
                    },
                    tabBarItemStyle: {
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                }}
            >
                <Tab.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{
                        tabBarLabel: t('dashboard.title'),
                        tabBarIcon: ({ color }) => (
                            <Icon name="grid" size={24} color={color} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="MonthlyDashboard"
                    component={ReceiptListScreen}
                    options={{
                        tabBarLabel: t('receipts.title'),
                        tabBarIcon: ({ color }) => (
                            <Icon name="doc" size={24} color={color} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="BillHistory"
                    component={BillHistoryScreen}
                    options={{
                        tabBarLabel: t('billHistory.title') || 'History',
                        tabBarIcon: ({ color }) => (
                            <Icon name="chart" size={24} color={color} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="BillUpload"
                    component={BillUploadScreen}
                    options={{
                        tabBarLabel: t('billUpload.title') || 'Upload',
                        tabBarIcon: ({ color }) => (
                            <Icon name="cloud-upload" size={24} color={color} />
                        ),
                    }}
                />


                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        tabBarLabel: t('settings.title'),
                        tabBarIcon: ({ color }) => (
                            <Icon name="settings" size={24} color={color} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="AddReceipt"
                    component={EmptyComponent}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: () => null,
                        tabBarButton: (props) => (
                            <AnimatedAddButton onPress={handleAddReceipt} />
                        ),
                    }}
                    listeners={{
                        tabPress: (e) => {
                            e.preventDefault();
                        },
                    }}
                />
            </Tab.Navigator>

            <AddReceiptModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={t('addReceipt.chooseSource') || 'Fiş Ekle'}
                message={t('addReceipt.chooseSourceMessage') || 'Fişinizi nasıl eklemek istersiniz?'}
                options={modalOptions}
                cancelText={t('common.cancel') || 'İptal'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    addButtonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default TabNavigator;
