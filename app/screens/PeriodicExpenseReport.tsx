import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTransactions } from '../hook/useTransactions';
import {
  getRecentWeeks,
  calculateReport,
  WeekPeriod,
  ReportData,
} from '../utils/reportUtils';
import { useTheme } from '../theme/themeContext';

const { width } = Dimensions.get('window');

export default function PeriodicExpenseReport() {

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
          previousWeek?.endDate
        );
      });
      
      setReports(calculatedReports);
    }
  }, [transactions, weeks]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading || weeks.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Đang tải dữ liệu...
        </Text>
      </View>
    );
  }

  const currentWeek = weeks[selectedWeekIndex];
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Báo cáo chi tiêu định kỳ
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Chọn kỳ báo cáo</Text>
            <View style={styles.periodGrid}>
              {weeks.slice(0, 2).map((week, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedWeekIndex(index)}
                  style={[
                    styles.periodButton,
                    { 
                      borderColor: colors.border,
                      backgroundColor: colors.surface
                    },
                    selectedWeekIndex === index && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + '15'
                    }
                  ]}
                >
                  <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
                    Tuần:
                  </Text>
                  <Text style={[styles.periodDate, { color: colors.text }]}>
                    {week.label}
                  </Text>
                  {selectedWeekIndex === index && (
                    <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[
              styles.notificationContainer,
              { backgroundColor: isDarkMode ? colors.background : '#F9FAFB' }
            ]}>
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
                  ? `${((currentReport.balance / currentReport.totalIncome) * 100).toFixed(1)}% thu nhập`
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
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Chưa có giao dịch nào trong tuần này
                </Text>
              </View>
            ) : (
              <>
                {currentReport.categories.map((category, index) => (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {category.name}
                      </Text>
                      <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                        {formatCurrency(category.amount)}
                      </Text>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[
                        styles.progressBar,
                        { backgroundColor: isDarkMode ? colors.border : '#E5E7EB' }
                      ]}>
                        <View
                          style={[
                            styles.progressFill,
                            { 
                              width: `${category.percent}%`, 
                              backgroundColor: category.color 
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.percentText, { color: colors.textSecondary }]}>
                        {category.percent}%
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={[
                  styles.summaryBox,
                  { backgroundColor: isDarkMode ? colors.primary + '20' : '#DBEAFE' }
                ]}>
                  <Text style={[styles.summaryBoxTitle, { color: colors.text }]}>
                    Nhận xét
                  </Text>
                  <Text style={[styles.summaryBoxText, { color: colors.textSecondary }]}>
                    {currentReport.trend === 'up' ? (
                      `Chi tiêu tuần này tăng ${currentReport.comparison} so với tuần trước. ${
                        currentReport.categories[0]
                          ? `Danh mục "${currentReport.categories[0].name}" chiếm tỷ trọng cao nhất (${currentReport.categories[0].percent}%).`
                          : ''
                      } Bạn nên cân nhắc tiết kiệm hơn ở các khoản không cần thiết.`
                    ) : currentReport.trend === 'down' ? (
                      `Chi tiêu tuần này giảm ${currentReport.comparison} so với tuần trước. Bạn đang quản lý chi tiêu tốt! Hãy duy trì thói quen này.`
                    ) : (
                      `Chi tiêu tuần này ổn định. ${
                        currentReport.categories[0]
                          ? `Danh mục "${currentReport.categories[0].name}" chiếm tỷ trọng cao nhất (${currentReport.categories[0].percent}%).`
                          : ''
                      }`
                    )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  periodGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  periodButtonActive: {},
  periodLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  periodDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    marginRight: 12,
  },
  summaryGrid: {
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  expenseCard: {
    backgroundColor: '#EF4444',
  },
  incomeCard: {
    backgroundColor: '#10B981',
  },
  balanceCard: {
    backgroundColor: '#3B82F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryComparison: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  categoryItem: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentText: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  summaryBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryBoxTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryBoxText: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});