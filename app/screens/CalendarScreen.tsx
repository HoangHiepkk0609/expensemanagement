import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  Image
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/themeContext';
import auth from '@react-native-firebase/auth';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
  dayNames: ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: "Hôm nay"
};
LocaleConfig.defaultLocale = 'vi';


const categoryIcons: any = {
  'Ăn uống': 'silverware-fork-knife', 'Mua sắm': 'cart-outline', 'Di chuyển': 'car',
  'Người thân': 'human-handsup', 'Khác': 'dots-grid', 'Lương': 'cash-marker',
  'Kinh doanh': 'chart-line', 'Thưởng': 'wallet-giftcard',
};
const categoryColors: any = {
  'Ăn uống': '#FF6B6B', 'Mua sắm': '#FFD93D', 'Di chuyển': '#6BCB77',
  'Người thân': '#4D96FF', 'Khác': '#9D9D9D', 'Lương': '#4CAF50',
  'Kinh doanh': '#2196F3', 'Thưởng': '#FFC107',
};

interface Transaction {
  id: string; type: 'expense' | 'income'; amount: number; category: string; note: string; date: string; wallet: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

const CalendarScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme(); 
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 10));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const userId = auth().currentUser?.uid;

if (!userId) {
   return <Text>Vui lòng đăng nhập</Text>; 
}


  const toggleExpand = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(!isExpanded);
  };

  const handleAddTransaction = () => {
      navigation.navigate('AddTransactionModal'); 
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      const date = new Date(currentMonth);
      const year = date.getFullYear();
      const month = date.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const unsubscribe = firestore()
        .collection('transactions')
        .where('userId', '==', userId)
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth)
        .onSnapshot(snapshot => {
          const transactionsData: Transaction[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            transactionsData.push({
              id: doc.id, date: data.date, type: data.type, amount: data.amount,
              category: data.category, note: data.note, wallet: data.wallet,
            });
          });
          setMonthTransactions(transactionsData);
          setLoading(false);
        }, error => { console.error("Lỗi tải lịch: ", error); setLoading(false); });
      return () => unsubscribe();
    }, [currentMonth])
  );

  const monthlyTotals = useMemo(() => {
    let totalIncome = 0; let totalExpense = 0;
    monthTransactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpense += t.amount;
    });
    return { totalIncome, totalExpense };
  }, [monthTransactions]);

  const dailyData = useMemo(() => {
    const data: { [key: string]: { income: number, expense: number } } = {};
    monthTransactions.forEach(t => {
      const dateKey = t.date.slice(0, 10);
      if (!data[dateKey]) data[dateKey] = { income: 0, expense: 0 };
      if (t.type === 'income') data[dateKey].income += t.amount;
      if (t.type === 'expense') data[dateKey].expense += t.amount;
    });
    return data;
  }, [monthTransactions]);

  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};
    Object.keys(dailyData).forEach(date => {
      const day = dailyData[date];
      marked[date] = {
        dots: [
          ...(day.income > 0 ? [{ key: 'income', color: '#4CAF50' }] : []),
          ...(day.expense > 0 ? [{ key: 'expense', color: '#FF6B6B' }] : []),
        ],
      };
    });
    marked[selectedDate] = { ...(marked[selectedDate] || {}), selected: true, selectedColor: colors.primary };
    return marked;
  }, [dailyData, selectedDate, colors.primary]);

  const selectedDayTransactions = useMemo(() => {
    return monthTransactions
      .filter(t => t.date.slice(0, 10) === selectedDate)
      .sort((a, b) => (a.type === 'income' ? -1 : 1));
  }, [monthTransactions, selectedDate]);

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const color = isIncome ? '#4CAF50' : '#FF6B6B';
    const sign = isIncome ? '+' : '-';
    const iconName = categoryIcons[item.category] || 'dots-grid';
    const iconColor = (categoryColors[item.category] || '#999');

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
      >
        <View style={[styles.iconBox, { backgroundColor: iconColor + '20' }]}>
           <Icon name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemNote, { color: colors.text }]}>{item.note || item.category}</Text>
          <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>{item.category} • {item.wallet}</Text>
        </View>
        <Text style={[styles.itemAmount, { color }]}>{sign}{formatCurrency(item.amount)}</Text>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
        <Icon name="package-variant-closed" size={80} color={colors.textSecondary} style={{marginBottom: 10}} />
        
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có giao dịch nào sắp tới</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Lên lịch chi tiêu để chủ động quản lý và tránh quên thanh toán hóa đơn nhé
        </Text>

        <TouchableOpacity 
          style={[styles.emptyButton, { 
            borderColor: colors.primary,
            backgroundColor: isDarkMode ? colors.surface : '#fff'
          }]} 
          onPress={handleAddTransaction}
        >
            <Text style={[styles.emptyButtonText, { color: colors.primary }]}>Thêm giao dịch dự kiến</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.summaryContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.summaryItem}>
           <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tổng thu</Text>
           <Text style={[styles.summaryValue, {color: '#4CAF50'}]}>{formatCurrency(monthlyTotals.totalIncome)}</Text>
        </View>
        <View style={styles.summaryItem}>
           <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tổng chi</Text>
           <Text style={[styles.summaryValue, {color: '#FF6B6B'}]}>{formatCurrency(monthlyTotals.totalExpense)}</Text>
        </View>
        <View style={styles.summaryItem}>
           <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Chênh lệch</Text>
           <Text style={[styles.summaryValue, {color: colors.text}]}>
             {formatCurrency(monthlyTotals.totalIncome - monthlyTotals.totalExpense)}
           </Text>
        </View>
      </View>

      <View style={{ height: isExpanded ? 0 : 'auto', overflow: 'hidden', opacity: isExpanded ? 0 : 1 }}>
          <Calendar
            current={currentMonth}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            onMonthChange={(month: any) => setCurrentMonth(month.dateString)}
            monthFormat={'MMMM yyyy'}
            firstDay={1}
            markingType={'multi-dot'}
            markedDates={markedDates}
            theme={{ 
              arrowColor: colors.primary,
              todayTextColor: colors.primary,
              monthTextColor: colors.text,
              textMonthFontWeight: 'bold',
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textSecondary,
              dayTextColor: colors.text,
              textDisabledColor: colors.border,
              dotColor: colors.primary,
              selectedDotColor: '#fff',
            }}
            style={[styles.calendar, { 
              backgroundColor: colors.surface,
              borderBottomColor: colors.border 
            }]}
          />
      </View>

      <View style={[
        styles.detailsContainer, 
        { backgroundColor: colors.surface }, 
        isExpanded ? styles.detailsExpanded : styles.detailsCollapsed
      ]}>
        
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
            <Icon name={isExpanded ? "chevron-down" : "chevron-up"} size={30} color={colors.textSecondary} />
        </TouchableOpacity>

        {selectedDayTransactions.length > 0 && (
            <View style={styles.detailsHeader}>
                <Text style={[styles.detailsTitle, { color: colors.text }]}>Giao dịch ngày {selectedDate.split('-').reverse().join('/')}</Text>
                <View style={styles.dailyStats}>
                    <Text style={[styles.dailyStatText, { color: colors.textSecondary }]}>Thu: <Text style={{color: '#4CAF50'}}>{formatCurrency(dailyData[selectedDate]?.income || 0)}</Text></Text>
                    <Text style={{marginHorizontal: 8, color: colors.border}}>|</Text>
                    <Text style={[styles.dailyStatText, { color: colors.textSecondary }]}>Chi: <Text style={{color: '#FF6B6B'}}>{formatCurrency(dailyData[selectedDate]?.expense || 0)}</Text></Text>
                </View>
            </View>
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
        ) : (
          <FlatList
            data={selectedDayTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
            scrollEnabled={true} 
            ListEmptyComponent={<EmptyState />}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  summaryContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1
  },
  summaryItem: { 
    alignItems: 'center', 
    flex: 1 
  },
  summaryLabel: { 
    fontSize: 12, 
    marginBottom: 4 
  },
  summaryValue: { 
    fontSize: 14, 
    fontWeight: 'bold' 
  },

  calendar: { 
    borderBottomWidth: 1 
  },

  detailsContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowOffset: { 
      width: 0, 
      height: -2 
    },
  },
  detailsCollapsed: { 
    flex: 1, 
    marginTop: -10, 
    paddingTop: 5 
  },
  detailsExpanded: { 
    flex: 1,
    marginTop: 0, 
    paddingTop: 5 
  },
  expandButton: { 
    alignItems: 'center', 
    paddingVertical: 8, 
    marginBottom: 5 
  },
  detailsHeader: { 
    flexDirection: 'column', 
    marginBottom: 12 
  },
  detailsTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  dailyStats: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  dailyStatText: { 
    fontSize: 13, 
    fontWeight: '500' 
  },

  itemContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 8, 
    elevation: 1 
  },
  iconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  itemInfo: { 
    flex: 1 
  },
  itemNote: { 
    fontSize: 15, 
    fontWeight: '500' 
  },
  itemCategory: { 
    fontSize: 12,  
    marginTop: 2 
  },
  itemAmount: { 
    fontSize: 15, 
    fontWeight: 'bold'
   },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default CalendarScreen;