import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { ArrowLeft, Calendar, ChevronDown } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // ✅ THÊM IMPORT
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/AppNavigator';

type Category = { id: string; name: string; icon: string; };
type Source = { id: string; name: string; icon: string; };
type Props = NativeStackScreenProps<RootStackParamList, 'TransactionEdit'>;

// ✅ SỬA ICON DANH MỤC
  const expenseCategories: Category[] = [
    { id: 'food', name: 'Ăn uống', icon: 'food-fork-drink' },
    { id: 'shopping', name: 'Mua sắm', icon: 'cart' },
    { id: 'friend', name: 'Người thân', icon: 'human-greeting' },
    { id: 'other', name: 'Khác', icon: 'dots-grid' }
  ];

  const incomeCategories: Category[] = [
  { id: 'salary', name: 'Lương', icon: 'cash-marker' },
  { id: 'business', name: 'Kinh doanh', icon: 'chart-line' },
  { id: 'bonus', name: 'Thưởng', icon: 'wallet-giftcard' },
  { id: 'other_income', name: 'Khác', icon: 'dots-grid' },
  ];

  const sources: Source[] = [
    { id: 'momo', name: 'Ngoài MoMo', icon: '💳' },
    { id: 'cash', name: 'Tiền mặt', icon: '💵' },
    { id: 'bank', name: 'Ngân hàng', icon: '🏦' }
  ];

const TransactionEditScreen = ({ route, navigation }: Props) => {
  const { transaction } = route.params;

  const formatDisplayDate = (isoDateString: string) => {
    if (!isoDateString || isNaN(new Date(isoDateString).getTime())) {
      isoDateString = new Date().toISOString();
    }

    const date = new Date(isoDateString.includes('T') ? isoDateString : isoDateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('vi-VN', options);

    if (isSameDay(date, today)) return `Hôm nay, ${formattedDate}`;
    if (isSameDay(date, yesterday)) return `Hôm qua, ${formattedDate}`;

    return formattedDate;
  };

  const [editData, setEditData] = useState({
    id: transaction.id,
    amount: transaction.amount.toString(),
    category: transaction.category,
    categoryIcon: transaction.categoryIcon || 'food-fork-drink',
    date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
    wallet: transaction.wallet,
    sourceIcon: transaction.sourceIcon || '💳',
    note: transaction.note || '',
  });

  const [showNotification, setShowNotification] = useState(false);

  const [categoriesToShow, setCategoriesToShow] = useState<Category[]>(expenseCategories);

  // ✅ THÊM useEffect NÀY VÀO
  useEffect(() => {
    // Lấy 'type' từ giao dịch đang sửa
    const type = transaction.type || 'expense'; 

    if (type === 'income') {
      setCategoriesToShow(incomeCategories);
    } else {
      setCategoriesToShow(expenseCategories);
    }
  }, [transaction]); // Chạy lại khi 'transaction' thay đổi

  

  const handleSaveEdit = async () => {
    const amountAsNumber = parseFloat(editData.amount.replace(/\./g, ''));
    if (isNaN(amountAsNumber) || amountAsNumber <= 0) {
      Alert.alert("Lỗi", "Số tiền không hợp lệ.");
      return;
    }

    const dataToSave = {
      ...editData,
      amount: amountAsNumber,
      date: new Date(editData.date + 'T00:00:00').toISOString(),
    };

    delete dataToSave.id;
    delete dataToSave.categoryIcon;
    delete dataToSave.sourceIcon;

    try {
      await firestore()
        .collection('transactions')
        .doc(transaction.id.toString())
        .update(dataToSave);

      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error("Lỗi khi cập nhật giao dịch: ", error);
      Alert.alert("Lỗi", "Không thể cập nhật giao dịch. Vui lòng thử lại.");
    }
  };

  const handleCategorySelect = (category: Category) => {
    setEditData({
      ...editData,
      category: category.name,
      categoryIcon: category.icon
    });
  };

  const handleSourceSelect = (source: Source) => {
    setEditData({
      ...editData,
      wallet: source.name,
      sourceIcon: source.icon
    });
  };

  const formatAmountInput = (text: string) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    if (!cleanedText) return '';
    return cleanedText.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRightIcons} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          {/* Số tiền */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Số tiền<Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.inputAmount}
              value={formatAmountInput(editData.amount)}
              onChangeText={(text) => setEditData({ ...editData, amount: text.replace(/\./g, '') })}
              placeholder="0"
              keyboardType="numeric"
            />
            <Text style={styles.currencySymbol}>₫</Text>
          </View>

          {/* Danh mục - ✅ SỬA PHẦN RENDER ICON */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Danh mục<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoryGrid}>
              {categoriesToShow.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => handleCategorySelect(cat)}
                  style={[
                    styles.categoryButton,
                    editData.category === cat.name ? (transaction.type === 'income' ? styles.categoryButtonActive : styles.categoryButtonActive) 
                      : null
                  ]}
                >
                  {/* ✅ SỬA: Dùng Icon component thay vì Text emoji */}
                  <Icon
                    name={cat.icon}
                    size={28}
                    color={editData.category === cat.name ? (transaction.type === 'income' ? '#4CAF50' : '#FF69B4') : '#666'}
                    style={styles.categoryIconStyle}
                  />
                  <Text style={[
                    styles.categoryText,
                    editData.category === cat.name ? styles.categoryTextActive : styles.categoryTextActive
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Ngày giao dịch */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Ngày giao dịch<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputWithIcon}
              onPress={() => Alert.alert("Thông báo", "Chức năng chọn ngày chưa được cài đặt.")}
            >
              <Text style={styles.inputDate}>
                {formatDisplayDate(editData.date)}
              </Text>
              <Calendar style={styles.inputIconRight} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Nguồn tiền */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Nguồn tiền<Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.pickerWrapper}>
              <View style={styles.sourceDisplay}>
                <Text style={styles.sourceIconText}>{editData.sourceIcon}</Text>
                <Text style={styles.sourceNameText}>{editData.wallet}</Text>
                <ChevronDown style={styles.inputIconRight} size={20} color="#9CA3AF" />
              </View>

              <Picker
                selectedValue={editData.wallet}
                onValueChange={(itemValue: string) => {
                  const selectedSource = sources.find(s => s.name === itemValue);
                  if (selectedSource) handleSourceSelect(selectedSource);
                }}
                style={styles.hiddenPicker}
              >
                {sources.map((src) => (
                  <Picker.Item key={src.id} label={`${src.icon} ${src.name}`} value={src.name} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Ghi chú */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Ghi chú</Text>
            <TextInput
              style={styles.inputNote}
              value={editData.note}
              onChangeText={(text) => setEditData({ ...editData, note: text })}
              placeholder="Thêm ghi chú..."
            />
          </View>
        </View>
      </ScrollView>

      {/* Nút "Chỉnh sửa" */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
          <Text style={styles.saveButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>

      {/* Notification */}
      {showNotification && (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>✓ Cập nhật thành công!</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default TransactionEditScreen;

const { width: screenWidth } = Dimensions.get('window');
const cardHorizontalPadding = 24 * 2;
const screenHorizontalPadding = 16 * 2;
const gridGap = 12;
const itemsPerRow = 4;
const totalGapWidth = gridGap * (itemsPerRow - 1);
const availableWidth = screenWidth - screenHorizontalPadding - cardHorizontalPadding;
const categoryButtonWidth = (availableWidth - totalGapWidth) / itemsPerRow;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  headerRightIcons: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: '#EF4444',
  },
  inputAmount: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#F9F9F9',
    textAlign: 'right',
  },
  currencySymbol: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 44 : 48,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#999',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: categoryButtonWidth,
    aspectRatio: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  categoryButtonActive: {
    borderColor: '#FF69B4',
    backgroundColor: '#FFF0F5',
  },
  // ✅ THÊM STYLE CHO ICON
  categoryIconStyle: {
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    height: 50,
  },
  inputDate: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputIconRight: {
    marginLeft: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    position: 'relative',
    height: 50,
  },
  sourceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 16,
    height: '100%',
  },
  sourceIconText: {
    fontSize: 18,
    marginRight: 8,
  },
  sourceNameText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  hiddenPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  inputNote: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9F9F9',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  notification: {
    position: 'absolute',
    top: 60,
    left: '10%',
    right: '10%',
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationText: {
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600'
  },
  categoryButtonActiveIncome: {
    borderColor: '#4CAF50', // Xanh lá
    backgroundColor: '#f0fff5',
  },
  categoryTextActiveIncome: {
    color: '#4CAF50', // Xanh lá
    fontWeight: '600',
  },
});