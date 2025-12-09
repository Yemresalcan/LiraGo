import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

import { useTranslation } from 'react-i18next';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { t } = useTranslation();
  const { user, signOut, updateUserProfile } = useAuth();
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { theme, colors } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' }>({
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert(t('profile.error'), t('profile.nameRequired'), 'error');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({ displayName: name, bio });
      setIsEditing(false);
      showAlert(t('profile.success'), t('profile.profileUpdated'), 'success');
    } catch (error) {
      showAlert(t('profile.error'), t('profile.updateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const MenuItem = ({ icon, title, value, hasNotification, onPress, color = '#FFD700' }: any) => (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="#000" />
        </View>
        <Text style={[styles.menuItemTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && <Text style={[styles.menuItemValue, { color: colors.textSecondary }]}>{value}</Text>}
        {hasNotification && <View style={styles.notificationDot} />}
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Settings' })}>
            <Ionicons name="settings-sharp" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarRing, { borderColor: colors.border }]}>
              <View style={[styles.avatarContainer, { backgroundColor: theme === 'dark' ? '#333' : '#333' }]}>
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
            <View style={[styles.percentageBadge, { borderColor: colors.background }]}>
              <Text style={styles.percentageText}>100%</Text>
            </View>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={[styles.label, { color: colors.text }]}>{t('profile.name')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.enterName')}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('profile.bio')}</Text>
              <TextInput
                style={[styles.input, styles.bioInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                value={bio}
                onChangeText={setBio}
                placeholder={t('profile.enterBio')}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setIsEditing(false);
                    setName(user?.displayName || '');
                    setBio(user?.bio || '');
                  }}
                  disabled={saving}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('profile.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.text }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={[styles.saveButtonText, { color: colors.background }]}>{t('profile.save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.text }]}>{user?.displayName || 'User'}</Text>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.userHandle, { color: colors.textSecondary }]}>{user?.email}</Text>
              {user?.bio ? <Text style={[styles.userBio, { color: colors.textSecondary }]}>{user.bio}</Text> : null}

              <TouchableOpacity
                style={[styles.editProfileButton, { backgroundColor: colors.card }]}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="pencil" size={16} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.editProfileText, { color: colors.text }]}>{t('profile.editProfile')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu List */}
        <View style={styles.menuList}>
          <MenuItem
            icon="hardware-chip-outline"
            title={t('dashboard.activity')} // Using existing key or add new one if needed
            value="85%"
            color="#B19CD9"
            onPress={() => { }}
          />
          <MenuItem
            icon="log-out-outline"
            title={t('auth.logout')}
            color="#FF6B6B"
            onPress={handleLogout}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  coinText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderTopColor: '#8CE4FF', // Progress effect
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }], // Rotate to position the colored part
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }], // Counter-rotate content
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  percentageBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    backgroundColor: '#8CE4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
  },
  userHandle: {
    fontSize: 14,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 16,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuList: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  editForm: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
  },
  saveButton: {
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userBio: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});

export default ProfileScreen;
