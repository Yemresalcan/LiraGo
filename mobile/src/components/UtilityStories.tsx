import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const UtilityStories = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
    const { theme, colors } = useTheme();

    const stories = [
        {
            key: 'electricity',
            label: t('dashboard.electricity'),
            icon: 'flash',
            color: colors.billColors.electricity,
            bgColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
        },
        {
            key: 'water',
            label: t('dashboard.water'),
            icon: 'water',
            color: colors.billColors.water,
            bgColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
        },
        {
            key: 'naturalGas',
            label: t('dashboard.naturalGas'),
            icon: 'flame',
            color: colors.billColors.naturalGas,
            bgColor: theme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)',
        },
        {
            key: 'other',
            label: t('dashboard.otherBills'),
            icon: 'receipt',
            color: colors.billColors.other,
            bgColor: theme === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
        },
    ];

    return (
        <View style={styles.storiesContainer}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScrollContent}
            >
                {stories.map((story) => (
                    <TouchableOpacity
                        key={story.key}
                        style={styles.storyItem}
                        onPress={() => navigation.navigate('BillHistory', { initialCategory: story.key as any })}
                    >
                        <View style={[styles.storyIconContainer, { backgroundColor: story.bgColor, borderColor: colors.card }]}>
                            <Ionicons name={story.icon as any} size={24} color={story.color} />
                        </View>
                        <Text style={[styles.storyLabel, { color: colors.text }]}>{story.label}</Text>
                    </TouchableOpacity>
                ))}

                {/* Add New Item Button */}
                <TouchableOpacity
                    style={styles.storyItem}
                    onPress={() => navigation.navigate('BillUpload')}
                >
                    <View style={[styles.storyIconContainer, styles.addButtonContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="add" size={32} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.storyLabel, { color: colors.text }]}>{t('common.add')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    storiesContainer: {
        marginBottom: 24,
    },
    storiesScrollContent: {
        paddingHorizontal: 4,
        gap: 20,
    },
    storyItem: {
        alignItems: 'center',
        gap: 8,
    },
    storyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    storyLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    addButtonContainer: {
        borderStyle: 'dashed',
        borderWidth: 2,
    },
});

export default UtilityStories;
