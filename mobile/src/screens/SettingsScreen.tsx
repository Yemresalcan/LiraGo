import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useReceipts } from '../contexts/ReceiptContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const { syncReceipts } = useReceipts();
  const navigation = useNavigation();
  const { theme, colors, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [offlineMode, setOfflineMode] = React.useState(false);

  const handleLanguageChange = () => {
    Alert.alert(
      t('settings.selectLanguage'),
      '',
      [
        {
          text: t('settings.english'),
          onPress: () => i18n.changeLanguage('en'),
        },
        {
          text: t('settings.turkish'),
          onPress: () => i18n.changeLanguage('tr'),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const handleSync = async () => {
    try {
      await syncReceipts();
      Alert.alert(t('common.success'), t('settings.syncSuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.syncError'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* General Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.general')}</Text>

          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={handleLanguageChange}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="language-outline" size={20} color="#0284C7" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.language')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {i18n.language === 'tr' ? t('settings.turkish') : t('settings.english')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="notifications-outline" size={20} color="#9333EA" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.notifications')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#8CE4FF' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cloud-offline-outline" size={20} color="#D97706" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.offlineMode')}</Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: '#E5E7EB', true: '#8CE4FF' }}
              thumbColor={offlineMode ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6' }]}>
                <Ionicons name={theme === 'dark' ? "moon" : "moon-outline"} size={20} color={theme === 'dark' ? "#F9FAFB" : "#374151"} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E5E7EB', true: '#8CE4FF' }}
              thumbColor={'#fff'}
            />
          </View>
        </View>



        {/* About Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.about')}</Text>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="information-circle-outline" size={20} color="#475569" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.version')}</Text>
            </View>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>


        </View>

        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.card }]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.signOutButtonText}>{t('settings.signOut')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  headerTitle: {
    fontFamily: 'Pacifico',
    fontSize: 40,
    paddingBottom: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  signOutButton: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
