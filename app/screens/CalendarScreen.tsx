import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CalendarScreen = () => {
  const [selectedMonth, setSelectedMonth] = useState('Tháng này');
  
  const formatCurrency = (amount: any) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  // Dữ liệu lịch tháng 10/2025
  const calendarData: any = {
    totalIncome: 0,
    totalExpense: 6667,
    balance: -6667,
    daysInMonth: 31,
    firstDayOfWeek: 2, // Thứ 3
    transactions: {
      '18': [
        {
          id: '1',
          date: '18/10/2025',
          title: 'Thanh toán Google',
          category: 'Giải trí',
          amount: -6667,
          icon: 'home',
        }
      ]
    }
  };

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  
  // Tạo mảng ngày trong tháng
  const getDaysArray = () => {
    const days = [];
    const firstDay = calendarData.firstDayOfWeek;
    
    // Thêm ô trống cho các ngày trước ngày 1
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }
    
    // Thêm các ngày trong tháng
    for (let i = 1; i <= calendarData.daysInMonth; i++) {
      const hasTransaction = calendarData.transactions[i.toString()];
      days.push({ 
        day: i, 
        key: `day-${i}`,
        amount: hasTransaction ? hasTransaction[0].amount : null
      });
    }
    
    return days;
  };

  const renderDayCell = ({ item }: any) => {
    if (item.empty) {
      return <View style={styles.dayCell} />;
    }

    return (
      <TouchableOpacity style={styles.dayCell}>
        <Text style={styles.dayNumber}>{item.day}</Text>
        {item.amount && (
          <Text style={[styles.dayAmount, item.amount < 0 && styles.expenseAmount]}>
            {Math.abs(item.amount)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderTransaction = ({ item }: any) => (
    <TouchableOpacity style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIcon}>
          <Icon name="home" size={24} color="#FF69B4" />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <View style={styles.categoryBadge}>
            <Icon name="gift" size={14} color="#FF69B4" />
            <Text style={styles.categoryText}>{item.category}</Text>
            <Icon name="chevron-down" size={14} color="#FF69B4" />
          </View>
        </View>
      </View>
      <Text style={styles.transactionAmount}>
        {item.amount < 0 ? '' : '+'}{formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="check-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="wallet-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="home-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity>
            <Icon name="chevron-left" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{selectedMonth}</Text>
          <TouchableOpacity>
            <Icon name="chevron-right" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-variant" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tổng thu</Text>
            <Text style={[styles.summaryAmount, styles.incomeText]}>
              {formatCurrency(calendarData.totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tổng chi</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(calendarData.totalExpense)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Chênh lệch</Text>
            <Text style={[styles.summaryAmount, styles.balanceText]}>
              {formatCurrency(calendarData.balance)}
            </Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Week Days Header */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          <FlatList
            data={getDaysArray()}
            renderItem={renderDayCell}
            numColumns={7}
            scrollEnabled={false}
            keyExtractor={(item) => item.key}
          />
        </View>

        {/* Collapse Button */}
        <TouchableOpacity style={styles.collapseButton}>
          <Icon name="chevron-up" size={24} color="#999" />
        </TouchableOpacity>

        {/* Transaction List */}
        <View style={styles.transactionSection}>
          <Text style={styles.sectionTitle}>Danh sách giao dịch</Text>
          
          <View style={styles.transactionDate}>
            <Text style={styles.dateText}>18/10/2025</Text>
          </View>

          <FlatList
            data={calendarData.transactions['18']}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFD6E8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 100,
    textAlign: 'center',
  },
  filterButton: {
    position: 'absolute',
    right: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  incomeText: {
    color: '#4CD080',
  },
  balanceText: {
    color: '#FF6B6B',
  },
  calendarContainer: {
    paddingHorizontal: 16,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayNumber: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  dayAmount: {
    fontSize: 10,
    color: '#4CD080',
    fontWeight: '500',
  },
  expenseAmount: {
    color: '#FF69B4',
  },
  collapseButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    marginTop: 8,
  },
  transactionSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  transactionDate: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  categoryText: {
    fontSize: 12,
    color: '#FF69B4',
    marginLeft: 4,
    marginRight: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#FF69B4',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28,
    shadowColor: '#FF69B4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 9,
    color: '#fff',
    marginTop: 2,
    fontWeight: '600',
  },
});

export default CalendarScreen;