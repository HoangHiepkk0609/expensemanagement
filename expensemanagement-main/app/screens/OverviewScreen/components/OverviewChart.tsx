import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import styles from '../styles';
import { useTheme } from '../../../theme/themeContext';

interface OverviewChartProps {
  data: any[];
  chartScale: Animated.Value;
  selectedIndex: number;
  onPressItem: (index: number) => void;
  formatCurrency: (amount: number) => string;
}

const OverviewChart = ({ data, chartScale, selectedIndex, onPressItem, formatCurrency }: OverviewChartProps) => {
  const { colors, isDarkMode } = useTheme();

  if (data.length === 0) return null;

  return (
    <Animated.View style={[{ transform: [{ scale: chartScale }] }]}>
      <View style={[styles.chartContainer, { backgroundColor: colors.background }]}>
        <PieChart
          data={data}
          radius={70}
          focusOnPress={true}
          toggleFocusOnPress={true}
          onPress={(_: any, index: number) => onPressItem(index)}
        />
        
        {/* Phần Legend */}
        <View style={styles.legendContainer}>
          {data.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => onPressItem(index)}
                style={[
                  styles.legendItem,
                  isSelected && { backgroundColor: isDarkMode ? colors.surface : '#fff', borderRadius: 8, borderWidth: 1, borderColor: colors.border }
                ]}
              >
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <View>
                  <Text style={[styles.legendText, { color: colors.text }]}>
                    {formatCurrency(item.value).replace('₫', '')} 
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}> {item.categoryName}</Text>
                  </Text>
                  <Text style={[styles.legendPercent, { color: item.color }]}>{item.percentage}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

export default OverviewChart;