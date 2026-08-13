import firestore from '@react-native-firebase/firestore';
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import React, { useCallback, useLayoutEffect } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/themeContext';
import { formatCurrency } from '../../utils/formatCurrency';
import styles from './styles';

type Transaction = {
  id: string | number;
  type: 'expense' | 'income';
  amount: number;
  date: string | Date;
  wallet: string;
  category: string;
  note?: string;
  recurrence?: string;
};

type RootStackParamList = {
  CategoryDetail: { category: string };
  TransactionDetail: { transaction: Transaction };
  TransactionEdit: { transaction: Transaction };
};

const formatTransactionDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  return new Date(date).toLocaleDateString('vi-VN', options);
};

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

const InfoRow = ({
  label,
  value,
  icon,
  valueColor,
  isCategory,
  colors,
}: any) => {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <View style={styles.valueContainer}>
        {isCategory && (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryColors[value] + '20' },
            ]}
          >
            <Icon
              name={categoryIcons[value] || 'dots-grid'}
              size={18}
              color={categoryColors[value] || '#9D9D9D'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.value,
                { color: categoryColors[value] || colors.text },
              ]}
            >
              {value}
            </Text>
          </View>
        )}
        {!isCategory && (
          <>
            {icon && (
              <Icon
                name={icon}
                size={20}
                color={valueColor || colors.textSecondary}
                style={styles.valueIcon}
              />
            )}
            <Text style={[styles.value, { color: valueColor || colors.text }]}>
              {value}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const TransactionDetailScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TransactionDetail'>>();

  const { transaction } = route.params;
  const { amount, date, wallet, category, note, type } = transaction;

  const isExpense = type === 'expense';
  const amountColor = isExpense ? '#FF6B6B' : '#4CAF50';

  const headerBgColorDark = isExpense
    ? isDarkMode
      ? '#4a2020'
      : '#FFE6E6'
    : isDarkMode
    ? '#1a3a1a'
    : '#E6F7E6';

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      'Xác nhận xoá',
      'Bạn có chắc chắn muốn xoá giao dịch này không?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          onPress: async () => {
            try {
              if (!transaction.id) {
                Alert.alert('Lỗi', 'ID không hợp lệ.');
                return;
              }
              await firestore()
                .collection('transactions')
                .doc(transaction.id.toString())
                .delete();
              navigation.goBack();
            } catch (error) {
              console.error('Lỗi xoá: ', error);
            }
          },
          style: 'destructive',
        },
      ],
    );
  }, [transaction, navigation]);

  const handleEditPress = useCallback(() => {
    navigation.navigate('TransactionEdit', { transaction: transaction });
  }, [transaction, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Chi tiết giao dịch',
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        color: colors.text,
      },
      headerRight: () => (
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity onPress={handleEditPress} style={styles.headerBtn}>
            <Icon name="pencil" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeletePress}
            style={styles.headerBtn}
          >
            <Icon name="trash-can-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, transaction, colors, handleDeletePress, handleEditPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerBackground,
          { backgroundColor: headerBgColorDark },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: categoryColors[category] + '20' },
            ]}
          >
            <Icon
              name={categoryIcons[category] || 'dots-grid'}
              size={32}
              color={categoryColors[category] || '#9D9D9D'}
            />
          </View>

          <Text style={[styles.typeText, { color: colors.textSecondary }]}>
            {isExpense ? 'Chi tiêu' : 'Thu nhập'}
          </Text>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {isExpense ? '-' : '+'}
            {formatCurrency(amount)}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <InfoRow
            label="Danh mục"
            value={category || 'Khác'}
            isCategory={true}
            colors={colors}
          />
          <InfoRow
            label="Nguồn tiền"
            value={wallet || 'Ngoài MoMo'}
            icon="credit-card"
            valueColor={colors.text}
            colors={colors}
          />
          <InfoRow
            label="Thời gian"
            value={formatTransactionDate(date)}
            icon="calendar-outline"
            valueColor={colors.text}
            colors={colors}
          />

          {note && (
            <View style={styles.noteSection}>
              <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>
                Ghi chú
              </Text>
              <View
                style={[
                  styles.noteBubble,
                  {
                    backgroundColor: isDarkMode ? colors.background : '#f8f9fa',
                    borderLeftColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.noteText, { color: colors.text }]}>
                  {note}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TransactionDetailScreen;
