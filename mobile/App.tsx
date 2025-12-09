import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import * as Font from 'expo-font';
import { AuthProvider } from './src/contexts/AuthContext';
import { ReceiptProvider } from './src/contexts/ReceiptContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import './src/i18n/index';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <ReceiptProvider>
          <RootNavigator />
        </ReceiptProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
