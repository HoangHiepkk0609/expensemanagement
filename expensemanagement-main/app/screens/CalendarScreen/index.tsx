import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/themeContext';
import styles from './styles';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

LocaleConfig.locales.vi = {
  monthNames: [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ],
  monthNamesShort: [
    'Th.1',
    'Th.2',
    'Th.3',
    'Th.4',
    'Th.5',
    'Th.6',
    'Th.7',
    'Th.8',
    'Th.9',
    'Th.10',
    'Th.11',
    'Th.12',
  ],
  dayNames: ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay',
};
LocaleConfig.defaultLocale = 'vi';

const categoryIcons: any = {
  'Ăn uống': 'silverware-fork-knife',
  'Mua sắm': 'cart-outline',
  'Di chuyển': 'car',
  'Người thân': 'human-handsup',
  Khác: 'dots-grid',
  Lương: 'cash-marker',
  'Kinh doanh': 'chart-line',
  Thưởng: 'wallet-giftcard',
};
const categoryColors: any = {
  'Ăn uống': '#FF6B6B',
  'Mua sắm': '#FFD93D',
  'Di chuyển': '#6BCB77',
  'Người thân': '#4D96FF',
  Khác: '#9D9D9D',
  Lương: '#4CAF50',
  'Kinh doanh': '#2196F3',
  Thưởng: '#FFC107',
};

interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  date: string;
  wallet: string;
  isFamily?: boolean;
  familyId?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

const CalendarScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'family' | 'all'>(
    'all',
  );
  const userId = auth().currentUser?.uid;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleAddTransaction = () => {
    navigation.navigate('AddTransactionModal');
  };

  useEffect(() => {
    if (!userId) return;
    firestore()
      .collection('users')
      .doc(userId)
      .get()
      .then(doc => setFamilyId(doc.data()?.familyId || null));
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      const date = new Date(currentMonth);
      const year = date.getFullYear();
      const month = date.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const personalQuery = firestore()
        .collection('transactions')
        .where('userId', '==', userId)
        .where('isFamily', '==', false) 
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth);

      const familyQuery = familyId
        ? firestore()
            .collection('transactions')
            .where('familyId', '==', familyId)
            .where('isFamily', '==', true)
            .where('date', '>=', startOfMonth)
            .where('date', '<=', endOfMonth)
        : null;

      const unsubscribePersonal = personalQuery.onSnapshot(
        personalSnapshot => {
          const personalData: Transaction[] = personalSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              date: data.date,
              type: data.type,
              amount: data.amount,
              category: data.category,
              note: data.note,
              wallet: data.wallet,
              isFamily: false,
            };
          });

          if (familyQuery) {
            familyQuery.get().then(familySnapshot => {
              console.log(
                'Family transactions count:',
                familySnapshot.docs.length,
              ); 
              console.log('familyId đang dùng:', familyId);
              const familyData: Transaction[] = familySnapshot.docs.map(doc => {
                console.log('Family doc data:', doc.data());
                const data = doc.data();
                return {
                  id: doc.id,
                  date: data.date,
                  type: data.type,
                  amount: data.amount,
                  category: data.category,
                  note: data.note,
                  wallet: data.wallet,
                  isFamily: true,
                  familyId: data.familyId,
                };
              });

              const merged = [...personalData, ...familyData];
              setMonthTransactions(merged);
              console.log('Personal count:', personalData.length);
              console.log('Family count:', familyData.length);
              console.log('Merged count:', merged.length); 
              console.log(
                'Merged isFamily:',
                merged.map(t => ({ id: t.id, isFamily: t.isFamily })),
              );
              setMonthTransactions(merged);
              setLoading(false);
            });
          } else {
            setMonthTransactions(personalData);
            setLoading(false);
          }
        },
        error => {
          console.error('Lỗi tải lịch:', error);
          setLoading(false);
        },
      );

      return () => unsubscribePersonal();
    }, [currentMonth, userId, familyId]),
  );

  const monthlyTotals = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    const filtered = monthTransactions.filter(t => {
      if (viewMode === 'personal') return !t.isFamily;
      if (viewMode === 'family') return t.isFamily;
      return true;
    });

    filtered.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpense += t.amount;
    });

    return { totalIncome, totalExpense };
  }, [monthTransactions, viewMode]);

  const dailyData = useMemo(() => {
    const data: { [key: string]: { income: number; expense: number } } = {};
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
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: colors.primary,
    };
    return marked;
  }, [dailyData, selectedDate, colors.primary]);

  const selectedDayTransactions = useMemo(() => {
    return monthTransactions
      .filter(t => t.date.slice(0, 10) === selectedDate)
      .filter(t => {
        if (viewMode === 'personal') return !t.isFamily;
        if (viewMode === 'family') return t.isFamily;
        return true;
      })
      .sort(a => (a.type === 'income' ? -1 : 1));
  }, [monthTransactions, selectedDate, viewMode]);

  if (!userId) {
    return <Text>Vui lòng đăng nhập</Text>;
  }

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const color = isIncome ? '#4CAF50' : '#FF6B6B';
    const sign = isIncome ? '+' : '-';
    const iconName = categoryIcons[item.category] || 'dots-grid';
    const iconColor = categoryColors[item.category] || '#999';

    return (
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: colors.surface }]}
        onPress={() =>
          navigation.navigate('TransactionDetail', { transaction: item })
        }
      >
        <View style={[styles.iconBox, { backgroundColor: iconColor + '20' }]}>
          <Icon name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.itemInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.itemNote, { color: colors.text }]}>
              {item.note || item.category}
            </Text>
            {/* Badge gia đình */}
            {item.isFamily && (
              <View
                style={{
                  backgroundColor: '#E91E6320',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  flexDirection: "row"
                }}
              >
                 <Icon name="home" size={13} color={colors.primary} />
                <Text style={{ fontSize: 10, color: colors.primary }}>
                  Gia đình
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
            {item.category} • {item.wallet}
          </Text>
        </View>
        <Text style={[styles.itemAmount, { color }]}>
          {sign}
          {formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="package-variant-closed"
        size={80}
        color={colors.textSecondary}
        style={{ marginBottom: 10 }}
      />

      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Chưa có giao dịch nào sắp tới
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Lên lịch chi tiêu để chủ động quản lý và tránh quên thanh toán hóa đơn
        nhé
      </Text>

      <TouchableOpacity
        style={[
          styles.emptyButton,
          {
            borderColor: colors.primary,
            backgroundColor: isDarkMode ? colors.surface : '#fff',
          },
        ]}
        onPress={handleAddTransaction}
      >
        <Text style={[styles.emptyButtonText, { color: colors.primary }]}>
          Thêm giao dịch dự kiến
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.summaryContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Tổng thu
          </Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {formatCurrency(monthlyTotals.totalIncome)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Tổng chi
          </Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {formatCurrency(monthlyTotals.totalExpense)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Chênh lệch
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatCurrency(
              monthlyTotals.totalIncome - monthlyTotals.totalExpense,
            )}
          </Text>
        </View>
      </View>

      <View
        style={{
          height: isExpanded ? 0 : 'auto',
          overflow: 'hidden',
          opacity: isExpanded ? 0 : 1,
        }}
      >
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
          style={[
            styles.calendar,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.detailsContainer,
          { backgroundColor: colors.surface },
          isExpanded ? styles.detailsExpanded : styles.detailsCollapsed,
        ]}
      >
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          <Icon
            name={isExpanded ? 'chevron-down' : 'chevron-up'}
            size={30}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {selectedDayTransactions.length > 0 && (
          <View style={styles.detailsHeader}>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>
              Giao dịch ngày {selectedDate.split('-').reverse().join('/')}
            </Text>
            <View style={styles.dailyStats}>
              <Text
                style={[styles.dailyStatText, { color: colors.textSecondary }]}
              >
                Thu:{' '}
                <Text style={{ color: '#4CAF50' }}>
                  {formatCurrency(dailyData[selectedDate]?.income || 0)}
                </Text>
              </Text>
              <Text style={{ marginHorizontal: 8, color: colors.border }}>
                |
              </Text>
              <Text
                style={[styles.dailyStatText, { color: colors.textSecondary }]}
              >
                Chi:{' '}
                <Text style={{ color: '#FF6B6B' }}>
                  {formatCurrency(dailyData[selectedDate]?.expense || 0)}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Tab phân loại */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 16,
            marginBottom: 8,
            backgroundColor: colors.background,
            borderRadius: 8,
            padding: 4,
          }}
        >
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'personal', label: 'Cá nhân' },
            ...(familyId ? [{ key: 'family', label: 'Gia đình' }] : []),
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={{
                flex: 1,
                paddingVertical: 6,
                borderRadius: 6,
                alignItems: 'center',
                backgroundColor:
                  viewMode === tab.key ? colors.primary : 'transparent',
              }}
              onPress={() => setViewMode(tab.key as any)}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: viewMode === tab.key ? '#fff' : colors.textSecondary,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
        ) : (
          <FlatList
            data={selectedDayTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
            scrollEnabled={true}
            ListEmptyComponent={<EmptyState />}
          />
        )}
      </View>
    </View>
  );
};

export default CalendarScreen;
