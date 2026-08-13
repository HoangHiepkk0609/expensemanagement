import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import { useTransactions } from '../../hook/useTransactions';
import { useTheme } from '../../theme/themeContext';
import styles from './styles';

type Period = 'week' | 'month' | 'year';

interface DayData {
  date: string;
  label: string;
  expense: number;
  income: number;
}

export default function IncomeExpenseTrend({ navigation }: any) {
  const { colors, isDarkMode } = useTheme();
  const { transactions, loading } = useTransactions();
  const [period, setPeriod] = useState<Period>('week');
  const [chartData, setChartData] = useState<DayData[]>([]);

  useEffect(() => {
    if (transactions.length === 0) return;

    const now = new Date();
    let data: DayData[] = [];

    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const dayTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= date && tDate < nextDate;
        });

        const expense = dayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const income = dayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({
          date: date.toISOString(),
          label: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()],
          expense,
          income,
        });
      }
    } else if (period === 'month') {
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - i * 7);

        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(endDate);
        nextDate.setHours(23, 59, 59, 999);

        const weekTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= startDate && tDate <= nextDate;
        });

        const expense = weekTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const income = weekTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({
          date: startDate.toISOString(),
          label: `T${4 - i}`,
          expense,
          income,
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const monthTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= date && tDate < nextDate;
        });

        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({
          date: date.toISOString(),
          label: `T${date.getMonth() + 1}`,
          expense,
          income,
        });
      }
    }

    setChartData(data);
  }, [transactions, period]);

  const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0);
  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const balance = totalIncome - totalExpense;

  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.expense, d.income)),
    1,
  );

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'tr';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'k';
    }
    return amount.toString();
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Đang tải dữ liệu...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader
        title={'Biến động thu chi'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              period === 'week' && {
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setPeriod('week')}
          >
            <Text
              style={[
                styles.periodText,
                { color: colors.textSecondary },
                period === 'week' && { color: colors.primary },
              ]}
            >
              Tuần
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              period === 'month' && {
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setPeriod('month')}
          >
            <Text
              style={[
                styles.periodText,
                { color: colors.textSecondary },
                period === 'month' && { color: colors.primary },
              ]}
            >
              Tháng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              period === 'year' && {
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setPeriod('year')}
          >
            <Text
              style={[
                styles.periodText,
                { color: colors.textSecondary },
                period === 'year' && { color: colors.primary },
              ]}
            >
              Năm
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface },
              styles.expenseCard,
            ]}
          >
            <Icon name="arrow-up-bold-circle" size={32} color="#EF4444" />
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Chi tiêu
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.text }]}>
              {formatFullCurrency(totalExpense)}
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface },
              styles.incomeCard,
            ]}
          >
            <Icon name="arrow-down-bold-circle" size={32} color="#10B981" />
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Thu nhập
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.text }]}>
              {formatFullCurrency(totalIncome)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface },
            styles.balanceCard,
          ]}
        >
          <Icon name="wallet" size={32} color="#3B82F6" />
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Chênh lệch
          </Text>
          <Text
            style={[
              styles.summaryAmount,
              { color: balance >= 0 ? '#10B981' : '#EF4444' },
            ]}
          >
            {formatFullCurrency(balance)}
          </Text>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Biểu đồ chi tiêu & thu nhập
            </Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: '#EF4444' }]}
                />
                <Text
                  style={[styles.legendText, { color: colors.textSecondary }]}
                >
                  Chi
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: '#10B981' }]}
                />
                <Text
                  style={[styles.legendText, { color: colors.textSecondary }]}
                >
                  Thu
                </Text>
              </View>
            </View>
          </View>

          {chartData.length === 0 ? (
            <View style={styles.emptyChart}>
              <Icon name="chart-bar" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Chưa có dữ liệu
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chartContainer}>
                <View style={styles.yAxis}>
                  <Text
                    style={[styles.yAxisLabel, { color: colors.textSecondary }]}
                  >
                    {formatCurrency(maxValue)}
                  </Text>
                  <Text
                    style={[styles.yAxisLabel, { color: colors.textSecondary }]}
                  >
                    {formatCurrency(maxValue / 2)}
                  </Text>
                  <Text
                    style={[styles.yAxisLabel, { color: colors.textSecondary }]}
                  >
                    0
                  </Text>
                </View>

                <View style={styles.barsContainer}>
                  {chartData.map((item, index) => {
                    const expenseHeight = (item.expense / maxValue) * 150;
                    const incomeHeight = (item.income / maxValue) * 150;

                    return (
                      <View key={index} style={styles.barGroup}>
                        <View style={styles.bars}>
                          <View style={styles.barWrapper}>
                            <View
                              style={[
                                styles.bar,
                                styles.expenseBar,
                                { height: expenseHeight || 2 },
                              ]}
                            />
                          </View>

                          <View style={styles.barWrapper}>
                            <View
                              style={[
                                styles.bar,
                                styles.incomeBar,
                                { height: incomeHeight || 2 },
                              ]}
                            />
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.barLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          )}
        </View>

        {chartData.length > 0 && (
          <View
            style={[
              styles.insightCard,
              {
                backgroundColor: isDarkMode ? '#854d0e20' : '#FFFBEB',
                borderColor: isDarkMode ? '#854d0e' : '#FDE68A',
              },
            ]}
          >
            <View style={styles.insightHeader}>
              <Icon name="lightbulb" size={24} color="#F59E0B" />
              <Text
                style={[
                  styles.insightTitle,
                  { color: isDarkMode ? '#FDE68A' : '#92400E' },
                ]}
              >
                Nhận xét
              </Text>
            </View>
            <Text
              style={[
                styles.insightText,
                { color: isDarkMode ? '#FDE68A' : '#78350F' },
              ]}
            >
              {totalExpense > totalIncome
                ? `Chi tiêu vượt thu nhập ${formatFullCurrency(
                    totalExpense - totalIncome,
                  )}. Bạn nên cân nhắc tiết kiệm hơn.`
                : totalIncome > totalExpense
                ? `Tuyệt vời! Bạn tiết kiệm được ${formatFullCurrency(
                    totalIncome - totalExpense,
                  )} trong kỳ này.`
                : 'Chi tiêu và thu nhập cân bằng.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


