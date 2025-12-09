import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { AppStackParamList } from '../types';
import TabNavigator from './TabNavigator';
import ReceiptDetailScreen from '../screens/ReceiptDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BillUploadScreen from '../screens/BillUploadScreen';
import BillHistoryScreen from '../screens/BillHistoryScreen';

const Stack = createStackNavigator<AppStackParamList>();

const AppStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReceiptDetail"
        component={ReceiptDetailScreen}
        options={{ title: t('receipts.receiptDetails') }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BillUpload"
        component={BillUploadScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BillHistory"
        component={BillHistoryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
