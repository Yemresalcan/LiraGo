import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import Svg, { Path } from 'react-native-svg';
import * as Font from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

const LoadingScreen = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const { theme, colors } = useTheme();

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            delay: delay,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.graphicContainer}>
        {/* Yellow Background Circle */}
        <View style={styles.yellowCircle} />

        {/* Blue Circle */}
        <View style={styles.blueCircle} />

        {/* Green Circle */}
        <View style={styles.greenCircle}>
          <Ionicons name="time-outline" size={32} color="#000" style={{ opacity: 0.8 }} />
        </View>
      </View>

      <Text style={[styles.loadingTitle, { color: colors.text }]}>Connecting to LiraGo</Text>
      <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>This may take a few seconds.</Text>

      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
};

const LoginScreen = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const { signIn } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert(t('auth.invalidCredentials'), error.message);
      setLoading(false);
    }
  };

  if (!fontLoaded) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loading) {
    return <LoadingScreen />;
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
          {/* Placeholder for illustration or just empty space as per request for "Lira Go" title below */}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>LiraGo</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Support for all of life's moments</Text>

          <View style={styles.form}>
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

            <TouchableOpacity
              style={[styles.button, styles.loginButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.registerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={[styles.registerButtonText, { color: colors.text }]}>{t('auth.signUp')}</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  graphicContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  yellowCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FCD535', // Yellow
    position: 'absolute',
    opacity: 0.9,
  },
  blueCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0052FF', // Blue
    position: 'absolute',
    left: 30,
    zIndex: 2,
  },
  greenCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00C805', // Green
    position: 'absolute',
    right: 30,
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FCD535', // Overlap effect
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    marginBottom: 60,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0052FF',
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
  loginButton: {
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    borderWidth: 2,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default LoginScreen;

