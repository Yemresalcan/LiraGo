import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeColors {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    inputBackground: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    billColors: {
        electricity: string;
        water: string;
        naturalGas: string;
        internet: string;
        other: string;
    };
}

export const lightColors: ThemeColors = {
    background: '#F2F4F7',
    card: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    primary: '#8CE4FF',
    border: '#E5E7EB',
    inputBackground: '#F9FAFB',
    success: '#16A34A',
    error: '#EF4444',
    warning: '#D97706',
    info: '#3B82F6',
    billColors: {
        electricity: '#F59E0B', // Yellow
        water: '#3B82F6',       // Blue
        naturalGas: '#F97316',  // Orange
        internet: '#10B981',    // Green (keeping generic for now, or user didn't specify)
        other: '#A855F7',       // Purple
    }
};

export const darkColors: ThemeColors = {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#8CE4FF',
    border: '#374151',
    inputBackground: '#27272a',
    success: '#22C55E',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    billColors: {
        electricity: '#F59E0B', // Yellow
        water: '#3B82F6',       // Blue
        naturalGas: '#F97316',  // Orange
        internet: '#10B981',    // Green
        other: '#A855F7',       // Purple
    }
};

interface ThemeContextType {
    theme: ThemeType;
    colors: ThemeColors;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeType>('light');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user_theme');
            if (savedTheme) {
                setThemeState(savedTheme as ThemeType);
            } else if (systemScheme) {
                setThemeState(systemScheme as ThemeType);
            }
        } catch (error) {
            console.error('Failed to load theme', error);
        }
    };

    const setTheme = async (newTheme: ThemeType) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('user_theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const colors = theme === 'light' ? lightColors : darkColors;
    const isDark = theme === 'dark';

    return (
        <ThemeContext.Provider value={{ theme, colors, isDark, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
