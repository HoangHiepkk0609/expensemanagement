import React from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/themeContext';
import styles from '../styles';

interface CategoryListProps {
  groupedTransactions: any;
  categoryListOpacity: Animated.Value;
  viewMode: 'expense' | 'income';
  selectedIndex: number;
  pieChartData: any[];
  navigation: any;
  formatCurrency: (amount: number) => string;
  getCategoryStyle: (name: string, mode: 'expense' | 'income') => any;
}

const CategoryList = ({
  groupedTransactions,
  categoryListOpacity,
  viewMode,
  selectedIndex,
  pieChartData,
  navigation,
  formatCurrency,
  getCategoryStyle,
}: CategoryListProps) => {
  const { colors } = useTheme();
  const categories = Object.keys(groupedTransactions);

  if (categories.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.categorySection,
        { backgroundColor: colors.surface, opacity: categoryListOpacity },
      ]}
    >
      {categories.map(category => {
        const { icon, color } = getCategoryStyle(category, viewMode);
        const transactions = groupedTransactions[category];
        const categoryTotal = transactions.reduce(
          (sum: number, t: any) => sum + t.amount,
          0,
        );
        const isHighlighted =
          selectedIndex !== -1 &&
          pieChartData[selectedIndex]?.categoryName === category;

        return (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryItem,
              isHighlighted && { backgroundColor: color + '10' },
            ]}
            onPress={() =>
              navigation.navigate('CategoryDetail', { category, transactions })
            }
          >
            <View
              style={[styles.categoryIcon, { backgroundColor: color + '20' }]}
            >
              <Icon name={icon} size={24} color={color} />
            </View>
            <View style={styles.categoryInfo}>
              <Text
                style={[
                  styles.categoryName,
                  { color: colors.text },
                  isHighlighted && { fontWeight: 'bold' },
                ]}
              >
                {category}
              </Text>
            </View>
            <View style={styles.categoryAmount}>
              <Text style={[styles.categoryTotal, { color: colors.text }]}>
                {formatCurrency(categoryTotal)}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

export default CategoryList;