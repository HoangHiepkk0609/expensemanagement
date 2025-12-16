import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { PieChart } from "react-native-gifted-charts"; 
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTransactions } from '../hook/useTransactions';
import { useTheme } from '../theme/themeContext';

// Kích hoạt LayoutAnimation cho Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const TEST_USER_ID = 'my-test-user-id-123';

interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  date: Date;
  wallet: string;
  recurrence: string;
}

const OverviewScreen = ({ navigation }: any) => {
  const [viewMode, setViewMode] = useState<'expense' | 'income'>('expense');
  const route = useRoute();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [chartScale] = useState(new Animated.Value(0));
  const [categoryListOpacity] = useState(new Animated.Value(0));

  // ✅ STATE MỚI: Lưu vị trí miếng bánh đang chọn (-1 là chưa chọn gì)
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { colors, isDarkMode } = useTheme();

  // Icon cho từng danh mục
  const categoryIcons: any = {
    'Ăn uống': 'silverware-fork-knife',
    'Mua sắm': 'cart-outline',
    'Di chuyển': 'car',
    'Người thân': 'human-handsup',
    'Khác': 'dots-grid',
  };

  const categoryColors: any = {
    'Ăn uống': '#FF6B6B',
    'Mua sắm': '#FFD93D',
    'Di chuyển': '#6BCB77',
    'Người thân': '#4D96FF',
    'Khác': '#9D9D9D',
  };

  const incomeCategoryIcons: any = {
    'Lương': 'cash-marker',
    'Kinh doanh': 'chart-line',
    'Thưởng': 'wallet-giftcard',
    'Khác': 'dots-grid',
  };
  const incomeCategoryColors: any = {
    'Lương': '#4CAF50',
    'Kinh doanh': '#2196F3',
    'Thưởng': '#FFC107',
    'Khác': '#9D9D9D',
  };
  

  useFocusEffect(
    React.useCallback(() => {
      const jumpToDateParam = (route.params as any)?.jumpToDate;
      if (jumpToDateParam) {
        const newDate = new Date(jumpToDateParam);
        setCurrentMonth(newDate); 
        navigation.setParams({ jumpToDate: undefined });
      }

      const unsubscribe = firestore()
        .collection('transactions')
        .where('userId', '==', TEST_USER_ID)
        .orderBy('date', 'desc')
        .onSnapshot(
          (snapshot) => {
            const transactionsData: Transaction[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              transactionsData.push({
                id: doc.id,
                type: data.type,
                amount: data.amount,
                category: data.category,
                note: data.note,
                date: new Date(data.date),
                wallet: data.wallet,
                recurrence: data.recurrence,
              });
            });
            setTransactions(transactionsData);
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching transactions:', error);
            setLoading(false);
          }
        );

      return () => unsubscribe();
    }, [(route.params as any)?.jumpToDate])
  );

  const getCurrentMonthTransactions = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getFullYear() === year &&
        transactionDate.getMonth() === month
      );
    });
  };

  const getTotalExpense = () => {
    const monthTransactions = getCurrentMonthTransactions();
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalIncome = () => {
    const monthTransactions = getCurrentMonthTransactions();
    return monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCategoryTotals = () => {
    const monthTransactions = getCurrentMonthTransactions();
    const transactionsToUse = monthTransactions.filter((t) => t.type === viewMode);
    
    const categoryTotals: any = {};
    transactionsToUse.forEach((transaction) => {
      if (categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] += transaction.amount;
      } else {
        categoryTotals[transaction.category] = transaction.amount;
      }
    });
    return categoryTotals;
  };

  const getPieChartData = () => {
    const categoryTotals = getCategoryTotals();
    const total = (viewMode === 'expense') ? getTotalExpense() : getTotalIncome();
    const colorsToUse = (viewMode === 'expense') ? categoryColors : incomeCategoryColors;

    return Object.keys(categoryTotals).map((category, index) => {
      const amount = categoryTotals[category];
      const percentage = (total > 0) ? ((amount / total) * 100).toFixed(0) : '0';
      
      // Kiểm tra xem item này có đang được chọn không
      const isFocused = index === selectedIndex;

      return {
        value: amount,
        color: colorsToUse[category] || '#9D9D9D',
        text: `${percentage}%`,
        categoryName: category,
        percentage: percentage,
        // ✅ Cấu hình riêng cho item khi được focus
       focused: isFocused, 
       shiftTextX: isFocused ? 10 : 0, 
       radius: isFocused ? 80 : 70,
      };
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    setSelectedIndex(-1); // Reset selection khi đổi tháng
  };

  const formatMonth = () => {
    return `Tháng ${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}`;
  };

  const getGroupedTransactions = () => {
    const monthTransactions = getCurrentMonthTransactions();
    const transactionsToUse = monthTransactions.filter((t) => t.type === viewMode);
    
    const grouped: any = {};
    transactionsToUse.forEach((transaction) => {
      if (!grouped[transaction.category]) {
        grouped[transaction.category] = [];
      }
      grouped[transaction.category].push(transaction);
    });

    return grouped;
  };

  useEffect(() => {
    setSelectedIndex(-1); // Reset khi đổi chế độ view
    Animated.timing(chartScale, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(categoryListOpacity, {
      toValue: 1,
      duration: 600,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, [viewMode]);

  // ✅ HÀM RENDER LEGEND (CHÚ THÍCH) ĐÃ NÂNG CẤP
  // Nhận vào sự kiện onLegendPress để bấm vào chữ cũng focus vào biểu đồ
  const renderLegend = (data: any[], onLegendPress: (index: number) => void) => {
    return (
      <View style={styles.legendContainer}>
        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          
          return (
            <TouchableOpacity 
                key={index} 
                activeOpacity={0.8}
                onPress={() => onLegendPress(index)}
                style={[
                    styles.legendItem,
                    // ✅ NẾU DARK MODE: Nền đen (surface)
                    // ✅ NẾU LIGHT MODE: Nền trắng nếu được chọn, ngược lại trong suốt
                    { 
                        backgroundColor: isDarkMode 
                            ? (isSelected ? colors.surface : 'transparent') 
                            : (isSelected ? '#fff' : 'transparent'),
                        // Thêm viền nhẹ ở Dark Mode cho nổi
                        borderColor: isDarkMode && isSelected ? colors.border : 'transparent',
                        borderWidth: isDarkMode && isSelected ? 1 : 0,
                    },
                    // Shadow chỉ dùng cho Light Mode
                    !isDarkMode && isSelected && styles.legendItemSelected
                ]}
            >
              <View style={[ styles.legendColor, { backgroundColor: item.color } ]} />
              <View>
                  {/* ✅ SỬA MÀU CHỮ: Dùng colors.text */}
                  <Text style={[
                    styles.legendText,
                    { color: colors.text }, // Chữ trắng/đen tùy theme
                    isSelected && styles.legendTextSelected
                  ]}>
                      {formatCurrency(item.value).replace('₫','')} 
                      <Text style={{fontSize: 12, color: colors.textSecondary}}> {item.categoryName}</Text>
                  </Text>
                  <Text style={[
                      styles.legendPercent, 
                      {color: item.color},
                      isSelected && { fontSize: 14 }
                  ]}>
                      {item.percentage}%
                  </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };
  // ✅ Hàm xử lý khi bấm vào (cả Chart và Legend đều gọi cái này)
  const handlePressItem = (index: number) => {
    // Kích hoạt animation mượt mà
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // Nếu bấm lại cái đang chọn thì bỏ chọn, ngược lại thì chọn cái mới
    setSelectedIndex(prev => prev === index ? -1 : index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const pieChartData = getPieChartData();
  const groupedTransactions = getGroupedTransactions();
  const totalExpense = getTotalExpense();
  const totalIncome = getTotalIncome();

  const chartScaleStyle = {
    transform: [{ scale: chartScale }],
  };

  const categoryListStyle = {
    opacity: categoryListOpacity,
  };

  // --- LOGIC TÍNH TOÁN XU HƯỚNG ---
  const calculateTrend = () => {
    const now = new Date();
    const currentMonth = now.getMonth();     // Tháng này (0-11)
    const currentYear = now.getFullYear();   // Năm nay

    // Tính tháng trước
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    let thisMonthExpense = 0;
    let lastMonthExpense = 0;

    transactions.forEach(t => {
      const tDate = new Date(t.date); // Đảm bảo t.date chuẩn định dạng
      
      // Chỉ tính khoản CHI (expense)
      if (t.type === 'expense') {
        // Cộng tổng tháng này
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          thisMonthExpense += t.amount;
        }
        // Cộng tổng tháng trước
        if (tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear) {
          lastMonthExpense += t.amount;
        }
      }
    });

    const diff = thisMonthExpense - lastMonthExpense;
    return { 
      diff, 
      isIncrease: diff >= 0, 
      percent: lastMonthExpense > 0 ? ((diff / lastMonthExpense) * 100).toFixed(1) : 100 
    };
  };

  const trendData = calculateTrend();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: isDarkMode ? colors.border : '#EEE' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Quản lý chi tiêu</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderLeft}>
              <Icon name="eye-outline" size={20} color={colors.primary || '#FF69B4'} />
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Tình hình thu chi</Text>
            </View>
            <View style={styles.summaryHeaderRight}>
              <TouchableOpacity>
                <Text style={[styles.filterButton, { color: colors.primary || '#FF69B4' }]}>Phân bổ</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.monthSelector, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => changeMonth('prev')}>
              <Icon name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={[styles.monthBadge, { backgroundColor: colors.background }]}
            >
              <Icon name="calendar-month" size={16} color={colors.text} />
              <Text style={[styles.monthText, { color: colors.text }]}>{formatMonth()}</Text>
            </View>
            <TouchableOpacity onPress={() => changeMonth('next')}>
              <Icon name="chevron-right" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* ... Bên trong return ... */}

          <View style={styles.totalsContainer}>
            
            {/* 1. HỘP CHI TIÊU */}
            <TouchableOpacity
              style={[
                styles.totalBox,
                {
                  // ✅ LOGIC MỚI: Kiểm tra xem có đang chọn 'expense' không?
                  backgroundColor: isDarkMode 
                      ? colors.surface 
                      : (viewMode === 'expense' ? '#FFF0F5' : '#F9F9F9'),
                  
                  // Chỉ hiện viền Hồng nếu đang chọn 'expense'
                  borderColor: viewMode === 'expense' ? '#FF69B4' : 'transparent',
                  borderWidth: viewMode === 'expense' ? 1.5 : 0, // Viền dày hơn chút cho rõ
                  
                  // Làm mờ đi nếu không chọn
                  opacity: viewMode === 'expense' ? 1 : 0.5, 
                }
              ]}
              onPress={() => setViewMode('expense')}
            >
              <View style={styles.totalHeader}>
                <Icon name="swap-horizontal" size={20} color={viewMode === 'expense' ? "#FF69B4" : colors.textSecondary} />
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Chi tiêu</Text>
                {viewMode === 'expense' && <Icon name="arrow-up" size={16} color="#FF6B6B" />}
              </View>
              
              <Text style={[styles.totalAmount, { color: viewMode === 'expense' ? '#FF69B4' : colors.textSecondary }]}>
                {formatCurrency(totalExpense)}
              </Text>
            </TouchableOpacity>

            {/* 2. HỘP THU NHẬP */}
            <TouchableOpacity
              style={[
                styles.totalBox,
                {
                  // ✅ LOGIC MỚI: Kiểm tra xem có đang chọn 'income' không?
                  backgroundColor: isDarkMode 
                      ? colors.surface 
                      : (viewMode === 'income' ? '#F0FFF4' : '#F9F9F9'),

                  // Chỉ hiện viền Xanh nếu đang chọn 'income'
                  borderColor: viewMode === 'income' ? '#4CAF50' : 'transparent',
                  borderWidth: viewMode === 'income' ? 1.5 : 0,
                  
                  // Làm mờ đi nếu không chọn
                  marginLeft: 12,
                  opacity: viewMode === 'income' ? 1 : 0.5,
                }
              ]}
              onPress={() => setViewMode('income')} 
            >
              <View style={styles.totalHeader}>
                <Icon name="swap-horizontal" size={20} color={viewMode === 'income' ? "#4CAF50" : colors.textSecondary} />
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Thu nhập</Text>
                {viewMode === 'income' && <Icon name="minus" size={16} color="#4CAF50"/>}
              </View>
              
              <Text style={[styles.totalAmount, { color: viewMode === 'income' ? '#4CAF50' : colors.textSecondary }]}>
                {formatCurrency(totalIncome)}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.trendContainer, { backgroundColor: isDarkMode ? colors.surface : '#FFF5E6' }]
            }
            onPress={() => navigation.navigate('IncomeExpenseTrend')}
          >
            <View style={styles.trendIconBox}>
              <Icon 
                name={trendData.isIncrease ? "chart-line-variant" : "trending-down"} 
                size={24} 
                color={trendData.isIncrease ? "#FF6B6B" : "#4CAF50"} 
              /> 
            </View>

            <Text style={[styles.trendText, { color: colors.text }]}>
              {trendData.isIncrease ? "Tăng" : "Giảm"} 
              <Text style={[
                styles.trendHighlight, 
                { color: trendData.isIncrease ? '#FF6B6B' : '#4CAF50' } 
              ]}>
                {' ' + formatCurrency(Math.abs(trendData.diff))}
              </Text> 
              {' '}so với tháng trước
            </Text>

            <Icon name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {pieChartData.length > 0 && (
            <Animated.View style={[styles.chartContainerWrapper, chartScaleStyle]}>
              <View style={[styles.chartContainer, { backgroundColor: colors.background }]}>
                <PieChart
                  data={pieChartData}
                  textSize={10}
                  radius={70}
                  strokeWidth={0}
                  focusOnPress={true} 
                  toggleFocusOnPress={true}
                  onPress={(item: any, index: number) => handlePressItem(index)}
                  sectionAutoFocus={true}
                />
                
                {renderLegend(pieChartData, handlePressItem)}
              </View>
            </Animated.View>
          )}

          {pieChartData.length === 0 && (
            <View style={styles.emptyChart}>
              <Icon name="chart-pie" size={60} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có dữ liệu chi tiêu</Text>
            </View>
          )}
        </View>

        <Animated.View style={[styles.categorySection, { backgroundColor: colors.surface }, categoryListStyle]}>

          {Object.keys(groupedTransactions).length === 0 && (
            <View style={styles.emptyTransactions}>
              <Icon name="receipt-text-outline" size={60} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có giao dịch nào</Text>
            </View>
          )}

          {Object.keys(groupedTransactions).map((category, index) => {
            const iconsToUse = (viewMode === 'expense') ? categoryIcons : incomeCategoryIcons;
            const colorsToUse = (viewMode === 'expense') ? categoryColors : incomeCategoryColors;
            const totalToUse = (viewMode === 'expense') ? totalExpense : totalIncome;

            const categoryTransactions = groupedTransactions[category];
            const categoryTotal = categoryTransactions.reduce(
              (sum: number, t: Transaction) => sum + t.amount,
              0
            );
            const percentage = (totalToUse > 0) ? ((categoryTotal / totalToUse) * 100).toFixed(0) : '0';

            const isHighlighted = selectedIndex !== -1 && pieChartData[selectedIndex]?.categoryName === category;

            return (
              <Animated.View
                key={category}
                style={{
                  opacity: categoryListOpacity,
                  transform: [
                    {
                      translateY: categoryListOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20 * (index + 1), 0],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity 
                  style={[
                      styles.categoryItem,
                      { borderBottomColor: colors.border || '#F5F5F5' },
                      isHighlighted && { backgroundColor: isDarkMode ? colors.surface : '#FFF0F5' }
                  ]}
                  onPress={() =>
                      navigation.navigate('CategoryDetail', {
                      category,
                      transactions: groupedTransactions[category],
                      })
                  }
                  >
                  <View style={[styles.categoryIcon, { backgroundColor: colorsToUse[category] + '20' }]}
                  >
                    <Icon
                      name={iconsToUse[category] || 'dots-grid'}
                      size={24}
                      color={colorsToUse[category] || '#9D9D9D'}
                    />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[
                        styles.categoryName,
                        { color: colors.text },
                        isHighlighted && { fontWeight: 'bold', color: '#FF69B4' }
                    ]}>{category}</Text>
                    <Text style={[styles.categoryPercentage, { color: colorsToUse[category] }]}>{percentage}%</Text>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={[
                        styles.categoryTotal,
                        { color: colors.text },
                        isHighlighted && { color: '#FF69B4', fontSize: 16 }
                    ]}>{formatCurrency(categoryTotal)}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 15,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  summaryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    fontSize: 14,
    color: '#FF69B4',
    marginRight: 15,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 20,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 5,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalBox: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
  },
  expenseBox: {
    borderWidth: 2,
    borderColor: '#FF69B4',
    backgroundColor: '#FFF0F5',
  },
  incomeBox: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#f0fff5',
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    flex: 1,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  comparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  comparisonText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  comparisonAmount: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  chartContainerWrapper: {
    marginVertical: 10,
  },
  chartContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-around', 
    backgroundColor: '#FAFAFA',
    paddingVertical: 20,
    borderRadius: 15,
  },
  // Legend Styles
  legendContainer: {
    justifyContent: 'center',
    maxWidth: '45%', 
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  legendItemSelected: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    transform: [{ scale: 1.05 }], // Nổi lên một chút
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    marginTop: 2
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  legendTextSelected: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  categorySection: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,179,0.1)',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  categoryAmount: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  categoryTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#FF69B4',
    fontWeight: '600',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6', // Màu nền cam nhạt
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 16, // Cách lề 2 bên
  },
  trendIconBox: {
    marginRight: 10,
  },
  trendText: {
    flex: 1, // Để text chiếm hết khoảng trống giữa 2 icon
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  trendHighlight: {
    color: '#FF6B6B', // Màu đỏ hồng cho số tiền
    fontWeight: 'bold',
  },
});

export default OverviewScreen;