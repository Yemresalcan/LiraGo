import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import { ReceiptProvider } from './src/contexts/ReceiptContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { requestNotificationPermissions } from './src/services/notificationService';
import './src/i18n/index';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Pacifico': require('./assets/fonts/Pacifico-Regular.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    // Request notification permissions on app start
    requestNotificationPermissions().then((granted) => {
      if (granted) {
        console.log('Notification permissions granted');
      }
    });

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Here you could navigate to a specific screen based on the notification data
      const data = response.notification.request.content.data;
      if (data?.billId) {
        // Could navigate to bill details screen
        console.log('Bill reminder tapped:', data.billId);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ReceiptProvider>
            <RootNavigator />
          </ReceiptProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

