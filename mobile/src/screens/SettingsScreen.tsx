import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useReceipts } from '../contexts/ReceiptContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import {
  getReminderSettings,
  saveReminderSettings,
  ReminderSettings,
  refreshBillReminders,
  cancelAllBillReminders,
  getUpcomingBillsCount,
} from '../services/billReminderService';
import { requestNotificationPermissions } from '../services/notificationService';
import DateTimePicker from '@react-native-community/datetimepicker';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { signOut, user } = useAuth();
  const { syncReceipts } = useReceipts();
  const navigation = useNavigation();
  const { theme, colors, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  // Bill Reminder States
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: true,
    reminderDays: [1, 3, 7],
    reminderTime: { hour: 9, minute: 0 },
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [upcomingBillsCount, setUpcomingBillsCount] = useState(0);
  const [tempSelectedTime, setTempSelectedTime] = useState<Date>(new Date(2000, 0, 1, 9, 0));

  // Load reminder settings on mount
  useEffect(() => {
    loadReminderSettings();
    loadUpcomingBillsCount();
  }, []);

  const loadReminderSettings = async () => {
    const settings = await getReminderSettings();
    setReminderSettings(settings);
  };

  const loadUpcomingBillsCount = async () => {
    if (user?.id) {
      const count = await getUpcomingBillsCount(user.id, 7);
      setUpcomingBillsCount(count);
    }
  };

  const handleReminderToggle = async (enabled: boolean) => {
    const newSettings = { ...reminderSettings, enabled };
    setReminderSettings(newSettings);
    await saveReminderSettings(newSettings);

    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          t('settings.permissionRequired') || 'Permission Required',
          t('settings.notificationPermissionMessage') || 'Please enable notifications in your device settings to receive bill reminders.'
        );
        // Revert the toggle
        setReminderSettings({ ...reminderSettings, enabled: false });
        await saveReminderSettings({ ...reminderSettings, enabled: false });
        return;
      }
      // Refresh reminders when enabled
      if (user?.id) {
        await refreshBillReminders(user.id);
      }
    } else {
      // Cancel all reminders when disabled
      await cancelAllBillReminders();
    }
  };

  const handleReminderDayToggle = async (day: number) => {
    let newDays = [...reminderSettings.reminderDays];
    if (newDays.includes(day)) {
      newDays = newDays.filter(d => d !== day);
    } else {
      newDays.push(day);
      newDays.sort((a, b) => a - b);
    }

    const newSettings = { ...reminderSettings, reminderDays: newDays };
    setReminderSettings(newSettings);
    await saveReminderSettings(newSettings);

    // Refresh reminders with new settings
    if (reminderSettings.enabled && user?.id) {
      await refreshBillReminders(user.id);
    }
  };

  // Handle iOS time change (just update temp value, don't save yet)
  const handleIOSTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      // Create a new date to avoid timezone issues
      const localDate = new Date();
      localDate.setHours(selectedDate.getHours());
      localDate.setMinutes(selectedDate.getMinutes());
      localDate.setSeconds(0);
      localDate.setMilliseconds(0);
      setTempSelectedTime(localDate);
      console.log('iOS Time Selected:', selectedDate.getHours(), ':', selectedDate.getMinutes());
    }
  };

  // Handle iOS OK button press (save the time)
  const handleIOSTimeConfirm = async () => {
    setShowTimePicker(false);
    const hour = tempSelectedTime.getHours();
    const minute = tempSelectedTime.getMinutes();
    console.log('Saving time:', hour, ':', minute);
    
    const newSettings = {
      ...reminderSettings,
      reminderTime: { hour, minute },
    };
    setReminderSettings(newSettings);
    await saveReminderSettings(newSettings);

    // Refresh reminders with new time
    if (reminderSettings.enabled && user?.id) {
      await refreshBillReminders(user.id);
    }
  };

  // Handle Android time change (save immediately)
  const handleAndroidTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && event.type !== 'dismissed') {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      console.log('Android Time Selected:', hour, ':', minute);
      
      const newSettings = {
        ...reminderSettings,
        reminderTime: { hour, minute },
      };
      setReminderSettings(newSettings);
      await saveReminderSettings(newSettings);

      // Refresh reminders with new time
      if (reminderSettings.enabled && user?.id) {
        await refreshBillReminders(user.id);
      }
    }
  };

  // Open time picker and initialize temp value
  const openTimePicker = () => {
    const now = new Date();
    now.setHours(reminderSettings.reminderTime.hour);
    now.setMinutes(reminderSettings.reminderTime.minute);
    now.setSeconds(0);
    now.setMilliseconds(0);
    setTempSelectedTime(now);
    setShowTimePicker(true);
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

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

        {/* Bill Reminders Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('settings.billReminders') || 'Fatura Hatırlatıcıları'}
            </Text>
            {upcomingBillsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{upcomingBillsCount}</Text>
              </View>
            )}
          </View>

          {/* Enable Reminders Toggle */}
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alarm-outline" size={20} color="#DC2626" />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t('settings.enableReminders') || 'Hatırlatıcıları Etkinleştir'}
                </Text>
                <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>
                  {t('settings.reminderDescription') || 'Son ödeme tarihinden önce bildirim al'}
                </Text>
              </View>
            </View>
            <Switch
              value={reminderSettings.enabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
              thumbColor={reminderSettings.enabled ? '#DC2626' : '#f4f3f4'}
            />
          </View>

          {/* Reminder Time */}
          {reminderSettings.enabled && (
            <>
              <TouchableOpacity
                style={[styles.settingRow, { borderBottomColor: colors.border }]}
                onPress={openTimePicker}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="time-outline" size={20} color="#2563EB" />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {t('settings.reminderTime') || 'Hatırlatma Saati'}
                  </Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>
                    {formatTime(reminderSettings.reminderTime.hour, reminderSettings.reminderTime.minute)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>

              {/* Reminder Days */}
              <View style={[styles.settingRow, { borderBottomWidth: 0, flexDirection: 'column', alignItems: 'flex-start' }]}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="calendar-outline" size={20} color="#059669" />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {t('settings.reminderDays') || 'Hatırlatma Günleri'}
                  </Text>
                </View>
                <View style={styles.daysContainer}>
                  {[1, 3, 7].map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayChip,
                        { backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6' },
                        reminderSettings.reminderDays.includes(day) && styles.dayChipActive,
                      ]}
                      onPress={() => handleReminderDayToggle(day)}
                    >
                      <Text style={[
                        styles.dayChipText,
                        { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' },
                        reminderSettings.reminderDays.includes(day) && styles.dayChipTextActive,
                      ]}>
                        {day === 1 
                          ? (t('settings.oneDayBefore') || '1 Gün Önce')
                          : day === 3 
                            ? (t('settings.threeDaysBefore') || '3 Gün Önce')
                            : (t('settings.sevenDaysBefore') || '7 Gün Önce')
                        }
                      </Text>
                      {reminderSettings.reminderDays.includes(day) && (
                        <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Time Picker Modal */}
        {showTimePicker && Platform.OS === 'ios' && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showTimePicker}
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.timePickerModalOverlay}>
              <View style={[styles.timePickerModalContent, { backgroundColor: '#FFFFFF' }]}>
                <View style={[styles.timePickerHeader, { borderBottomColor: '#E5E7EB' }]}>
                  <Text style={[styles.timePickerTitle, { color: '#111827' }]}>
                    {t('settings.reminderTime') || 'Hatırlatma Saati'}
                  </Text>
                  <TouchableOpacity onPress={handleIOSTimeConfirm}>
                    <Text style={{ color: '#DC2626', fontSize: 16, fontWeight: '600' }}>
                      {t('common.ok') || 'Tamam'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempSelectedTime}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={handleIOSTimeChange}
                  style={{ height: 180, backgroundColor: '#FFFFFF' }}
                  textColor="#000000"
                  themeVariant="light"
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Android Time Picker */}
        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={new Date(2000, 0, 1, reminderSettings.reminderTime.hour, reminderSettings.reminderTime.minute)}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleAndroidTimeChange}
          />
        )}

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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    flex: 1,
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
  settingSubLabel: {
    fontSize: 12,
    marginTop: 2,
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
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginLeft: 48,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dayChipActive: {
    backgroundColor: '#10B981',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dayChipTextActive: {
    color: '#fff',
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
  timePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
