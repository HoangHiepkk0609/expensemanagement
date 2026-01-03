import React, { useEffect, useState } from 'react';
import {
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
import { useTheme } from '../theme/themeContext';
import auth from '@react-native-firebase/auth';

type Category = { 
  id: string; 
  name: string; 
  label: string;
  icon: string;
  color?: string;
  type?: string;
};

type Source = { id: string; name: string; icon: string; };
type Props = NativeStackScreenProps<RootStackParamList, 'TransactionEdit'>;

const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Ăn uống', label: 'Ăn uống', icon: 'food-fork-drink', color: '#FF6B6B' },
  { id: 'shopping', name: 'Mua sắm', label: 'Mua sắm', icon: 'cart', color: '#FFD93D' },
  { id: 'transport', name: 'Di chuyển', label: 'Di chuyển', icon: 'car', color: '#6BCB77' },
  { id: 'friend', name: 'Người thân', label: 'Người thân', icon: 'account-group', color: '#4D96FF' },
  { id: 'other', name: 'Khác', label: 'Khác', icon: 'dots-grid', color: '#9D9D9D' }
];

const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Lương', label: 'Lương', icon: 'cash', color: '#4CAF50' },
  { id: 'business', name: 'Kinh doanh', label: 'Kinh doanh', icon: 'chart-line', color: '#2196F3' },
  { id: 'bonus', name: 'Thưởng', label: 'Thưởng', icon: 'gift', color: '#FFC107' },
  { id: 'other_income', name: 'Khác', label: 'Khác', icon: 'dots-grid', color: '#9D9D9D' },
];

const sources: Source[] = [
  { id: 'momo', name: 'Ngoài MoMo', icon: '💳' },
  { id: 'cash', name: 'Tiền mặt', icon: '💵' },
  { id: 'bank', name: 'Ngân hàng', icon: '🏦' }
];

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
  const { colors, isDarkMode } = useTheme();
  const { transaction } = route.params;
  const userId = auth().currentUser?.uid;
  
  const [expenseCategoriesList, setExpenseCategoriesList] = useState<Category[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [incomeCategoriesList, setIncomeCategoriesList] = useState<Category[]>(DEFAULT_INCOME_CATEGORIES);
  const [showNotification, setShowNotification] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoriesToShow, setCategoriesToShow] = useState<Category[]>(
    transaction.type === 'expense' ? expenseCategoriesList : incomeCategoriesList
  );
  const [selectedCategory, setSelectedCategory] = useState(transaction.category);

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

  useEffect(() => {
    const type = transaction.type || 'expense';
    if (type === 'income') {
      setCategoriesToShow(incomeCategoriesList);
    } else {
      setCategoriesToShow(expenseCategoriesList);
    }
  }, [transaction, expenseCategoriesList, incomeCategoriesList]);

  useEffect(() => {
    if (!userId) return;

    const subscriber = firestore()
      .collection('user_categories')
      .where('userId', '==', userId)
      .onSnapshot(querySnapshot => {
        const customExpense: Category[] = [];
        const customIncome: Category[] = [];

        querySnapshot.forEach(doc => {
          const data = doc.data();
          const item: Category = { 
            id: doc.id, 
            name: data.name || '',
            label: data.label || data.name || '',
            icon: data.icon || 'tag-outline',
            color: data.color,
            type: data.type
          };

          if (data.type === 'income') {
            customIncome.push(item);
          } else {
            customExpense.push(item);
          }
        });

        setExpenseCategoriesList([...DEFAULT_EXPENSE_CATEGORIES, ...customExpense]);
        setIncomeCategoriesList([...DEFAULT_INCOME_CATEGORIES, ...customIncome]); 
      });
      
    return () => subscriber();
  }, [userId]);

  const handleSaveEdit = async () => {
    const amountAsNumber = parseFloat(editData.amount.replace(/\./g, ''));
    if (isNaN(amountAsNumber) || amountAsNumber <= 0) {
      Alert.alert("Lỗi", "Số tiền không hợp lệ.");
      return;
    }

    const dataToSave: any = {
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
      category: category.label || category.name,
      categoryIcon: category.icon
    });
    setSelectedCategory(category.label || category.name);
    setShowCategoryModal(false);
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
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Số tiền */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Số tiền<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.amountInputWrapper}>
              <TextInput
                style={[
                  styles.inputAmount,
                  { 
                    color: colors.primary,
                    borderBottomColor: colors.border,
                    backgroundColor: colors.surface
                  }
                ]}
                value={formatAmountInput(editData.amount)}
                onChangeText={(text) => setEditData({ ...editData, amount: text.replace(/\./g, '') })}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₫</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Danh mục<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoryContainer}>
              {categoriesToShow.slice(0, 3).map((cat, index) => {
                const catColor = cat.color || categoryColors[cat.name] || '#9D9D9D';
                const catLabel = cat.label || cat.name;
                const isSelected = editData.category === catLabel;
                
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCategorySelect(cat)}
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.border
                      },
                      isSelected && { 
                        backgroundColor: catColor + '15',
                        borderColor: catColor
                      }
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
                    <Text style={[
                      styles.categoryText, 
                      { color: colors.text },
                      isSelected && { fontWeight: '700', color: catColor }
                    ]} numberOfLines={1}>
                      {catLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {(() => {
                const top3Labels = categoriesToShow.slice(0, 3).map(c => c.label || c.name);
                const isSelectedInTop3 = top3Labels.includes(editData.category);
                const showSelectedCustom = editData.category && !isSelectedInTop3;
                
                const currentCategoryObj = categoriesToShow.find(c => (c.label || c.name) === editData.category);

                const displayLabel = showSelectedCustom ? editData.category : 'Khác';
                const displayIcon = showSelectedCustom ? (currentCategoryObj?.icon || 'tag-outline') : 'dots-grid';
                const displayColor = showSelectedCustom ? (currentCategoryObj?.color || '#9D9D9D') : '#9D9D9D';

                return (
                  <TouchableOpacity 
                    style={[
                      styles.categoryButton,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      showSelectedCustom && {
                        backgroundColor: displayColor + '15', 
                        borderColor: displayColor
                      }
                    ]}
                    onPress={() => setShowCategoryModal(true)}
                  >
                    <View style={[styles.categoryIconWrapper, { backgroundColor: displayColor + '20' }]}>
                      <Icon name={displayIcon} size={24} color={displayColor} />
                    </View>
                    <Text 
                      style={[
                        styles.categoryText, 
                        { color: colors.text },
                        showSelectedCustom && { fontWeight: '700', color: displayColor }
                      ]} 
                      numberOfLines={1}
                    >
                      {displayLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>

          <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Chọn danh mục</Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                    <Icon name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {categoriesToShow.map((cat, index) => {
                    const catLabel = cat.label || cat.name;
                    const isSelected = editData.category === catLabel;
                    const catColor = cat.color || categoryColors[cat.name] || '#9D9D9D';
                    
                    return (
                      <TouchableOpacity
                        key={cat.id || index}
                        style={[
                          styles.optionItem,
                          { borderBottomColor: colors.border },
                          isSelected && { backgroundColor: catColor + '10' }
                        ]}
                        onPress={() => handleCategorySelect(cat)}
                      >
                        <View style={styles.optionContent}>
                          <View style={[
                            styles.optionIconWrapper,
                            { backgroundColor: catColor + '20' }
                          ]}>
                            <Icon name={cat.icon} size={22} color={catColor} />
                          </View>
                          <Text style={[
                            styles.optionText,
                            { color: colors.text },
                            isSelected && { color: catColor, fontWeight: '700' }
                          ]}>
                            {catLabel}
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

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Ngày giao dịch<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.inputWithIcon, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => Alert.alert("Thông báo", "Chức năng chọn ngày chưa được cài đặt.")}
            >
              <Icon name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.inputDate, { color: colors.text }]}>
                {formatDisplayDate(editData.date)}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Nguồn tiền<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.inputWithIcon, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowWalletModal(true)}
            >
              <Icon name="credit-card" size={20} color={colors.textSecondary} />
              <Text style={[styles.inputDate, { color: colors.text }]}>{editData.wallet}</Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Modal
            visible={showWalletModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowWalletModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Nguồn tiền</Text>
                  <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                    <Icon name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {sources.map((src, index) => {
                    const isSelected = editData.wallet === src.name;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionItem,
                          { borderBottomColor: colors.border },
                          isSelected && { backgroundColor: colors.primary + '15' }
                        ]}
                        onPress={() => {
                          handleSourceSelect(src);
                          setShowWalletModal(false);
                        }}
                      >
                        <Text style={[
                          styles.optionText,
                          { color: colors.text },
                          isSelected && { color: colors.primary, fontWeight: '700' }
                        ]}>
                          {src.name}
                        </Text>
                        {isSelected && (
                          <Icon name="check" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Ghi chú</Text>
            <TextInput
              style={[
                styles.inputNote,
                { 
                  color: colors.text,
                  borderBottomColor: colors.border,
                  backgroundColor: colors.surface
                }
              ]}
              value={editData.note}
              onChangeText={(text) => setEditData({ ...editData, note: text })}
              placeholder="Thêm ghi chú..."
              placeholderTextColor={colors.textSecondary}
              multiline={true}
            />
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            transaction.type === 'income' && styles.saveButtonIncome
          ]} 
          onPress={handleSaveEdit}
        >
          <Icon name="check" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </View>

      {showNotification && (
        <View style={styles.notification}>
          <Icon name="check-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.notificationText}>Cập nhật thành công!</Text>
        </View>
      )}
    </View>
  );
};



const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
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
    borderTopWidth: 1,
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
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'left',
  },
  currencySymbol: {
    position: 'absolute',
    right: 0,
    top: Platform.OS === 'ios' ? 8 : 10,
    fontSize: 20,
    fontWeight: '700',
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
    borderWidth: 2,
  },
  selectedCategory: {},
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
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingVertical: 10,
    gap: 10,
  },
  inputDate: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  inputNote: {
    borderBottomWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  selectedOption: {},
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
    fontWeight: '500',
  },
  selectedOptionText: {},
});

export default TransactionEditScreen;