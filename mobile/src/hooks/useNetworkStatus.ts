import { useState, useEffect } from 'react';

/**
 * Network status hook - monitors internet connectivity
 * Note: For full React Native support, install @react-native-community/netinfo
 * This implementation provides basic web support via navigator.onLine
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    // Check if running in browser environment
    if (typeof window !== 'undefined' && 'navigator' in window) {
      const handleOnline = () => {
        setIsConnected(true);
        setIsInternetReachable(true);
      };
      
      const handleOffline = () => {
        setIsConnected(false);
        setIsInternetReachable(false);
      };

      // Set initial state
      setIsConnected(navigator.onLine);
      setIsInternetReachable(navigator.onLine);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOffline: isConnected === false,
  };
}
