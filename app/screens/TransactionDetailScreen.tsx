import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCurrency } from '../utils/formatCurrency'; 
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '../theme/themeContext';

const { width } = Dimensions.get('window');

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
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  };
  return new Date(date).toLocaleDateString('vi-VN', options);
};

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

const InfoRow = ({ label, value, icon, valueColor, isCategory, colors }: any) => {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.valueContainer}>
        {isCategory && (
          <View style={[styles.categoryBadge, { backgroundColor: categoryColors[value] + '20' }]}>
            <Icon 
              name={categoryIcons[value] || 'dots-grid'} 
              size={18} 
              color={categoryColors[value] || '#9D9D9D'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.value, { color: categoryColors[value] || colors.text }]}>
              {value}
            </Text>
          </View>
        )}
        {!isCategory && (
          <>
            {icon && <Icon name={icon} size={20} color={valueColor || colors.textSecondary} style={styles.valueIcon} />}
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
  const headerBgColor = isExpense ? '#FFE6E6' : '#E6F7E6';

  const headerBgColorDark = isExpense 
    ? (isDarkMode ? '#4a2020' : '#FFE6E6')
    : (isDarkMode ? '#1a3a1a' : '#E6F7E6');

  const handleDeletePress = () => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc chắn muốn xoá giao dịch này không?",
      [
        { text: "Huỷ", style: "cancel" },
        { 
          text: "Xoá", 
          onPress: async () => {
            try {
              if (!transaction.id) { Alert.alert("Lỗi", "ID không hợp lệ."); return; }
              await firestore().collection('transactions').doc(transaction.id.toString()).delete();
              navigation.goBack();
            } catch (error) {
              console.error("Lỗi xoá: ", error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleEditPress = () => {
    navigation.navigate('TransactionEdit', { transaction: transaction });
  };

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
          
          <TouchableOpacity onPress={handleDeletePress} style={styles.headerBtn}>
            <Icon name="trash-can-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, transaction, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBackground, { backgroundColor: headerBgColorDark }]} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconCircle, { backgroundColor: categoryColors[category] + '20' }]}>
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
            {isExpense ? '-' : '+'}{formatCurrency(amount)}
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
              <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>Ghi chú</Text>
              <View style={[
                styles.noteBubble, 
                { 
                  backgroundColor: isDarkMode ? colors.background : '#f8f9fa',
                  borderLeftColor: colors.primary 
                }
              ]}>
                <Text style={[styles.noteText, { color: colors.text }]}>{note}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerBtn: {
    padding: 8,
    marginLeft: 4,
  },
  headerBackground: {
    height: 140,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueIcon: {
    marginRight: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  noteSection: {
    width: '100%',
    marginTop: 10,
  },
  noteLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  noteBubble: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default TransactionDetailScreen;