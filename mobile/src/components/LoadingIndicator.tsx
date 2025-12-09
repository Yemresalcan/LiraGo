import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
  overlay?: boolean;
  style?: ViewStyle;
}

/**
 * Reusable loading indicator component
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  size = 'large',
  fullScreen = false,
  overlay = false,
  style,
}) => {
  const { isDark } = useTheme();

  const containerStyle = [
    styles.container,
    fullScreen && styles.fullScreen,
    overlay && styles.overlay,
    isDark && styles.darkContainer,
    style,
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator 
        size={size} 
        color={isDark ? '#818cf8' : '#6366f1'} 
      />
      {message && (
        <Text style={[styles.message, isDark && styles.darkMessage]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 999,
  },
  darkContainer: {
    backgroundColor: '#1a1a2e',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  darkMessage: {
    color: '#9ca3af',
  },
});

export default LoadingIndicator;
