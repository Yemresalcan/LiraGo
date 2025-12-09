import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import Svg, { Path } from 'react-native-svg';
import * as Font from 'expo-font';
import { useTheme } from '../contexts/ThemeContext';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const { width, height } = Dimensions.get('window');

const RegisterScreen = () => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const { signUp } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { theme, colors } = useTheme();

  useEffect(() => {
    async function loadFont() {
      try {
        await Font.loadAsync({
          'Pacifico': require('../../assets/fonts/Pacifico-Regular.ttf'),
        });
        setFontLoaded(true);
      } catch (error) {
        console.log('Font load error:', error);
        setFontLoaded(true);
      }
    }
    loadFont();
  }, []);

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName);
      Alert.alert(t('common.success'), t('auth.accountCreated'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!fontLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.headerContainer}>
        <Svg height="100%" width={width} viewBox={`0 0 ${width} ${height * 0.4}`} style={styles.svg}>
          <Path
            d={`M0,0 L${width},0 L${width},${height * 0.3} Q${width * 0.5},${height * 0.4} 0,${height * 0.3} Z`}
            fill={colors.primary}
          />
        </Svg>
        <View style={styles.headerContent}>
          {/* Placeholder for illustration or just empty space */}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>LiraGo</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('auth.createAccount')}</Text>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, borderWidth: 1 }]}
              placeholder={t('auth.displayName')}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
              placeholderTextColor={colors.textSecondary}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, borderWidth: 1 }]}
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              placeholderTextColor={colors.textSecondary}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, borderWidth: 1 }]}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              placeholderTextColor={colors.textSecondary}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, borderWidth: 1 }]}
              placeholder={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.button, styles.registerButton, loading && styles.buttonDisabled, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>{t('auth.signUp')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.loginButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={[styles.loginButtonText, { color: colors.text }]}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 0,
  },
  svg: {
    position: 'absolute',
    top: 0,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: height * 0.35, // Push content below the header curve
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontFamily: 'Pacifico',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  input: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  registerButton: {
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    borderWidth: 2,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default RegisterScreen;

