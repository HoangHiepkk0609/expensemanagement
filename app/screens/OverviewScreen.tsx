import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';


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
  const [selectedTab, setSelectedTab] = useState<'children' | 'parent'>('children');
  const [currentMonth, setCurrentMonth] = useState(new Date());


  // Icon cho từng danh mục
  const categoryIcons: any = {
    'Ăn uống': 'silverware-fork-knife',
    'Mua sắm': 'cart-outline',
    'Di chuyển': 'car',
    'Người thân': 'human-handsup',
    'Khác': 'dots-grid',
  };

  // Màu sắc cho PieChart
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
    'Lương': '#4CAF50', // Xanh lá
    'Kinh doanh': '#2196F3', // Xanh dương
    'Thưởng': '#FFC107', // Vàng
    'Khác': '#9D9D9D',
  };

  // Lấy dữ liệu từ Firestore
  // Nhớ import 'useRoute' ở đầu file nhé:
  // import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

  // Và lấy 'route' ở đầu component:
  // const route = useRoute();

  useFocusEffect(
    React.useCallback(() => {
      
      // ✅ 1. KIỂM TRA TÍN HIỆU JUMP-TO-DATE
      // (Đảm bảo bạn đã định nghĩa 'route' và 'navigation' ở trên)
      const jumpToDateParam = (route.params as any)?.jumpToDate;
      
      if (jumpToDateParam) {
        const newDate = new Date(jumpToDateParam);
        
        // 2. SET THÁNG HIỆN TẠI VỀ THÁNG CỦA GD MỚI
        setCurrentMonth(newDate); 
        
        // 3. XÓA PARAM ĐI ĐỂ TRÁNH LẶP LẠI
        navigation.setParams({ jumpToDate: undefined });
      }

      // 4. PHẦN CODE CŨ CỦA BẠN (GIỮ NGUYÊN)
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
                date: new Date(data.date), // Đảm bảo data.date là chuỗi ISO
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

      // Cleanup khi rời khỏi màn hình
      return () => unsubscribe();
      
    // 5. THÊM DEPENDENCY VÀO MẢNG
    }, [(route.params as any)?.jumpToDate]) // <-- Thêm vào đây
  );

  // Lọc giao dịch theo tháng hiện tại
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

  // Tính tổng chi tiêu
  const getTotalExpense = () => {
    const monthTransactions = getCurrentMonthTransactions();
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Tính tổng thu nhập
  const getTotalIncome = () => {
    const monthTransactions = getCurrentMonthTransactions();
    return monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Tính tổng theo danh mục
  const getCategoryTotals = () => {
    const monthTransactions = getCurrentMonthTransactions();
    // const expenseTransactions = monthTransactions.filter((t) => t.type === 'expense');
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

  // Dữ liệu cho PieChart
  const getPieChartData = () => {
    const categoryTotals = getCategoryTotals();
    // const totalExpense = getTotalExpense();

    const total = (viewMode === 'expense') ? getTotalExpense() : getTotalIncome();
    const colorsToUse = (viewMode === 'expense') ? categoryColors : incomeCategoryColors;

    return Object.keys(categoryTotals).map((category) => ({
      name: category,
      amount: categoryTotals[category],
      color: colorsToUse[category] || '#9D9D9D',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
      percentage: (total > 0) ? ((categoryTotals[category] / total) * 100).toFixed(0) : '0',
    }));
  };

  // Format số tiền
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  // Chuyển tháng
  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Format tháng
  const formatMonth = () => {
    return `Tháng ${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}`;
  };

  // Nhóm giao dịch theo danh mục
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý chi tiêu</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="star-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="message-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="close-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tình hình thu chi */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderLeft}>
              <Icon name="eye-outline" size={20} color="#FF69B4" />
              <Text style={styles.summaryTitle}>Tình hình thu chi</Text>
            </View>
            <View style={styles.summaryHeaderRight}>
              <TouchableOpacity>
                <Text style={styles.filterButton}>Phân bổ</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Icon name="chart-bar" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chọn tháng */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth('prev')}>
              <Icon name="chevron-left" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.monthBadge}>
              <Icon name="calendar-month" size={16} color="#333" />
              <Text style={styles.monthText}>{formatMonth()}</Text>
            </View>
            <TouchableOpacity onPress={() => changeMonth('next')}>
              <Icon name="chevron-right" size={24} color="#333" />
            </TouchableOpacity>
          </View>

       
         <View style={styles.totalsContainer}>
          <TouchableOpacity
            style={[
              styles.totalBox,
              viewMode === 'expense' && styles.expenseBox, 
            ]}
            onPress={() => setViewMode('expense')}
          >
            <View style={styles.totalHeader}>
              <Icon name="swap-horizontal" size={20} color={viewMode === 'expense' ? '#FF69B4' : '#999'} />
              <Text style={styles.totalLabel}>Chi tiêu</Text>
              <Icon name="arrow-up" size={16} color="#FF6B6B" />
            </View>
            <Text style={styles.totalAmount}>{formatCurrency(totalExpense)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.totalBox,
              viewMode === 'income' && styles.incomeBox, 
            ]}
            onPress={() => setViewMode('income')} 
          >
            <View style={styles.totalHeader}>
              <Icon name="swap-horizontal" size={20} color={viewMode === 'income' ? '#4CAF50' : '#999'} />
              <Text style={styles.totalLabel}>Thu nhập</Text>
              <Icon name="minus" size={16} color="#999"/>
            </View>
            <Text style={styles.totalAmount}>{formatCurrency(totalIncome)}</Text>
          </TouchableOpacity>
        </View>

      
          <View style={styles.comparisonBox}>
            <Icon name="chart-line" size={20} color="#FF6B6B" />
            <Text style={styles.comparisonText}>
              Tăng <Text style={styles.comparisonAmount}>{formatCurrency(totalExpense)}</Text> so với cùng kỳ tháng trước
            </Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </View>

          
          {pieChartData.length > 0 && (
            <View style={styles.chartContainer}>
              <PieChart
                data={pieChartData.map((item) => ({
                  name: `${item.name} ${item.percentage}%`,
                  population: item.amount,
                  color: item.color,
                  legendFontColor: '#7F7F7F',
                  legendFontSize: 12,
                }))}
                width={width - 80}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}

          {pieChartData.length === 0 && (
            <View style={styles.emptyChart}>
              <Icon name="chart-pie" size={60} color="#DDD" />
              <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu</Text>
            </View>
          )}
        </View>

      
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'children' && styles.activeTab]}
            onPress={() => setSelectedTab('children')}
          >
            <Text style={[styles.tabText, selectedTab === 'children' && styles.activeTabText]}>
              Danh mục con
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'parent' && styles.activeTab]}
            onPress={() => setSelectedTab('parent')}
          >
            <Text style={[styles.tabText, selectedTab === 'parent' && styles.activeTabText]}>
              Danh mục cha
            </Text>
          </TouchableOpacity>
        </View>

        
        <View style={styles.transactionsList}>
          {Object.keys(groupedTransactions).length === 0 && (
            <View style={styles.emptyTransactions}>
              <Icon name="receipt-text-outline" size={60} color="#DDD" />
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
            </View>
          )}

          {Object.keys(groupedTransactions).map((category) => {
            const iconsToUse = (viewMode === 'expense') ? categoryIcons : incomeCategoryIcons;
            const colorsToUse = (viewMode === 'expense') ? categoryColors : incomeCategoryColors;
            const totalToUse = (viewMode === 'expense') ? totalExpense : totalIncome;

            const categoryTransactions = groupedTransactions[category];
            const categoryTotal = categoryTransactions.reduce(
              (sum: number, t: Transaction) => sum + t.amount,
              0
            );
            const percentage = (totalToUse > 0) ? ((categoryTotal / totalToUse) * 100).toFixed(0) : '0';

            return (
              <TouchableOpacity 
                key={category}
                style={styles.categoryItem}
                onPress={() =>
                    navigation.navigate('CategoryDetail', {
                    category,
                    transactions: groupedTransactions[category],
                    })
                }
                >
                <View style={styles.categoryIcon}>
                  <Icon
                    name={iconsToUse[category] || 'dots-grid'}
                    size={24}
                    color={colorsToUse[category] || '#9D9D9D'}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryCount}>
                    {categoryTransactions.length} giao dịch
                  </Text>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.categoryTotal}>{formatCurrency(categoryTotal)}</Text>
                  <Text style={[styles.categoryPercentage, { color: colorsToUse[category] || '#9D9D9D' }]}>{percentage}%</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            );
          })}
        </View>
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
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 5,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FF69B4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  transactionsList: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 10,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  categoryCount: {
    fontSize: 12,
    color: '#999',
  },
  categoryAmount: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  categoryTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#FF69B4',
    fontWeight: '600',
  },
  incomeBox: {
    borderWidth: 2,
    borderColor: '#4CAF50', // Màu xanh lá
    backgroundColor: '#f0fff5',
  },
});

export default OverviewScreen;