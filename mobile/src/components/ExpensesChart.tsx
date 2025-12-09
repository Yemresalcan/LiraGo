import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface ChartData {
    category: string;
    amount: number;
    percentage: number;
    color?: string;
}

interface ExpensesChartProps {
    data: ChartData[];
    total: number;
}

// Brand Palette
const COLORS = [
    '#8CE4FF', // Brand Cyan
    '#B19CD9', // Lavender
    '#FFB7B2', // Soft Red
    '#E2F0CB', // Soft Green
    '#FFDAC1', // Soft Orange
    '#E6E6FA', // Light Lavender
    '#97C1A9', // Sage
];

const ExpensesChart: React.FC<ExpensesChartProps> = ({ data, total }) => {
    const { t } = useTranslation();
    const { theme, colors } = useTheme();
    const radius = 70;
    const strokeWidth = 20;
    const center = radius + strokeWidth;
    const size = center * 2;

    // Prepare data with colors
    const chartData = data.map((item, index) => ({
        ...item,
        color: item.color || COLORS[index % COLORS.length],
    }));

    // Calculate paths for the pie chart
    let startAngle = 0;
    const paths = chartData.map((item) => {
        const angle = (item.amount / total) * 360;
        const endAngle = startAngle + angle;

        // Convert angles to radians
        const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
        const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
        const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
        const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);

        // SVG Path command
        const largeArcFlag = angle > 180 ? 1 : 0;
        const path = `M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;

        startAngle = endAngle;
        return { path, color: item.color };
    });

    // If there's only one item or total is 0, handle gracefully
    if (total === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('dashboard.noData')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.card, shadowColor: theme === 'dark' ? '#000' : '#000' }]}>
            <View style={styles.chartContainer}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <G rotation="-90" origin={`${center}, ${center}`}>
                        {paths.map((item, index) => (
                            <Path
                                key={index}
                                d={item.path}
                                fill={item.color}
                                stroke={colors.card}
                                strokeWidth="2"
                            />
                        ))}
                        {/* Inner Circle for Donut Effect */}
                        <Circle cx={center} cy={center} r={radius - strokeWidth} fill={colors.card} />
                    </G>
                </Svg>
                <View style={styles.centerLabel}>
                    <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('dashboard.total')}</Text>
                    <Text style={[styles.totalAmount, { color: colors.text }]}>₺{total.toFixed(0)}</Text>
                </View>
            </View>

            <View style={styles.legendContainer}>
                {chartData.map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <View style={styles.legendTextContainer}>
                            <Text style={[styles.legendCategory, { color: colors.text }]} numberOfLines={1}>{item.category}</Text>
                            <Text style={[styles.legendPercentage, { color: colors.textSecondary }]}>{item.percentage.toFixed(1)}%</Text>
                        </View>
                        <Text style={[styles.legendAmount, { color: colors.text }]}>₺{item.amount.toFixed(0)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        position: 'relative',
    },
    centerLabel: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    totalLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    legendContainer: {
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    legendTextContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginRight: 16,
    },
    legendCategory: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    legendPercentage: {
        fontSize: 12,
        marginLeft: 8,
    },
    legendAmount: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ExpensesChart;
