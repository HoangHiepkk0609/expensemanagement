import firestore from '@react-native-firebase/firestore';
import {
  NavigationProp,
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/themeContext';
import { formatCurrency } from '../../utils/formatCurrency';
import styles from './styles';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_EXPENSE = [
  { label: 'Ăn uống', icon: 'silverware-fork-knife', color: '#FF6B6B' },
  { label: 'Mua sắm', icon: 'cart-outline', color: '#FFD93D' },
  { label: 'Di chuyển', icon: 'car', color: '#6BCB77' },
  { label: 'Người thân', icon: 'human-handsup', color: '#4D96FF' },
  { label: 'Khác', icon: 'dots-grid', color: '#9D9D9D' },
];

const DEFAULT_INCOME = [
  { label: 'Lương', icon: 'cash-marker', color: '#4CAF50' },
  { label: 'Thưởng', icon: 'wallet-giftcard', color: '#FFC107' },
  { label: 'Kinh doanh', icon: 'chart-line', color: '#2196F3' },
  { label: 'Khác', icon: 'dots-grid', color: '#9D9D9D' },
];

const ALL_DEFAULTS = [...DEFAULT_EXPENSE, ...DEFAULT_INCOME];

type Transaction = {
  id?: string | number;
  amount: number;
  date: any;
  note?: string;
  name?: string;
  category?: string;
  type?: 'expense' | 'income';
};

type RootStackParamList = {
  CategoryDetail: {
    category: string;
    icon?: string;
    color?: string;
  };
  TransactionDetail: {
    transaction: Transaction;
  };
};

type CategoryTheme = {
  icon: string;
  color: string;
};

const WeeklyTrendChart = ({
  data,
  color,
  textColor,
}: {
  data: { label: string; value: number }[];
  color: string;
  textColor: string;
}) => {
  const maxValue = Math.max(...data.map(d => d.value)) || 1;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartPlaceholder}>
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <View key={index} style={styles.chartBarWrapper}>
              {heightPercent === 100 && item.value > 0 && (
                <Text style={[styles.chartAmountLabel, { color: color }]}>
                  {formatCurrency(item.value).replace('₫', '')}
                </Text>
              )}
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: item.value > 0 ? color : '#E0E0E0',
                      opacity: item.value > 0 ? 1 : 0.3,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chartLabel, { color: textColor }]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const groupTransactionsByDate = (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) return [];
  const grouped = transactions.reduce(
    (acc: Record<string, Transaction[]>, tx: Transaction) => {
      let dateObj =
        tx.date && typeof tx.date.toDate === 'function'
          ? tx.date.toDate()
          : new Date(tx.date);
      const date = dateObj.toLocaleDateString('vi-VN');
      if (!acc[date]) acc[date] = [];
      acc[date].push(tx);
      return acc;
    },
    {},
  );

  return Object.keys(grouped)
    .sort((a, b) => {
      const dateA = a.split('/').reverse().join('-');
      const dateB = b.split('/').reverse().join('-');
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .map(date => ({ title: date, data: grouped[date] }));
};

const processWeeklyData = (transactions: Transaction[], selectedDate: Date) => {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const result = days.map(day => ({ label: day, value: 0 }));

  const startOfWeek = getStartOfWeek(selectedDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  transactions.forEach(tx => {
    let txDate =
      tx.date && typeof tx.date.toDate === 'function'
        ? tx.date.toDate()
        : new Date(tx.date);

    if (txDate >= startOfWeek && txDate < endOfWeek) {
      let dayIndex = txDate.getDay();
      let arrayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      result[arrayIndex].value += tx.amount;
    }
  });

  return result;
};

interface HeaderProps {
  category: string;
  theme: CategoryTheme;
  weeklyData: any[];
  currentDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  colors: any;
}

const ListHeader: React.FC<HeaderProps> = ({
  theme,
  weeklyData,
  currentDate,
  onPrevWeek,
  onNextWeek,
  colors,
}) => {
  const start = getStartOfWeek(currentDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const dateRangeText = `${start.getDate()}/${
    start.getMonth() + 1
  } - ${end.getDate()}/${end.getMonth() + 1}`;

  return (
    <View style={styles.headerContainer}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={[styles.bigIconCircle, { backgroundColor: theme.color }]}
          >
            <Icon name={theme.icon} size={32} color="#fff" />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Xu hướng tuần này
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              Chi tiết giao dịch
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.card,
          styles.trendCard,
          { backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.chartHeaderRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Xu hướng chi tiêu
          </Text>
          <View
            style={[
              styles.weekNavigator,
              { backgroundColor: colors.background },
            ]}
          >
            <TouchableOpacity onPress={onPrevWeek} style={styles.navBtn}>
              <Icon name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.dateRangeText, { color: colors.text }]}>
              {dateRangeText}
            </Text>
            <TouchableOpacity onPress={onNextWeek} style={styles.navBtn}>
              <Icon name="chevron-right" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <WeeklyTrendChart
          data={weeklyData}
          color={theme.color}
          textColor={colors.textSecondary}
        />
      </View>
      <Text style={[styles.transactionTitle, { color: colors.text }]}>
        Lịch sử giao dịch
      </Text>
    </View>
  );
};

const CategoryDetailScreen = () => {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'CategoryDetail'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const { category, icon: paramIcon, color: paramColor } = route.params;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, familyId, filterMode } = useAuth();

  const [categoryTheme, setCategoryTheme] = useState<CategoryTheme>({
    icon: paramIcon || 'help-circle',
    color: paramColor || '#999',
  });

  const weeklyData = useMemo(
    () => processWeeklyData(transactions, currentDate),
    [transactions, currentDate],
  );

  const sections = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions],
  );

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  useFocusEffect(
    useCallback(() => {
      const syncTheme = async () => {
        if (paramIcon && paramColor) return;
        const defaultMatch = ALL_DEFAULTS.find(c => c.label === category);
        if (defaultMatch) {
          setCategoryTheme({
            icon: defaultMatch.icon,
            color: defaultMatch.color,
          });
          return;
        }
        try {
          const snapshot = await firestore()
            .collection('user_categories')
            .where('label', '==', category)
            .limit(1)
            .get();
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setCategoryTheme({
              icon: data.icon || 'help-circle',
              color: data.color || '#999',
            });
          }
        } catch {}
      };
      syncTheme();
    }, [category, paramIcon, paramColor]),
  );

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
          let query: any = firestore()
            .collection('transactions')
            .where('category', '==', category);

          if (filterMode === 'family' && familyId) {
            query = query.where('familyId', '==', familyId);
          } else {
            query = query.where('userId', '==', userId);
          }

          const querySnapshot = await query.orderBy('date', 'desc').get();

          const fetchedTransactions: Transaction[] = [];
          querySnapshot.forEach((doc: any) =>
            fetchedTransactions.push({
              id: doc.id,
              ...doc.data(),
            } as Transaction),
          );
          setTransactions(fetchedTransactions);
        } catch (error) {
          console.error('Lỗi tải giao dịch: ', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [category, userId, familyId, filterMode]),
  );

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('TransactionDetail', { transaction: item })
      }
    >
      <View style={[styles.item, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.iconPlaceholder,
            { backgroundColor: categoryTheme.color + '20' },
          ]}
        >
          <Icon
            name={categoryTheme.icon}
            size={24}
            color={categoryTheme.color}
          />
        </View>
        <View style={styles.itemLeft}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.note || item.name || 'Chi tiêu'}
          </Text>
          <View
            style={[
              styles.categoryTag,
              {
                borderColor: categoryTheme.color,
                backgroundColor: categoryTheme.color + '10',
              },
            ]}
          >
            <Text
              style={[styles.categoryTagText, { color: categoryTheme.color }]}
            >
              {item.category || category}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.amount,
            { color: item.type === 'income' ? '#4CAF50' : '#FF6B6B' },
          ]}
        >
          {item.type === 'income' ? '+' : '-'}
          {formatCurrency(item.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <Text style={[styles.dateHeader, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={categoryTheme.color} />
      </View>
    );
  }

  return (
    <SectionList
      style={[styles.container, { backgroundColor: colors.background }]}
      sections={sections}
      keyExtractor={(item, index) => (item.id || index).toString()}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={
        <ListHeader
          category={category}
          theme={categoryTheme}
          weeklyData={weeklyData}
          currentDate={currentDate}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          colors={colors}
        />
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Chưa có giao dịch nào
        </Text>
      }
      contentContainerStyle={styles.listContent}
      scrollEnabled={true}
    />
  );
};

export default CategoryDetailScreen;
