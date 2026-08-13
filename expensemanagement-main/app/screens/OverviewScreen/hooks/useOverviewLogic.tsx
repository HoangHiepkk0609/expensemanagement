import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Animated, LayoutAnimation } from 'react-native';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../../../constants/categories';
import { useAuth } from '../../../context/AuthContext';
import { useCategories } from '../../../hook/useCategories';
import { Transaction } from '../types';

export const useOverviewLogic = ({ route, navigation }: any) => {
  const { familyId, filterMode } = useAuth();
  const user = auth().currentUser;
  const userId = user ? user.uid : null;
  const { categories: customCategories } = useCategories();

  const [viewMode, setViewMode] = useState<'expense' | 'income'>('expense');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [chartScale] = useState(new Animated.Value(0));
  const [categoryListOpacity] = useState(new Animated.Value(0));
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const jumpToDateParam = (route.params as any)?.jumpToDate;

  useEffect(() => {
    setSelectedIndex(-1);
    Animated.timing(chartScale, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    Animated.timing(categoryListOpacity, {
      toValue: 1,
      duration: 600,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, [viewMode, filterMode, categoryListOpacity, chartScale]);

  useFocusEffect(
    useCallback(() => {
      if (jumpToDateParam) {
        setCurrentMonth(new Date(jumpToDateParam));
        navigation.setParams({ jumpToDate: undefined });
      }

      setLoading(true);

      let query = firestore().collection('transactions') as any;

      if (filterMode === 'family' && familyId) {
        query = query.where('familyId', '==', familyId);
      } else {
        query = query.where('userId', '==', userId);
      }

      const unsubscribe = query.orderBy('date', 'desc').onSnapshot(
        (snapshot: any) => {
          const transactionsData: Transaction[] = [];
          snapshot.forEach((doc: any) => {
            const data = doc.data();
            if (filterMode === 'personal' && data.isFamily === true) return;

            transactionsData.push({
              id: doc.id,
              type: data.type,
              amount: data.amount,
              category: data.category,
              note: data.note,
              date: new Date(data.date),
              wallet: data.wallet,
              recurrence: data.recurrence,
              isFamily: data.isFamily,
            });
          });
          setTransactions(transactionsData);
          setLoading(false);
        },
        (error: any) => {
          console.error('Error fetching transactions:', error);
          setLoading(false);
        },
      );

      return () => unsubscribe();
    }, [jumpToDateParam, filterMode, familyId, userId, navigation]),
  );

  const getCurrentMonthTransactions = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return transactions.filter(transaction => {
      const tDate = new Date(transaction.date);
      return tDate.getFullYear() === year && tDate.getMonth() === month;
    });
  };

  const getTotalExpense = () =>
    getCurrentMonthTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

  const getTotalIncome = () =>
    getCurrentMonthTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

  const getCategoryTotals = () => {
    const categoryTotals: any = {};
    getCurrentMonthTransactions()
      .filter(t => t.type === viewMode)
      .forEach(t => {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + t.amount;
      });
    return categoryTotals;
  };

  const getCategoryStyle = (
    categoryName: string,
    currentViewMode: 'expense' | 'income',
  ) => {
    const custom = customCategories.find(
      c => c.label === categoryName && c.type === currentViewMode,
    );
    if (custom) return { icon: custom.icon, color: custom.color };
    const defaultList =
      currentViewMode === 'expense'
        ? DEFAULT_EXPENSE_CATEGORIES
        : DEFAULT_INCOME_CATEGORIES;
    const def = defaultList.find(c => c.label === categoryName);
    if (def) return { icon: def.icon, color: def.color || '#9D9D9D' };
    return { icon: 'dots-grid', color: '#9D9D9D' };
  };

  const getPieChartData = () => {
    const categoryTotals = getCategoryTotals();
    const total = viewMode === 'expense' ? getTotalExpense() : getTotalIncome();
    return Object.keys(categoryTotals).map((category, index) => {
      const amount = categoryTotals[category];
      const percentage = total > 0 ? ((amount / total) * 100).toFixed(0) : '0';
      const isFocused = index === selectedIndex;
      const { color } = getCategoryStyle(category, viewMode);
      return {
        value: amount,
        color: color,
        text: `${percentage}%`,
        categoryName: category,
        percentage: percentage,
        focused: isFocused,
        shiftTextX: isFocused ? 10 : 0,
        radius: isFocused ? 80 : 70,
      };
    });
  };

  const getGroupedTransactions = () => {
    const grouped: any = {};
    getCurrentMonthTransactions()
      .filter(t => t.type === viewMode)
      .forEach(t => {
        if (!grouped[t.category]) grouped[t.category] = [];
        grouped[t.category].push(t);
      });
    return grouped;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    direction === 'prev'
      ? newMonth.setMonth(newMonth.getMonth() - 1)
      : newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    setSelectedIndex(-1);
  };

  const handlePressItem = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedIndex(prev => (prev === index ? -1 : index));
  };

  return {
    viewMode,
    setViewMode,
    loading,
    currentMonth,
    chartScale,
    categoryListOpacity,
    selectedIndex,
    totalExpense: getTotalExpense(),
    totalIncome: getTotalIncome(),
    pieChartData: getPieChartData(),
    groupedTransactions: getGroupedTransactions(),
    changeMonth,
    handlePressItem,
    getCategoryStyle,
  };
};