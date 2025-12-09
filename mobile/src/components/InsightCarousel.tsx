import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface InsightItem {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  iconColor: string;
  bgColor: string;
}

const InsightCarousel = () => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const insights: InsightItem[] = [
    {
      id: '1',
      titleKey: 'dashboard.newLookTitle',
      subtitleKey: 'dashboard.newLookSubtitle',
      icon: 'eye-outline',
      iconColor: '#45c3e2ff',
      bgColor: theme === 'dark' ? '#1a3b47' : '#E0F7FA',
    },
    {
      id: '2',
      titleKey: 'dashboard.trackBillsTitle',
      subtitleKey: 'dashboard.trackBillsSubtitle',
      icon: 'flash-outline',
      iconColor: '#FBC02D',
      bgColor: theme === 'dark' ? '#332b00' : '#FFF9C4',
    },
    {
      id: '3',
      titleKey: 'dashboard.analyzeSpendingTitle',
      subtitleKey: 'dashboard.analyzeSpendingSubtitle',
      icon: 'pie-chart-outline',
      iconColor: '#FF5722',
      bgColor: theme === 'dark' ? '#3e1c12' : '#FBE9E7',
    },
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= insights.length) {
        nextIndex = 0;
      }
      setCurrentIndex(nextIndex);

      if (scrollViewRef.current) {
        const offset = nextIndex * (CARD_WIDTH + 16); // Width + gap
        scrollViewRef.current.scrollTo({ x: offset, animated: true });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, insights.length]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CARD_WIDTH + 16));
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 16} // Card width + margin
        snapToAlignment="center"
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {insights.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: item.bgColor, width: CARD_WIDTH }]}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
            </View>
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text }]}>{t(item.titleKey)}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(item.subtitleKey)}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
});

export default InsightCarousel;
