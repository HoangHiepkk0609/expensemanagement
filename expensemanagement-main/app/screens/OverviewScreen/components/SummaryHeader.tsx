import React from 'react';
import { Text, TouchableOpacity, View } from "react-native";
import styles from "../styles";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { formatCurrency } from "../../../utils/formatCurrency";
import { useTheme } from '../../../theme/themeContext'; 

interface SummaryHeaderProps {
  viewMode: 'expense' | 'income';
  setViewMode: (mode: 'expense' | 'income') => void;
  totalExpense: number;
  totalIncome: number;
}

const SummaryHeader = ({ viewMode, setViewMode, totalExpense, totalIncome }: SummaryHeaderProps) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={styles.totalsContainer}>
      <TouchableOpacity
        style={[
          styles.totalBox,
          {
            backgroundColor: isDarkMode
              ? colors.surface
              : viewMode === 'expense'
              ? '#FFF0F5'
              : '#F9F9F9',
            borderColor: viewMode === 'expense' ? '#FF69B4' : 'transparent',
            borderWidth: viewMode === 'expense' ? 1.5 : 0,
            opacity: viewMode === 'expense' ? 1 : 0.5,
          },
        ]}
        onPress={() => setViewMode('expense')}
      >
        <View style={styles.totalHeader}>
          <Icon
            name="swap-horizontal"
            size={20}
            color={viewMode === 'expense' ? '#FF69B4' : colors.textSecondary}
          />
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Chi tiêu
          </Text>
          {viewMode === 'expense' && (
            <Icon name="arrow-up" size={16} color="#FF6B6B" />
          )}
        </View>
        <Text
          style={[
            styles.totalAmount,
            {
              color: viewMode === 'expense' ? '#FF69B4' : colors.textSecondary,
            },
          ]}
        >
          {formatCurrency(totalExpense)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.totalBox,
          {
            backgroundColor: isDarkMode
              ? colors.surface
              : viewMode === 'income'
              ? '#F0FFF4'
              : '#F9F9F9',
            borderColor: viewMode === 'income' ? '#4CAF50' : 'transparent',
            borderWidth: viewMode === 'income' ? 1.5 : 0,
            marginLeft: 12,
            opacity: viewMode === 'income' ? 1 : 0.5,
          },
        ]}
        onPress={() => setViewMode('income')}
      >
        <View style={styles.totalHeader}>
          <Icon
            name="swap-horizontal"
            size={20}
            color={viewMode === 'income' ? '#4CAF50' : colors.textSecondary}
          />
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Thu nhập
          </Text>
          {viewMode === 'income' && (
            <Icon name="minus" size={16} color="#4CAF50" />
          )}
        </View>
        <Text
          style={[
            styles.totalAmount,
            {
              color: viewMode === 'income' ? '#4CAF50' : colors.textSecondary,
            },
          ]}
        >
          {formatCurrency(totalIncome)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SummaryHeader;