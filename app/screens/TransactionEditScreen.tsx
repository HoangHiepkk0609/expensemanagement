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
  Modal,
} from 'react-native';
import { Calendar, ChevronDown } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/AppNavigator';

type Category = { id: string; name: string; icon: string; };
type Source = { id: string; name: string; icon: string; };
type Props = NativeStackScreenProps<RootStackParamList, 'TransactionEdit'>;

// ✅ DANH MỤC VỚI ICON ĐÚNG
const expenseCategories: Category[] = [
  { id: 'food', name: 'Ăn uống', icon: 'food-fork-drink' },
  { id: 'shopping', name: 'Mua sắm', icon: 'cart' },
  { id: 'transport', name: 'Di chuyển', icon: 'car' },
  { id: 'friend', name: 'Người thân', icon: 'account-group' },
  { id: 'other', name: 'Khác', icon: 'dots-grid' }
];

const incomeCategories: Category[] = [
  { id: 'salary', name: 'Lương', icon: 'cash' },
  { id: 'business', name: 'Kinh doanh', icon: 'chart-line' },
  { id: 'bonus', name: 'Thưởng', icon: 'gift' },
  { id: 'other_income', name: 'Khác', icon: 'dots-grid' },
];

const sources: Source[] = [
  { id: 'momo', name: 'Ngoài MoMo', icon: '💳' },
  { id: 'cash', name: 'Tiền mặt', icon: '💵' },
  { id: 'bank', name: 'Ngân hàng', icon: '🏦' }
];

// ✅ MÀU DANH MỤC
const categoryColors: any = {
  'Ăn uống': '#FF6B6B',
  'Mua sắm': '#FFD93D',
  'Di chuyển': '#6BCB77',
  'Người thân': '#4D96FF',
  'Khác': '#9D9D9D',
  'Lương': '#4CAF50',
  'Kinh doanh': '#2196F3',
  'Thưởng': '#FFC107',
};

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
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoriesToShow, setCategoriesToShow] = useState<Category[]>(expenseCategories);

  useEffect(() => {
    const type = transaction.type || 'expense';
    if (type === 'income') {
      setCategoriesToShow(incomeCategories);
    } else {
      setCategoriesToShow(expenseCategories);
    }
  }, [transaction]);

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
    <View style={styles.safeArea}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Số tiền */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Số tiền<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.amountInputWrapper}>
              <TextInput
                style={styles.inputAmount}
                value={formatAmountInput(editData.amount)}
                onChangeText={(text) => setEditData({ ...editData, amount: text.replace(/\./g, '') })}
                placeholder="0"
                keyboardType="numeric"
              />
              <Text style={styles.currencySymbol}>₫</Text>
            </View>
          </View>

          {/* ✅ DANH MỤC - GIỐNG ADD SCREEN */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Danh mục<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoryContainer}>
              {categoriesToShow.slice(0, 3).map((cat, index) => {
                const catColor = categoryColors[cat.name] || '#9D9D9D';
                const isSelected = editData.category === cat.name;
                
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCategorySelect(cat)}
                    style={[
                      styles.categoryButton,
                      isSelected && styles.selectedCategory
                    ]}
                  >
                    <View style={[
                      styles.categoryIconWrapper,
                      { backgroundColor: catColor + '20' }
                    ]}>
                      <Icon
                        name={cat.icon}
                        size={24}
                        color={catColor}
                      />
                    </View>
                    <Text style={styles.categoryText}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
              
              {/* Nút Khác */}
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  editData.category && !categoriesToShow.slice(0, 3).find(c => c.name === editData.category) && styles.selectedCategory
                ]}
                onPress={() => setShowCategoryModal(true)}
              >
                <View style={[
                  styles.categoryIconWrapper,
                  { backgroundColor: '#9D9D9D20' }
                ]}>
                  <Icon
                    name="dots-grid"
                    size={24}
                    color="#9D9D9D"
                  />
                </View>
                <Text style={styles.categoryText}>
                  {editData.category && !categoriesToShow.slice(0, 3).find(c => c.name === editData.category) ? editData.category : 'Khác'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ✅ MODAL CHỌN DANH MỤC */}
          <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn danh mục</Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                    <Icon name="close" size={24} color="#888" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {categoriesToShow.map((item, index) => {
                    const catColor = categoryColors[item.name] || '#9D9D9D';
                    const isSelected = editData.category === item.name;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.optionItem, isSelected && styles.selectedOption]}
                        onPress={() => {
                          handleCategorySelect(item);
                          setShowCategoryModal(false);
                        }}
                      >
                        <View style={styles.optionContent}>
                          <View style={[
                            styles.optionIconWrapper,
                            { backgroundColor: catColor + '20' }
                          ]}>
                            <Icon
                              name={item.icon}
                              size={22}
                              color={catColor}
                            />
                          </View>
                          <Text style={[
                            styles.optionText,
                            isSelected && styles.selectedOptionText
                          ]}>
                            {item.name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon name="check" size={20} color={catColor} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Ngày giao dịch */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Ngày giao dịch<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputWithIcon}
              onPress={() => Alert.alert("Thông báo", "Chức năng chọn ngày chưa được cài đặt.")}
            >
              <Icon name="calendar-outline" size={20} color="#999" />
              <Text style={styles.inputDate}>
                {formatDisplayDate(editData.date)}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* ✅ NGUỒN TIỀN - MODAL */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Nguồn tiền<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputWithIcon}
              onPress={() => setShowWalletModal(true)}
            >
              <Icon name="credit-card" size={20} color="#999" />
              <Text style={styles.inputDate}>{editData.wallet}</Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* ✅ MODAL NGUỒN TIỀN */}
          <Modal
            visible={showWalletModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowWalletModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Nguồn tiền</Text>
                  <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                    <Icon name="close" size={24} color="#888" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {sources.map((src, index) => {
                    const isSelected = editData.wallet === src.name;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.optionItem, isSelected && styles.selectedOption]}
                        onPress={() => {
                          handleSourceSelect(src);
                          setShowWalletModal(false);
                        }}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.selectedOptionText
                        ]}>
                          {src.name}
                        </Text>
                        {isSelected && (
                          <Icon name="check" size={20} color="#FF69B4" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Ghi chú */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Ghi chú</Text>
            <TextInput
              style={styles.inputNote}
              value={editData.note}
              onChangeText={(text) => setEditData({ ...editData, note: text })}
              placeholder="Thêm ghi chú..."
              placeholderTextColor="#ccc"
              multiline={true}
            />
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Nút Lưu */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, transaction.type === 'income' && styles.saveButtonIncome]} 
          onPress={handleSaveEdit}
        >
          <Icon name="check" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </View>

      {/* Notification */}
      {showNotification && (
        <View style={styles.notification}>
          <Icon name="check-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.notificationText}>Cập nhật thành công!</Text>
        </View>
      )}
    </View>
  );
};

export default TransactionEditScreen;

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f7fa',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 5,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    color: '#333',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '700',
  },
  required: {
    color: '#FF6B6B',
  },
  amountInputWrapper: {
    position: 'relative',
  },
  inputAmount: {
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontSize: 28,
    fontWeight: '700',
    color: '#FF69B4',
    backgroundColor: '#fff',
    textAlign: 'left',
  },
  currencySymbol: {
    position: 'absolute',
    right: 0,
    top: Platform.OS === 'ios' ? 8 : 10,
    fontSize: 20,
    fontWeight: '700',
    color: '#999',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  categoryButton: {
    width: (screenWidth - 32 - 40 - 30) / 4,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#fff0f5',
    borderWidth: 2,
    borderColor: '#FF69B4',
  },
  categoryIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingVertical: 10,
    gap: 10,
  },
  inputDate: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  inputNote: {
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 60,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonIncome: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  notification: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#22C55E',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedOption: {
    backgroundColor: '#fff0f5',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FF69B4',
    fontWeight: '700',
  },
});