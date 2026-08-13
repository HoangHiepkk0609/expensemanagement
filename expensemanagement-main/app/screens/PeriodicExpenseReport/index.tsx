import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import { useTransactions } from '../../hook/useTransactions';
import { useTheme } from '../../theme/themeContext';
import {
  calculateReport,
  getRecentWeeks,
  ReportData,
  WeekPeriod,
} from '../../utils/reportUtils';
import styles from './styles';

export default function PeriodicExpenseReport() {
  const navigation = useNavigation();
  const { transactions, loading } = useTransactions();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [weeks, setWeeks] = useState<WeekPeriod[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [reports, setReports] = useState<Record<number, ReportData>>({});
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    const recentWeeks = getRecentWeeks(4);
    setWeeks(recentWeeks);
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && weeks.length > 0) {
      const calculatedReports: Record<number, ReportData> = {};

      weeks.forEach((week, index) => {
        const previousWeek = weeks[index + 1];

        calculatedReports[index] = calculateReport(
          transactions,
          week.startDate,
          week.endDate,
          previousWeek?.startDate,
          previousWeek?.endDate,
        );
      });

      setReports(calculatedReports);
    }
  }, [transactions, weeks]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading || weeks.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Đang tải dữ liệu...
        </Text>
      </View>
    );
  }

  const currentReport = reports[selectedWeekIndex] || {
    totalExpense: 0,
    totalIncome: 0,
    balance: 0,
    categories: [],
    trend: 'stable',
    comparison: '0%',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={'Báo cáo chi tiêu định kì'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Chọn kỳ báo cáo
            </Text>
            <View style={styles.periodGrid}>
              {weeks.slice(0, 2).map((week, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedWeekIndex(index)}
                  style={[
                    styles.periodButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                    selectedWeekIndex === index && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + '15',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.periodLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tuần:
                  </Text>
                  <Text style={[styles.periodDate, { color: colors.text }]}>
                    {week.label}
                  </Text>
                  {selectedWeekIndex === index && (
                    <View
                      style={[
                        styles.activeDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={[
                styles.notificationContainer,
                { backgroundColor: isDarkMode ? colors.background : '#F9FAFB' },
              ]}
            >
              <Text style={[styles.notificationText, { color: colors.text }]}>
                Nhận thông báo khi có báo cáo chi tiêu
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, styles.expenseCard]}>
              <Text style={styles.summaryLabel}>Chi tiêu</Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(currentReport.totalExpense)}
              </Text>
              <Text style={styles.summaryComparison}>
                {currentReport.comparison} so với kỳ trước
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.incomeCard]}>
              <Text style={styles.summaryLabel}>Thu nhập</Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(currentReport.totalIncome)}
              </Text>
              <Text style={styles.summaryComparison}>
                {currentReport.totalIncome > 0 ? 'Có thu nhập' : 'Chưa có'}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.balanceCard]}>
              <Text style={styles.summaryLabel}>Còn lại</Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(currentReport.balance)}
              </Text>
              <Text style={styles.summaryComparison}>
                {currentReport.totalIncome > 0
                  ? `${(
                      (currentReport.balance / currentReport.totalIncome) *
                      100
                    ).toFixed(1)}% thu nhập`
                  : 'N/A'}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Chi tiết theo danh mục
            </Text>

            {currentReport.categories.length === 0 ? (
              <View style={styles.emptyState}>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Chưa có giao dịch nào trong tuần này
                </Text>
              </View>
            ) : (
              <>
                {currentReport.categories.map((category, index) => (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <Text
                        style={[styles.categoryName, { color: colors.text }]}
                      >
                        {category.name}
                      </Text>
                      <Text
                        style={[
                          styles.categoryAmount,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatCurrency(category.amount)}
                      </Text>
                    </View>
                    <View style={styles.progressContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            backgroundColor: isDarkMode
                              ? colors.border
                              : '#E5E7EB',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${category.percent}%`,
                              backgroundColor: category.color,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.percentText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {category.percent}%
                      </Text>
                    </View>
                  </View>
                ))}

                <View
                  style={[
                    styles.summaryBox,
                    {
                      backgroundColor: isDarkMode
                        ? colors.primary + '20'
                        : '#DBEAFE',
                    },
                  ]}
                >
                  <Text
                    style={[styles.summaryBoxTitle, { color: colors.text }]}
                  >
                    Nhận xét
                  </Text>
                  <Text
                    style={[
                      styles.summaryBoxText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {currentReport.trend === 'up'
                      ? `Chi tiêu tuần này tăng ${
                          currentReport.comparison
                        } so với tuần trước. ${
                          currentReport.categories[0]
                            ? `Danh mục "${currentReport.categories[0].name}" chiếm tỷ trọng cao nhất (${currentReport.categories[0].percent}%).`
                            : ''
                        } Bạn nên cân nhắc tiết kiệm hơn ở các khoản không cần thiết.`
                      : currentReport.trend === 'down'
                      ? `Chi tiêu tuần này giảm ${currentReport.comparison} so với tuần trước. Bạn đang quản lý chi tiêu tốt! Hãy duy trì thói quen này.`
                      : `Chi tiêu tuần này ổn định. ${
                          currentReport.categories[0]
                            ? `Danh mục "${currentReport.categories[0].name}" chiếm tỷ trọng cao nhất (${currentReport.categories[0].percent}%).`
                            : ''
                        }`}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
